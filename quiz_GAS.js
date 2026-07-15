/**
 * Google Apps Script - SAT Quiz API v2.0
 * 새 표준 헤더를 그대로 JSON으로 반환
 *
 * 지원:
 *   ?total=true
 *   ?start=1&limit=120
 *   ?subject=SAT
 *   ?status=ACTIVE
 */

const DEFAULT_SHEET_NAME = 'sat';
const ALLOWED_SHEETS = ['sat', 'realestate', 'mortgage', 'insurance', 'notary'];
const DEFAULT_LIMIT = 120;
const MAX_LIMIT = 500;

// 현재 표준 헤더
const SAT_HEADERS = [
  'N',
  'SUBJECT',
  'Q_EN',
  'Q_KO',
  'P_EN',
  'P_KO',
  '1_EN',
  '1_KO',
  '2_EN',
  '2_KO',
  '3_EN',
  '3_KO',
  '4_EN',
  '4_KO',
  'A',
  'E_EN',
  'E_KO',
  'G',
  'D',
  'SOURCE_TYPE',
  'VARIANT_NO',
  'SOURCE_ID',
  'STATUS',
  'CREATED_AT',
  'UPDATED_AT'
];
const LICENSE_HEADERS = ['N', 'Q_EN', '1_EN', '2_EN', '3_EN', '4_EN', 'A', 'E_EN'];

// BLOCK 4000: Dynamic question loader
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};

    const start = Math.max(1, parseInt(params.start, 10) || 1);
    const requestedLimit = parseInt(params.limit, 10) || DEFAULT_LIMIT;
    const limit = Math.max(1, Math.min(requestedLimit, MAX_LIMIT));

    const totalOnly = String(params.total || '').toLowerCase() === 'true';
    const subject = cleanText_(params.subject);
    const status = cleanText_(params.status);
    const sheetName = validateSheetName_(params.sheet || DEFAULT_SHEET_NAME);

    const allData = getQuizData_({
      sheet: sheetName,
      subject: subject,
      status: status
    });

    if (totalOnly) {
      return jsonResponse_({
        status: 'success',
        apiVersion: 'MULTI_SCHEMA_V2',
        total: allData.length,
        sheet: sheetName,
        subject: subject || '',
        statusFilter: status || ''
      });
    }

    const startIndex = start - 1;
    const result = allData.slice(startIndex, startIndex + limit);

    return jsonResponse_({
      status: 'success',
      apiVersion: 'MULTI_SCHEMA_V2',
      data: result,
      total: allData.length,
      start: start,
      limit: limit,
      count: result.length,
      sheet: sheetName,
      subject: subject || '',
      statusFilter: status || ''
    });

  } catch (error) {
    return jsonResponse_({
      status: 'error',
      message: error && error.message ? error.message : String(error)
    });
  }
}

function doPost(e) {
  try {
    const body = parseJsonBody_(e);
    const fakeEvent = {
      parameter: Object.assign(
        {},
        (e && e.parameter) ? e.parameter : {},
        body || {}
      )
    };
    return doGet(fakeEvent);
  } catch (error) {
    return jsonResponse_({
      status: 'error',
      message: error && error.message ? error.message : String(error)
    });
  }
}

/**
 * 시트 헤더를 기준으로 각 행을 객체로 변환한다.
 * 열 순서가 바뀌어도 헤더 이름만 같으면 정상 동작한다.
 */
function getQuizData_(filters) {
  const sheetName = validateSheetName_(filters && filters.sheet);
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(sheetName);

  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 2 || lastColumn < 1) {
    return [];
  }

  const values = sheet
    .getRange(1, 1, lastRow, lastColumn)
    .getValues();

  const headers = values[0].map(function(header) {
    return normalizeHeader_(header);
  });

  const schema = detectSchema_(headers);
  validateHeaders_(headers, schema);

  const subjectFilter = cleanText_(filters && filters.subject).toUpperCase();
  const statusFilter = cleanText_(filters && filters.status).toUpperCase();

  const result = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];

    if (isBlankRow_(row)) {
      continue;
    }

    const item = {};

    for (let c = 0; c < headers.length; c++) {
      const header = headers[c];

      if (!header) {
        continue;
      }

      item[header] = normalizeCellValue_(row[c]);
    }
    item._SCHEMA = schema;

    // N이 비어 있으면 실제 데이터 순번 사용
    if (item.N === '' || item.N === null || item.N === undefined) {
      item.N = r;
    }

    // 선택 필터
    if (
      subjectFilter &&
      cleanText_(item.SUBJECT).toUpperCase() !== subjectFilter
    ) {
      continue;
    }

    if (
      statusFilter &&
      cleanText_(item.STATUS).toUpperCase() !== statusFilter
    ) {
      continue;
    }

    result.push(item);
  }

  return result;
}

function validateSheetName_(value) {
  const requested = cleanText_(value || DEFAULT_SHEET_NAME);
  const match = ALLOWED_SHEETS.find(function(name) {
    return name.toUpperCase() === requested.toUpperCase();
  });
  if (!match) throw new Error('Unsupported quiz sheet: ' + requested);
  return match;
}

function detectSchema_(headers) {
  if (SAT_HEADERS.every(function(header) { return headers.indexOf(header) !== -1; })) return 'SAT_25_COLUMN';
  if (LICENSE_HEADERS.every(function(header) { return headers.indexOf(header) !== -1; })) return 'LICENSE_8_COLUMN';
  return 'UNKNOWN';
}

function validateHeaders_(headers, schema) {
  const requiredHeaders = schema === 'SAT_25_COLUMN' ? SAT_HEADERS : LICENSE_HEADERS;
  const missing = requiredHeaders.filter(function(required) {
    return headers.indexOf(required) === -1;
  });

  if (missing.length > 0) {
    throw new Error(
      'Missing required headers: ' + missing.join(', ')
    );
  }
}

function normalizeHeader_(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/^\uFEFF/, '')
    .trim()
    .toUpperCase();
}

function normalizeCellValue_(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (
    Object.prototype.toString.call(value) === '[object Date]' &&
    !isNaN(value.getTime())
  ) {
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd'T'HH:mm:ss"
    );
  }

  return value;
}

function isBlankRow_(row) {
  return row.every(function(value) {
    return value === '' || value === null || value === undefined;
  });
}

function cleanText_(value) {
  return String(value === null || value === undefined ? '' : value).trim();
}

function parseJsonBody_(e) {
  if (
    !e ||
    !e.postData ||
    !e.postData.contents
  ) {
    return {};
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    return {};
  }
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Apps Script 편집기에서 직접 실행하는 테스트 함수
 */
function testAPI() {
  const data = getQuizData_({
    subject: '',
    status: ''
  });

  Logger.log('총 문제 수: ' + data.length);

  if (data.length > 0) {
    Logger.log(
      '첫 문제 키: ' +
      Object.keys(data[0]).join(', ')
    );

    Logger.log(
      '첫 문제: ' +
      JSON.stringify(data[0], null, 2)
    );
  }

  return 'Success: ' + data.length;
}

/**
 * 헤더 검사 전용
 */
function testHeaders() {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(DEFAULT_SHEET_NAME);

  if (!sheet) {
    throw new Error('Sheet not found: ' + DEFAULT_SHEET_NAME);
  }

  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(normalizeHeader_);

  const schema = detectSchema_(headers);
  validateHeaders_(headers, schema);

  Logger.log('헤더 정상: ' + headers.join(', '));
  return 'Headers OK';
}
