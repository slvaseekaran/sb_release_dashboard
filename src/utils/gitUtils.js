const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const fetch = require('node-fetch');

const GITHUB_PAT = process.env.GITHUB_PAT; 
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'x-access-token'; 

function getHttpsUrlWithAuth(httpsUrl) {
  if (!GITHUB_PAT) throw new Error('GITHUB_PAT not set');
  const urlObj = new URL(httpsUrl);
  urlObj.username = GITHUB_USERNAME;
  urlObj.password = GITHUB_PAT;
  return urlObj.toString();
}

function cloneRepository(httpsUrl, directory) {
  const urlWithAuth = getHttpsUrlWithAuth(httpsUrl);
  return new Promise((resolve, reject) => {
    exec(`git clone ${urlWithAuth} ${directory}`, (error, stdout, stderr) => {
      if (error) return reject(new Error(stderr || error.message));
      resolve(stdout);
    });
  });
}

async function fetchGitHubRelease(owner, repo, tag) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`;
  try {
    const res = await fetch(apiUrl, {
      headers: { 
        'Accept': 'application/vnd.github+json',
        'Authorization': `token ${GITHUB_PAT}` 
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.body || null;
  } catch (e) {
    return null;
  }
}

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

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.getRepositoryReleaseNotes = async (httpsUrl, previousVersion, currentVersion) => {
  const repoName = httpsUrl.split('/').pop().replace('.git', '');
  const owner = httpsUrl.split('/')[3]; 
  const tempDir = path.join(__dirname, '../../temp', repoName);
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });
  await cloneRepository(httpsUrl, tempDir);
  const apiRelease = await fetchGitHubRelease(owner, repoName, currentVersion);
  if (apiRelease) return apiRelease;
  const changelogPath = path.join(tempDir, 'CHANGELOG.md');
  if (fs.existsSync(changelogPath)) {
    const changelog = fs.readFileSync(changelogPath, 'utf8');
    const notes = extractNotesFromChangelog(changelog, currentVersion);
    if (notes) return notes;
  }
  try {
    const gitLog = await new Promise((resolve, reject) => {
      exec(
        `cd ${tempDir} && git log ${previousVersion}..${currentVersion} --pretty=format:"%h - %s (%an)" --no-merges`,
        (error, stdout, stderr) => {
          if (error) return reject(new Error(stderr || error.message));
          resolve(stdout);
        }
      );
    });
    return gitLog || 'No release notes available';
  } catch (err) {
    return 'No release notes available';
  }
};

exports.getPRsBetweenTags = async function () {
  throw new Error('getPRsBetweenTags not implemented');
};
