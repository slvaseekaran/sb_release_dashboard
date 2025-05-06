const fetch = require('node-fetch');

const ORGANIZATION = 'rapyuta-robotics';
const PROJECT = 'sootballs';
const PAT = process.env.AZURE_PAT;

// Fetch work item details for a list of IDs
async function fetchWorkItemDetails(workItemIds) {
  if (!workItemIds || workItemIds.length === 0) return [];
  if (!PAT) {
      console.warn('No Azure PAT configured');
      return workItemIds.map(id => ({
          id,
          type: 'Unknown',
          title: 'No PAT configured',
          assignee: 'Unknown'
      }));
  }
  const url = `https://dev.azure.com/${ORGANIZATION}/${PROJECT}/_apis/wit/workitemsbatch?api-version=7.1`;
  const response = await fetch(url, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(':' + PAT).toString('base64')}`,
      },
      body: JSON.stringify({
          ids: workItemIds.map(id => parseInt(id)),
          fields: [
              'System.Id',
              'System.WorkItemType',
              'System.Title',
              'System.State',
              'System.AssignedTo'
          ]
      })
  });
  if (!response.ok) {
      const err = await response.text();
      console.error('Azure DevOps API error:', err);
      return workItemIds.map(id => ({
          id,
          type: 'Unknown',
          title: 'Error fetching title',
          assignee: 'Unknown'
      }));
  }
  const data = await response.json();
  return (data.value || []).map(item => ({
      id: item.id,
      type: item.fields['System.WorkItemType'] || 'Unknown',
      title: item.fields['System.Title'] || `Work Item ${item.id}`,
      assignee: item.fields['System.AssignedTo']?.displayName || 'Unassigned'
  }));
}

// Fetch all work items from a WIQL query by Query ID
async function fetchWorkItemsByQueryId(queryId) {
  if (!PAT) throw new Error('No Azure PAT configured');
  // 1. Get work item IDs from the query
  const wiqlUrl = `https://dev.azure.com/${ORGANIZATION}/${PROJECT}/_apis/wit/wiql/${queryId}?api-version=7.1`;
  const wiqlRes = await fetch(wiqlUrl, {
      headers: {
          'Authorization': `Basic ${Buffer.from(':' + PAT).toString('base64')}`,
      }
  });
  if (!wiqlRes.ok) {
      throw new Error(`Failed to fetch WIQL results: ${await wiqlRes.text()}`);
  }
  const wiqlData = await wiqlRes.json();
  const workItemIds = (wiqlData.workItems || []).map(wi => wi.id);
  if (workItemIds.length === 0) return [];
  // 2. Fetch details for these work items
  return await fetchWorkItemDetails(workItemIds);
}

// For backward compatibility: extract from release notes text
async function processReleaseNotesForWorkItems(releaseNotes) {
  const workItemIds = new Set();
  if (releaseNotes.notes && releaseNotes.notes.io_amr) {
    releaseNotes.notes.io_amr.forEach(note => {
      if (!note.error && note.notes) {
        extractWorkItemReferences(note.notes).forEach(id => workItemIds.add(id));
      }
    });
  }
  if (releaseNotes.notes && releaseNotes.notes.sootball) {
    releaseNotes.notes.sootball.forEach(note => {
      if (!note.error && note.notes) {
        extractWorkItemReferences(note.notes).forEach(id => workItemIds.add(id));
      }
    });
  }
  if (workItemIds.size > 0) {
    return await fetchWorkItemDetails(Array.from(workItemIds));
  }
  return [];
}

module.exports = {
  fetchWorkItemsByQueryId,
  processReleaseNotesForWorkItems,
};
