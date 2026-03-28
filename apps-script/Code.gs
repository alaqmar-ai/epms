const CONFIG = {
  TEAM_TOKEN: 'toyota2024',
  SPREADSHEET_ID: SpreadsheetApp.getActiveSpreadsheet().getId()
};

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Projects sheet
  let projSheet = ss.getSheetByName('Projects');
  if (!projSheet) {
    projSheet = ss.insertSheet('Projects');
    projSheet.appendRow(['id', 'pic', 'name', 'code', 'group', 'source', 'duration', 'createdAt', 'updatedAt']);
    projSheet.getRange('1:1').setFontWeight('bold');
  }

  // Stages sheet
  let stageSheet = ss.getSheetByName('Stages');
  if (!stageSheet) {
    stageSheet = ss.insertSheet('Stages');
    stageSheet.appendRow(['projectId', 'stageIndex', 'stageName', 'planStart', 'planFinish', 'actualStart', 'actualFinish', 'checked']);
    stageSheet.getRange('1:1').setFontWeight('bold');
  }

  // Users sheet
  let userSheet = ss.getSheetByName('Users');
  if (!userSheet) {
    userSheet = ss.insertSheet('Users');
    userSheet.appendRow(['name', 'password', 'role', 'active']);
    userSheet.getRange('1:1').setFontWeight('bold');
    // Default users
    userSheet.appendRow(['Ahmad', 'Ahmad', 'PIC', 'TRUE']);
    userSheet.appendRow(['Faiz', 'Faiz', 'PIC', 'TRUE']);
    userSheet.appendRow(['Hidayat', 'Hidayat', 'Lead', 'TRUE']);
    userSheet.appendRow(['Admin', 'Admin', 'Admin', 'TRUE']);
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;

    switch (action) {
      case 'getAll':
        result = getAllProjects();
        break;
      case 'getProject':
        result = getProject(e.parameter.id);
        break;
      case 'login':
        result = login(e.parameter.name, e.parameter.password);
        break;
      case 'validateToken':
        result = { success: true, valid: e.parameter.token === CONFIG.TEAM_TOKEN };
        break;
      default:
        result = { success: false, error: 'Unknown action' };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    let result;

    switch (payload.action) {
      case 'createProject':
        result = createProject(payload.data);
        break;
      case 'updateProject':
        result = updateProject(payload.data);
        break;
      case 'deleteProject':
        result = deleteProjectById(payload.id);
        break;
      default:
        result = { success: false, error: 'Unknown action' };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function login(name, password) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === name && data[i][1] === password && String(data[i][3]).toUpperCase() === 'TRUE') {
      return { success: true, user: { name: data[i][0], role: data[i][2] } };
    }
  }
  return { success: false, error: 'Invalid credentials' };
}

function getAllProjects() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const projSheet = ss.getSheetByName('Projects');
  const stageSheet = ss.getSheetByName('Stages');

  if (!projSheet || !stageSheet) return { success: true, projects: [] };

  const projData = projSheet.getDataRange().getValues();
  const stageData = stageSheet.getDataRange().getValues();

  // Build stage map
  const stageMap = {};
  for (let i = 1; i < stageData.length; i++) {
    const projectId = stageData[i][0];
    if (!stageMap[projectId]) stageMap[projectId] = [];
    stageMap[projectId].push({
      stageIndex: Number(stageData[i][1]),
      stageName: stageData[i][2],
      planStart: formatSheetDate(stageData[i][3]),
      planFinish: formatSheetDate(stageData[i][4]),
      actualStart: formatSheetDate(stageData[i][5]),
      actualFinish: formatSheetDate(stageData[i][6]),
      checked: String(stageData[i][7]).toUpperCase() === 'TRUE'
    });
  }

  const projects = [];
  for (let i = 1; i < projData.length; i++) {
    const id = projData[i][0];
    if (!id) continue;
    const stages = (stageMap[id] || []).sort((a, b) => a.stageIndex - b.stageIndex);
    projects.push({
      id: id,
      pic: projData[i][1],
      name: projData[i][2],
      code: projData[i][3],
      group: projData[i][4],
      source: projData[i][5],
      duration: Number(projData[i][6]) || 0,
      createdAt: projData[i][7],
      updatedAt: projData[i][8],
      stages: stages
    });
  }

  return { success: true, projects: projects };
}

function getProject(id) {
  const result = getAllProjects();
  if (!result.success) return result;
  const project = result.projects.find(p => p.id === id);
  if (!project) return { success: false, error: 'Project not found' };
  return { success: true, project: project };
}

function createProject(data) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const projSheet = ss.getSheetByName('Projects');
  const stageSheet = ss.getSheetByName('Stages');

  const id = 'prj_' + Date.now();
  const now = new Date().toISOString();

  projSheet.appendRow([id, data.pic, data.name, data.code, data.group, data.source, data.duration || 0, now, now]);

  const STAGE_NAMES = ['Concept', 'Tender Spec & Quotation', 'Procure & PO', 'Drawing', 'Fabrication', 'PDI', 'Shipping & Tax', 'Delivery', 'Installation', 'Trial', 'Handover'];

  const stageRows = [];
  for (let i = 0; i < 11; i++) {
    const s = data.stages && data.stages[i] ? data.stages[i] : {};
    stageRows.push([id, i, STAGE_NAMES[i], s.planStart || '', s.planFinish || '', s.actualStart || '', s.actualFinish || '', s.checked ? 'TRUE' : 'FALSE']);
  }

  if (stageRows.length > 0) {
    stageSheet.getRange(stageSheet.getLastRow() + 1, 1, stageRows.length, 8).setValues(stageRows);
  }

  return { success: true, project: { id, pic: data.pic, name: data.name, code: data.code, group: data.group, source: data.source, duration: data.duration || 0, stages: data.stages || [], createdAt: now, updatedAt: now } };
}

function updateProject(data) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const projSheet = ss.getSheetByName('Projects');
  const stageSheet = ss.getSheetByName('Stages');

  // Find and update project row
  const projData = projSheet.getDataRange().getValues();
  let projRow = -1;
  for (let i = 1; i < projData.length; i++) {
    if (projData[i][0] === data.id) { projRow = i + 1; break; }
  }
  if (projRow === -1) return { success: false, error: 'Project not found' };

  const now = new Date().toISOString();
  projSheet.getRange(projRow, 2, 1, 8).setValues([[data.pic, data.name, data.code, data.group, data.source, data.duration || 0, projData[projRow - 1][7], now]]);

  // Delete existing stages for this project
  const stageData = stageSheet.getDataRange().getValues();
  const rowsToDelete = [];
  for (let i = stageData.length - 1; i >= 1; i--) {
    if (stageData[i][0] === data.id) rowsToDelete.push(i + 1);
  }
  for (const row of rowsToDelete) {
    stageSheet.deleteRow(row);
  }

  // Insert updated stages
  const STAGE_NAMES = ['Concept', 'Tender Spec & Quotation', 'Procure & PO', 'Drawing', 'Fabrication', 'PDI', 'Shipping & Tax', 'Delivery', 'Installation', 'Trial', 'Handover'];
  const stageRows = [];
  for (let i = 0; i < 11; i++) {
    const s = data.stages && data.stages[i] ? data.stages[i] : {};
    stageRows.push([data.id, i, STAGE_NAMES[i], s.planStart || '', s.planFinish || '', s.actualStart || '', s.actualFinish || '', s.checked ? 'TRUE' : 'FALSE']);
  }
  if (stageRows.length > 0) {
    stageSheet.getRange(stageSheet.getLastRow() + 1, 1, stageRows.length, 8).setValues(stageRows);
  }

  return { success: true, project: data };
}

function deleteProjectById(id) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const projSheet = ss.getSheetByName('Projects');
  const stageSheet = ss.getSheetByName('Stages');

  // Delete project row
  const projData = projSheet.getDataRange().getValues();
  for (let i = projData.length - 1; i >= 1; i--) {
    if (projData[i][0] === id) { projSheet.deleteRow(i + 1); break; }
  }

  // Delete stage rows
  const stageData = stageSheet.getDataRange().getValues();
  for (let i = stageData.length - 1; i >= 1; i--) {
    if (stageData[i][0] === id) stageSheet.deleteRow(i + 1);
  }

  return { success: true };
}

function seedData() {
  // Run setupSheets first to ensure sheets exist
  setupSheets();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const projSheet = ss.getSheetByName('Projects');
  const stageSheet = ss.getSheetByName('Stages');

  // Check if already seeded
  if (projSheet.getLastRow() > 1) {
    Logger.log('Projects already exist. Skipping seed.');
    return;
  }

  const STAGE_NAMES = ['Concept', 'Tender Spec & Quotation', 'Procure & PO', 'Drawing', 'Fabrication', 'PDI', 'Shipping & Tax', 'Delivery', 'Installation', 'Trial', 'Handover'];
  const now = new Date();
  const iso = now.toISOString();

  function fmt(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function addDays(d, n) {
    var r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  }

  var projects = [
    { code: 'EQ-2025-001', name: 'CNC Lathe Line 4', pic: 'Ahmad', group: 'Machining', source: 'Import - Japan', duration: 77, offset: -50 },
    { code: 'EQ-2025-002', name: 'Robotic Welding Cell B', pic: 'Faiz', group: 'Welding', source: 'Import - Germany', duration: 66, offset: -40 },
    { code: 'EQ-2025-003', name: 'Conveyor System Assy 2', pic: 'Ahmad', group: 'Assembly', source: 'Local', duration: 55, offset: -30 },
    { code: 'EQ-2025-004', name: 'Hydraulic Press 500T', pic: 'Hidayat', group: 'Press', source: 'Import - China', duration: 77, offset: -55 },
    { code: 'EQ-2025-005', name: 'Paint Booth Upgrade', pic: 'Faiz', group: 'Paint', source: 'Local', duration: 44, offset: -20 },
    { code: 'EQ-2026-006', name: 'AGV Material Handler', pic: 'Ahmad', group: 'Logistics', source: 'Import - Japan', duration: 55, offset: -5 }
  ];

  var projRows = [];
  var stageRows = [];

  for (var p = 0; p < projects.length; p++) {
    var proj = projects[p];
    var id = 'prj_seed_' + (p + 1);
    var startDate = addDays(now, proj.offset);
    var stageLen = Math.round(proj.duration / 11);

    projRows.push([id, proj.pic, proj.name, proj.code, proj.group, proj.source, proj.duration, iso, iso]);

    for (var i = 0; i < 11; i++) {
      var sStart = addDays(startDate, i * stageLen);
      var sEnd = addDays(sStart, stageLen - 1);
      var isPast = sEnd < now;
      var isActive = sStart <= now && sEnd >= now;
      var actualStart = (isPast || isActive) ? fmt(addDays(sStart, Math.floor(Math.random() * 3) - 1)) : '';
      var actualFinish = isPast ? fmt(addDays(sEnd, Math.floor(Math.random() * 5) - 2)) : '';
      var checked = isPast ? 'TRUE' : 'FALSE';

      stageRows.push([id, i, STAGE_NAMES[i], fmt(sStart), fmt(sEnd), actualStart, actualFinish, checked]);
    }
  }

  // Batch write
  projSheet.getRange(2, 1, projRows.length, 9).setValues(projRows);
  stageSheet.getRange(2, 1, stageRows.length, 8).setValues(stageRows);

  Logger.log('Seeded ' + projRows.length + ' projects and ' + stageRows.length + ' stages.');
}

function formatSheetDate(value) {
  if (!value) return '';
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  return String(value);
}
