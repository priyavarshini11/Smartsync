const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Read JSON data from a file in the data directory.
 * Returns parsed data or an empty array/object fallback.
 */
function readData(filename) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filepath)) return [];
    const raw = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
    return [];
  }
}

/**
 * Write JSON data to a file in the data directory (atomic).
 */
function writeData(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  const tmpPath = filepath + '.tmp';
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, filepath);
  } catch (err) {
    console.error(`Error writing ${filename}:`, err.message);
    // Clean up temp file if rename failed
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    throw err;
  }
}

/**
 * Generate a unique ID (URL-safe, 16 chars).
 */
function generateId() {
  return crypto.randomBytes(12).toString('base64url').slice(0, 16);
}

module.exports = { readData, writeData, generateId, DATA_DIR };
