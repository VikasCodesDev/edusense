/**
 * Backend API Test Suite
 */

const assert = require('assert');
const app = require('../backend/src/server');

async function testBackend() {
  console.log('Testing EduSense Express Backend APIs...');
  const PORT = 5555;
  const server = app.listen(PORT, '127.0.0.1');

  try {
    const axios = require('axios');
    const api = axios.create({ baseURL: `http://127.0.0.1:${PORT}/api` });

    // 1. Health check
    const health = await api.get('/health');
    assert.strictEqual(health.data.status, 'healthy');
    console.log('✔ Health endpoint passed');

    // 2. Student 1 Login
    const loginStudent = await api.post('/auth/login', {
      email: 'student1@edusense.edu',
      password: 'Student@123'
    });
    assert.strictEqual(loginStudent.data.success, true);
    assert.strictEqual(loginStudent.data.user.role, 'student');
    const studentToken = loginStudent.data.token;
    console.log('✔ Student login passed');

    // 3. Student Me Profile & ML Prediction
    const studentProfile = await api.get('/students/me', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(studentProfile.data.success, true);
    assert.strictEqual(studentProfile.data.student.studentId, 'EDU2024CS001');
    assert.strictEqual(studentProfile.data.prediction.risk_level, 'High');
    assert(studentProfile.data.recommendation !== null);
    console.log('✔ Student profile, ML prediction & recommendations passed');

    // 4. Faculty Login & Dashboard
    const loginFaculty = await api.post('/auth/login', {
      email: 'faculty@edusense.edu',
      password: 'Faculty@123'
    });
    const facultyToken = loginFaculty.data.token;
    assert.strictEqual(loginFaculty.data.user.role, 'faculty');

    const facultyDashboard = await api.get('/faculty/dashboard', {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    assert.strictEqual(facultyDashboard.data.success, true);
    assert(facultyDashboard.data.stats.totalStudents > 0);
    assert(facultyDashboard.data.riskDistribution.length === 3);
    console.log('✔ Faculty dashboard overview & risk distribution passed');

    // 5. Faculty Student List & Filtering
    const studentList = await api.get('/faculty/students?risk=High', {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    assert.strictEqual(studentList.data.success, true);
    assert(studentList.data.students.length > 0);
    assert.strictEqual(studentList.data.students[0].currentRiskLevel, 'High');
    console.log('✔ Faculty students list filtering passed');

    // 6. Admin Login & ML Model Status
    const loginAdmin = await api.post('/auth/login', {
      email: 'admin@edusense.edu',
      password: 'Admin@123'
    });
    const adminToken = loginAdmin.data.token;

    const modelStatus = await api.get('/admin/model', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(modelStatus.data.success, true);
    console.log('✔ Admin ML model metadata & benchmark query passed');

    console.log('\nAll Backend API Tests Passed Successfully! (6/6)');
  } catch (err) {
    console.error('Test failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  } finally {
    server.close();
  }
}

testBackend();
