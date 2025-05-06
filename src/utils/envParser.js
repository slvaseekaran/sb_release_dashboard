const fs = require('fs');

exports.parseEnvFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const envData = { io_amr_tags: {}, sootball_tags: {} };
  let currentSection = null;
  for (const line of lines) {
    if (!line.trim()) continue;
    if (line.includes('IO_AMR Tags')) {
      currentSection = 'io_amr_tags';
      continue;
    } else if (line.includes('Sootball Tags')) {
      currentSection = 'sootball_tags';
      continue;
    }
    if (currentSection && line.includes('=')) {
      const [key, value] = line.split('=').map(part => part.trim());
      const cleanValue = value.replace(/^["'](.*)["']$/, '$1');
      if (key && cleanValue) {
        envData[currentSection][key] = cleanValue;
      }
    }
  }
  return envData;
};
