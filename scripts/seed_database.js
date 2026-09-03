/**
 * EduSense Database Seeder
 * Populates MongoDB / persistent storage with demo accounts, 50+ students,
 * academic records, pre-calculated ML risk predictions, and personalized recommendations.
 */

const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('../backend/src/models/db');
const mlService = require('../backend/src/services/mlService');
const llmService = require('../backend/src/services/llmService');

async function seed() {
  console.log('[Seeder] Initializing EduSense Database Seeding...');

  // Clear existing collections
  db.data.users = [];
  db.data.students = [];
  db.data.academic_records = [];
  db.data.predictions = [];
  db.data.recommendations = [];
  db.data.interventions = [];
  db.data.datasets = [];
  db.data.activity_logs = [];

  const salt = await bcrypt.genSalt(10);
  const studentPasswordHash = await bcrypt.hash('Student@123', salt);
  const facultyPasswordHash = await bcrypt.hash('Faculty@123', salt);
  const adminPasswordHash = await bcrypt.hash('Admin@123', salt);

  // 1. Create Core Users
  const users = [
    {
      _id: 'usr_admin_01',
      name: 'System Administrator',
      email: 'admin@edusense.edu',
      passwordHash: adminPasswordHash,
      role: 'admin',
      department: 'Academic Computing Center'
    },
    {
      _id: 'usr_faculty_01',
      name: 'Prof. Sunita Rao',
      email: 'faculty@edusense.edu',
      passwordHash: facultyPasswordHash,
      role: 'faculty',
      department: 'Computer Science & Engineering'
    },
    {
      _id: 'usr_student_01',
      name: 'Rahul Sharma',
      email: 'student1@edusense.edu',
      passwordHash: studentPasswordHash,
      role: 'student',
      studentId: 'EDU2024CS001',
      department: 'Computer Science & Engineering'
    },
    {
      _id: 'usr_student_02',
      name: 'Priya Patel',
      email: 'student2@edusense.edu',
      passwordHash: studentPasswordHash,
      role: 'student',
      studentId: 'EDU2024CS002',
      department: 'Computer Science & Engineering'
    },
    {
      _id: 'usr_student_03',
      name: 'Aarav Gupta',
      email: 'student3@edusense.edu',
      passwordHash: studentPasswordHash,
      role: 'student',
      studentId: 'EDU2024CS003',
      department: 'Computer Science & Engineering'
    }
  ];

  db.insertMany('users', users);
  console.log(`[Seeder] Seeded ${users.length} authenticated users.`);

  // 2. Curated Archetype Students
  const curatedStudents = [
    {
      studentId: 'EDU2024CS001',
      name: 'Rahul Sharma',
      email: 'student1@edusense.edu',
      course: 'B.Tech Computer Science',
      semester: 4,
      department: 'Computer Science & Engineering',
      attendancePct: 58.0,
      assignmentCompletionRate: 50.0,
      assignmentAvgScore: 48.0,
      internalTestAvg: 42.0,
      previousExamScore: 52.0,
      performanceTrend: -14.0,
      studyEngagementScore: 40.0,
      subjectFailureCount: 2,
      currentRiskLevel: 'High',
      currentRiskScore: 92,
      subjects: [
        { name: 'Data Structures & Algorithms', score: 38, attendance: 55, assignmentCompletion: 45, trend: 'declining' },
        { name: 'Database Management Systems', score: 62, attendance: 65, assignmentCompletion: 60, trend: 'stable' },
        { name: 'Applied Mathematics', score: 36, attendance: 52, assignmentCompletion: 40, trend: 'declining' },
        { name: 'Operating Systems', score: 45, attendance: 60, assignmentCompletion: 55, trend: 'declining' },
        { name: 'Computer Networks', score: 50, attendance: 58, assignmentCompletion: 50, trend: 'stable' }
      ]
    },
    {
      studentId: 'EDU2024CS002',
      name: 'Priya Patel',
      email: 'student2@edusense.edu',
      course: 'B.Tech Computer Science',
      semester: 4,
      department: 'Computer Science & Engineering',
      attendancePct: 74.0,
      assignmentCompletionRate: 75.0,
      assignmentAvgScore: 68.0,
      internalTestAvg: 60.0,
      previousExamScore: 65.0,
      performanceTrend: -4.0,
      studyEngagementScore: 68.0,
      subjectFailureCount: 0,
      currentRiskLevel: 'Moderate',
      currentRiskScore: 48,
      subjects: [
        { name: 'Data Structures & Algorithms', score: 62, attendance: 75, assignmentCompletion: 78, trend: 'stable' },
        { name: 'Database Management Systems', score: 72, attendance: 78, assignmentCompletion: 80, trend: 'improving' },
        { name: 'Applied Mathematics', score: 48, attendance: 68, assignmentCompletion: 70, trend: 'declining' },
        { name: 'Operating Systems', score: 65, attendance: 74, assignmentCompletion: 75, trend: 'stable' },
        { name: 'Computer Networks', score: 63, attendance: 75, assignmentCompletion: 72, trend: 'stable' }
      ]
    },
    {
      studentId: 'EDU2024CS003',
      name: 'Aarav Gupta',
      email: 'student3@edusense.edu',
      course: 'B.Tech Computer Science',
      semester: 4,
      department: 'Computer Science & Engineering',
      attendancePct: 92.0,
      assignmentCompletionRate: 98.0,
      assignmentAvgScore: 89.0,
      internalTestAvg: 88.0,
      previousExamScore: 86.0,
      performanceTrend: 6.0,
      studyEngagementScore: 92.0,
      subjectFailureCount: 0,
      currentRiskLevel: 'Low',
      currentRiskScore: 12,
      subjects: [
        { name: 'Data Structures & Algorithms', score: 92, attendance: 95, assignmentCompletion: 100, trend: 'improving' },
        { name: 'Database Management Systems', score: 88, attendance: 90, assignmentCompletion: 95, trend: 'stable' },
        { name: 'Applied Mathematics', score: 85, attendance: 92, assignmentCompletion: 98, trend: 'improving' },
        { name: 'Operating Systems', score: 87, attendance: 90, assignmentCompletion: 95, trend: 'stable' },
        { name: 'Computer Networks', score: 90, attendance: 94, assignmentCompletion: 100, trend: 'improving' }
      ]
    }
  ];

  // 3. Generate 45 more student records
  const namesPool = [
    { f: 'Aditya', l: 'Verma' }, { f: 'Vihaan', l: 'Singh' }, { f: 'Arjun', l: 'Reddy' },
    { f: 'Ananya', l: 'Nair' }, { f: 'Diya', l: 'Mehta' }, { f: 'Saanvi', l: 'Joshi' },
    { f: 'Vikas', l: 'Chopra' }, { f: 'Rohan', l: 'Malhotra' }, { f: 'Anika', l: 'Kapoor' },
    { f: 'Ishaan', l: 'Bose' }, { f: 'Atharva', l: 'Das' }, { f: 'Dhruv', l: 'Mukherjee' },
    { f: 'Kabir', l: 'Banerjee' }, { f: 'Rudra', l: 'Ghosh' }, { f: 'Deepak', l: 'Mishra' },
    { f: 'Sneha', l: 'Pandey' }, { f: 'Kunal', l: 'Saxena' }, { f: 'Pooja', l: 'Bhatia' },
    { f: 'Vikram', l: 'Seth' }, { f: 'Neha', l: 'Tiwari' }, { f: 'Amit', l: 'Yadav' },
    { f: 'Simran', l: 'Chauhan' }, { f: 'Varun', l: 'Agarwal' }, { f: 'Shruti', l: 'Bansal' },
    { f: 'Manish', l: 'Dubey' }, { f: 'Divya', l: 'Iyer' }, { f: 'Gaurav', l: 'Soni' },
    { f: 'Tanvi', l: 'Sen' }, { f: 'Riya', l: 'Nath' }, { f: 'Karan', l: 'Garg' },
    { f: 'Ayush', l: 'Kaur' }, { f: 'Nikhil', l: 'Rawat' }, { f: 'Tarun', l: 'Gill' },
    { f: 'Shreya', l: 'Bora' }, { f: 'Bhavya', l: 'Pillai' }, { f: 'Suresh', l: 'Menon' },
    { f: 'Harsh', l: 'Naik' }, { f: 'Aniket', l: 'Hegde' }, { f: 'Kavita', l: 'Shetty' },
    { f: 'Pranav', l: 'Gowda' }, { f: 'Rajat', l: 'Venkatesh' }, { f: 'Kiran', l: 'Rajan' },
    { f: 'Alok', l: 'Swaminathan' }, { f: 'Megha', l: 'Krishnan' }, { f: 'Sakshi', l: 'Chatterjee' }
  ];

  const allStudents = [...curatedStudents];

  namesPool.forEach((person, idx) => {
    const studentId = `EDU2024CS${String(idx + 4).padStart(3, '0')}`;
    const name = `${person.f} ${person.l}`;
    const email = `${person.f.toLowerCase()}.${person.l.toLowerCase()}${idx + 4}@university.edu`;

    let archetype = idx % 3; // 0 = low risk, 1 = moderate risk, 2 = high risk (balanced distribution)
    let att, assignComp, internal, prevExam, trend, failures, riskLevel, riskScore;

    if (archetype === 0) { // Low Risk
      att = 82 + (idx % 15);
      assignComp = 85 + (idx % 14);
      internal = 78 + (idx % 18);
      prevExam = 75 + (idx % 20);
      trend = 2 + (idx % 6);
      failures = 0;
      riskLevel = 'Low';
      riskScore = 10 + (idx % 20);
    } else if (archetype === 1) { // Moderate Risk
      att = 68 + (idx % 8);
      assignComp = 65 + (idx % 12);
      internal = 54 + (idx % 12);
      prevExam = 60 + (idx % 10);
      trend = -4 - (idx % 5);
      failures = idx % 5 === 0 ? 1 : 0;
      riskLevel = 'Moderate';
      riskScore = 45 + (idx % 15);
    } else { // High Risk
      att = 48 + (idx % 15);
      assignComp = 42 + (idx % 15);
      internal = 36 + (idx % 12);
      prevExam = 46 + (idx % 12);
      trend = -10 - (idx % 8);
      failures = 1 + (idx % 3);
      riskLevel = 'High';
      riskScore = 78 + (idx % 20);
    }

    const dsa = Math.max(25, Math.min(98, internal + ((idx % 7) - 3) * 2));
    const dbms = Math.max(30, Math.min(98, internal + ((idx % 5) - 2) * 2));
    const maths = Math.max(25, Math.min(98, internal + ((idx % 6) - 4) * 2));
    const os = Math.max(30, Math.min(98, internal + ((idx % 4) - 2) * 2));
    const cn = Math.max(30, Math.min(98, internal + ((idx % 5) - 1) * 2));

    allStudents.push({
      studentId,
      name,
      email,
      course: 'B.Tech Computer Science',
      semester: 4,
      department: 'Computer Science & Engineering',
      attendancePct: Number(att.toFixed(1)),
      assignmentCompletionRate: Number(assignComp.toFixed(1)),
      assignmentAvgScore: Number((internal + 5).toFixed(1)),
      internalTestAvg: Number(internal.toFixed(1)),
      previousExamScore: Number(prevExam.toFixed(1)),
      performanceTrend: Number(trend.toFixed(1)),
      studyEngagementScore: Number((internal + 10).toFixed(1)),
      subjectFailureCount: failures,
      currentRiskLevel: riskLevel,
      currentRiskScore: riskScore,
      subjects: [
        { name: 'Data Structures & Algorithms', score: dsa, attendance: att, assignmentCompletion: assignComp, trend: trend < -5 ? 'declining' : 'stable' },
        { name: 'Database Management Systems', score: dbms, attendance: att, assignmentCompletion: assignComp, trend: 'stable' },
        { name: 'Applied Mathematics', score: maths, attendance: att, assignmentCompletion: assignComp, trend: maths < 50 ? 'declining' : 'stable' },
        { name: 'Operating Systems', score: os, attendance: att, assignmentCompletion: assignComp, trend: 'stable' },
        { name: 'Computer Networks', score: cn, attendance: att, assignmentCompletion: assignComp, trend: 'improving' }
      ]
    });
  });

  db.insertMany('students', allStudents);
  console.log(`[Seeder] Seeded ${allStudents.length} student records.`);

  // 4. Generate ML Predictions & LLM Recommendations for all students
  for (const student of allStudents) {
    const mlPred = mlService.calculateLocalPrediction({
      attendance_pct: student.attendancePct,
      assignment_completion_rate: student.assignmentCompletionRate,
      internal_test_avg: student.internalTestAvg,
      previous_exam_score: student.previousExamScore,
      performance_trend: student.performanceTrend,
      subject_failure_count: student.subjectFailureCount,
      score_dsa: student.subjects[0].score,
      score_dbms: student.subjects[1].score,
      score_maths: student.subjects[2].score,
      score_os: student.subjects[3].score,
      score_cn: student.subjects[4].score
    });

    const predDoc = db.create('predictions', {
      studentId: student.studentId,
      ...mlPred
    });

    const guidance = llmService.generateDeterministicGuidance(student, mlPred);
    db.create('recommendations', {
      studentId: student.studentId,
      predictionId: predDoc._id,
      source: 'deterministic_rules',
      modelName: 'llama-3.3-70b-versatile',
      ...guidance
    });

    // 5. Seed historical progress data (3 evaluation cycles)
    const baseAtt = student.attendancePct;
    const baseMarks = student.internalTestAvg;
    const isHighRisk = student.currentRiskLevel === 'High';

    const historyPoints = [
      {
        studentId: student.studentId,
        evaluationCycle: 'T1 - Baseline (Month 1)',
        date: '2026-06-15',
        attendance: isHighRisk ? Math.min(100, baseAtt + 14) : baseAtt - 2,
        internalMarks: isHighRisk ? baseMarks + 12 : baseMarks - 2,
        assignmentRate: isHighRisk ? student.assignmentCompletionRate + 20 : student.assignmentCompletionRate - 2,
        riskScore: isHighRisk ? 40 : student.currentRiskScore + 5,
        riskLevel: isHighRisk ? 'Moderate' : student.currentRiskLevel
      },
      {
        studentId: student.studentId,
        evaluationCycle: 'T2 - Midterm (Month 2)',
        date: '2026-07-20',
        attendance: isHighRisk ? Math.min(100, baseAtt + 6) : baseAtt - 1,
        internalMarks: isHighRisk ? baseMarks + 5 : baseMarks + 1,
        assignmentRate: isHighRisk ? student.assignmentCompletionRate + 8 : student.assignmentCompletionRate,
        riskScore: isHighRisk ? 68 : student.currentRiskScore,
        riskLevel: isHighRisk ? 'Moderate' : student.currentRiskLevel
      },
      {
        studentId: student.studentId,
        evaluationCycle: 'T3 - Current (Month 3)',
        date: '2026-08-30',
        attendance: baseAtt,
        internalMarks: baseMarks,
        assignmentRate: student.assignmentCompletionRate,
        riskScore: student.currentRiskScore,
        riskLevel: student.currentRiskLevel
      }
    ];

    db.insertMany('academic_records', historyPoints);
  }

  // 6. Seed sample faculty interventions
  db.create('interventions', {
    studentId: 'EDU2024CS001',
    studentName: 'Rahul Sharma',
    facultyId: 'usr_faculty_01',
    facultyName: 'Prof. Sunita Rao',
    note: 'Held one-on-one academic counseling regarding attendance shortage and DSA lab tutorials.',
    actionTaken: 'Assigned teaching assistant peer tutor for DSA; agreed on weekly attendance monitoring.',
    priority: 'High',
    status: 'in_progress',
    followUpDate: '2026-09-10'
  });

  db.create('interventions', {
    studentId: 'EDU2024CS002',
    studentName: 'Priya Patel',
    facultyId: 'usr_faculty_01',
    facultyName: 'Prof. Sunita Rao',
    note: 'Discussed Discrete Maths formula revision and past paper practice sessions.',
    actionTaken: 'Provided Mathematics remedial problem sheets.',
    priority: 'Medium',
    status: 'resolved',
    followUpDate: '2026-09-05'
  });

  // 7. Seed sample dataset metadata
  db.create('datasets', {
    filename: 'college_academic_dataset_clean.csv',
    uploadedBy: 'System Administrator',
    uploadedByEmail: 'admin@edusense.edu',
    importedRecordsCount: allStudents.length,
    createdCount: allStudents.length,
    updatedCount: 0,
    status: 'completed',
    importedAt: new Date().toISOString()
  });

  // 8. Seed Activity Log
  db.create('activity_logs', {
    userId: 'usr_admin_01',
    userName: 'System Administrator',
    role: 'admin',
    action: 'SYSTEM_INITIALIZED',
    details: 'EduSense database initialized with institutional demo dataset, ML models, and role profiles.'
  });

  console.log('[Seeder] Database seeding completed successfully!');
}

seed().catch(err => {
  console.error('[Seeder] Error during seeding:', err);
});
