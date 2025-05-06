document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements - Screens
  const homeScreen = document.getElementById('home-screen');
  const postScreen = document.getElementById('post-screen');
  const resultsScreen = document.getElementById('results-screen');
  const getScreen = document.getElementById('get-screen');
  const versionDetailsScreen = document.getElementById('version-details-screen');
  
  // DOM Elements - Buttons
  const getNotesBtn = document.getElementById('get-notes-btn');
  const postNotesBtn = document.getElementById('post-notes-btn');
  const releaseForm = document.getElementById('release-form');
  const postReleaseBtn = document.getElementById('post-release-btn');
  const downloadBtn = document.getElementById('download-btn');
  const newComparisonBtn = document.getElementById('new-comparison-btn');
  const backToVersionsBtn = document.getElementById('back-to-versions-btn');
  const viewDownloadBtn = document.getElementById('view-download-btn');
  const backBtns = document.querySelectorAll('.back-btn');
  const clearButtons = document.querySelectorAll('.clear-file-btn');
  
  // DOM Elements - Inputs and Displays
  const previousEnvInput = document.getElementById('previousEnv');
  const currentEnvInput = document.getElementById('currentEnv');
  const azureQueryIdInput = document.getElementById('azureQueryId');
  const previousEnvLabel = document.getElementById('previousEnvLabel');
  const currentEnvLabel = document.getElementById('currentEnvLabel');
  const ioAmrChanges = document.getElementById('io-amr-changes');
  const sootballChanges = document.getElementById('sootball-changes');
  const azureWorkItems = document.getElementById('azure-work-items');
  const viewIoAmrChanges = document.getElementById('view-io-amr-changes');
  const viewSootballChanges = document.getElementById('view-sootball-changes');
  const viewAzureWorkItems = document.getElementById('view-azure-work-items');
  const versionsList = document.getElementById('versions-list');
  const versionTitle = document.getElementById('version-title');
  const loadingOverlay = document.getElementById('loading-overlay');
  
  // Tab buttons
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  // Add click event listener to each clear button
  clearButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Get the target input ID from data-target attribute
      const targetId = this.getAttribute('data-target');
      const fileInput = document.getElementById(targetId);
      const fileLabel = document.getElementById(`${targetId}Label`);
      
      // Clear the file input
      clearFileInput(fileInput, fileLabel);
    });
  });
  
  // Current release notes data
  let currentReleaseData = null;
  let currentViewVersion = null;

  // Navigation history tracking
  let navigationHistory = ['home-screen'];

  // Navigation handlers
  getNotesBtn.addEventListener('click', function() {
    navigateTo('get-screen');
    loadVersions();
  });

  postNotesBtn.addEventListener('click', function() {
    navigateTo('post-screen');
  });

  backToVersionsBtn.addEventListener('click', function() {
    navigateTo('get-screen');
  });

  // Add event listeners for all back buttons
  backBtns.forEach(btn => {
    btn.addEventListener('click', navigateBack);
  });

  newComparisonBtn.addEventListener('click', function() {
    navigateTo('post-screen');
    releaseForm.reset();
    previousEnvLabel.textContent = 'Choose a file';
    previousEnvLabel.classList.remove('has-file');
    currentEnvLabel.textContent = 'Choose a file';
    currentEnvLabel.classList.remove('has-file');
    currentReleaseData = null;
  });

  // File input handlers
  previousEnvInput.addEventListener('change', function() {
    updateFileLabel(this, previousEnvLabel);
  });

  currentEnvInput.addEventListener('change', function() {
    updateFileLabel(this, currentEnvLabel);
  });

  // Form submission
  releaseForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!previousEnvInput.files[0] || !currentEnvInput.files[0]) {
      alert('Please select both previous and current .env files');
      return;
    }
    
    showLoading();
    
    const formData = new FormData();
    formData.append('previousEnv', previousEnvInput.files[0]);
    formData.append('currentEnv', currentEnvInput.files[0]);
    formData.append('azureQueryId', azureQueryIdInput.value.trim());
    
    try {
      const response = await fetch('/api/release-notes', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process release notes');
      }
      
      if (data.message === 'No version changes detected between the environment files.') {
        hideLoading();
        alert('No version changes detected between the environment files.');
        return;
      }
      
      // Store the release data
      currentReleaseData = data.releaseNotes;
      
      // Display the release notes
      displayReleaseNotes(
        currentReleaseData, 
        ioAmrChanges, 
        sootballChanges, 
        azureWorkItems
      );
      
      // Show results screen
      navigateTo('results-screen');
      
      hideLoading();
    } catch (error) {
      hideLoading();
      alert('Error: ' + error.message);
    }
  });

  // Post release notes button
  postReleaseBtn.addEventListener('click', async function() {
    if (!currentReleaseData) {
      alert('No release notes to post');
      return;
    }
    
    showLoading();
    
    try {
      const response = await fetch('/api/release-notes/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ releaseNotes: currentReleaseData })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to post release notes');
      }
      
      hideLoading();
      alert(`Release notes posted successfully as "${data.version}"`);
      
      // Go to home screen
      navigateTo('home-screen');
    } catch (error) {
      hideLoading();
      alert('Error: ' + error.message);
    }
  });

  // Download buttons
  downloadBtn.addEventListener('click', function() {
    if (!currentReleaseData) return;
    downloadAsMarkdown(currentReleaseData);
  });

  viewDownloadBtn.addEventListener('click', function() {
    if (!currentViewVersion) return;
    downloadAsMarkdown(currentViewVersion);
  });

  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Get the parent tabs container
      const tabsContainer = this.closest('.tabs');
      // Get all tab buttons in this container
      const buttons = tabsContainer.querySelectorAll('.tab-btn');
      // Get the tab content container
      const tabContentsContainer = this.closest('section');
      // Get all tab contents in this section
      const tabContents = tabContentsContainer.querySelectorAll('.tab-content');
      
      // Remove active class from all buttons and contents
      buttons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      this.classList.add('active');
      const tabId = this.getAttribute('data-tab');
      tabContentsContainer.querySelector(`#${tabId}-content`).classList.add('active');
    });
  });

  // Function to clear file input
  function clearFileInput(input, label) {
    // Create a new empty input element
    const newInput = document.createElement('input');
    newInput.type = 'file';
    newInput.id = input.id;
    newInput.name = input.name;
    newInput.className = input.className;
    newInput.required = input.required;
    
    // Add the same event listener to the new input
    newInput.addEventListener('change', function() {
      updateFileLabel(this, label);
    });
    
    // Replace the old input with the new one
    input.parentNode.replaceChild(newInput, input);
    
    // Reset the label text
    label.textContent = 'Choose a file';
    label.classList.remove('has-file');
  }

  // Extract major and minor version from a version string
  function extractMajorMinor(versionStr) {
    // Handle case when version is in the format "Sootballs 3.3.1-rc1"
    if (versionStr.includes("Sootballs")) {
      // Match the first two version components (major.minor)
      const match = versionStr.match(/Sootballs\s+(\d+)\.(\d+)/);
      if (match) {
        return { major: parseInt(match[1]), minor: parseInt(match[2]) };
      }
      
      // Fallback for just major version (Sootballs 3)
      const majorMatch = versionStr.match(/Sootballs\s+(\d+)/);
      if (majorMatch) {
        return { major: parseInt(majorMatch[1]), minor: 0 };
      }
    }
    
    // Regular version format like "3.4.1-rc0"
    const match = versionStr.match(/^(\d+)\.(\d+)/);
    if (match) {
      return { major: parseInt(match[1]), minor: parseInt(match[2]) };
    }
    
    return { major: 0, minor: 0 };
  }
  

  // Format version for display
  function formatVersionName(version) {
    const { major, minor } = extractMajorMinor(version);
    return `Sootballs – ${major}.${minor}`;
  }

  // Format version number for button
  function formatVersionNumber(version) {
    if (version.includes("Sootballs")) {
      const match = version.match(/Sootballs\s+(.+)/);
      return match ? match[1] : version;
    }
    
    // For other formats
    return version;
  }  

  // Group versions by major.minor
  function groupVersionsByMajorMinor(versions) {
    const groups = {};
    
    versions.forEach(version => {
        // Extract major.minor.patch-rc from version string
        const versionMatch = version.version.match(/(\d+)\.(\d+)\.(\d+)(?:-rc\d+)?/);
        if (!versionMatch) return;
        
        const major = parseInt(versionMatch[1]);
        const minor = parseInt(versionMatch[2]);
        const patch = parseInt(versionMatch[3]);
        
        // Create major.minor group key
        const majorMinorKey = `${major}.${minor}`;
        
        // Create patch group key
        const patchKey = `${major}.${minor}.${patch}`;
        
        // Initialize major.minor group if it doesn't exist
        if (!groups[majorMinorKey]) {
            groups[majorMinorKey] = {
                name: `Sootballs – ${major}.${minor}`,
                subgroups: {}
            };
        }
        
        // Initialize patch subgroup if it doesn't exist
        if (!groups[majorMinorKey].subgroups[patchKey]) {
            groups[majorMinorKey].subgroups[patchKey] = {
                name: `Sootballs ${major}.${minor}.${patch}`,
                versions: []
            };
        }
        
        // Add version to appropriate subgroup
        groups[majorMinorKey].subgroups[patchKey].versions.push(version);
    });
    
    // Sort versions within each subgroup
    Object.keys(groups).forEach(majorMinorKey => {
        Object.keys(groups[majorMinorKey].subgroups).forEach(patchKey => {
            groups[majorMinorKey].subgroups[patchKey].versions.sort((a, b) => {
                return b.version.localeCompare(a.version, undefined, { numeric: true });
            });
        });
    });
    
    return groups;
  }


  // Load versions
  async function loadVersions() {
    versionsList.innerHTML = '<div class="loading">Loading versions...</div>';
    
    try {
        const response = await fetch('/api/release-notes');
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load versions');
        }
        
        const groupedVersions = groupVersionsByMajorMinor(data.versions);
        
        if (Object.keys(groupedVersions).length === 0) {
            versionsList.innerHTML = '<div class="empty-state">No versions found</div>';
            return;
        }
        
        let html = '';
        
        // Sort major.minor groups by version (descending)
        const sortedGroups = Object.keys(groupedVersions).sort((a, b) => {
            return b.localeCompare(a, undefined, { numeric: true });
        });
        
        sortedGroups.forEach(majorMinorKey => {
            const group = groupedVersions[majorMinorKey];
            
            html += `<div class="version-group">
                <h3 class="version-group-title">${group.name}</h3>`;
            
            // Sort patch subgroups by version (descending)
            const sortedSubgroups = Object.keys(group.subgroups).sort((a, b) => {
                return b.localeCompare(a, undefined, { numeric: true });
            });
            
            sortedSubgroups.forEach(patchKey => {
                const subgroup = group.subgroups[patchKey];
                
                html += `<div class="version-subgroup">
                    <h4 class="version-subgroup-title">${subgroup.name}</h4>
                    <div class="version-buttons-container">`;
                
                subgroup.versions.forEach(version => {
                    const versionNumber = formatVersionNumber(version.version);
                    html += `<div class="version-btn" data-version="${version.version}">${versionNumber}</div>`;
                });
                
                html += `</div></div>`;
            });
            
            html += `</div>`;
        });
        
        versionsList.innerHTML = html;
        
        // Add click event listeners to version buttons
        document.querySelectorAll('.version-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const version = this.getAttribute('data-version');
                loadVersionDetails(version);
            });
        });
    } catch (error) {
        versionsList.innerHTML = `<div class="error-state">Error loading versions: ${error.message}</div>`;
    }
  }


  // Load version details
  async function loadVersionDetails(version) {
    showLoading();
    
    try {
      const response = await fetch(`/api/release-notes/${encodeURIComponent(version)}`);
      
      if (!response.ok) {
        throw new Error('Failed to load version details');
      }
      
      const data = await response.json();
      
      // Store the current view version
      currentViewVersion = data.releaseNotes;
      
      // Set the version title using the formatted version name
      versionTitle.textContent = formatVersionName(version);
      
      // Display the release notes
      displayReleaseNotes(
        data.releaseNotes, 
        viewIoAmrChanges, 
        viewSootballChanges, 
        viewAzureWorkItems
      );
      
      // Show version details screen
      navigateTo('version-details-screen');
      
      hideLoading();
    } catch (error) {
      hideLoading();
      alert('Error: ' + error.message);
    }
  }

  // Navigation functions
  function navigateTo(screenId) {
    // Add current screen to history before navigating
    const currentScreen = document.querySelector('section:not(.hidden)').id;
    if (currentScreen !== screenId) {
      navigationHistory.push(currentScreen);
    }
    
    // Show the requested screen
    showScreen(document.getElementById(screenId));
  }

  function navigateBack() {
    if (navigationHistory.length > 1) {
      // Remove current screen from history
      navigationHistory.pop();
      // Get the previous screen
      const previousScreen = navigationHistory[navigationHistory.length - 1];
      // Show the previous screen without adding to history
      showScreen(document.getElementById(previousScreen));
    } else {
      // If no history, go to home
      showScreen(document.getElementById('home-screen'));
      navigationHistory = ['home-screen'];
    }
  }

  // Helper functions
  function showScreen(screen) {
    // Hide all screens
    const screens = document.querySelectorAll('section');
    screens.forEach(s => s.classList.add('hidden'));
    
    // Show the requested screen
    screen.classList.remove('hidden');
  }

  function updateFileLabel(input, label) {
    if (input.files && input.files[0]) {
      label.textContent = input.files[0].name;
      label.classList.add('has-file');
    } else {
      label.textContent = 'Choose a file';
      label.classList.remove('has-file');
    }
  }

  // Function to extract Azure Work Item references from text
  function extractWorkItemReferences(text) {
    if (!text) return [];
    
    // Match AB#1234 pattern in text
    const workItemRegex = /AB#(\d+)/gi;
    const matches = [...text.matchAll(workItemRegex)];
    
    // Extract the work item IDs and remove duplicates
    const workItemIds = [...new Set(matches.map(match => match[1]))];
    return workItemIds;
  }

  // Function to convert PR references to links with the actual repository name
  function linkifyPRReferences(text, repoName) {
    if (!text) return '';
    
    // Match patterns like #123 or PR-123 or pull/123
    const prRegex = /(PR[- ]?(\d+))|(#(\d+))|(pull\/(\d+))/g;
    
    return text.replace(prRegex, function(match, pr1, prNum1, pr2, prNum2, pr3, prNum3) {
      const prNumber = prNum1 || prNum2 || prNum3;
      return `<a href="https://github.com/rapyuta-robotics/${repoName}/pull/${prNumber}" target="_blank" class="pr-link">${match}</a>`;
    });
  }

  // Function to convert Azure Work Item references to links
  function linkifyWorkItemReferences(text) {
    if (!text) return '';
    
    // Match AB#1234 pattern
    const workItemRegex = /(AB#(\d+))/gi;
    
    return text.replace(workItemRegex, function(match, full, itemId) {
      return `<a href="https://dev.azure.com/rapyuta-robotics/sootballs/_workitems/edit/${itemId}" target="_blank" class="work-item-link">${match}</a>`;
    });
  }

  function displayReleaseNotes(data, ioAmrElement, sootballElement, workItemsElement) {
    // Display IO AMR changes
    let ioAmrHtml = '';
    
    if (data.notes.io_amr.length > 0) {
      data.notes.io_amr.forEach(note => {
        ioAmrHtml += '<div class="repo-item">';
        ioAmrHtml += '<div class="repo-header">';
        ioAmrHtml += '<div class="repo-name">' + note.repository + '</div>';
        ioAmrHtml += '<div class="version-change">Version: <span>' + note.previousVersion + '</span> → <span>' + note.currentVersion + '</span></div>';
        ioAmrHtml += '</div>';
        
        if (note.error) {
          ioAmrHtml += '<div class="error-message">' + note.error + '</div>';
        } else {
          // Apply PR linkification to the notes
          const linkedText = linkifyPRReferences(note.notes, note.repository);
          // Also linkify Azure Work Item references
          const fullyLinkedText = linkifyWorkItemReferences(linkedText);
          ioAmrHtml += '<div class="repo-notes">' + fullyLinkedText + '</div>';
        }
        
        ioAmrHtml += '</div>';
      });
    } else {
      ioAmrHtml = '<p>No changes detected</p>';
    }
    
    ioAmrElement.innerHTML = ioAmrHtml;
    
    // Display Sootball changes
    let sootballHtml = '';
    
    if (data.notes.sootball.length > 0) {
      data.notes.sootball.forEach(note => {
        sootballHtml += '<div class="repo-item">';
        sootballHtml += '<div class="repo-header">';
        sootballHtml += '<div class="repo-name">' + note.repository + '</div>';
        sootballHtml += '<div class="version-change">Version: <span>' + note.previousVersion + '</span> → <span>' + note.currentVersion + '</span></div>';
        sootballHtml += '</div>';
        
        if (note.error) {
          sootballHtml += '<div class="error-message">' + note.error + '</div>';
        } else {
          // Apply PR linkification to the notes
          const linkedText = linkifyPRReferences(note.notes, note.repository);
          // Also linkify Azure Work Item references
          const fullyLinkedText = linkifyWorkItemReferences(linkedText);
          sootballHtml += '<div class="repo-notes">' + fullyLinkedText + '</div>';
        }
        
        sootballHtml += '</div>';
      });
    } else {
      sootballHtml = '<p>No changes detected</p>';
    }
    
    sootballElement.innerHTML = sootballHtml;
    
    // Display Azure Work Items
    const workItems = data.workItems || [];
    displayAzureWorkItems(workItems, workItemsElement);    
  }  

  function downloadAsMarkdown(data) {
    let markdown = '# Release Notes\n\n';
    markdown += `Generated on: ${new Date(data.generatedAt).toLocaleString()}\n\n`;
    
    // IO AMR changes
    markdown += '## IO AMR Changes\n\n';
    
    if (data.notes.io_amr.length > 0) {
      data.notes.io_amr.forEach(note => {
        markdown += `### ${note.repository}\n\n`;
        markdown += `**Version Change:** ${note.previousVersion} → ${note.currentVersion}\n\n`;
        
        if (note.error) {
          markdown += `*Error: ${note.error}*\n\n`;
        } else {
          markdown += `${note.notes}\n\n`;
        }
      });
    } else {
      markdown += 'No changes detected\n\n';
    }
    
    // Sootball changes
    markdown += '## Sootball Changes\n\n';
    
    if (data.notes.sootball.length > 0) {
      data.notes.sootball.forEach(note => {
        markdown += `### ${note.repository}\n\n`;
        markdown += `**Version Change:** ${note.previousVersion} → ${note.currentVersion}\n\n`;
        
        if (note.error) {
          markdown += `*Error: ${note.error}*\n\n`;
        } else {
          markdown += `${note.notes}\n\n`;
        }
      });
    } else {
      markdown += 'No changes detected\n\n';
    }
    
    // Azure Work Items
    markdown += '## Azure Work Items\n\n';
    
    const workItems = data.workItems || [];
    if (workItems.length > 0) {
      workItems.forEach(item => {
        markdown += `- [AB#${item.id}](https://dev.azure.com/rapyuta-robotics/sootballs/_workitems/edit/${item.id}) - ${item.title}\n`;
      });
    } else {
      // Extract work items from notes
      const extractedItems = new Set();
      
      // Extract from IO AMR notes
      data.notes.io_amr.forEach(note => {
        if (!note.error && note.notes) {
          const itemIds = extractWorkItemReferences(note.notes);
          itemIds.forEach(id => extractedItems.add(id));
        }
      });
      
      // Extract from Sootball notes
      data.notes.sootball.forEach(note => {
        if (!note.error && note.notes) {
          const itemIds = extractWorkItemReferences(note.notes);
          itemIds.forEach(id => extractedItems.add(id));
        }
      });
      
      if (extractedItems.size > 0) {
        Array.from(extractedItems).forEach(id => {
          markdown += `- [AB#${id}](https://dev.azure.com/rapyuta-robotics/sootballs/_workitems/edit/${id})\n`;
        });
      } else {
        markdown += 'No Azure Work Items found\n\n';
      }
    }
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `release-notes-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function showLoading() {
    loadingOverlay.style.display = 'flex';
  }

  function hideLoading() {
    loadingOverlay.style.display = 'none';
  }

  function displayAzureWorkItems(workItems, container) {
    if (!workItems || workItems.length === 0) {
      container.innerHTML = '<div class="error-message">No Azure Work Items found.</div>';
      return;
    }
  
    // Define the display order and friendly names
    const typeOrder = [
      { type: "Bug", label: "🐞 Bugs" },
      { type: "User Story", label: "📘 User Stories" },
      { type: "Feature", label: "⭐ Features" },
      { type: "Task", label: "📝 Tasks" }
    ];
  
    // Group work items by type
    const groups = {};
    workItems.forEach(item => {
      const type = item.type || "Other";
      if (!groups[type]) groups[type] = [];
      groups[type].push(item);
    });
  
    let html = '<div class="work-items-grouped-container">';
    typeOrder.forEach(({type, label}) => {
      if (groups[type]) {
        html += `
          <div class="work-item-group-block">
            <div class="work-item-group-title">${label}</div>
            <table class="work-item-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Title</th>
                  <th>Assignee</th>
                </tr>
              </thead>
              <tbody>
                ${groups[type].map((item, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>
                      <a href="https://dev.azure.com/rapyuta-robotics/sootballs/_workitems/edit/${item.id}" 
                         class="work-item-link" 
                         target="_blank">${item.title}</a>
                    </td>
                    <td>${item.assignee || "Unassigned"}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    });
  
    // Show any other types not in the main list
    Object.keys(groups).forEach(type => {
      if (!typeOrder.some(t => t.type === type)) {
        html += `
          <div class="work-item-group-block">
            <div class="work-item-group-title">${type}</div>
            <table class="work-item-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Title</th>
                  <th>Assignee</th>
                </tr>
              </thead>
              <tbody>
                ${groups[type].map((item, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>
                      <a href="https://dev.azure.com/rapyuta-robotics/sootballs/_workitems/edit/${item.id}" 
                         class="work-item-link" 
                         target="_blank">${item.title}</a>
                    </td>
                    <td>${item.assignee || "Unassigned"}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    });
  
    html += '</div>';
    container.innerHTML = html;
  }    

  // Start with home screen
  showScreen(homeScreen);
});