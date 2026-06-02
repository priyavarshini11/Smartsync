/**
 * Migration script: Import existing JSON data files into MongoDB.
 * Run this ONCE after setting up MongoDB Atlas.
 * 
 * Usage:
 *   cd server
 *   set MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/smartcampus
 *   node migrate-to-mongo.js
 */

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const DATA_DIR = path.join(__dirname, 'data');

// Read a JSON file from the data directory
function readJsonFile(filename) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filepath)) return null;
    const raw = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
    return null;
  }
}

async function migrate() {
  const uri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.mongo_url || process.env.mongo_uri;
  if (!uri) {
    console.error('ERROR: MONGO_URI or MONGO_URL environment variable is not set.');
    console.error('Set it to your MongoDB Atlas connection string.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected to:', mongoose.connection.host);

  const db = mongoose.connection.db;

  // Migrate users
  const users = readJsonFile('users.json');
  if (users && users.length > 0) {
    await db.collection('users').deleteMany({});
    await db.collection('users').insertMany(users);
    console.log(`✓ Migrated ${users.length} users`);
  } else {
    console.log('⚠ No users.json found or empty');
  }

  // Migrate resources
  const resources = readJsonFile('resources.json');
  if (resources && resources.length > 0) {
    await db.collection('resources').deleteMany({});
    await db.collection('resources').insertMany(resources);
    console.log(`✓ Migrated ${resources.length} resources`);
  } else {
    console.log('⚠ No resources.json found or empty');
  }

  // Migrate departments (single document)
  const departments = readJsonFile('departments.json');
  if (departments && departments.branches) {
    await db.collection('departments').deleteMany({});
    await db.collection('departments').insertOne(departments);
    console.log(`✓ Migrated departments (${departments.branches.length} branches)`);
  } else {
    console.log('⚠ No departments.json found or empty');
  }

  // Migrate admin config (single document)
  const adminConfig = readJsonFile('admin_config.json');
  if (adminConfig && adminConfig.setupComplete !== undefined) {
    await db.collection('admin_config').deleteMany({});
    await db.collection('admin_config').insertOne(adminConfig);
    console.log('✓ Migrated admin_config');
  } else {
    console.log('⚠ No admin_config.json found or empty');
  }

  // Migrate subscriptions
  const subscriptions = readJsonFile('subscriptions.json');
  if (subscriptions && subscriptions.length > 0) {
    await db.collection('subscriptions').deleteMany({});
    await db.collection('subscriptions').insertMany(subscriptions);
    console.log(`✓ Migrated ${subscriptions.length} subscriptions`);
  } else {
    console.log('⚠ No subscriptions.json found or empty');
  }

  console.log('\n✅ Migration complete!');
  console.log('You can now deploy to Vercel with your MONGO_URI set as an environment variable.');

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
