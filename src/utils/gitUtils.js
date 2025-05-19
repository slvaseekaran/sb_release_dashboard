const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const fetch = require('node-fetch');

// Utility to run a shell command and return a promise
function execWithSshAgent(cmd, options = {}) {
  // Forward SSH agent environment variables if present
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

// Clone a repo using SSH URL (e.g., [email protected]:org/repo.git)
function cloneRepository(sshUrl, directory) {
  return execWithSshAgent(`git clone --quiet ${sshUrl} ${directory}`);
}

// Fetch release notes from GitHub API (still uses HTTPS but for public info)
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

// Extract release notes from CHANGELOG.md between versions
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

// Main: get release notes for a repo between two tags
exports.getRepositoryReleaseNotes = async (sshUrl, previousVersion, currentVersion) => {
  const repoName = sshUrl.split('/').pop().replace('.git', '');
  const owner = sshUrl.split(':')[1].split('/')[0];
  const tempDir = path.join(__dirname, '../../temp', repoName);

  // Clean old clone if exists
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

  await cloneRepository(sshUrl, tempDir);

  // Try GitHub API for release notes (optional)
  const apiRelease = await fetchGitHubRelease(owner, repoName, currentVersion);
  if (apiRelease) return apiRelease;

  // Try extracting from CHANGELOG.md
  const changelogPath = path.join(tempDir, 'CHANGELOG.md');
  if (fs.existsSync(changelogPath)) {
    const changelog = fs.readFileSync(changelogPath, 'utf8');
    const notes = extractNotesFromChangelog(changelog, currentVersion);
    if (notes) return notes;
  }

  // Fallback: git log between tags
  try {
    const gitLog = await execWithSshAgent(
      `cd ${tempDir} && git log ${previousVersion}..${currentVersion} --pretty=format:"%h - %s (%an)" --no-merges`
    );
    return gitLog || 'No release notes available';
  } catch (err) {
    return 'No release notes available';
  }
};

// (Optional) Export a stub for getPRsBetweenTags if needed elsewhere
exports.getPRsBetweenTags = async function () {
  throw new Error('getPRsBetweenTags not implemented');
};
