const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const fetch = require('node-fetch');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Set this in your .env

exports.getRepositoryReleaseNotes = async (repoUrl, previousVersion, currentVersion) => {
  const repoName = repoUrl.split('/').pop();
  const owner = repoUrl.split('/').slice(-2, -1)[0];
  const tempDir = path.join(__dirname, '../../temp', repoName);

  // Clean and clone repo
  if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir, { recursive: true });
  fs.mkdirSync(tempDir, { recursive: true });
  await cloneRepository(repoUrl, tempDir);

  // 1. Try to fetch GitHub Release Notes via API
  const apiRelease = await fetchGitHubRelease(owner, repoName, currentVersion);
  if (apiRelease) {
    return apiRelease;
  }

  // 2. Fallback: Try to extract from CHANGELOG.md
  const changelogPath = path.join(tempDir, 'CHANGELOG.md');
  if (fs.existsSync(changelogPath)) {
    const changelog = fs.readFileSync(changelogPath, 'utf8');
    const notes = extractNotesFromChangelog(changelog, currentVersion);
    if (notes) return notes;
  }

  // 3. Fallback: git log between tags
  const gitLog = await new Promise((resolve) => {
    exec(
      `cd ${tempDir} && git log ${previousVersion}..${currentVersion} --pretty=format:"%h - %s (%an)" --no-merges`,
      (error, stdout) => {
        if (error) return resolve(null);
        resolve(stdout);
      }
    );
  });

  return gitLog || 'No release notes available';
};

// Helper: Clone repo
function cloneRepository(repoUrl, directory) {
  return new Promise((resolve, reject) => {
    exec(`git clone --quiet ${repoUrl} ${directory}`, (error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

// Helper: Fetch GitHub Release Notes via API
async function fetchGitHubRelease(owner, repo, tag) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`;
  const headers = {
    'Accept': 'application/vnd.github+json',
    ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}),
  };
  try {
    const res = await fetch(apiUrl, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data.body || null;
  } catch (e) {
    return null;
  }
}

// Helper: Extract notes from CHANGELOG.md for a version
function extractNotesFromChangelog(changelog, version) {
  const versionRegex = new RegExp(`^##\\s*\\[?${escapeRegExp(version)}\\]?`, 'm');
  const match = changelog.match(versionRegex);
  if (!match) return null;
  const start = match.index;
  const nextVersionRegex = /^##\s*\[?\d+\.\d+\.\S*\]?/gm;
  nextVersionRegex.lastIndex = start + 1;
  const nextMatch = nextVersionRegex.exec(changelog);
  const end = nextMatch ? nextMatch.index : changelog.length;
  return changelog.substring(start, end).trim();
}

// Utility: Escape regex special chars
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}