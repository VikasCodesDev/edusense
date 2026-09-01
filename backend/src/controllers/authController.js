/**
 * Auth Controller
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { JWT_SECRET } = require('../middleware/auth');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
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
    const { name, email, password, role, studentId, department } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Name, email, password, and role are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = db.findOne('users', { email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, error: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = db.create('users', {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: role.toLowerCase(),
      studentId: studentId ? studentId.trim() : null,
      department: department || 'Computer Science & Engineering'
    });

    // If student, ensure student record is also linked
    if (role.toLowerCase() === 'student' && studentId) {
      const existingStudent = db.findOne('students', { studentId: studentId.trim() });
      if (!existingStudent) {
        db.create('students', {
          studentId: studentId.trim(),
          name: name.trim(),
          email: normalizedEmail,
          course: 'B.Tech Computer Science',
          semester: 4,
          department: department || 'Computer Science & Engineering',
          attendancePct: 75.0,
          assignmentCompletionRate: 80.0,
          internalTestAvg: 65.0,
          previousExamScore: 68.0,
          performanceTrend: 0.0,
          studyEngagementScore: 75.0,
          subjectFailureCount: 0,
          currentRiskLevel: 'Moderate',
          currentRiskScore: 45,
          subjects: [
            { name: 'Data Structures & Algorithms', score: 65, attendance: 75, assignmentCompletion: 80, trend: 'stable' },
            { name: 'Database Management Systems', score: 70, attendance: 78, assignmentCompletion: 85, trend: 'improving' },
            { name: 'Applied Mathematics', score: 60, attendance: 72, assignmentCompletion: 75, trend: 'declining' },
            { name: 'Operating Systems', score: 68, attendance: 76, assignmentCompletion: 80, trend: 'stable' },
            { name: 'Computer Networks', score: 64, attendance: 74, assignmentCompletion: 78, trend: 'stable' }
          ]
        });
      }
    }

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...safeUser } = newUser;
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
