const assert = require('assert');
const db = require('../backend/src/models/db');

function createMongoCollection(initialDocuments) {
  const documents = new Map(initialDocuments.map((doc) => [doc._id, { ...doc }]));
  return {
    find: () => ({
      toArray: async () => [...documents.values()].map((doc) => ({ ...doc }))
    }),
    bulkWrite: async (operations) => {
      operations.forEach((operation) => {
        if (operation.deleteOne) {
          documents.delete(operation.deleteOne.filter._id);
          return;
        }
        const { replacement } = operation.replaceOne;
        documents.set(replacement._id, { ...replacement });
      });
    },
    snapshot: () => [...documents.values()]
  };
}

async function run() {
  const collectionName = '__persist_collection_test__';
  const originalMongoDb = db.mongoDb;
  const originalMongoEnabled = db.mongoEnabled;
  const originalDocuments = db.data[collectionName];
  const mongoCollection = createMongoCollection([
    { _id: 'keep-user', role: 'student', name: 'Student' },
    { _id: 'keep-admin', role: 'admin', name: 'Admin' }
  ]);

  try {
    db.mongoEnabled = true;
    db.mongoDb = { collection: () => mongoCollection };
    db.data[collectionName] = [
      { _id: 'keep-user', role: 'student', name: 'Updated Student' },
      { _id: 'keep-admin', role: 'admin', name: 'Admin' }
    ];
    await db.persistCollection(collectionName);

    let snapshot = mongoCollection.snapshot();
    assert.strictEqual(snapshot.length, 2);
    assert.strictEqual(snapshot.find((doc) => doc._id === 'keep-user').name, 'Updated Student');
    assert(snapshot.some((doc) => doc._id === 'keep-admin'));

    db.data[collectionName].push({ _id: 'new-faculty', role: 'faculty', name: 'Faculty' });
    await db.persistCollection(collectionName);
    snapshot = mongoCollection.snapshot();
    assert.strictEqual(snapshot.length, 3);

    db.data[collectionName] = db.data[collectionName].filter((doc) => doc._id !== 'new-faculty');
    await db.persistCollection(collectionName);
    snapshot = mongoCollection.snapshot();
    assert.strictEqual(snapshot.length, 2);
    assert(snapshot.every((doc) => doc._id !== 'new-faculty'));

    await db.persistCollection(collectionName);
    assert.strictEqual(mongoCollection.snapshot().length, 2);
    console.log('persistCollection regression test passed');
  } finally {
    db.mongoDb = originalMongoDb;
    db.mongoEnabled = originalMongoEnabled;
    if (originalDocuments === undefined) delete db.data[collectionName];
    else db.data[collectionName] = originalDocuments;
  }
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
