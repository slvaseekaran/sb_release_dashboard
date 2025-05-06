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
      const azureQueryId = req.body.azureQueryId; // <-- Accept queryId from request

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
    const { releaseNotes } = req.body;
    if (!releaseNotes) {
      return res.status(400).json({ error: 'Release notes data is required' });
    }

    // Find the DEVTAG specifically
    const devTagChange = releaseNotes.changes.sootball.find(change => 
      change.key === 'DEVTAG'
    );

    if (!devTagChange) {
      return res.status(400).json({ error: 'DEVTAG is required for release grouping' });
    }
    
    // Use the full DEVTAG version
    const versionName = `Sootballs ${devTagChange.currentVersion}`;

    if (!releaseNotes.workItems) {
      releaseNotes.workItems = await azureUtils.processReleaseNotesForWorkItems(releaseNotes);
    }

    const savedReleaseNotes = await ReleaseNotes.saveReleaseNotes(versionName, releaseNotes);
    
    res.status(200).json({
      message: 'Release notes posted successfully',
      version: versionName,
      id: savedReleaseNotes.id
    });
  } catch (error) {
    console.error('Error posting release notes:', error);
    res.status(500).json({ error: 'Failed to post release notes: ' + error.message });
  }
};


exports.getAllReleaseNotes = async (req, res) => {
  try {
    const versions = await ReleaseNotes.getAllVersions();
    res.status(200).json({ versions });
  } catch (error) {
    console.error('Error getting release notes versions:', error);
    res.status(500).json({ error: 'Failed to get release notes versions: ' + error.message });
  }
};

exports.getReleaseNotesByVersion = async (req, res) => {
  try {
    const { version } = req.params;
    const releaseNotes = await ReleaseNotes.getByVersion(version);
    if (!releaseNotes) {
      return res.status(404).json({ error: 'Release notes not found for this version' });
    }
    if (!releaseNotes.workItems) {
      releaseNotes.workItems = await azureUtils.processReleaseNotesForWorkItems(releaseNotes);
    }
    res.status(200).json({
      version,
      releaseNotes
    });
  } catch (error) {
    console.error('Error getting release notes:', error);
    res.status(500).json({ error: 'Failed to get release notes: ' + error.message });
  }
};
