/**
 * Faculty Controller
 */

const db = require('../models/db');
const mlService = require('../services/mlService');
const llmService = require('../services/llmService');

exports.getDashboardOverview = async (req, res) => {
  try {
    const students = db.find('students');
    const totalStudents = students.length;

    let highRiskCount = 0;
    let moderateRiskCount = 0;
    let lowRiskCount = 0;
    let totalAttendance = 0;
    let totalMarks = 0;

    const subjectsSummary = {
      'Data Structures & Algorithms': { total: 0, count: 0 },
      'Database Management Systems': { total: 0, count: 0 },
      'Applied Mathematics': { total: 0, count: 0 },
      'Operating Systems': { total: 0, count: 0 },
      'Computer Networks': { total: 0, count: 0 }
    };

    const attentionList = [];
    const earlyWarningAlerts = [];

    students.forEach(s => {
      const risk = s.currentRiskLevel || 'Low';
      if (risk === 'High') highRiskCount++;
      else if (risk === 'Moderate') moderateRiskCount++;
      else lowRiskCount++;

      totalAttendance += Number(s.attendancePct || 0);
      totalMarks += Number(s.internalTestAvg || 0);

      // Aggregate subject marks
      if (s.subjects && Array.isArray(s.subjects)) {
        s.subjects.forEach(sub => {
          if (subjectsSummary[sub.name]) {
            subjectsSummary[sub.name].total += Number(sub.score || 0);
            subjectsSummary[sub.name].count++;
          }
        });
      }

      // Early warning detection: high risk OR severe negative trend (< -8%) OR attendance < 65%
      const trend = Number(s.performanceTrend || 0);
      const att = Number(s.attendancePct || 0);

      if (risk === 'High' || (risk === 'Moderate' && trend < -4)) {
        attentionList.push({
          _id: s._id,
          studentId: s.studentId,
          name: s.name,
          course: s.course,
          semester: s.semester,
          attendancePct: s.attendancePct,
          internalTestAvg: s.internalTestAvg,
          currentRiskLevel: s.currentRiskLevel,
          currentRiskScore: s.currentRiskScore,
          performanceTrend: s.performanceTrend,
          mainConcern: att < 65 ? 'Critical Attendance Shortage' : trend < -8 ? 'Sharp Performance Decline' : 'Low Assessment Averages'
        });
      }

      if (trend <= -8 || (att < 60 && s.internalTestAvg < 50)) {
        earlyWarningAlerts.push({
          studentId: s.studentId,
          name: s.name,
          riskLevel: s.currentRiskLevel,
          severity: risk === 'High' ? 'Critical' : 'Warning',
          reason: `Continuous decline detected (${trend.toFixed(1)}% drop). Immediate faculty intervention recommended.`,
          attendance: att,
          marks: s.internalTestAvg
        });
      }
    });

    const avgAttendance = totalStudents > 0 ? Number((totalAttendance / totalStudents).toFixed(1)) : 0;
    const avgMarks = totalStudents > 0 ? Number((totalMarks / totalStudents).toFixed(1)) : 0;

    const subjectAverages = Object.entries(subjectsSummary).map(([name, data]) => ({
      subject: name,
      averageScore: data.count > 0 ? Number((data.total / data.count).toFixed(1)) : 70
    }));

    const riskDistribution = [
      { name: 'Low Risk', count: lowRiskCount, color: '#10b981', percentage: totalStudents ? Math.round((lowRiskCount / totalStudents) * 100) : 0 },
      { name: 'Moderate Risk', count: moderateRiskCount, color: '#f59e0b', percentage: totalStudents ? Math.round((moderateRiskCount / totalStudents) * 100) : 0 },
      { name: 'High Risk', count: highRiskCount, color: '#ef4444', percentage: totalStudents ? Math.round((highRiskCount / totalStudents) * 100) : 0 }
    ];

    return res.json({
      success: true,
      stats: {
        totalStudents,
        highRiskCount,
        moderateRiskCount,
        lowRiskCount,
        avgAttendance,
        avgMarks,
        atRiskPercentage: totalStudents ? Math.round(((highRiskCount + moderateRiskCount) / totalStudents) * 100) : 0
      },
      riskDistribution,
      subjectAverages,
      studentsRequiringAttention: attentionList.sort((a, b) => (b.currentRiskScore || 0) - (a.currentRiskScore || 0)),
      earlyWarningAlerts
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getStudentsList = async (req, res) => {
  try {
    const { search, risk, course, semester, sortBy, sortOrder = 'asc', page = 1, limit = 15 } = req.query;

    let students = db.find('students');

    // Search
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      students = students.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.studentId && s.studentId.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      );
    }

    // Risk Filter
    if (risk && risk !== 'ALL') {
      students = students.filter(s => (s.currentRiskLevel || '').toLowerCase() === risk.toLowerCase());
    }

    // Course Filter
    if (course && course !== 'ALL') {
      students = students.filter(s => s.course === course);
    }

    // Semester Filter
    if (semester && semester !== 'ALL') {
      students = students.filter(s => String(s.semester) === String(semester));
    }

    // Sorting
    const sortField = sortBy || 'studentId';
    const orderMultiplier = sortOrder === 'desc' ? -1 : 1;

    students.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return -1 * orderMultiplier;
      if (valA > valB) return 1 * orderMultiplier;
      return 0;
    });

    const total = students.length;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = students.slice(startIndex, startIndex + limitNum);

    return res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      students: paginated
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getStudentDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const student = db.findById('students', id) || db.findOne('students', { studentId: id });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    const prediction = db.findOne('predictions', { studentId: student.studentId });
    const recommendation = db.findOne('recommendations', { studentId: student.studentId });
    const interventions = db.find('interventions', { studentId: student.studentId }) || [];
    const progressHistory = db.find('academic_records', { studentId: student.studentId }) || [];

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

exports.logIntervention = async (req, res) => {
  try {
    const { studentId, note, actionTaken, priority = 'Medium', followUpDate } = req.body;
    if (!studentId || !note) {
      return res.status(400).json({ success: false, error: 'Student ID and intervention note are required.' });
    }

    const student = db.findOne('students', { studentId });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    const intervention = db.create('interventions', {
      studentId,
      studentName: student.name,
      facultyId: req.user.id,
      facultyName: req.user.name,
      note: note.trim(),
      actionTaken: actionTaken ? actionTaken.trim() : 'Advisory Meeting Scheduled',
      priority,
      status: 'in_progress',
      followUpDate: followUpDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    db.create('activity_logs', {
      userId: req.user.id,
      userName: req.user.name,
      role: 'faculty',
      action: 'FACULTY_INTERVENTION_LOGGED',
      details: `Logged intervention for student ${student.name} (${studentId}): ${actionTaken || note}`
    });

    return res.status(201).json({
      success: true,
      intervention,
      message: 'Intervention action logged successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
