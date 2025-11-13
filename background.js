// background.js (MV3 service worker)

// --- 設定 ---
const ALARM_NAME = "fetchKindleHighlights";
const PERIOD_MINUTES = 30; // 例: 30分ごとに取得（適宜変更）
const TARGET_URL_MATCH = "*://read.amazon.co.jp/notebook*"; // tabs.query の url マッチパターン

// ユーティリティ：ログ（service worker のコンソールに出る）
function log(...args) {
  console.log("[background]", ...args);
}

// 初回登録：起動時にアラームを作成（既になければ）
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: PERIOD_MINUTES });
  log(`Alarm created: ${ALARM_NAME}, period ${PERIOD_MINUTES} min`);
});

// ブラウザ再起動・拡張再読み込み時もアラームが存在しない場合に備える
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.get(ALARM_NAME, (alarm) => {
    if (!alarm) {
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: PERIOD_MINUTES });
      log(`Alarm recreated at startup: ${ALARM_NAME}`);
    } else {
      log(`Alarm exists at startup: ${ALARM_NAME}`);
    }
  });
});

// アラーム発火時の処理
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  log("Alarm fired — starting fetch flow");

  try {
    // タブを探す（該当の notebook ページが開かれているタブ）
    const tabs = await chrome.tabs.query({ url: TARGET_URL_MATCH });
    if (!tabs || tabs.length === 0) {
      log("No kindle notebook tab open. Skipping this run.");
      return;
    }

    // 複数タブが開かれている可能性があるので、先頭のタブを使う（必要ならループ可）
    const tab = tabs[0];
    log("Found notebook tab:", tab.id, tab.url);

    // content script にメッセージ送信してハイライト取得を依頼
    chrome.tabs.sendMessage(tab.id, { action: "getHighlights" }, (response) => {
      if (chrome.runtime.lastError) {
        log("sendMessage error:", chrome.runtime.lastError.message);
        // ここでフォールバック (scripting.executeScript) を試すことも可能
        return;
      }

      if (!response || !response.books) {
        log("No books returned from content script. Response:", response);
        return;
      }

      log(`Received ${response.books.length} books from content script`);

      // 受け取ったデータを storage に保存（最新1回分）
      chrome.storage.local.set({ latestHighlights: response.books, lastFetchedAt: Date.now() }, () => {
        log("Saved latestHighlights to chrome.storage.local");
      });

      // 必要ならここで外部APIやGASにPOSTしてスプレッドシートへ送信する処理を挟む
      // sendToGAS(response.books).catch(e => log("GAS send failed", e));
    });
  } catch (err) {
    log("Unexpected error in alarm handler:", err);
  }
});
