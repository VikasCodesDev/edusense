const db = require('../models/db');

const VALID_SEVERITIES = new Set(['Low', 'Medium', 'High', 'Critical']);
const VALID_STATUSES = new Set(['Open', 'In Progress', 'Resolved', 'Closed']);

function validateReport(body) {
  const errors = [];
  const required = [
    ['title', 'Bug title'],
    ['description', 'Description'],
    ['severity', 'Severity'],
    ['page', 'Current page/module']
  ];

  required.forEach(([field, label]) => {
    if (!String(body[field] || '').trim()) errors.push(`${label} is required.`);
  });
  if (body.severity && !VALID_SEVERITIES.has(body.severity)) errors.push('Severity is invalid.');
  return errors;
}

exports.createReport = (req, res) => {
  const errors = validateReport(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: 'Bug report validation failed.', errors });
  }

  const report = db.create('bug_reports', {
    title: String(req.body.title).trim(),
    description: String(req.body.description).trim(),
    severity: req.body.severity,
    page: String(req.body.page).trim(),
    additionalDetails: String(req.body.additionalDetails || '').trim(),
    reporterId: req.user.id || req.user._id,
    reporter: req.user.name,
    reporterEmail: req.user.email,
    role: req.user.role,
    status: 'Open'
  });

  return res.status(201).json({ success: true, report, message: 'Bug report submitted successfully.' });
};

exports.listReports = (req, res) => {
  const reports = db.find('bug_reports').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return res.json({ success: true, reports });
};

exports.updateStatus = (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({ success: false, error: 'Invalid bug report status.' });
  }
  const report = db.updateOne('bug_reports', { _id: req.params.id }, { status });
  if (!report) return res.status(404).json({ success: false, error: 'Bug report not found.' });
  return res.json({ success: true, report });
};

exports.VALID_STATUSES = VALID_STATUSES;
