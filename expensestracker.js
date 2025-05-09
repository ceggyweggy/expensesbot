var token = "INSERT TELEGRAM BOT TOKEN";
var telegramUrl = "https://api.telegram.org/bot" + token;
var webAppUrl = "INSERT WEBAPP URL";
var sheetId = "INSERT SPREADSHEET ID";
var userId = 861886075;

var ss = SpreadsheetApp.getActiveSpreadsheet();
var spending_log = ss.getSheetByName("Spending Log");
var spending_source = ss.getSheetByName("Spending Source");
var earning_log = ss.getSheetByName("Earning Log");
var earning_source = ss.getSheetByName("Earning Source");
var const_sheet = ss.getSheetByName("extra");

function set_consts(ncat, nsrc, samt, newe, eamt) {
  const_sheet.getRange('B1').setValue(ncat);
  const_sheet.getRange('B2').setValue(nsrc);
  const_sheet.getRange('B3').setValue(samt);
  const_sheet.getRange('B4').setValue(newe);
  const_sheet.getRange('B5').setValue(eamt);
}

function getMe() {
  var url = telegramUrl + "/getMe";
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function sendMessage(id, text, keyboard) {
  var data = {
    method : "post",
    payload: {
      method: "sendMessage",
      chat_id: String(id),
      text: text,
      parse_mode: "HTML",
      reply_markup: JSON.stringify(keyboard)
    }
  };
  var url = "https://api.telegram.org/bot" + token + "/";
  var response = UrlFetchApp.fetch(url, data);
  Logger.log(response.getContentText());
}

function editMessage(chat_id, message_id, text, keyboard) {
  var data = {
    method: "post",
    payload: {
      method: "editMessageText",
      chat_id: String(chat_id),
      message_id: message_id.toString(),
      text: text,
      reply_markup: JSON.stringify(keyboard)
    }
  };
  UrlFetchApp.fetch("https://api.telegram.org/bot" + token + "/", data);
}

function setWebhook() {
  var url = telegramUrl + "/setWebhook?url=" + webAppUrl;
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function sendText(chat_id, text) {
  var url = telegramUrl + "/sendMessage?chat_id=" + chat_id + "&text=" + text + "&parse_mode=Markdown";
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function doGet(e) {
  return HtmlService.createHtmlOutput("Hi there");
}

function getKeyboard() {
  let keyboard = {
    "inline_keyboard": [
    ]
  };
  var items = week.getRange(2, 1, week.getLastRow()-2, 1).getValues();
  Logger.log(week.getLastRow());
  Logger.log(items);
  for (i=0; i<items.length; i++) keyboard["inline_keyboard"].push([{"text":items[i][0], "callback_data":items[i][0]}]);
  // Logger.log(keyboard);
  return keyboard;
}

function startKeyboard() {
  let keyboard = {
    "inline_keyboard": [[{"text":"Spent", "callback_data": "Spent"}], [{"text":"Earned", "callback_data": "Earned"}]]
  };
  return keyboard;
}

function getSpendingHeaders() {
  let col = spending_source.getLastColumn();
  let headers = spending_source.getRange(1, 1, 1, col).getValues();
  return headers;
}

function spentCategoryKeyboard() {
  let keyboard = {
    "inline_keyboard" : []
  };
  let headers = getSpendingHeaders();
  // Logger.log(headers[0][1]);
  let col = spending_source.getLastColumn();
  for (let i=0; i<col; i++) keyboard["inline_keyboard"].push([{"text":headers[0][i], "callback_data":"Category"+headers[0][i]}]);
  keyboard["inline_keyboard"].push([{"text":"Add new category", "callback_data":"New Spending Category"}]);
  return keyboard;
}

function spentSourceKeyboard(category) {
  let keyboard = {
    "inline_keyboard" : []
  };
  let row = spending_source.getLastRow();
  let headers = getSpendingHeaders();
  let col = -1;
  for (let i=0; i<spending_source.getLastColumn(); i++) if (headers[0][i] == category) {col = i+1; break;}
  let spend_sources = spending_source.getRange(2, col, row, 1).getValues();
  for (let i=0; i<row; i++) {
    try {
      if (spend_sources[i][0] == "") break;
      keyboard["inline_keyboard"].push([{"text":spend_sources[i][0], "callback_data":"Source"+spend_sources[i][0]}]);
    } catch (e) {break;};
  }
  keyboard["inline_keyboard"].push([{"text":"Add new source", "callback_data":"New Spending Source"+category}]);
  Logger.log(keyboard);
  return keyboard;
}

function earningSourceKeyboard() {
  let keyboard = {
    "inline_keyboard" : []
  };
  let row = earning_source.getLastRow();
  let vals = earning_source.getRange(1, 1, row, 1).getValues();
  for (let i=0; i<row; i++) {
    if (vals[i][0] == "") break;
    keyboard["inline_keyboard"].push([{"text":vals[i][0], "callback_data":"Earning Source"+vals[i][0]}]);
  }
  keyboard["inline_keyboard"].push([{"text":"Add new source", "callback_data":"New Earning Source"}]);
  return keyboard;
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  if (data.callback_query) { // clicked button :D
    var returned = data.callback_query.data;
    // editMessage(userId, data.callback_query.message.message_id, "What are you doing? (Currently doing: " + returned + ")", getKeyboard());

    if (/New Spending Category/.test(returned)) {
      set_consts(1, 0, 0, 0);
      sendText(userId, "Enter new category name: ");
    }
    else if (/New Spending Source/.test(returned)) {
      let cat = returned.slice(19,);
      set_consts(0, cat, 0, 0, 0);
      sendText(userId, "Enter new source name: ");
    }
    else if (/New Earning Source/.test(returned)) {
      set_consts(0, 0, 0, 1, 0);
      sendText(userId, "Enter new source name: ");
    }
    else if (/Earning Source/.test(returned)) {
      let cat = returned.slice(14,);
      earning_log.getRange(earning_log.getLastRow(), 2).setValue(cat);
      set_consts(0, 0, 0, 0, 1);
      sendText(userId, "How much did you earn?");
    }
    else if (/Category/.test(returned)) {
      let cat = returned.slice(8,);
      let keyboard = spentSourceKeyboard(cat);
      let last_row = spending_log.getLastRow();
      spending_log.getRange('B'+ String(last_row)).setValue(cat);
      sendMessage(userId, "What did you spend on? (" + cat + ")", keyboard );
    }
    else if (/Source/.test(returned)) {
      let last_row = spending_log.getLastRow();
      let src = returned.slice(6,);
      spending_log.getRange('C'+String(last_row)).setValue(src);
      set_consts(0, 0, 1, 0, 0);
      sendText(userId, "How much did you spend?");
    }
    else if (/Spent/.test(returned)) {
      spending_log.getRange('A'+ String(spending_log.getLastRow()+1)).setValue(Utilities.formatDate(new Date(), "GMT+8", "dd/MM/yyyy"));
      sendMessage(userId, "What did you spend on?", spentCategoryKeyboard());
    }
    else if (/Earned/.test(returned)) {
      earning_log.getRange('A'+String(earning_log.getLastRow()+1)).setValue(Utilities.formatDate(new Date(), "GMT+8", "MM/yyyy"));
      sendMessage(userId, "Source of earnings?", earningSourceKeyboard());
    }
  }

  else if (data.message.text) {
    var text = data.message.text;

    if (/\/start/.test(text)) {
      let keyboard = startKeyboard();
      set_consts(0, 0, 0, 0, 0);
      sendMessage(userId, "What kind of expense would you like to include?", keyboard);
    }
    else if (const_sheet.getRange('B1').getValue() != 0) { // new spending category added
      spending_source.getRange(1, spending_source.getLastColumn()+1).setValue(text);
      spending_log.getRange(spending_log.getLastRow(), 2).setValue(text);
      set_consts(0, text, 0, 0, 0);
      sendText(userId, "Write new source name");
    }
    else if (const_sheet.getRange('B2').getValue() != 0) { // new spending source added
      let cat = const_sheet.getRange('B2').getValue();
      let headers = getSpendingHeaders();
      let src_col = -1;
      for (let i=0; i<spending_source.getLastColumn(); i++) {
        if (headers[0][i] == cat) {
          src_col = i+1; break;
        } 
      }
      let row = 2;
      while (1) {
        if (spending_source.getRange(row, src_col).getValue() != "") row = row + 1;
        else break;
      }
      spending_source.getRange(row, src_col).setValue(text);
      spending_log.getRange(spending_log.getLastRow(), 3).setValue(text);
      set_consts(0, 0, 1, 0, 0);
      sendText(userId, "Enter cost: ");
    }
    else if (const_sheet.getRange('B3').getValue() != 0) { // adding amount spent
      spending_log.getRange('D'+String(spending_log.getLastRow())).setValue(text);
      set_consts(0, 0, 0, 0, 0);
      sendText(userId, "Done!");
    }
    else if (const_sheet.getRange('B4').getValue() != 0) { // new earning source added
      earning_source.getRange(earning_source.getLastRow()+1, 1).setValue(text);
      earning_log.getRange('B'+String(earning_log.getLastRow())).setValue(text);
      set_consts(0, 0, 0, 0, 1);
      sendText(userId, "How much did you earn?");
    }
    else if (const_sheet.getRange('B5').getValue() != 0) { // adding amount earned
      earning_log.getRange('C'+String(earning_log.getLastRow())).setValue(text);
      set_consts(0, 0, 0, 0, 0);
      sendText(userId, "Done!");
    }
  }
}