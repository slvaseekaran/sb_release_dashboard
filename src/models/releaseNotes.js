const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.join(__dirname, '../../data');

// Helper function to get the path to versions.json for a specific release type
const getVersionsFilePath = (releaseType) => {
    let subDir = '';
    if (releaseType === 'rc') subDir = 'rc_release';
    else if (releaseType === 'minor') subDir = 'minor_release';
    else if (releaseType === 'major') subDir = 'major_release';
    else {
        // Fallback or error for unknown release type
        console.error(`Unknown release type for versions file: ${releaseType}`);
        throw new Error(`Invalid release type specified: ${releaseType}`);
    }
    const versionsDir = path.join(STORAGE_DIR, subDir);
    if (!fs.existsSync(versionsDir)) {
        fs.mkdirSync(versionsDir, { recursive: true });
    }
    return path.join(versionsDir, 'versions.json');
};

class ReleaseNotes {
    static async saveReleaseNotes(version, data, releaseType) {
        let subDir = '';
        if (releaseType === 'rc') subDir = 'rc_release';
        else if (releaseType === 'minor') subDir = 'minor_release';
        else if (releaseType === 'major') subDir = 'major_release';
        else {
            // Fallback to a generic directory or throw an error if releaseType is mandatory and unknown
            console.warn(`Unknown releaseType: ${releaseType}, saving to root data directory.`);
            subDir = 'unknown_release_type'; 
        }

        const targetDir = path.join(STORAGE_DIR, subDir);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const id = Date.now().toString(); // Using timestamp as a simple unique ID
        const filePath = path.join(targetDir, `${id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data));

        // Save version metadata to the releaseType-specific versions.json
        const versionsFilePath = getVersionsFilePath(releaseType);
        let versions = [];
        if (fs.existsSync(versionsFilePath)) {
            versions = JSON.parse(fs.readFileSync(versionsFilePath));
        }
        versions.push({
            id,
            version, 
            releaseType,
            timestamp: new Date().toISOString()
        });
        fs.writeFileSync(versionsFilePath, JSON.stringify(versions));

        return { id, version };
    }

    static async getAllVersions(releaseType) {
        const versionsFilePath = getVersionsFilePath(releaseType);
        if (!fs.existsSync(versionsFilePath)) {
            return []; // No versions file means no versions for this type
        }
        const versions = JSON.parse(fs.readFileSync(versionsFilePath));
        // Sort by timestamp, newest first
        return versions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    static async getByVersion(versionName, releaseType) {
        const versionsFilePath = getVersionsFilePath(releaseType);
        if (!fs.existsSync(versionsFilePath)) {
            console.error(`Versions file not found for release type ${releaseType}: ${versionsFilePath}`);
            return null;
        }

        const versions = JSON.parse(fs.readFileSync(versionsFilePath));
        const versionInfo = versions.find(
            v => v.version.trim().toLowerCase() === versionName.trim().toLowerCase()
        );

        if (!versionInfo) {
            console.error(`Version "${versionName}" not found in ${versionsFilePath}`);
            return null;
        }

        // Construct path to the actual release note JSON file
        let subDir = '';
        if (versionInfo.releaseType === 'rc') subDir = 'rc_release';
        else if (versionInfo.releaseType === 'minor') subDir = 'minor_release';
        else if (versionInfo.releaseType === 'major') subDir = 'major_release';

        const filePath = path.join(STORAGE_DIR, subDir, `${versionInfo.id}.json`);
        if (!fs.existsSync(filePath)) {
            console.error(`Release note data file not found: ${filePath}`);
            return null;
        }
        return JSON.parse(fs.readFileSync(filePath));
    }
}

module.exports = ReleaseNotes;
