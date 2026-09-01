# EduSense Security & Privacy Policy

## 1. Principles of Academic Data Privacy

EduSense handles real academic indicators; therefore, strict adherence to institutional data privacy, role-based authorization, and minimum data collection is enforced:

1. **Principle of Data Minimization**: EduSense collects only academic performance variables (attendance, marks, submissions, trends). No sensitive demographic, biometric, or personal financial variables are ever requested or stored.
2. **Student Isolation**: Backend authorization middleware ensures students can strictly view their own academic record (`/api/students/me`). Attempting to query another student's ID returns HTTP 403 Forbidden.
3. **Faculty Scope**: Faculty members can view assigned classes and cohort analytics but cannot alter core institutional configuration.
4. **Administrator Auditability**: All dataset imports, user mutations, and model retrainings are recorded in an immutable activity audit log (`activity_logs`).

---

## 2. Technical Security Controls

### 2.1 Password Hashing
Passwords are never stored in plaintext. They are salted and hashed using `bcryptjs` with a cost factor of 10 (`bcrypt.genSalt(10)`).

### 2.2 JWT Authentication & Session Handling
* JSON Web Tokens are signed using HMAC SHA-256 (`JWT_SECRET`).
* Tokens carry expiry timestamps and are validated on every protected API route via Express middleware.

### 2.3 API Key & Secret Protection
* All LLM API keys (`GROQ_API_KEY`, `LLM_API_KEY`) and database credentials remain exclusively on the server side.
* Frontend components never receive or transmit secret keys.

### 2.4 Input Sanitization & Attack Mitigation
* Express payload size limits prevent denial-of-service memory exhaustion.
* Multer upload filters restrict file processing to validated mime types.
* Regex queries are sanitized to mitigate ReDoS.
