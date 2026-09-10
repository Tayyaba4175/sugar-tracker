// Sugar Tracker -> Google Sheet sync.
//
// Deploy this as a Web App (Extensions > Apps Script, paste this in, then
// Deploy > New deployment > Web app). It receives the full reading list from
// the tracker page each time you add/edit/delete an entry, and rewrites
// Sheet1 (columns: Date, Time, Glucose (mg/dL), Reading type, Note) to match.
//
// See README.md in this folder for the exact deployment steps.

var SHEET_NAME = "Sheet1";

// Must match GOOGLE_SHEET_SECRET in index.html. This is not a strong secret
// (it travels in the request body) but stops random strangers who don't know
// it from overwriting your sheet if they ever guessed the Web App URL.
var SHARED_SECRET = "Rk6sotsrNTgPPuVwiuLDyDj0KPi59-Ov";

var TIMEZONE = "Asia/Karachi";

var TYPE_LABELS = {
  fasting: "Fasting",
  post: "Post-meal",
  random: "Random",
  bedtime: "Bedtime"
};

function doPost(e) {
  var result;
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.secret !== SHARED_SECRET) {
      result = { ok: false, error: "unauthorized" };
    } else if (!Array.isArray(body.readings)) {
      result = { ok: false, error: "expected a readings array" };
    } else {
      result = writeReadings(body.readings);
    }
  } catch (err) {
    result = { ok: false, error: String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function writeReadings(readings) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return { ok: false, error: "Sheet '" + SHEET_NAME + "' not found" };
  }

  var rows = readings
    .filter(function (r) {
      return r && typeof r.t === "number" && typeof r.v === "number" && TYPE_LABELS[r.type];
    })
    .sort(function (a, b) { return a.t - b.t; })
    .map(function (r) {
      var d = new Date(r.t);
      var date = Utilities.formatDate(d, TIMEZONE, "yyyy-MM-dd");
      var time = Utilities.formatDate(d, TIMEZONE, "HH:mm");
      return [date, time, r.v, TYPE_LABELS[r.type], r.note || ""];
    });

  // Rewrite the data rows (keep header row 1) so the sheet always matches
  // the app's current reading list exactly, instead of drifting via
  // one-row-at-a-time appends.
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
  }
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }

  return { ok: true, count: rows.length };
}

// Lets you sanity-check the deployment from the Apps Script editor itself:
// select this function in the toolbar dropdown and click Run.
function test() {
  var res = writeReadings([
    { t: Date.now(), v: 123, type: "fasting", note: "test row from Apps Script" }
  ]);
  Logger.log(res);
}
