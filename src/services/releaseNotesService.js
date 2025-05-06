const envParser = require('../utils/envParser');
const gitUtils = require('../utils/gitUtils');
const azureUtils = require('../utils/azureUtils');
const repoConfig = require('../config/repoConfig');

exports.processEnvFiles = async (previousEnvPath, currentEnvPath, azureQueryId) => {
  const previousEnv = envParser.parseEnvFile(previousEnvPath);
  const currentEnv = envParser.parseEnvFile(currentEnvPath);
  const changes = compareEnvironmentFiles(previousEnv, currentEnv);

  if (changes.io_amr.length === 0 && changes.sootball.length === 0) {
    return { noChanges: true };
  }

  const releaseNotes = await processRepositoryChanges(changes);

  // --- Fetch PRs for all changed repos ---
  let allPRs = [];
  // IO AMR
  for (const change of changes.io_amr) {
    try {
      const prs = await gitUtils.getPRsBetweenTags(
        change.repository.url,
        change.previousVersion,
        change.currentVersion
      );
      allPRs = allPRs.concat(prs);
    } catch (err) {
      console.error(`Error fetching PRs for ${change.repository.name}:`, err);
    }
  }
  
  // Sootball
  for (const change of changes.sootball) {
    try {
      const prs = await gitUtils.getPRsBetweenTags(
        change.repository.url,
        change.previousVersion,
        change.currentVersion
      );
      allPRs = allPRs.concat(prs);
    } catch (err) {
      console.error(`Error fetching PRs for ${change.repository.name}:`, err);
    }
  }

  // Remove duplicate PRs by PR number
  const seen = new Set();
  allPRs = allPRs.filter(pr => {
    if (!pr.number) return true;
    if (seen.has(pr.number)) return false;
    seen.add(pr.number);
    return true;
  });

  // Fetch Azure Work Items using the provided query ID
  let workItems = [];
  if (azureQueryId) {
      workItems = await azureUtils.fetchWorkItemsByQueryId(azureQueryId);
  }

  return {
      noChanges: false,
      releaseNotes: {
          generatedAt: new Date(),
          changes,
          notes: releaseNotes,
          workItems // Now always from Azure Query
      }
  };  
};

exports.generateReleaseNotes = async (req, res) => {
  try {
    if (!req.files || !req.files.previousEnv || !req.files.currentEnv) {
      return res.status(400).json({ error: 'Both previous and current .env files are required' });
    }
    const previousEnvPath = req.files.previousEnv[0].path;
    const currentEnvPath = req.files.currentEnv[0].path;
    // Get azureQueryId from req.body
    const azureQueryId = req.body.azureQueryId;

    // Pass azureQueryId to the service
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


function compareEnvironmentFiles(previousEnv, currentEnv) {
  const changes = { io_amr: [], sootball: [] };
  for (const [key, currentValue] of Object.entries(currentEnv.io_amr_tags)) {
    if (key === 'CUPS_TAG' || key === 'STATS_SERVICE_TAG') continue;
    const previousValue = previousEnv.io_amr_tags[key];
    if (previousValue && previousValue !== currentValue) {
      const repoInfo = getRepositoryInfo(key, 'io_amr');
      if (repoInfo) {
        changes.io_amr.push({
          key,
          previousVersion: previousValue,
          currentVersion: currentValue,
          repository: repoInfo
        });
      }
    }
  }
  for (const [key, currentValue] of Object.entries(currentEnv.sootball_tags)) {
    if (key === 'CUPS_TAG' || key === 'STATS_SERVICE_TAG') continue;
    const previousValue = previousEnv.sootball_tags[key];
    if (previousValue && previousValue !== currentValue) {
      const repoInfo = getRepositoryInfo(key, 'sootball');
      if (repoInfo) {
        changes.sootball.push({
          key,
          previousVersion: previousValue,
          currentVersion: currentValue,
          repository: repoInfo
        });
      }
    }
  }
  return changes;
}

function getRepositoryInfo(key, category) {
  const repoName = repoConfig.repoMappings[key];
  if (repoName === null) return null;
  return {
    name: repoName,
    category,
    url: `https://github.com/${repoConfig.orgPrefix}/${repoName}`
  };
}

async function processRepositoryChanges(changes) {
  const releaseNotes = { io_amr: [], sootball: [] };
  for (const change of changes.io_amr) {
    try {
      const notes = await gitUtils.getRepositoryReleaseNotes(
        change.repository.url,
        change.previousVersion,
        change.currentVersion
      );
      releaseNotes.io_amr.push({
        repository: change.repository.name,
        previousVersion: change.previousVersion,
        currentVersion: change.currentVersion,
        notes
      });
    } catch (error) {
      console.error(`Error processing ${change.repository.name}:`, error);
      releaseNotes.io_amr.push({
        repository: change.repository.name,
        error: `Failed to get release notes: ${error.message}`
      });
    }
  }
  for (const change of changes.sootball) {
    try {
      const notes = await gitUtils.getRepositoryReleaseNotes(
        change.repository.url,
        change.previousVersion,
        change.currentVersion
      );
      releaseNotes.sootball.push({
        repository: change.repository.name,
        previousVersion: change.previousVersion,
        currentVersion: change.currentVersion,
        notes
      });
    } catch (error) {
      console.error(`Error processing ${change.repository.name}:`, error);
      releaseNotes.sootball.push({
        repository: change.repository.name,
        error: `Failed to get release notes: ${error.message}`
      });
    }
  }
  return releaseNotes;
}
