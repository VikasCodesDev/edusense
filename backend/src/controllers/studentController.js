/**
 * Student Controller
 */

const db = require('../models/db');
const llmService = require('../services/llmService');
const {
  hasAcademicData,
  getLatestPrediction,
  getLatestRecommendation,
  refreshStudentIntelligence,
  validateAcademicPayload,
  normalizeSubjects
} = require('../services/academicService');
const REAL_ADMIN_EMAIL = 'kmr.vik136@gmail.com';
const DEMO_ADMIN_EMAIL = 'admin@edusense.edu';

function getStudentForUser(user) {
  return db.findOne('students', { userId: user.id || user._id }) ||
         db.findOne('students', { email: user.email }) ||
         (user.studentId ? db.findOne('students', { studentId: user.studentId }) : null);
}

function isDemoStudentRecord(student) {
  return !student.userId && !student.dataSource;
}

function canAccessStudent(user, student) {
  if (user.role === 'admin') {
    if (user.email === REAL_ADMIN_EMAIL) return !isDemoStudentRecord(student);
    if (user.email === DEMO_ADMIN_EMAIL) return isDemoStudentRecord(student);
    return false;
  }
  if (user.role === 'student') {
    return user.email === student.email || user.studentId === student.studentId || student.userId === (user.id || user._id);
  }
  if (user.role === 'faculty') {
    if (user._id === 'usr_faculty_01' || user.id === 'usr_faculty_01' || user.email === 'faculty@edusense.edu') {
      return isDemoStudentRecord(student) && user.department && student.department && user.department === student.department;
    }
    if (Array.isArray(user.assignedStudentIds) && user.assignedStudentIds.includes(student.studentId)) return true;
    if (user.assignedSemester || user.assignedSection) {
      const semesterMatch = user.assignedSemester ? String(student.semester) === String(user.assignedSemester) : true;
      const sectionMatch = user.assignedSection ? String(student.section || '').toLowerCase() === String(user.assignedSection).toLowerCase() : true;
      return !isDemoStudentRecord(student) && semesterMatch && sectionMatch;
    }
    return false;
  }
  return false;
}

exports.getMyProfile = async (req, res) => {
  try {
    const student = getStudentForUser(req.user);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student academic record not found.' });
    }

    let prediction = getLatestPrediction(student.studentId);
    let recommendation = getLatestRecommendation(student.studentId);
    if (hasAcademicData(student) && (!prediction || !recommendation)) {
      const refreshed = await refreshStudentIntelligence(student);
      prediction = refreshed.prediction;
      recommendation = refreshed.recommendation;
    }

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

    if (!canAccessStudent(req.user, student)) {
      return res.status(403).json({ success: false, error: 'Access denied for this student record.' });
    }

    const prediction = getLatestPrediction(student.studentId);
    const recommendation = getLatestRecommendation(student.studentId);
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
    if (!canAccessStudent(req.user, student)) {
      return res.status(403).json({ success: false, error: 'Access denied for this student record.' });
    }
    if (!hasAcademicData(student)) {
      return res.status(400).json({ success: false, error: 'Academic data is required before risk analysis can be calculated.' });
    }

    const { prediction } = await refreshStudentIntelligence(student);

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
    if (!canAccessStudent(req.user, student)) {
      return res.status(403).json({ success: false, error: 'Access denied for this student record.' });
    }
    if (!hasAcademicData(student)) {
      return res.status(400).json({ success: false, error: 'Academic data is required before recommendations can be generated.' });
    }

    let prediction = getLatestPrediction(student.studentId);
    if (!prediction) {
      prediction = (await refreshStudentIntelligence(student)).prediction;
    }

    let recommendation = getLatestRecommendation(student.studentId);
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
    if (!canAccessStudent(req.user, student)) {
      return res.status(403).json({ success: false, error: 'Access denied for this student record.' });
    }
    if (!hasAcademicData(student)) {
      return res.status(400).json({ success: false, error: 'Academic data is required before recommendations can be generated.' });
    }

    const prediction = getLatestPrediction(student.studentId) || (await refreshStudentIntelligence(student)).prediction;

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
    if (!canAccessStudent(req.user, student)) {
      return res.status(403).json({ success: false, error: 'Access denied for this student record.' });
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

exports.updateMyAcademicData = async (req, res) => {
  try {
    const student = getStudentForUser(req.user);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student academic record not found.' });
    }

    const errors = validateAcademicPayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: 'Academic data validation failed.', errors });
    }

    const updatedStudent = db.updateOne('students', { _id: student._id }, {
      userId: req.user.id || req.user._id,
      name: student.name || req.user.name,
      email: student.email || req.user.email,
      semester: req.body.semester !== undefined && req.body.semester !== null && req.body.semester !== ''
        ? Number(req.body.semester)
        : student.semester,
      attendancePct: Number(req.body.attendancePct),
      assignmentCompletionRate: Number(req.body.assignmentCompletionRate),
      assignmentAvgScore: Number(req.body.assignmentAvgScore ?? req.body.internalTestAvg),
      internalTestAvg: Number(req.body.internalTestAvg),
      previousExamScore: Number(req.body.previousExamScore),
      performanceTrend: Number(req.body.performanceTrend ?? 0),
      studyEngagementScore: Number(req.body.studyEngagementScore ?? 75),
      subjectFailureCount: normalizeSubjects(req.body.subjects).filter((s) => s.score < 50).length,
      subjects: normalizeSubjects(req.body.subjects),
      academicDataComplete: true,
      dataSource: 'student_entry'
    });

    const refreshed = await refreshStudentIntelligence(updatedStudent, { createHistory: true });

    return res.json({
      success: true,
      student: refreshed.student || updatedStudent,
      prediction: refreshed.prediction,
      recommendation: refreshed.recommendation,
      message: 'Academic data updated and risk analysis refreshed.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
