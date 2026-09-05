/**
 * Auth Controller
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { JWT_SECRET } = require('../middleware/auth');
const REAL_ADMIN_EMAIL = 'edusense.admin@gmail.com';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeSemester(value) {
  const semester = Number(value);
  if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
    return null;
  }
  return semester;
}

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = db.findOne('users', { email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const requestedRole = role ? String(role).toLowerCase() : null;
    if (requestedRole && requestedRole !== user.role) {
      return res.status(403).json({ success: false, error: `This account is provisioned as ${user.role}. Please use the matching login role.` });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Activity log
    db.create('activity_logs', {
      userId: user._id,
      userName: user.name,
      role: user.role,
      action: 'USER_LOGIN',
      details: `User ${user.email} logged in successfully.`
    });

    const { passwordHash, ...safeUser } = user;
    safeUser.id = user._id;
    return res.json({
      success: true,
      token,
      user: safeUser
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, studentId, department, semester } = req.body;
    const requestedRole = String(role || 'student').toLowerCase();
    if (requestedRole !== 'student') {
      return res.status(403).json({ success: false, error: 'Public registration is limited to student accounts.' });
    }

    if (!name || !email || !password || !studentId) {
      return res.status(400).json({ success: false, error: 'Name, email, password, and student ID are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    }
    if (normalizedEmail === REAL_ADMIN_EMAIL) {
      return res.status(403).json({ success: false, error: 'This email is reserved for the authorized administrator account.' });
    }

    const existing = db.findOne('users', { email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, error: 'A user with this email already exists.' });
    }

    const normalizedStudentId = studentId.trim();
    const studentIdUser = db.findOne('users', { studentId: normalizedStudentId });
    if (studentIdUser) {
      return res.status(400).json({ success: false, error: 'A user with this student ID already exists.' });
    }
    const existingStudent = db.findOne('students', { studentId: normalizedStudentId });
    if (existingStudent) {
      return res.status(400).json({ success: false, error: 'This student ID is already linked to an existing academic record.' });
    }

    const normalizedSemester = normalizeSemester(semester ?? 1);
    if (!normalizedSemester) {
      return res.status(400).json({ success: false, error: 'Semester must be an integer from 1 to 8.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = db.create('users', {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'student',
      studentId: normalizedStudentId,
      department: department || 'Computer Science & Engineering'
    });

    db.create('students', {
      userId: newUser._id,
      studentId: normalizedStudentId,
      name: name.trim(),
      email: normalizedEmail,
      course: 'B.Tech Computer Science',
      semester: normalizedSemester,
      department: department || 'Computer Science & Engineering',
      academicDataComplete: false,
      subjects: []
    });

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...safeUser } = newUser;
    safeUser.id = newUser._id;
    return res.status(201).json({
      success: true,
      token,
      user: safeUser
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    let studentData = null;
    if (req.user.role === 'student') {
      studentData = db.findOne('students', { email: req.user.email }) ||
                    (req.user.studentId ? db.findOne('students', { studentId: req.user.studentId }) : null);
    }
    return res.json({
      success: true,
      user: req.user,
      student: studentData
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
