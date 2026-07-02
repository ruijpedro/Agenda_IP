const CONFIG = {
  APP_NAME: 'IP_RJP Agenda',
  ROOT_FOLDER_NAME: 'IP_RJP_Agenda',
  SHEET_NAME: 'IP_RJP_Agenda_Dados'
};

function doGet() {
  return jsonOutput({ ok: true, app: CONFIG.APP_NAME, message: 'Servidor Google ativo' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action || '';
    const payload = body.payload || {};
    if (action === 'test') return jsonOutput({ ok: true, message: 'Ligação ativa' });
    if (action === 'saveActivity') return jsonOutput(saveActivity(payload));
    return jsonOutput({ ok: false, error: 'Ação desconhecida: ' + action });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

function saveActivity(item) {
  const ss = getSheet();
  const sh = getOrCreateSheet(ss, 'Atividades');
  if (sh.getLastRow() === 0) sh.appendRow(['Data', 'Início', 'Fim', 'Tipo', 'Título', 'Local', 'Observações', 'Criado em']);
  sh.appendRow([item.date, item.start, item.end, item.type, item.title, item.location, item.notes, new Date()]);
  return { ok: true, message: 'Atividade guardada no Google Sheets' };
}

function getSheet() {
  const files = DriveApp.getFilesByName(CONFIG.SHEET_NAME);
  if (files.hasNext()) return SpreadsheetApp.open(files.next());
  return SpreadsheetApp.create(CONFIG.SHEET_NAME);
}

function getOrCreateSheet(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
