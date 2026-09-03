/**
 * EduSense LLM Personalized Guidance Service
 * Generates structured, actionable academic support plans using Groq / LLM API
 * with automatic deterministic rule-based fallback.
 */

const axios = require('axios');

class LLMService {
  constructor() {
    this.apiKey = process.env.LLM_API_KEY || process.env.GROQ_API_KEY || '';
    this.provider = process.env.LLM_PROVIDER || 'groq';
    this.model = process.env.LLM_MODEL || 'llama-3.3-70b-versatile';
    if (this.provider.toLowerCase() === 'groq' && (!this.apiKey.trim() || !this.model.trim())) {
      console.warn('[LLM Service] Invalid Groq configuration: LLM_API_KEY/GROQ_API_KEY and LLM_MODEL are required.');
    }
  }

  isGroqConfigured() {
    return this.provider.toLowerCase() === 'groq' &&
      this.apiKey.trim() !== '' &&
      !this.apiKey.startsWith('mock') &&
      this.model.trim() !== '';
  }

  async generateGuidance(studentData, predictionData) {
    // If API key is present and provider is groq, attempt LLM generation
    if (this.isGroqConfigured()) {
      try {
        const llmResult = await this.callGroqAPI(studentData, predictionData);
        if (llmResult) {
          return {
            ...llmResult,
            source: 'ai_groq',
            modelName: this.model,
            generatedAt: new Date().toISOString()
          };
        }
      } catch (err) {
        console.warn(`[LLM Service] Groq ${this.classifyError(err)} failure: ${err.message}. Using deterministic guidance fallback.`);
      }
    } else {
      console.warn(`[LLM Service] Groq configuration unavailable (provider=${this.provider}, model=${this.model || 'missing'}, api_key=${this.apiKey ? 'present' : 'missing'}). Using deterministic guidance fallback.`);
    }

    // Deterministic Rule-Based Fallback
    const fallbackGuidance = this.generateDeterministicGuidance(studentData, predictionData);
    return {
      ...fallbackGuidance,
      source: 'deterministic_rules',
      modelName: 'EduSense Deterministic Academic Guidance Engine',
      generatedAt: new Date().toISOString()
    };
  }

  classifyError(err) {
    if (err.response?.status === 401 || err.response?.status === 403) return 'auth';
    if (err.response?.status === 404) return 'model';
    if (err.response?.status === 429) return 'quota/rate-limit';
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') return 'timeout';
    if (err.code && ['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET'].includes(err.code)) return 'network';
    if (err.response?.status >= 500) return 'provider';
    return err.category || 'request';
  }

  async callGroqAPI(student, prediction) {
    const systemPrompt = `You are EduSense Academic Advisor, an AI academic guidance specialist.
Your goal is to provide concise, realistic, structured academic improvement plans based strictly on provided student data.
RULES:
1. ONLY use the provided academic context.
2. DO NOT make psychological, medical, or diagnostic claims.
3. DO NOT guarantee specific grades or future outcomes.
4. Keep suggestions highly practical, actionable, and specific to the student's actual weak subjects.
5. Return strictly valid JSON conforming to the requested schema.`;

    const weakSubjects = (student.subjects || [])
      .filter(s => (s.score ?? s.internalScore ?? 100) < 55)
      .map(s => `${s.name} (${s.score ?? s.internalScore}%)`)
      .join(', ') || 'None identified';

    const strongSubjects = (student.subjects || [])
      .filter(s => (s.score ?? s.internalScore ?? 0) >= 75)
      .map(s => `${s.name} (${s.score ?? s.internalScore}%)`)
      .join(', ') || 'General Coursework';

    const userPrompt = `Student Academic Profile:
- Name: ${student.name}
- Course: ${student.course ?? 'B.Tech CS'} (Semester ${student.semester ?? 4})
- Overall Risk Level: ${prediction.risk_level ?? 'Moderate'}
- Risk Score: ${prediction.risk_score ?? 50}/100
- Lecture Attendance: ${student.attendancePct ?? student.attendance_pct ?? 75}%
- Internal Assessment Average: ${student.internalTestAvg ?? student.internal_test_avg ?? 60}%
- Assignment Submission Rate: ${student.assignmentCompletionRate ?? student.assignment_completion_rate ?? 70}%
- Recent Performance Trend: ${student.performanceTrend ?? student.performance_trend ?? 0}%
- Subject Weaknesses: ${weakSubjects}
- Subject Strengths: ${strongSubjects}
- Key Risk Factors: ${(prediction.contributing_factors || []).map(f => f.factor).join('; ')}

Return a valid JSON object with the following exact keys:
{
  "immediatePriority": "1-2 sentence core urgent focus",
  "studyFocus": ["Specific subject/topic action 1", "Specific subject/topic action 2", "Specific subject/topic action 3"],
  "attendanceStrategy": "Concrete plan to recover/maintain attendance",
  "assignmentActionPlan": "Action plan for assignments and coursework",
  "suggestedWeeklyRoutine": "Recommended daily study hours and schedule allocation",
  "motivationalNote": "Constructive, professional encouragement"
}`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const rawContent = response.data?.choices?.[0]?.message?.content;
    if (typeof rawContent !== 'string' || !rawContent.trim()) {
      const error = new Error('Groq response content is missing');
      error.category = 'response';
      throw error;
    }
    const jsonContent = rawContent.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (err) {
      err.category = 'invalid-json';
      throw err;
    }
    const required = ['immediatePriority', 'studyFocus', 'attendanceStrategy', 'assignmentActionPlan', 'suggestedWeeklyRoutine', 'motivationalNote'];
    const validSchema = parsed && typeof parsed === 'object' &&
      required.every((key) => Object.prototype.hasOwnProperty.call(parsed, key)) &&
      typeof parsed.immediatePriority === 'string' &&
      Array.isArray(parsed.studyFocus) &&
      parsed.studyFocus.every((item) => typeof item === 'string') &&
      required.slice(2).every((key) => typeof parsed[key] === 'string');
    if (!validSchema) {
      const error = new Error('Groq response schema is invalid');
      error.category = 'schema';
      throw error;
    }
    return parsed;
  }

  generateDeterministicGuidance(student, prediction) {
    const att = Number(student.attendancePct ?? student.attendance_pct ?? 75);
    const assignComp = Number(student.assignmentCompletionRate ?? student.assignment_completion_rate ?? 75);
    const internal = Number(student.internalTestAvg ?? student.internal_test_avg ?? 65);
    const trend = Number(student.performanceTrend ?? student.performance_trend ?? 0);
    const riskLevel = prediction.risk_level || (att < 65 || internal < 45 ? 'High' : (att < 75 || internal < 60 ? 'Moderate' : 'Low'));

    const subjects = student.subjects || [];
    const weakSubs = subjects.filter(s => (s.score ?? s.internalScore ?? 100) < 55);
    const strongSubs = subjects.filter(s => (s.score ?? s.internalScore ?? 0) >= 75);

    let immediatePriority = '';
    const studyFocus = [];
    let attendanceStrategy = '';
    let assignmentActionPlan = '';
    let suggestedWeeklyRoutine = '';
    let motivationalNote = '';

    if (riskLevel === 'High') {
      immediatePriority = `Prioritize attending all upcoming lectures to reverse the attendance deficit (${att}%) and schedule dedicated recovery review for ${weakSubs.length > 0 ? weakSubs.map(s => s.name).join(' & ') : 'core technical subjects'}.`;
      
      if (weakSubs.length > 0) {
        weakSubs.forEach(s => {
          studyFocus.push(`Review foundational concepts and problem sets in ${s.name} (current score: ${s.score ?? s.internalScore}%).`);
        });
      } else {
        studyFocus.push('Revisit core problem-solving methodologies in internal assessment syllabi.');
        studyFocus.push('Clarify doubts with faculty during designated office hours.');
      }
      studyFocus.push('Complete practice problems from previous mid-semester test papers.');

      attendanceStrategy = att < 65
        ? `Attendance is at ${att}%. Commit to 100% lecture and lab presence for the next 4 consecutive weeks to reach the required institutional threshold (75%).`
        : `Maintain unbroken lecture attendance to ensure critical internal assessment requirements are met.`;

      assignmentActionPlan = assignComp < 60
        ? `Submit all pending assignments within the next 7 days. Set a strict deadline 24 hours prior to submission deadlines.`
        : `Continue timely assignment submissions while reviewing feedback comments to boost scores.`;

      suggestedWeeklyRoutine = 'Allocate 2.5 - 3 hours daily for self-study: 1.5 hours on weak technical subjects, 1 hour on coursework/assignments, and 30 minutes on concept revision.';
      motivationalNote = 'Academic setbacks are solvable through structured consistency. Early intervention now creates the fastest path to strong semester results.';
    } else if (riskLevel === 'Moderate') {
      immediatePriority = `Stabilize your continuous assessment scores and maintain lecture attendance above 78% to transition into low risk standing.`;
      
      if (weakSubs.length > 0) {
        studyFocus.push(`Consolidate understanding in ${weakSubs[0].name} by solving weekly tutorial exercises.`);
      }
      studyFocus.push('Review notes within 24 hours of each lecture to improve long-term retention.');
      studyFocus.push('Form a peer discussion group for collaborative algorithmic and analytical problem solving.');

      attendanceStrategy = att < 75
        ? `Attendance is at ${att}%. Aim for perfect attendance over the next 2 weeks to safely cross the 75% baseline.`
        : `Your attendance is steady at ${att}%. Keep up this consistency across all lab and theory sessions.`;

      assignmentActionPlan = 'Maintain 100% completion on upcoming assignments and prioritize high-weightage lab reports.';
      suggestedWeeklyRoutine = 'Dedicate 1.5 - 2 hours per day: 1 hour on primary subject review and 1 hour on active problem-solving and assignments.';
      motivationalNote = 'You have a solid foundation. Minor adjustments to your study routine and attendance will quickly lift your performance.';
    } else {
      immediatePriority = `Maintain your excellent academic trajectory (${att}% attendance, ${internal}% assessment average) and explore advanced domain projects.`;
      
      studyFocus.push('Engage in advanced topic exploration and open-ended practical projects.');
      if (strongSubs.length > 0) {
        studyFocus.push(`Leverage your strong mastery in ${strongSubs[0].name} for competitive coding or academic research.`);
      }
      studyFocus.push('Assist peers through study circles to further solidify complex theoretical concepts.');

      attendanceStrategy = `Outstanding attendance at ${att}%. Keep leading by example.`;
      assignmentActionPlan = 'Maintain high quality and thorough documentation on all submissions.';
      suggestedWeeklyRoutine = 'Maintain 1 - 1.5 hours daily for regular coursework, plus additional self-directed project development.';
      motivationalNote = 'Great work! Consistent habits have placed you in a strong academic position. Keep pushing your intellectual curiosity.';
    }

    return {
      immediatePriority,
      studyFocus,
      attendanceStrategy,
      assignmentActionPlan,
      suggestedWeeklyRoutine,
      motivationalNote
    };
  }
}

module.exports = new LLMService();
