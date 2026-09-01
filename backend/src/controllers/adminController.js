/**
 * Admin Controller
 */

const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const csvParser = require('csv-parser');
const stream = require('stream');
const db = require('../models/db');
const mlService = require('../services/mlService');
const { getLatestPrediction } = require('../services/academicService');

const REQUIRED_IMPORT_COLUMNS = [
  'student_id',
  'name',
  'email',
  'attendance_pct',
  'assignment_completion_rate',
  'internal_test_avg',
  'previous_exam_score',
  'score_dsa',
  'score_dbms',
  'score_maths',
  'score_os',
  'score_cn'
];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeImportRow(row) {
  return Object.entries(row).reduce((acc, [key, value]) => {
    acc[String(key).trim().toLowerCase()] = typeof value === 'string' ? value.trim() : value;
    return acc;
  }, {});
}

function validateImportRows(records) {
  const normalized = records.map(normalizeImportRow);
  const detectedColumns = Object.keys(normalized[0] || {});
  const missingColumns = REQUIRED_IMPORT_COLUMNS.filter((column) => !detectedColumns.includes(column));
  const valid = [];
  const invalid = [];
  const seen = new Set();

  normalized.forEach((row, idx) => {
    const errors = [];
    const studentId = String(row.student_id || row.roll_no || '').trim();
    if (!studentId) errors.push('Missing student_id');
    if (studentId && seen.has(studentId)) errors.push('Duplicate student_id in upload');
    if (studentId) seen.add(studentId);
    if (!row.name) errors.push('Missing name');
    if (!row.email || !isValidEmail(String(row.email).toLowerCase())) errors.push('Invalid email');

    REQUIRED_IMPORT_COLUMNS.forEach((column) => {
      if (row[column] === undefined || row[column] === null || row[column] === '') {
        errors.push(`Missing required value: ${column}`);
      }
    });

    ['attendance_pct', 'assignment_completion_rate', 'assignment_avg_score', 'internal_test_avg', 'previous_exam_score', 'study_engagement_score', 'score_dsa', 'score_dbms', 'score_maths', 'score_os', 'score_cn'].forEach((column) => {
      if (row[column] === undefined || row[column] === null || row[column] === '') return;
      const value = Number(row[column]);
      if (!Number.isFinite(value)) errors.push(`${column} must be numeric`);
      else if (value < 0 || value > 100) errors.push(`${column} must be between 0 and 100`);
    });

    if (row.performance_trend !== undefined && row.performance_trend !== '' && !Number.isFinite(Number(row.performance_trend))) {
      errors.push('performance_trend must be numeric');
    }
    if (row.subject_failure_count !== undefined && row.subject_failure_count !== '' && Number(row.subject_failure_count) < 0) {
      errors.push('subject_failure_count cannot be negative');
    }

    const userForStudentId = studentId ? db.findOne('users', { studentId }) : null;
    if (userForStudentId && userForStudentId.email !== String(row.email || '').toLowerCase()) {
      errors.push('student_id belongs to a different registered email');
    }

    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    if (errors.length > 0) {
      invalid.push({ row_number: idx + 1, student_id: studentId || 'N/A', errors, raw_data: row });
    } else {
      valid.push(row);
    }
  });

  return {
    total_records: records.length,
    valid_count: valid.length,
    invalid_count: invalid.length,
    duplicate_count: invalid.filter((row) => row.errors.some((err) => err.includes('Duplicate student_id'))).length,
    validation_errors: invalid,
    all_valid_records: valid,
    preview_valid_records: valid.slice(0, 10),
    is_ready_for_import: invalid.length === 0
  };
}

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
    const normalizedRole = String(role || '').toLowerCase();
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Name, email, password, and role are required.' });
    }
    if (!['student', 'faculty', 'admin'].includes(normalizedRole)) {
      return res.status(400).json({ success: false, error: 'Invalid role requested.' });
    }
    if (normalizedRole === 'student' && !studentId) {
      return res.status(400).json({ success: false, error: 'Student ID is required for student accounts.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }
    if (db.findOne('users', { email: normalizedEmail })) {
      return res.status(400).json({ success: false, error: 'User with this email already exists.' });
    }
    if (studentId && db.findOne('users', { studentId: studentId.trim() })) {
      return res.status(400).json({ success: false, error: 'User with this student ID already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = db.create('users', {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: normalizedRole,
      studentId: studentId ? studentId.trim() : null,
      department: department || 'Computer Science & Engineering'
    });

    if (normalizedRole === 'student') {
      const existingStudent = db.findOne('students', { studentId: studentId.trim() });
      if (existingStudent) {
        db.updateOne('students', { _id: existingStudent._id }, {
          userId: user._id,
          name: existingStudent.name || name.trim(),
          email: existingStudent.email || normalizedEmail
        });
      } else {
        db.create('students', {
          userId: user._id,
          studentId: studentId.trim(),
          name: name.trim(),
          email: normalizedEmail,
          course: 'B.Tech Computer Science',
          semester: 4,
          department: department || 'Computer Science & Engineering',
          academicDataComplete: false,
          subjects: []
        });
      }
    }

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
    if (user._id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Administrators cannot delete their own active account.' });
    }

    db.deleteOne('users', { _id: id });
    if (user.role === 'student') {
      const student = db.findOne('students', { userId: user._id }) ||
        db.findOne('students', { email: user.email }) ||
        (user.studentId ? db.findOne('students', { studentId: user.studentId }) : null);
      if (student) {
        db.deleteOne('students', { _id: student._id });
        db.deleteMany('academic_records', { studentId: student.studentId });
        db.deleteMany('predictions', { studentId: student.studentId });
        db.deleteMany('recommendations', { studentId: student.studentId });
        db.deleteMany('interventions', { studentId: student.studentId });
      }
    }
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

    const validationReport = validateImportRows(records);

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
    const validation = validateImportRows(validRecords);
    if (validation.valid_count === 0) {
      return res.status(400).json({ success: false, error: 'No valid records to import.', validation });
    }

    // Run batch ML predictions on imported records
    const importableRecords = validation.all_valid_records;
    const mlBatchInput = importableRecords.map(r => ({
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

    importableRecords.forEach(r => {
      const studentId = r.student_id || r.roll_no;
      const pred = predictionMap[studentId];
      if (!pred) {
        return;
      }

      const studentDoc = {
        studentId,
        name: r.name || `Student ${studentId}`,
        email: String(r.email).toLowerCase(),
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
        subjectFailureCount: Number(r.subject_failure_count || [r.score_dsa, r.score_dbms, r.score_maths, r.score_os, r.score_cn].filter((score) => Number(score) < 50).length),
        currentRiskLevel: pred.risk_level,
        currentRiskScore: pred.risk_score,
        lastPredictedAt: new Date().toISOString(),
        subjects: [
          { name: 'Data Structures & Algorithms', score: Number(r.score_dsa || 65), attendance: Number(r.attendance_pct || 75), assignmentCompletion: Number(r.assignment_completion_rate || 75), trend: 'stable' },
          { name: 'Database Management Systems', score: Number(r.score_dbms || 70), attendance: Number(r.attendance_pct || 75), assignmentCompletion: Number(r.assignment_completion_rate || 75), trend: 'improving' },
          { name: 'Applied Mathematics', score: Number(r.score_maths || 60), attendance: Number(r.attendance_pct || 75), assignmentCompletion: Number(r.assignment_completion_rate || 75), trend: 'declining' },
          { name: 'Operating Systems', score: Number(r.score_os || 68), attendance: Number(r.attendance_pct || 75), assignmentCompletion: Number(r.assignment_completion_rate || 75), trend: 'stable' },
          { name: 'Computer Networks', score: Number(r.score_cn || 64), attendance: Number(r.attendance_pct || 75), assignmentCompletion: Number(r.assignment_completion_rate || 75), trend: 'stable' }
        ],
        academicDataComplete: true,
        dataSource: 'admin_import'
      };

      const existing = db.findOne('students', { studentId });
      if (existing) {
        db.updateOne('students', { _id: existing._id }, { ...studentDoc, userId: existing.userId });
        updatedCount++;
      } else {
        const linkedUser = db.findOne('users', { studentId }) || db.findOne('users', { email: studentDoc.email });
        db.create('students', { ...studentDoc, userId: linkedUser?._id });
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
      rejectedRecordsCount: validation.invalid_count,
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
      details: `Imported dataset "${filename}": ${createdCount} created, ${updatedCount} updated, ${validation.invalid_count} rejected. ML predictions updated.`
    });

    return res.json({
      success: true,
      message: `${importableRecords.length} records imported, ${validation.invalid_count} records rejected.`,
      importedCount: importableRecords.length,
      rejectedCount: validation.invalid_count,
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
      risk_level: s.currentRiskLevel || getLatestPrediction(s.studentId)?.risk_level || 'Low'
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
