const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.join(__dirname, '../../data');
const VERSIONS_FILE = path.join(STORAGE_DIR, 'versions.json');

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}
if (!fs.existsSync(VERSIONS_FILE)) {
  fs.writeFileSync(VERSIONS_FILE, JSON.stringify([]));
}

class ReleaseNotes {
  static async saveReleaseNotes(version, data) {
    const id = Date.now().toString();
    const filePath = path.join(STORAGE_DIR, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data));
    const versions = JSON.parse(fs.readFileSync(VERSIONS_FILE));
    versions.push({
      id,
      version,
      timestamp: new Date().toISOString()
    });
    fs.writeFileSync(VERSIONS_FILE, JSON.stringify(versions));
    return { id, version };
  }

  static async getAllVersions() {
    const versions = JSON.parse(fs.readFileSync(VERSIONS_FILE));
    return versions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  static async getByVersion(version) {
    const versions = JSON.parse(fs.readFileSync(VERSIONS_FILE));
    const versionInfo = versions.find(v => v.version === version);
    if (!versionInfo) return null;
    const filePath = path.join(STORAGE_DIR, `${versionInfo.id}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath));
  }
}

module.exports = ReleaseNotes;
