/**
 * Admin Controller
 */

const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const csvParser = require('csv-parser');
const stream = require('stream');
const db = require('../models/db');
const mlService = require('../services/mlService');

exports.getOverview = async (req, res) => {
  try {
    const totalUsers = db.countDocuments('users');
    const totalStudents = db.countDocuments('students');
    const totalFaculty = db.countDocuments('users', { role: 'faculty' });
    const totalPredictions = db.countDocuments('predictions');
    const totalDatasets = db.countDocuments('datasets');
    const recentLogs = db.find('activity_logs').slice(-10).reverse();

    const mlHealth = await mlService.healthCheck();

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalFaculty,
        totalPredictions,
        totalDatasets,
        mlHealth
      },
      recentLogs
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = db.find('users').map(u => {
      const { passwordHash, ...safe } = u;
      return safe;
    });
    return res.json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, studentId, department } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Name, email, password, and role are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (db.findOne('users', { email: normalizedEmail })) {
      return res.status(400).json({ success: false, error: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = db.create('users', {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: role.toLowerCase(),
      studentId: studentId ? studentId.trim() : null,
      department: department || 'Computer Science & Engineering'
    });

    db.create('activity_logs', {
      userId: req.user.id,
      userName: req.user.name,
      role: 'admin',
      action: 'USER_CREATED',
      details: `Created new user ${user.email} with role ${user.role}`
    });

    const { passwordHash: _, ...safe } = user;
    return res.status(201).json({ success: true, user: safe });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = db.findById('users', id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    db.deleteOne('users', { _id: id });
    db.create('activity_logs', {
      userId: req.user.id,
      userName: req.user.name,
      role: 'admin',
      action: 'USER_DELETED',
      details: `Deleted user ${user.email} (${user.role})`
    });

    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.previewDatasetImport = async (req, res) => {
  try {
    let records = [];
    let detectedColumns = [];
    let filename = 'manual_input.csv';

    if (req.file) {
      filename = req.file.originalname;
      const fileBuffer = req.file.buffer;

      if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        records = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      } else {
        // CSV parsing
        const csvContent = fileBuffer.toString('utf-8');
        records = await parseCsvString(csvContent);
      }
    } else if (req.body.records && Array.isArray(req.body.records)) {
      records = req.body.records;
    } else {
      return res.status(400).json({ success: false, error: 'No file uploaded or records payload provided.' });
    }

    if (!records || records.length === 0) {
      return res.status(400).json({ success: false, error: 'The uploaded dataset is empty or unreadable.' });
    }

    detectedColumns = Object.keys(records[0]);

    // Send for validation
    const validationReport = await mlService.validateDataset(records);

    return res.json({
      success: true,
      filename,
      detectedColumns,
      totalRows: records.length,
      validation: validationReport
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.confirmDatasetImport = async (req, res) => {
  try {
    const { filename, validRecords } = req.body;
    if (!validRecords || !Array.isArray(validRecords) || validRecords.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid records to import.' });
    }

    // Run batch ML predictions on imported records
    const mlBatchInput = validRecords.map(r => ({
      student_id: r.student_id || r.roll_no || `STU${Date.now()}`,
      attendance_pct: Number(r.attendance_pct || 75),
      assignment_completion_rate: Number(r.assignment_completion_rate || 75),
      assignment_avg_score: Number(r.assignment_avg_score || 70),
      internal_test_avg: Number(r.internal_test_avg || 65),
      previous_exam_score: Number(r.previous_exam_score || 68),
      performance_trend: Number(r.performance_trend || 0),
      study_engagement_score: Number(r.study_engagement_score || 75),
      subject_failure_count: Number(r.subject_failure_count || 0),
      score_dsa: Number(r.score_dsa || 65),
      score_dbms: Number(r.score_dbms || 70),
      score_maths: Number(r.score_maths || 60),
      score_os: Number(r.score_os || 68),
      score_cn: Number(r.score_cn || 65)
    }));

    const batchPredictions = await mlService.predictBatch(mlBatchInput);
    const predictionMap = {};
    batchPredictions.forEach(bp => {
      predictionMap[bp.student_id] = bp.prediction;
    });

    let updatedCount = 0;
    let createdCount = 0;

    validRecords.forEach(r => {
      const studentId = r.student_id || r.roll_no;
      const pred = predictionMap[studentId] || { risk_level: 'Moderate', risk_score: 50 };

      const studentDoc = {
        studentId,
        name: r.name || `Student ${studentId}`,
        email: r.email || `${studentId.toLowerCase()}@university.edu`,
        course: r.course || 'B.Tech Computer Science',
        semester: Number(r.semester) || 4,
        department: r.department || 'Computer Science & Engineering',
        attendancePct: Number(r.attendance_pct || 75),
        assignmentCompletionRate: Number(r.assignment_completion_rate || 75),
        assignmentAvgScore: Number(r.assignment_avg_score || 70),
        internalTestAvg: Number(r.internal_test_avg || 65),
        previousExamScore: Number(r.previous_exam_score || 68),
        performanceTrend: Number(r.performance_trend || 0),
        studyEngagementScore: Number(r.study_engagement_score || 75),
        subjectFailureCount: Number(r.subject_failure_count || 0),
        currentRiskLevel: pred.risk_level,
        currentRiskScore: pred.risk_score,
        lastPredictedAt: new Date().toISOString(),
        subjects: [
          { name: 'Data Structures & Algorithms', score: Number(r.score_dsa || 65), attendance: Number(r.attendance_pct || 75), assignmentCompletion: Number(r.assignment_completion_rate || 75), trend: 'stable' },
          { name: 'Database Management Systems', score: Number(r.score_dbms || 70), attendance: Number(r.attendance_pct || 75), assignmentCompletion: Number(r.assignment_completion_rate || 75), trend: 'improving' },
          { name: 'Applied Mathematics', score: Number(r.score_maths || 60), attendance: Number(r.attendance_pct || 75), assignmentCompletion: Number(r.assignment_completion_rate || 75), trend: 'declining' },
          { name: 'Operating Systems', score: Number(r.score_os || 68), attendance: Number(r.attendance_pct || 75), assignmentCompletion: Number(r.assignment_completion_rate || 75), trend: 'stable' },
          { name: 'Computer Networks', score: Number(r.score_cn || 64), attendance: Number(r.attendance_pct || 75), assignmentCompletion: Number(r.assignment_completion_rate || 75), trend: 'stable' }
        ]
      };

      const existing = db.findOne('students', { studentId });
      if (existing) {
        db.updateOne('students', { _id: existing._id }, studentDoc);
        updatedCount++;
      } else {
        db.create('students', studentDoc);
        createdCount++;
      }

      // Save prediction
      db.create('predictions', {
        studentId,
        ...pred
      });
    });

    // Save dataset import metadata
    const datasetDoc = db.create('datasets', {
      filename: filename || 'academic_import.csv',
      uploadedBy: req.user.name,
      uploadedByEmail: req.user.email,
      importedRecordsCount: validRecords.length,
      createdCount,
      updatedCount,
      status: 'completed',
      importedAt: new Date().toISOString()
    });

    db.create('activity_logs', {
      userId: req.user.id,
      userName: req.user.name,
      role: 'admin',
      action: 'DATASET_IMPORTED',
      details: `Imported dataset "${filename}": ${createdCount} created, ${updatedCount} updated. ML predictions updated.`
    });

    return res.json({
      success: true,
      message: `Successfully imported ${validRecords.length} records (${createdCount} created, ${updatedCount} updated).`,
      dataset: datasetDoc
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getModelStatus = async (req, res) => {
  try {
    const info = await mlService.getModelInfo();
    return res.json({ success: true, ...info });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.triggerModelRetrain = async (req, res) => {
  try {
    const students = db.find('students');
    if (students.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'At least 10 student records are required to retrain the ML model.'
      });
    }

    const records = students.map(s => ({
      attendance_pct: s.attendancePct,
      assignment_completion_rate: s.assignmentCompletionRate,
      assignment_avg_score: s.assignmentAvgScore || s.internalTestAvg,
      internal_test_avg: s.internalTestAvg,
      previous_exam_score: s.previousExamScore,
      performance_trend: s.performanceTrend,
      study_engagement_score: s.studyEngagementScore || 75,
      subject_failure_count: s.subjectFailureCount || 0,
      score_dsa: (s.subjects && s.subjects[0]?.score) || s.internalTestAvg,
      score_dbms: (s.subjects && s.subjects[1]?.score) || s.internalTestAvg,
      score_maths: (s.subjects && s.subjects[2]?.score) || s.internalTestAvg,
      score_os: (s.subjects && s.subjects[3]?.score) || s.internalTestAvg,
      score_cn: (s.subjects && s.subjects[4]?.score) || s.internalTestAvg,
      risk_level: s.currentRiskLevel || 'Moderate'
    }));

    const result = await mlService.retrainModel(records);

    db.create('activity_logs', {
      userId: req.user.id,
      userName: req.user.name,
      role: 'admin',
      action: 'MODEL_RETRAINED',
      details: `Retrained ML models on ${records.length} institutional records.`
    });

    return res.json({
      success: true,
      message: 'EduSense ML model retrained and evaluated successfully.',
      result
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getActivityLogs = async (req, res) => {
  try {
    const logs = db.find('activity_logs').reverse();
    return res.json({ success: true, logs });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

function parseCsvString(csvString) {
  return new Promise((resolve, reject) => {
    const results = [];
    const readable = new stream.Readable();
    readable._read = () => {};
    readable.push(csvString);
    readable.push(null);

    readable
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}
