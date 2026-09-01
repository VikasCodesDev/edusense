/**
 * Student Controller
 */

const db = require('../models/db');
const mlService = require('../services/mlService');
const llmService = require('../services/llmService');

function getStudentForUser(user) {
  return db.findOne('students', { email: user.email }) ||
         (user.studentId ? db.findOne('students', { studentId: user.studentId }) : null);
}

exports.getMyProfile = async (req, res) => {
  try {
    const student = getStudentForUser(req.user);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student academic record not found.' });
    }

    // Fetch latest prediction or compute if none
    let prediction = db.findOne('predictions', { studentId: student.studentId });
    if (!prediction) {
      const mlFeatures = {
        student_id: student.studentId,
        attendance_pct: student.attendancePct,
        assignment_completion_rate: student.assignmentCompletionRate,
        assignment_avg_score: student.assignmentAvgScore || student.internalTestAvg,
        internal_test_avg: student.internalTestAvg,
        previous_exam_score: student.previousExamScore,
        performance_trend: student.performanceTrend,
        study_engagement_score: student.studyEngagementScore || 75,
        subject_failure_count: student.subjectFailureCount || 0,
        score_dsa: (student.subjects && student.subjects.find(s => s.name.includes('Data Structures'))?.score) || student.internalTestAvg,
        score_dbms: (student.subjects && student.subjects.find(s => s.name.includes('Database'))?.score) || student.internalTestAvg,
        score_maths: (student.subjects && student.subjects.find(s => s.name.includes('Mathematics'))?.score) || student.internalTestAvg,
        score_os: (student.subjects && student.subjects.find(s => s.name.includes('Operating'))?.score) || student.internalTestAvg,
        score_cn: (student.subjects && student.subjects.find(s => s.name.includes('Networks'))?.score) || student.internalTestAvg,
      };

      const mlResult = await mlService.predictStudent(mlFeatures);
      prediction = db.create('predictions', {
        studentId: student.studentId,
        ...mlResult
      });

      // Update student document with latest risk level & score
      db.updateOne('students', { _id: student._id }, {
        currentRiskLevel: mlResult.risk_level,
        currentRiskScore: mlResult.risk_score,
        lastPredictedAt: new Date().toISOString()
      });
    }

    // Fetch latest recommendation or generate
    let recommendation = db.findOne('recommendations', { studentId: student.studentId });
    if (!recommendation) {
      const guidance = await llmService.generateGuidance(student, prediction);
      recommendation = db.create('recommendations', {
        studentId: student.studentId,
        predictionId: prediction._id,
        ...guidance
      });
    }

    // Fetch progress history
    const progressHistory = db.find('academic_records', { studentId: student.studentId }) || [];

    return res.json({
      success: true,
      student,
      prediction,
      recommendation,
      progressHistory
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    let student = db.findById('students', id) || db.findOne('students', { studentId: id });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    // Role check: student can only view self
    if (req.user.role === 'student' && req.user.email !== student.email && req.user.studentId !== student.studentId) {
      return res.status(403).json({ success: false, error: 'Access denied: You can only view your own academic profile.' });
    }

    const prediction = db.findOne('predictions', { studentId: student.studentId });
    const recommendation = db.findOne('recommendations', { studentId: student.studentId });
    const interventions = db.find('interventions', { studentId: student.studentId });
    const progressHistory = db.find('academic_records', { studentId: student.studentId });

    return res.json({
      success: true,
      student,
      prediction,
      recommendation,
      interventions,
      progressHistory
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getRiskAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const student = id === 'me'
      ? getStudentForUser(req.user)
      : (db.findById('students', id) || db.findOne('students', { studentId: id }));

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    const mlFeatures = {
      student_id: student.studentId,
      attendance_pct: student.attendancePct,
      assignment_completion_rate: student.assignmentCompletionRate,
      assignment_avg_score: student.assignmentAvgScore || student.internalTestAvg,
      internal_test_avg: student.internalTestAvg,
      previous_exam_score: student.previousExamScore,
      performance_trend: student.performanceTrend,
      study_engagement_score: student.studyEngagementScore || 75,
      subject_failure_count: student.subjectFailureCount || 0,
      score_dsa: (student.subjects && student.subjects.find(s => s.name.includes('Data Structures'))?.score) || student.internalTestAvg,
      score_dbms: (student.subjects && student.subjects.find(s => s.name.includes('Database'))?.score) || student.internalTestAvg,
      score_maths: (student.subjects && student.subjects.find(s => s.name.includes('Mathematics'))?.score) || student.internalTestAvg,
      score_os: (student.subjects && student.subjects.find(s => s.name.includes('Operating'))?.score) || student.internalTestAvg,
      score_cn: (student.subjects && student.subjects.find(s => s.name.includes('Networks'))?.score) || student.internalTestAvg,
    };

    const mlResult = await mlService.predictStudent(mlFeatures);

    // Save prediction record
    const prediction = db.create('predictions', {
      studentId: student.studentId,
      ...mlResult
    });

    // Update student state
    db.updateOne('students', { _id: student._id }, {
      currentRiskLevel: mlResult.risk_level,
      currentRiskScore: mlResult.risk_score,
      lastPredictedAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      studentId: student.studentId,
      prediction
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const student = id === 'me'
      ? getStudentForUser(req.user)
      : (db.findById('students', id) || db.findOne('students', { studentId: id }));

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    let prediction = db.findOne('predictions', { studentId: student.studentId });
    if (!prediction) {
      const mlResult = await mlService.predictStudent({
        student_id: student.studentId,
        attendance_pct: student.attendancePct,
        assignment_completion_rate: student.assignmentCompletionRate,
        internal_test_avg: student.internalTestAvg,
        previous_exam_score: student.previousExamScore,
        performance_trend: student.performanceTrend
      });
      prediction = db.create('predictions', { studentId: student.studentId, ...mlResult });
    }

    let recommendation = db.findOne('recommendations', { studentId: student.studentId });
    if (!recommendation) {
      const guidance = await llmService.generateGuidance(student, prediction);
      recommendation = db.create('recommendations', {
        studentId: student.studentId,
        predictionId: prediction._id,
        ...guidance
      });
    }

    return res.json({
      success: true,
      recommendation
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.regenerateRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const student = id === 'me'
      ? getStudentForUser(req.user)
      : (db.findById('students', id) || db.findOne('students', { studentId: id }));

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    const prediction = db.findOne('predictions', { studentId: student.studentId }) || {
      risk_level: student.currentRiskLevel || 'Moderate',
      risk_score: student.currentRiskScore || 50,
      contributing_factors: []
    };

    const guidance = await llmService.generateGuidance(student, prediction);
    
    // Remove old recommendation and save new one
    db.deleteMany('recommendations', { studentId: student.studentId });
    const newRec = db.create('recommendations', {
      studentId: student.studentId,
      predictionId: prediction._id || 'manual',
      ...guidance
    });

    return res.json({
      success: true,
      recommendation: newRec,
      message: 'Personalized guidance regenerated successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getProgressHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const student = id === 'me'
      ? getStudentForUser(req.user)
      : (db.findById('students', id) || db.findOne('students', { studentId: id }));

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    const history = db.find('academic_records', { studentId: student.studentId });
    return res.json({
      success: true,
      history
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
