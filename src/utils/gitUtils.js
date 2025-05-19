const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const fetch = require('node-fetch');

function execWithSshAgent(cmd, options = {}) {
  options.env = {
    ...process.env,
    SSH_AUTH_SOCK: process.env.SSH_AUTH_SOCK,
    SSH_AGENT_PID: process.env.SSH_AGENT_PID,
  };
  return new Promise((resolve, reject) => {
    exec(cmd, options, (error, stdout, stderr) => {
      if (error) return reject(new Error(stderr || error.message));
      resolve(stdout);
    });
  });
}

function cloneRepository(sshUrl, directory) {
  return execWithSshAgent(`git clone ${sshUrl} ${directory}`);
}

async function fetchGitHubRelease(owner, repo, tag) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`;
  try {
    const res = await fetch(apiUrl, { headers: { 'Accept': 'application/vnd.github+json' } });
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

exports.getRepositoryReleaseNotes = async (sshUrl, previousVersion, currentVersion) => {
  const repoName = sshUrl.split('/').pop().replace('.git', '');
  const owner = sshUrl.split(':')[1].split('/')[0];
  const tempDir = path.join(__dirname, '../../temp', repoName);

  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

  await cloneRepository(sshUrl, tempDir);

  const apiRelease = await fetchGitHubRelease(owner, repoName, currentVersion);
  if (apiRelease) return apiRelease;

  const changelogPath = path.join(tempDir, 'CHANGELOG.md');
  if (fs.existsSync(changelogPath)) {
    const changelog = fs.readFileSync(changelogPath, 'utf8');
    const notes = extractNotesFromChangelog(changelog, currentVersion);
    if (notes) return notes;
  }

  try {
    const gitLog = await execWithSshAgent(
      `cd ${tempDir} && git log ${previousVersion}..${currentVersion} --pretty=format:"%h - %s (%an)" --no-merges`
    );
    return gitLog || 'No release notes available';
  } catch (err) {
    return 'No release notes available';
  }
};

exports.getPRsBetweenTags = async function () {
  throw new Error('getPRsBetweenTags not implemented');
};
