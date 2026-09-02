const db = require('../models/db');
const mlService = require('./mlService');
const llmService = require('./llmService');

const SUBJECTS = [
  { key: 'score_dsa', name: 'Data Structures & Algorithms' },
  { key: 'score_dbms', name: 'Database Management Systems' },
  { key: 'score_maths', name: 'Applied Mathematics' },
  { key: 'score_os', name: 'Operating Systems' },
  { key: 'score_cn', name: 'Computer Networks' }
];

function hasAcademicData(student) {
  return Boolean(
    student &&
    (
      student.academicDataComplete ||
      (
        student.attendancePct !== undefined &&
        student.assignmentCompletionRate !== undefined &&
        student.internalTestAvg !== undefined &&
        student.previousExamScore !== undefined &&
        Array.isArray(student.subjects) &&
        student.subjects.length > 0
      )
    )
  );
}

function latestByCreatedAt(records) {
  return [...records].sort((a, b) => {
    const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return bTime - aTime;
  })[0] || null;
}

function getLatestPrediction(studentId) {
  return latestByCreatedAt(db.find('predictions', { studentId }));
}

function getLatestRecommendation(studentId) {
  return latestByCreatedAt(db.find('recommendations', { studentId }));
}

function subjectScore(student, subjectName, fallback) {
  const subject = (student.subjects || []).find((s) => s.name === subjectName || subjectName.includes(s.name));
  return Number(subject?.score ?? subject?.internalScore ?? fallback);
}

function prepareFeatures(student) {
  const internal = Number(student.internalTestAvg);
  const subjects = Array.isArray(student.subjects) ? student.subjects : [];
  const subjectScores = subjects
    .map((subject) => Number(subject.score ?? subject.internalScore))
    .filter(Number.isFinite);
  const subjectAverage = subjectScores.length > 0
    ? subjectScores.reduce((sum, score) => sum + score, 0) / subjectScores.length
    : internal;
  const subjectFailures = subjectScores.filter((score) => score < 50).length;
  const knownSubjectScore = (name) => {
    const subject = subjects.find((item) => String(item.name || '').toLowerCase().includes(name));
    return subject ? Number(subject.score ?? subject.internalScore) : subjectAverage;
  };
  return {
    student_id: student.studentId,
    attendance_pct: Number(student.attendancePct),
    assignment_completion_rate: Number(student.assignmentCompletionRate),
    assignment_avg_score: Number(student.assignmentAvgScore ?? internal),
    internal_test_avg: internal,
    previous_exam_score: Number(student.previousExamScore),
    performance_trend: Number(student.performanceTrend ?? 0),
    study_engagement_score: Number(student.studyEngagementScore ?? 75),
    subject_failure_count: Number(student.subjectFailureCount ?? subjectFailures),
    score_dsa: knownSubjectScore('data structures'),
    score_dbms: knownSubjectScore('database management'),
    score_maths: knownSubjectScore('math'),
    score_os: knownSubjectScore('operating system'),
    score_cn: knownSubjectScore('computer network')
  };
}

async function refreshStudentIntelligence(student, { createHistory = false } = {}) {
  if (!hasAcademicData(student)) {
    return { prediction: null, recommendation: null };
  }

  const mlResult = await mlService.predictStudent(prepareFeatures(student));
  const prediction = db.create('predictions', {
    studentId: student.studentId,
    ...mlResult
  });

  const updatedStudent = db.updateOne('students', { _id: student._id }, {
    currentRiskLevel: mlResult.risk_level,
    currentRiskScore: mlResult.risk_score,
    lastPredictedAt: new Date().toISOString()
  }) || student;

  if (createHistory) {
    db.create('academic_records', {
      studentId: student.studentId,
      evaluationCycle: 'Current Update',
      date: new Date().toISOString().split('T')[0],
      attendance: Number(updatedStudent.attendancePct),
      internalMarks: Number(updatedStudent.internalTestAvg),
      assignmentRate: Number(updatedStudent.assignmentCompletionRate),
      riskScore: mlResult.risk_score,
      riskLevel: mlResult.risk_level
    });
  }

  db.deleteMany('recommendations', { studentId: student.studentId });
  const guidance = await llmService.generateGuidance(updatedStudent, prediction);
  const recommendation = db.create('recommendations', {
    studentId: student.studentId,
    predictionId: prediction._id,
    ...guidance
  });

  return { prediction, recommendation, student: updatedStudent };
}

function validateAcademicPayload(body) {
  const errors = [];
  const numberFields = [
    ['attendancePct', 'Attendance %'],
    ['assignmentCompletionRate', 'Assignment %'],
    ['internalTestAvg', 'Assessment / internal marks'],
    ['previousExamScore', 'Previous exam score']
  ];

  numberFields.forEach(([field, label]) => {
    const value = Number(body[field]);
    if (body[field] === undefined || body[field] === null || body[field] === '') errors.push(`${label} is required.`);
    else if (!Number.isFinite(value) || value < 0 || value > 100) errors.push(`${label} must be between 0 and 100.`);
  });

  if (body.performanceTrend !== undefined && body.performanceTrend !== '' && !Number.isFinite(Number(body.performanceTrend))) {
    errors.push('Performance trend must be numeric.');
  }

  if (body.semester !== undefined && body.semester !== null && body.semester !== '') {
    const semester = Number(body.semester);
    if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
      errors.push('Semester must be an integer from 1 to 8.');
    }
  }

  if (!Array.isArray(body.subjects) || body.subjects.length === 0) {
    errors.push('At least one subject record is required.');
  } else {
    body.subjects.forEach((subject, index) => {
      if (!subject.name || !String(subject.name).trim()) errors.push(`Subject ${index + 1} name is required.`);
      ['score', 'attendance', 'assignmentCompletion'].forEach((field) => {
        const value = Number(subject[field]);
        if (subject[field] === undefined || subject[field] === null || subject[field] === '') {
          errors.push(`${subject.name || `Subject ${index + 1}`} ${field} is required.`);
        } else if (!Number.isFinite(value) || value < 0 || value > 100) {
          errors.push(`${subject.name || `Subject ${index + 1}`} ${field} must be between 0 and 100.`);
        }
      });
    });
  }

  return errors;
}

function normalizeSubjects(subjects) {
  return subjects.map((subject) => ({
    id: subject.id || subject._id || String(subject.name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: String(subject.name).trim(),
    score: Number(subject.score),
    attendance: Number(subject.attendance),
    assignmentCompletion: Number(subject.assignmentCompletion),
    trend: subject.trend || 'stable'
  }));
}

function defaultSubjectsFromStudent(student) {
  return SUBJECTS.map((subject) => ({
    name: subject.name,
    score: Number(student.internalTestAvg || 0),
    attendance: Number(student.attendancePct || 0),
    assignmentCompletion: Number(student.assignmentCompletionRate || 0),
    trend: 'stable'
  }));
}

module.exports = {
  SUBJECTS,
  hasAcademicData,
  latestByCreatedAt,
  getLatestPrediction,
  getLatestRecommendation,
  prepareFeatures,
  refreshStudentIntelligence,
  validateAcademicPayload,
  normalizeSubjects,
  defaultSubjectsFromStudent
};
