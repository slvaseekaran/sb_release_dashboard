const releaseNotesService = require('../services/releaseNotesService');
const ReleaseNotes = require('../models/releaseNotes');
const azureUtils = require('../utils/azureUtils');

exports.generateReleaseNotes = async (req, res) => {
    try {
        if (!req.files || !req.files.previousEnv || !req.files.currentEnv) {
            return res.status(400).json({ error: 'Both previous and current .env files are required' });
        }
        const previousEnvPath = req.files.previousEnv[0].path;
        const currentEnvPath = req.files.currentEnv[0].path;
        const azureQueryId = req.body.azureQueryId;
        const result = await releaseNotesService.processEnvFiles(previousEnvPath, currentEnvPath, azureQueryId);

        if (result.noChanges) {
            return res.status(200).json({
                message: 'No version changes detected between the environment files.'
            });
        }
        res.status(200).json({
            message: 'Release notes prepared.',
            releaseNotes: result.releaseNotes
        });
    } catch (error) {
        console.error('Error processing release notes:', error);
        res.status(500).json({ error: 'Failed to process release notes: ' + error.message });
    }
};

exports.postReleaseNotes = async (req, res) => {
    try {
        const { releaseNotes, releaseType } = req.body;
        if (!releaseNotes || !releaseType) { // Added check for releaseType
            return res.status(400).json({ error: 'Release notes data and release type are required' });
        }

        let versionName = null;
        if (releaseNotes.notes && releaseNotes.notes.sootball && Array.isArray(releaseNotes.notes.sootball)) {
            const rrSootballsChange = releaseNotes.notes.sootball.find(
                change => change.repository === 'rr_sootballs'
            );
            if (rrSootballsChange) {
                versionName = rrSootballsChange.currentVersion;
            }
        }
        if (!versionName) {
            const mainComponent = releaseNotes.changes?.io_amr?.[0] || releaseNotes.changes?.sootball?.[0];
            if (mainComponent) {
                versionName = mainComponent.currentVersion;
            } else {
                 versionName = `release-${Date.now()}`; // Generic fallback
            }
        }
        
        const savedReleaseNotes = await ReleaseNotes.saveReleaseNotes(versionName, releaseNotes, releaseType);
        res.status(200).json({
            message: 'Release notes posted successfully',
            version: versionName, // The determined version name
            id: savedReleaseNotes.id
        });
    } catch (error) {
        console.error('Error posting release notes:', error);
        res.status(500).json({ error: 'Failed to post release notes: ' + error.message });
    }
};

// New controller method
exports.getVersionsByReleaseType = async (req, res) => {
    try {
        const { releaseType } = req.params;
        if (!['rc', 'minor', 'major'].includes(releaseType)) {
            return res.status(400).json({ error: 'Invalid release type specified.' });
        }
        const versions = await ReleaseNotes.getAllVersions(releaseType);
        res.status(200).json({ versions });
    } catch (error) {
        console.error(`Error getting versions for ${req.params.releaseType}:`, error);
        res.status(500).json({ error: 'Failed to get release notes versions: ' + error.message });
    }
};

exports.getReleaseNotesByVersion = async (req, res) => {
    try {
        const { version, releaseType } = req.params; // Added releaseType
        if (!['rc', 'minor', 'major'].includes(releaseType)) {
            return res.status(400).json({ error: 'Invalid release type specified.' });
        }

        const releaseNotesData = await ReleaseNotes.getByVersion(version, releaseType); // Pass both

        if (!releaseNotesData) {
            return res.status(404).json({ error: 'Release notes not found for this version and type' });
        }
        if (!releaseNotesData.workItems || releaseNotesData.workItems.length === 0) {
            if (azureUtils.processReleaseNotesForWorkItems) {
                 try {
                    const workItemsFromNotes = await azureUtils.processReleaseNotesForWorkItems(releaseNotesData);
                    releaseNotesData.workItems = workItemsFromNotes; // Add/replace workItems
                 } catch (azureError) {
                    console.error('Error fetching fallback Azure work items:', azureError);
                 }
            } else {
                console.warn("azureUtils.processReleaseNotesForWorkItems function not found. Cannot perform fallback for work items.");
            }
        }

        res.status(200).json({
            version, 
            releaseNotes: releaseNotesData 
        });
    } catch (error) {
        console.error('Error getting specific release notes:', error);
        res.status(500).json({ error: 'Failed to get release notes: ' + error.message });
    }
};
