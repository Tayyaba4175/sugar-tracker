// Sugar Tracker <-> Google Sheet sync.
//
// Deploy this as a Web App (Extensions > Apps Script, paste this in, then
// Deploy > New deployment > Web app). The tracker page POSTs its full
// reading list here on every add/edit/delete, which rewrites Sheet1
// (columns: Date, Time, Glucose (mg/dL), Reading type, Note) to match. It
// also GETs from here on page load, so the Sheet is the shared source of
// truth every device reads from - not just something readings get backed
// up to.
//
// See README.md in this folder for the exact deployment steps.

var SHEET_NAME = "Sheet1";

// Must match GOOGLE_SHEET_SECRET in index.html. This is not a strong secret
// (it travels in the request body/URL) but stops random strangers who don't
// know it from reading or overwriting your sheet if they ever guessed the
// Web App URL.
var SHARED_SECRET = "Rk6sotsrNTgPPuVwiuLDyDj0KPi59-Ov";

var TIMEZONE = "Asia/Karachi";

var TYPE_LABELS = {
  fasting: "Fasting",
  post: "Post-meal",
  random: "Random",
  bedtime: "Bedtime"
};

var LABEL_TO_TYPE = (function () {
  var m = {};
  Object.keys(TYPE_LABELS).forEach(function (k) { m[TYPE_LABELS[k]] = k; });
  return m;
})();

function doGet(e) {
  var result;
  try {
    var secret = e && e.parameter ? e.parameter.secret : null;
    if (secret !== SHARED_SECRET) {
      result = { ok: false, error: "unauthorized" };
    } else {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
      if (!sheet) {
        result = { ok: false, error: "Sheet '" + SHEET_NAME + "' not found" };
      } else {
        result = { ok: true, readings: readReadings(sheet) };
      }
    }
  } catch (err) {
    result = { ok: false, error: String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

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

// Reads Sheet1's data rows back into the same {t, v, type, note} shape the
// tracker page keeps in memory. There's no ID column in the sheet (it stays
// a plain human-readable log), so each row gets a synthetic id derived from
// its position + timestamp - stable for one page load, which is all the
// delete button needs.
function readReadings(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  var out = [];
  values.forEach(function (row, i) {
    var dateVal = row[0], timeVal = row[1], v = row[2], typeLabel = row[3], note = row[4];
    if (dateVal === "" || v === "" || v === null || typeof v !== "number") return; // skip blank rows
    var t = combineDateTime(dateVal, timeVal);
    if (t === null) return;
    out.push({
      id: "s" + t + "_" + i,
      t: t,
      v: v,
      type: LABEL_TO_TYPE[typeLabel] || "random",
      note: note ? String(note) : ""
    });
  });
  return out;
}

// Sheet cells come back as real Date objects (a date-only cell as midnight
// on that day, a time-only cell as that time-of-day on Dec 30 1899) -
// reformat both through the tracker's timezone and reparse together so the
// result is the same epoch ms the app would have produced for that entry.
function combineDateTime(dateVal, timeVal) {
  var dateStr = (dateVal instanceof Date)
    ? Utilities.formatDate(dateVal, TIMEZONE, "yyyy-MM-dd")
    : String(dateVal);
  var timeStr = (timeVal instanceof Date)
    ? Utilities.formatDate(timeVal, TIMEZONE, "HH:mm")
    : String(timeVal);
  var parsed = Utilities.parseDate(dateStr + " " + timeStr, TIMEZONE, "yyyy-MM-dd HH:mm");
  var ms = parsed.getTime();
  return isNaN(ms) ? null : ms;
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
// select this function in the toolbar dropdown and click Run, then check
// the Executions log (or View > Logs) for the result.
function test() {
  var res = writeReadings([
    { t: Date.now(), v: 123, type: "fasting", note: "test row from Apps Script" }
  ]);
  Logger.log(res);
  Logger.log(readReadings(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)));
}
