// ========================================================================
// REFACTOR MAP HEADER
// Purpose: Code.gs BLOCK organization only.
// Backend logic intentionally unchanged.
// ========================================================================

/**
 * Google Apps Script - SAT Quiz API
 */


const SPREADSHEET_ID = '1TJTOUlnLJ2l6_HoWIw16541unfprYFBGwoXSU-EEkzE';
const SHEET_NAME = 'sat';


function doGet(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var start = parseInt(params.start) || 1;
    var limit = parseInt(params.limit) || 120;
    var totalOnly = params.total === 'true';
   
    var allData = getQuizData();
   
    if (!allData || !Array.isArray(allData)) {
      allData = [];
    }
   
    var response = {};
    if (totalOnly) {
      response = { total: allData.length };
    } else {
      var startIndex = Math.max(0, start - 1);
      var endIndex = Math.min(allData.length, startIndex + limit);
      var result = allData.slice(startIndex, endIndex);
      response = {
        data: result,
        total: allData.length,
        start: start,
        limit: limit,
        count: result.length
      };
    }
   
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
   
  } catch(error) {
    var errorResponse = {
      status: 'error',
      message: error.message || 'Unknown error'
    };
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


function doPost(e) {
  return doGet(e);
}


function getQuizData() {
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    var range = sheet.getDataRange();
    var values = range.getValues();
   
    if (values.length < 2) return [];
   
    var data = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
     
      // 선택지가 하나라도 있으면 객체 생성, 없으면 빈 객체
      var choices = {};
      if (row[3] || row[4] || row[5] || row[6]) {
        choices["1"] = row[3] || '';
        choices["2"] = row[4] || '';
        choices["3"] = row[5] || '';
        choices["4"] = row[6] || '';
      }
     
      data.push({
        N: row[0] || i,
        Q: row[1] || '',
        passage: row[2] || '',
        choices: choices,
        answer: row[7] || '',
        explanation: row[8] || '',
        graphic: row[9] || ''
      });
    }
    return data;
   
  } catch(e) {
    Logger.log('Error: ' + e.message);
    return [];
  }
}


function testAPI() {
  var data = getQuizData();
  Logger.log('✅ 총 ' + data.length + '개 문제 로드');
  return 'Success: ' + data.length;
}

