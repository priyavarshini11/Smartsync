const crypto = require('crypto');
const mongoose = require('mongoose');
const { User, Resource, Department, AdminConfig, Subscription } = require('../models');

// --- Cached MongoDB connection for serverless environments ---
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.mongo_url || process.env.mongo_uri;
    if (!uri) throw new Error('MONGO_URI or MONGO_URL environment variable is not set');

    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    }).then(m => {
      console.log('MongoDB Connected:', m.connection.host);
      return m;
    }).catch(err => {
      cached.promise = null;
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// --- Collection mapping ---
const modelMap = {
  users: User,
  resources: Resource,
  departments: Department,
  admin_config: AdminConfig,
  subscriptions: Subscription,
};

const singleDocCollections = new Set(['departments', 'admin_config']);

function collName(filename) {
  return filename.replace('.json', '');
}

function stripMongoFields(doc) {
  if (!doc) return doc;
  const obj = { ...doc };
  delete obj._id;
  delete obj.__v;
  return obj;
}

/**
 * Read data from MongoDB collection (drop-in replacement for JSON file reads).
 * Returns array for multi-doc collections, object for single-doc collections.
 */
async function readData(filename) {
  await connectDB();
  const name = collName(filename);
  const Model = modelMap[name];
  if (!Model) throw new Error(`Unknown collection: ${name}`);

  if (singleDocCollections.has(name)) {
    const doc = await Model.findOne({}).lean();
    if (!doc) {
      if (name === 'departments') return { branches: [] };
      return []; // matches old behavior for missing files
    }
    return stripMongoFields(doc);
  }

  const docs = await Model.find({}).lean();
  return docs.map(stripMongoFields);
}

/**
 * Write data to MongoDB collection (drop-in replacement for JSON file writes).
 * Replaces entire collection content.
 */
async function writeData(filename, data) {
  await connectDB();
  const name = collName(filename);
  const Model = modelMap[name];
  if (!Model) throw new Error(`Unknown collection: ${name}`);

  if (singleDocCollections.has(name)) {
    await Model.deleteMany({});
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const cleanData = { ...data };
      delete cleanData._id;
      await Model.create(cleanData);
    }
    return;
  }

  // Array collections: replace all documents
  await Model.deleteMany({});
  if (Array.isArray(data) && data.length > 0) {
    const cleanData = data.map(d => {
      const clean = { ...d };
      delete clean._id;
      return clean;
    });
    await Model.insertMany(cleanData, { ordered: false });
  }
}

/**
 * Generate a unique ID (URL-safe, 16 chars).
 */
function generateId() {
  return crypto.randomBytes(12).toString('base64url').slice(0, 16);
}

module.exports = { readData, writeData, generateId, connectDB };
