/**
 * EduSense Hybrid Database Layer
 * Provides persistent storage with seamless file persistence and optional MongoDB Atlas connection.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_FILE = path.join(__dirname, '..', '..', 'data', 'edusense_db.json');

class DatabaseStore {
  constructor() {
    this.data = {
      users: [],
      students: [],
      academic_records: [],
      predictions: [],
      recommendations: [],
      interventions: [],
      datasets: [],
      activity_logs: []
    };
    this.init();
  }

  init() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        if (fileContent.trim()) {
          const parsed = JSON.parse(fileContent);
          this.data = { ...this.data, ...parsed };
          console.log(`[Database] Loaded persistent data from ${DB_FILE}`);
        }
      } else {
        this.save();
        console.log(`[Database] Initialized new persistent store at ${DB_FILE}`);
      }
    } catch (err) {
      console.error('[Database] Initialization error:', err.message);
    }
  }

  save() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database] Save error:', err.message);
    }
  }

  getCollection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return this.data[name];
  }

  find(collectionName, query = {}) {
    const col = this.getCollection(collectionName);
    return col.filter(item => {
      for (const [key, val] of Object.entries(query)) {
        if (typeof val === 'object' && val !== null) {
          if (val.$in && !val.$in.includes(item[key])) return false;
          if (val.$ne && item[key] === val.$ne) return false;
          if (val.$regex && !new RegExp(val.$regex, val.$options || 'i').test(item[key])) return false;
          if (val.$gte && item[key] < val.$gte) return false;
          if (val.$lte && item[key] > val.$lte) return false;
        } else if (item[key] !== val) {
          return false;
        }
      }
      return true;
    });
  }

  findOne(collectionName, query = {}) {
    const results = this.find(collectionName, query);
    return results.length > 0 ? results[0] : null;
  }

  findById(collectionName, id) {
    return this.findOne(collectionName, { _id: id });
  }

  create(collectionName, doc) {
    const col = this.getCollection(collectionName);
    const newDoc = {
      _id: doc._id || uuidv4(),
      ...doc,
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    col.push(newDoc);
    this.save();
    return newDoc;
  }

  insertMany(collectionName, docs) {
    const col = this.getCollection(collectionName);
    const created = docs.map(doc => ({
      _id: doc._id || uuidv4(),
      ...doc,
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    col.push(...created);
    this.save();
    return created;
  }

  updateOne(collectionName, query, update) {
    const col = this.getCollection(collectionName);
    const index = col.findIndex(item => {
      for (const [key, val] of Object.entries(query)) {
        if (item[key] !== val) return false;
      }
      return true;
    });

    if (index === -1) return null;

    col[index] = {
      ...col[index],
      ...update,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return col[index];
  }

  updateById(collectionName, id, update) {
    return this.updateOne(collectionName, { _id: id }, update);
  }

  deleteOne(collectionName, query) {
    const col = this.getCollection(collectionName);
    const index = col.findIndex(item => {
      for (const [key, val] of Object.entries(query)) {
        if (item[key] !== val) return false;
      }
      return true;
    });

    if (index === -1) return false;
    col.splice(index, 1);
    this.save();
    return true;
  }

  deleteMany(collectionName, query = {}) {
    const col = this.getCollection(collectionName);
    const initialLen = col.length;
    const remaining = col.filter(item => {
      for (const [key, val] of Object.entries(query)) {
        if (item[key] === val) return false;
      }
      return true;
    });
    this.data[collectionName] = remaining;
    this.save();
    return initialLen - remaining.length;
  }

  countDocuments(collectionName, query = {}) {
    return this.find(collectionName, query).length;
  }
}

const db = new DatabaseStore();

module.exports = db;
