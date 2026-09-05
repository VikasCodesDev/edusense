/**
 * Admin Controller
 */

const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const csvParser = require('csv-parser');
const stream = require('stream');
const db = require('../models/db');
const mlService = require('../services/mlService');
const { getLatestPrediction, prepareFeatures } = require('../services/academicService');

const REQUIRED_IMPORT_COLUMNS = [
  'student_id',
  'name',
  'attendance_pct',
  'assignment_completion_rate',
  'internal_test_avg',
  'previous_exam_score'
];
const IMPORT_COLUMN_ALIASES = {
  student_id: ['studentid', 'studentnumber', 'studentno', 'rollno', 'rollnumber', 'registrationno', 'enrollmentno'],
  name: ['studentname', 'fullname', 'full name'],
  email: ['emailid', 'studentemail', 'emailaddress'],
  attendance_pct: ['attendance', 'attendancepercentage', 'attendancepercent', 'attendancerate'],
  assignment_completion_rate: ['assignment', 'assignmentcompletion', 'assignmentpercentage', 'assignmentpercent', 'assignmentrate'],
  assignment_avg_score: ['assignmentscore', 'assignmentaverage', 'assignmentaveragescore', 'avgassignmentscore'],
  internal_test_avg: ['internalmarks', 'internalmark', 'internaltest', 'internaltestaverage', 'internalassessment', 'assessmentmarks'],
  previous_exam_score: ['previousscore', 'previousexam', 'previousexammarks', 'previoussemesterScore'],
  performance_trend: ['trend', 'performancetrend', 'scoretrend'],
  study_engagement_score: ['engagementscore', 'studyengagement', 'studyengagementscore'],
  subject_failure_count: ['failedsubjects', 'subjectfailures', 'failurecount'],
  score_dsa: ['dsa', 'dsascore', 'datastructures', 'datastructuresalgorithms', 'datastructuresalgorithmscore'],
  score_dbms: ['dbms', 'dbmsscore', 'databasemanagementsystems', 'databasemanagementsystemsscore'],
  score_maths: ['math', 'maths', 'mathscore', 'mathsscore', 'mathematics', 'mathematicsscore', 'appliedmathematics'],
  score_os: ['os', 'osscore', 'operatingsystems', 'operatingsystemsscore'],
  score_cn: ['cn', 'cnscore', 'computerNetworks', 'computernetworks', 'computernetworksscore']
};
const OPTIONAL_IMPORT_ALIASES = {
  assignment_avg_score: ['assignmentscore', 'assignmentaverage', 'assignmentaveragescore', 'avgassignmentscore'],
  performance_trend: ['trend', 'performancetrend', 'scoretrend'],
  study_engagement_score: ['engagementscore', 'studyengagement', 'studyengagementscore'],
  subject_failure_count: ['failedsubjects', 'subjectfailures', 'failurecount']
};
const REAL_ADMIN_EMAIL = 'edusense.admin@gmail.com';
const DEMO_ADMIN_EMAIL = 'admin@edusense.edu';
const DEMO_USER_IDS = new Set(['usr_admin_01', 'usr_faculty_01', 'usr_student_01', 'usr_student_02', 'usr_student_03']);

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isRealAdmin(user) {
  return user && user.role === 'admin' && user.email === REAL_ADMIN_EMAIL;
}

function normalizeSemester(value, fallback = 1) {
  const semester = Number(value ?? fallback);
  if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
    return null;
  }
  return semester;
}

function normalizeAssignedStudentIds(value) {
  if (Array.isArray(value)) {
    return value.map((id) => String(id).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(/[\n,]+/).map((id) => id.trim()).filter(Boolean);
  }
  return [];
}

function isDemoStudentRecord(student) {
  return student && !student.userId && !student.dataSource;
}

function isDemoUser(user) {
  return DEMO_USER_IDS.has(user._id);
}

function scopeRealStudents(students) {
  return students.filter((student) => !isDemoStudentRecord(student));
}

function valueOrDefault(value, fallback) {
  return value === undefined || value === null || value === '' ? fallback : value;
}

function numberOrDefault(value, fallback) {
  return Number(valueOrDefault(value, fallback));
}

function validateAssignedStudentIds(ids) {
  const missing = ids.filter((studentId) => !db.findOne('students', { studentId }));
  const demo = ids.filter((studentId) => isDemoStudentRecord(db.findOne('students', { studentId })));
  return { missing, demo };
}

function normalizedHeader(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

const CANONICAL_HEADERS = new Set([
  ...[
    ...REQUIRED_IMPORT_COLUMNS,
    'assignment_avg_score',
    'performance_trend',
    'study_engagement_score',
    'subject_failure_count',
    'course',
    'semester',
    'department',
    'section',
    'subjects',
    'risk_level'
  ].map(normalizedHeader)
]);

function subjectNameFromHeader(header) {
  const trimmed = String(header).trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  const name = trimmed.replace(/\s+(score|marks|mark|grade|percentage|percent)$/i, '').trim();
  return name.replace(/^score\s+/i, '').trim() || trimmed;
}

function normalizeImportRow(row) {
  const normalized = Object.entries(row).reduce((acc, [key, value]) => {
    const cleanValue = typeof value === 'string' ? value.trim() : value;
    const canonical = [...REQUIRED_IMPORT_COLUMNS, ...Object.keys(OPTIONAL_IMPORT_ALIASES)].find((column) => (
      normalizedHeader(column) === normalizedHeader(key) ||
      [...(IMPORT_COLUMN_ALIASES[column] || []), ...(OPTIONAL_IMPORT_ALIASES[column] || [])]
        .some((alias) => normalizedHeader(alias) === normalizedHeader(key))
    ));
    const normalizedKey = normalizedHeader(key);
    if (canonical || CANONICAL_HEADERS.has(normalizedKey)) {
      acc[canonical || normalizedKey] = cleanValue;
    } else if (cleanValue !== undefined && cleanValue !== null && cleanValue !== '' && Number.isFinite(Number(cleanValue))) {
      acc.subjects = [...(acc.subjects || []), {
        name: subjectNameFromHeader(key),
        score: Number(cleanValue)
      }];
    }
    return acc;
  }, {});
  return normalized;
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
    const studentId = String(row.student_id ?? '').trim();
    if (!studentId) errors.push('Missing student_id');
    if (studentId && seen.has(studentId)) errors.push('Duplicate student_id in upload');
    if (studentId) seen.add(studentId);
    if (row.name === undefined || row.name === null || row.name === '') errors.push('Missing name');
    if (row.email !== undefined && row.email !== null && row.email !== '' && !isValidEmail(String(row.email).toLowerCase())) errors.push('Invalid email');

    REQUIRED_IMPORT_COLUMNS.forEach((column) => {
      if (row[column] === undefined || row[column] === null || row[column] === '') {
        errors.push(`Missing required value: ${column}`);
      }
    });

    ['attendance_pct', 'assignment_completion_rate', 'assignment_avg_score', 'internal_test_avg', 'previous_exam_score', 'study_engagement_score'].forEach((column) => {
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
    if (row.semester !== undefined && row.semester !== '') {
      const semester = Number(row.semester);
      if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
        errors.push('semester must be an integer from 1 to 8');
      }

      if (!Array.isArray(row.subjects) || row.subjects.length === 0) {
        errors.push('At least one numeric subject score is required');
      } else {
        row.subjects.forEach((subject) => {
          if (subject.score < 0 || subject.score > 100) errors.push(`${subject.name} score must be between 0 and 100`);
        });
      }
    }

    const userForStudentId = studentId ? db.findOne('users', { studentId }) : null;
    if (userForStudentId && userForStudentId.email !== String(row.email || '').toLowerCase()) {
      errors.push('student_id belongs to a different registered email');
    }
    const existingStudent = studentId ? db.findOne('students', { studentId }) : null;
    if (isDemoStudentRecord(existingStudent)) {
      errors.push('demo student records are protected from real imports');
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
    const users = db.find('users');
    const students = isRealAdmin(req.user) ? scopeRealStudents(db.find('students')) : db.find('students');
    const realStudentIds = new Set(students.map((student) => student.studentId));
    const totalUsers = isRealAdmin(req.user)
      ? users.filter((user) => !isDemoUser(user)).length
      : users.length;
    const totalStudents = students.length;
    const totalFaculty = isRealAdmin(req.user)
      ? users.filter((user) => user.role === 'faculty' && user.email !== 'faculty@edusense.edu').length
      : db.countDocuments('users', { role: 'faculty' });
    const totalPredictions = isRealAdmin(req.user)
      ? db.find('predictions').filter((prediction) => realStudentIds.has(prediction.studentId)).length
      : db.countDocuments('predictions');
    const totalDatasets = isRealAdmin(req.user)
      ? db.find('datasets').filter((dataset) => dataset.uploadedByEmail === REAL_ADMIN_EMAIL).length
      : db.countDocuments('datasets');
    const recentLogs = db.find('activity_logs')
      .filter((log) => !isRealAdmin(req.user) || !DEMO_USER_IDS.has(log.userId))
      .slice(-10)
      .reverse();

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
    const users = db.find('users')
      .filter((u) => !isRealAdmin(req.user) || !isDemoUser(u))
      .map(u => {
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
    if (!isRealAdmin(req.user)) {
      return res.status(403).json({ success: false, error: 'Only the authorized real administrator can provision real accounts.' });
    }

    const { name, email, password, role, studentId, facultyId, department, semester, section, assignedStudentIds, assignedSemester, assignedSection, status } = req.body;
    const normalizedRole = String(role || '').toLowerCase();
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Name, email, password, and role are required.' });
    }
    if (!['student', 'faculty', 'admin'].includes(normalizedRole)) {
      return res.status(400).json({ success: false, error: 'Invalid role requested.' });
    }
    if (normalizedRole === 'admin') {
      return res.status(403).json({ success: false, error: 'Additional administrator accounts cannot be created.' });
    }
    if (normalizedRole === 'student' && !studentId) {
      return res.status(400).json({ success: false, error: 'Student ID is required for student accounts.' });
    }
    const normalizedSemester = normalizedRole === 'student' ? normalizeSemester(semester ?? 1) : null;
    if (normalizedRole === 'student' && !normalizedSemester) {
      return res.status(400).json({ success: false, error: 'Semester must be an integer from 1 to 8.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }
    if (normalizedEmail === DEMO_ADMIN_EMAIL || normalizedEmail === 'faculty@edusense.edu' || normalizedEmail === REAL_ADMIN_EMAIL) {
      return res.status(400).json({ success: false, error: 'This email is reserved or already protected.' });
    }
    if (db.findOne('users', { email: normalizedEmail })) {
      return res.status(400).json({ success: false, error: 'User with this email already exists.' });
    }
    if (studentId && db.findOne('users', { studentId: studentId.trim() })) {
      return res.status(400).json({ success: false, error: 'User with this student ID already exists.' });
    }
    if (normalizedRole === 'student') {
      const existingStudent = db.findOne('students', { studentId: studentId.trim() });
      if (isDemoStudentRecord(existingStudent)) {
        return res.status(400).json({ success: false, error: 'Demo student records are protected from real account provisioning.' });
      }
    }
    const normalizedAssignments = normalizedRole === 'faculty' ? normalizeAssignedStudentIds(assignedStudentIds) : [];
    const assignmentErrors = validateAssignedStudentIds(normalizedAssignments);
    if (assignmentErrors.missing.length > 0) {
      return res.status(400).json({ success: false, error: `Assigned student IDs not found: ${assignmentErrors.missing.join(', ')}` });
    }
    if (assignmentErrors.demo.length > 0) {
      return res.status(400).json({ success: false, error: `Demo student IDs cannot be assigned to real faculty accounts: ${assignmentErrors.demo.join(', ')}` });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = db.create('users', {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: normalizedRole,
      studentId: studentId ? studentId.trim() : null,
      facultyId: normalizedRole === 'faculty' && facultyId ? facultyId.trim() : undefined,
      department: department || 'Computer Science & Engineering',
      status: status || 'active',
      assignedStudentIds: normalizedRole === 'faculty' ? normalizedAssignments : undefined,
      assignedSemester: normalizedRole === 'faculty' && assignedSemester ? Number(assignedSemester) : undefined,
      assignedSection: normalizedRole === 'faculty' && assignedSection ? String(assignedSection).trim() : undefined
    });

    if (normalizedRole === 'student') {
      const existingStudent = db.findOne('students', { studentId: studentId.trim() });
      if (existingStudent) {
        db.updateOne('students', { _id: existingStudent._id }, {
          userId: user._id,
          name: existingStudent.name || name.trim(),
          email: existingStudent.email || normalizedEmail,
          semester: existingStudent.semester || normalizedSemester
        });
      } else {
        db.create('students', {
          userId: user._id,
          studentId: studentId.trim(),
          name: name.trim(),
          email: normalizedEmail,
          course: 'B.Tech Computer Science',
          semester: normalizedSemester,
          department: department || 'Computer Science & Engineering',
          section: section ? String(section).trim() : undefined,
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

exports.assignStudentsToFaculty = async (req, res) => {
  try {
    if (!isRealAdmin(req.user)) {
      return res.status(403).json({ success: false, error: 'Only the authorized real administrator can update faculty assignments.' });
    }

    const { id } = req.params;
    const faculty = db.findById('users', id);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ success: false, error: 'Faculty account not found.' });
    }
    if (faculty._id === 'usr_faculty_01' || faculty.email === 'faculty@edusense.edu') {
      return res.status(400).json({ success: false, error: 'Demo faculty assignments are protected.' });
    }

    const assignedStudentIds = normalizeAssignedStudentIds(req.body.assignedStudentIds);
    const assignmentErrors = validateAssignedStudentIds(assignedStudentIds);
    if (assignmentErrors.missing.length > 0) {
      return res.status(400).json({ success: false, error: `Assigned student IDs not found: ${assignmentErrors.missing.join(', ')}` });
    }
    if (assignmentErrors.demo.length > 0) {
      return res.status(400).json({ success: false, error: `Demo student IDs cannot be assigned to real faculty accounts: ${assignmentErrors.demo.join(', ')}` });
    }

    const updates = { assignedStudentIds };
    if (req.body.assignedSemester !== undefined && req.body.assignedSemester !== '') {
      const assignedSemester = normalizeSemester(req.body.assignedSemester, null);
      if (!assignedSemester) {
        return res.status(400).json({ success: false, error: 'Assigned semester must be an integer from 1 to 8.' });
      }
      updates.assignedSemester = assignedSemester;
    }
    if (req.body.assignedSection !== undefined) {
      updates.assignedSection = String(req.body.assignedSection || '').trim() || undefined;
    }

    const updated = db.updateOne('users', { _id: faculty._id }, updates);
    const { passwordHash, ...safe } = updated;

    db.create('activity_logs', {
      userId: req.user.id,
      userName: req.user.name,
      role: 'admin',
      action: 'FACULTY_ASSIGNMENTS_UPDATED',
      details: `Updated student assignments for ${faculty.email}: ${assignedStudentIds.length} student(s).`
    });

    return res.json({ success: true, user: safe });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (!isRealAdmin(req.user)) {
      return res.status(403).json({ success: false, error: 'Only the authorized real administrator can delete real accounts.' });
    }

    const { id } = req.params;
    const user = db.findById('users', id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    if (user._id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Administrators cannot delete their own active account.' });
    }
    if (user.email === DEMO_ADMIN_EMAIL || user.email === 'faculty@edusense.edu' || String(user.email || '').startsWith('student')) {
      return res.status(400).json({ success: false, error: 'Demo accounts are protected.' });
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
    if (!isRealAdmin(req.user)) {
      return res.status(403).json({ success: false, error: 'Only the authorized real administrator can import institutional data.' });
    }

    let records = [];
    let detectedColumns = [];
    let filename = 'manual_input.csv';

    if (req.file) {
      filename = req.file.originalname;
      const fileBuffer = req.file.buffer;

      const extension = filename.toLowerCase();
      if (extension.endsWith('.xlsx') || extension.endsWith('.xls')) {
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
    if (!isRealAdmin(req.user)) {
      return res.status(403).json({ success: false, error: 'Only the authorized real administrator can import institutional data.' });
    }

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
    const mlBatchInput = importableRecords.map(r => prepareFeatures({
      studentId: r.student_id,
      attendancePct: r.attendance_pct,
      assignmentCompletionRate: r.assignment_completion_rate,
      assignmentAvgScore: r.assignment_avg_score,
      internalTestAvg: r.internal_test_avg,
      previousExamScore: r.previous_exam_score,
      performanceTrend: r.performance_trend,
      studyEngagementScore: r.study_engagement_score,
      subjectFailureCount: r.subject_failure_count,
      subjects: r.subjects
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
        email: r.email ? String(r.email).toLowerCase() : undefined,
        course: r.course || 'B.Tech Computer Science',
        semester: numberOrDefault(r.semester, 1),
        department: r.department || 'Computer Science & Engineering',
        section: r.section ? String(r.section).trim() : undefined,
        attendancePct: numberOrDefault(r.attendance_pct, 75),
        assignmentCompletionRate: numberOrDefault(r.assignment_completion_rate, 75),
        assignmentAvgScore: numberOrDefault(r.assignment_avg_score, 70),
        internalTestAvg: numberOrDefault(r.internal_test_avg, 65),
        previousExamScore: numberOrDefault(r.previous_exam_score, 68),
        performanceTrend: numberOrDefault(r.performance_trend, 0),
        studyEngagementScore: numberOrDefault(r.study_engagement_score, 75),
        subjectFailureCount: numberOrDefault(r.subject_failure_count, r.subjects.filter((subject) => subject.score < 50).length),
        subjects: r.subjects.map((subject) => ({
          ...subject,
          attendance: numberOrDefault(r.attendance_pct, 75),
          assignmentCompletion: numberOrDefault(r.assignment_completion_rate, 75),
          trend: 'stable'
        })),
        currentRiskLevel: pred.risk_level,
        currentRiskScore: pred.risk_score,
        lastPredictedAt: new Date().toISOString(),
        academicDataComplete: true,
        dataSource: 'admin_import'
      };

      const existing = db.findOne('students', { studentId });
      if (existing) {
        db.deleteMany('recommendations', { studentId });
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
    const logs = db.find('activity_logs')
      .filter((log) => !isRealAdmin(req.user) || !DEMO_USER_IDS.has(log.userId))
      .reverse();
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
