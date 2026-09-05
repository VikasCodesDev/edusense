/**
 * EduSense database abstraction.
 *
 * The application uses synchronous collection methods, so MongoDB is loaded
 * into a process-local mirror at startup and every mutation is persisted back
 * to MongoDB. JSON remains available only when MONGODB_URI is not configured
 * for local development and as the one-time migration source for an empty DB.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { MongoClient } = require('mongodb');

const DB_FILE = path.join(__dirname, '..', '..', 'data', 'edusense_db.json');
const COLLECTIONS = [
  'users',
  'students',
  'academic_records',
  'predictions',
  'recommendations',
  'interventions',
  'datasets',
  'activity_logs'
];
const REAL_ADMIN_EMAIL = 'kmr.vik136@gmail.com';
const REAL_ADMIN_PASSWORD_HASH = '$2b$10$WKVJ5eozWbrQFdSW7HwccunLZR7pwmoMdX5zJjnduY/C8tL4dnkLa';
const REAL_ADMIN_ID = 'usr_real_admin_01';

function emptyData() {
  return COLLECTIONS.reduce((data, collection) => {
    data[collection] = [];
    return data;
  }, {});
}

function matches(item, query = {}) {
  return Object.entries(query).every(([key, expected]) => {
    if (expected && typeof expected === 'object') {
      if (expected.$in && !expected.$in.includes(item[key])) return false;
      if (expected.$ne && item[key] === expected.$ne) return false;
      if (expected.$regex && !new RegExp(expected.$regex, expected.$options || 'i').test(item[key])) return false;
      if (expected.$gte !== undefined && item[key] < expected.$gte) return false;
      if (expected.$lte !== undefined && item[key] > expected.$lte) return false;
      return true;
    }
    return item[key] === expected;
  });
}

class DatabaseStore {
  constructor() {
    this.data = emptyData();
    this.mongoClient = null;
    this.mongoDb = null;
    this.mongoEnabled = Boolean(process.env.MONGODB_URI);
    this.writeQueue = Promise.resolve();
    this.ready = this.init();
  }

  async init() {
    if (!this.mongoEnabled) {
      this.loadJson();
      this.ensureRealAdmin();
      this.saveJson();
      return;
    }

    try {
      this.mongoClient = new MongoClient(process.env.MONGODB_URI, {
        ignoreUndefined: true,
        serverSelectionTimeoutMS: 10000
      });
      await this.mongoClient.connect();
      this.mongoDb = this.mongoClient.db();
      await this.loadMongo();
      this.ensureRealAdmin();
      await this.persistAll();
      console.log('[Database] Connected to MongoDB.');
    } catch (err) {
      console.error(`[Database] MongoDB connection failed: ${err.message}`);
      await this.close();
      throw err;
    }
  }

  loadJson() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        if (content.trim()) this.data = { ...emptyData(), ...JSON.parse(content) };
      }
    } catch (err) {
      console.error(`[Database] JSON initialization error: ${err.message}`);
    }
  }

  async loadMongo() {
    const jsonData = this.readJsonSnapshot();
    for (const collection of COLLECTIONS) {
      const docs = await this.mongoDb.collection(collection).find({}).toArray();
      const existingIds = new Set(docs.map((doc) => String(doc._id)));
      const missing = (jsonData[collection] || []).filter((doc) => !existingIds.has(String(doc._id)));
      this.data[collection] = docs.length > 0 ? docs.concat(missing) : (jsonData[collection] || []);
    }
  }

  readJsonSnapshot() {
    try {
      if (!fs.existsSync(DB_FILE)) return emptyData();
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return content.trim() ? { ...emptyData(), ...JSON.parse(content) } : emptyData();
    } catch (err) {
      console.warn(`[Database] JSON migration source unavailable: ${err.message}`);
      return emptyData();
    }
  }

  ensureRealAdmin() {
    const users = this.getCollection('users');
    const students = this.getCollection('students');
    const now = new Date().toISOString();
    const existing = users.find((user) => user.email === REAL_ADMIN_EMAIL);

    if (existing) {
      existing._id = existing._id || REAL_ADMIN_ID;
      existing.name = 'Admin';
      existing.email = REAL_ADMIN_EMAIL;
      existing.passwordHash = REAL_ADMIN_PASSWORD_HASH;
      existing.role = 'admin';
      delete existing.studentId;
      delete existing.assignedStudentIds;
      existing.department = existing.department || 'Administration';
      existing.updatedAt = now;
    } else {
      users.push({
        _id: REAL_ADMIN_ID,
        name: 'Admin',
        email: REAL_ADMIN_EMAIL,
        passwordHash: REAL_ADMIN_PASSWORD_HASH,
        role: 'admin',
        department: 'Administration',
        createdAt: now,
        updatedAt: now
      });
    }

    const realAdminUser = users.find((user) => user.email === REAL_ADMIN_EMAIL);
    students.forEach((student) => {
      if (student.userId === realAdminUser._id) {
        delete student.userId;
        student.updatedAt = now;
      }
    });
  }

  saveJson() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`[Database] JSON save error: ${err.message}`);
    }
  }

  queuePersist(collectionName) {
    if (!this.mongoEnabled || !this.mongoDb) return;
    this.writeQueue = this.writeQueue
      .then(() => this.persistCollection(collectionName))
      .catch((err) => {
        console.error(`[Database] MongoDB write failed for ${collectionName}: ${err.message}`);
      });
  }

  async persistCollection(collectionName) {
    const collection = this.mongoDb.collection(collectionName);
    await collection.deleteMany({});
    const documents = this.data[collectionName];
    if (documents.length > 0) await collection.insertMany(documents, { ordered: false });
  }

  async persistAll() {
    for (const collection of COLLECTIONS) await this.persistCollection(collection);
  }

  getCollection(name) {
    if (!this.data[name]) this.data[name] = [];
    return this.data[name];
  }

  find(collectionName, query = {}) {
    return this.getCollection(collectionName).filter((item) => matches(item, query));
  }

  findOne(collectionName, query = {}) {
    return this.find(collectionName, query)[0] || null;
  }

  findById(collectionName, id) {
    return this.findOne(collectionName, { _id: id });
  }

  create(collectionName, doc) {
    const now = new Date().toISOString();
    const newDoc = {
      _id: doc._id || uuidv4(),
      ...doc,
      createdAt: doc.createdAt || now,
      updatedAt: now
    };
    this.getCollection(collectionName).push(newDoc);
    this.queuePersist(collectionName);
    if (!this.mongoEnabled) this.saveJson();
    return newDoc;
  }

  insertMany(collectionName, docs) {
    const created = docs.map((doc) => {
      const now = new Date().toISOString();
      return {
        _id: doc._id || uuidv4(),
        ...doc,
        createdAt: doc.createdAt || now,
        updatedAt: now
      };
    });
    this.getCollection(collectionName).push(...created);
    this.queuePersist(collectionName);
    if (!this.mongoEnabled) this.saveJson();
    return created;
  }

  updateOne(collectionName, query, update) {
    const collection = this.getCollection(collectionName);
    const index = collection.findIndex((item) => matches(item, query));
    if (index === -1) return null;
    collection[index] = {
      ...collection[index],
      ...update,
      updatedAt: new Date().toISOString()
    };
    this.queuePersist(collectionName);
    if (!this.mongoEnabled) this.saveJson();
    return collection[index];
  }

  updateById(collectionName, id, update) {
    return this.updateOne(collectionName, { _id: id }, update);
  }

  deleteOne(collectionName, query) {
    const collection = this.getCollection(collectionName);
    const index = collection.findIndex((item) => matches(item, query));
    if (index === -1) return false;
    collection.splice(index, 1);
    this.queuePersist(collectionName);
    if (!this.mongoEnabled) this.saveJson();
    return true;
  }

  deleteMany(collectionName, query = {}) {
    const collection = this.getCollection(collectionName);
    const remaining = collection.filter((item) => !matches(item, query));
    const deleted = collection.length - remaining.length;
    this.data[collectionName] = remaining;
    if (deleted > 0) {
      this.queuePersist(collectionName);
      if (!this.mongoEnabled) this.saveJson();
    }
    return deleted;
  }

  countDocuments(collectionName, query = {}) {
    return this.find(collectionName, query).length;
  }

  async clearCollections() {
    this.data = emptyData();
    if (this.mongoEnabled) {
      await Promise.all(COLLECTIONS.map((collection) => this.mongoDb.collection(collection).deleteMany({})));
    } else {
      this.saveJson();
    }
  }

  async flush() {
    await this.writeQueue;
  }

  async close() {
    await this.flush();
    if (this.mongoClient) await this.mongoClient.close();
  }
}

module.exports = new DatabaseStore();
