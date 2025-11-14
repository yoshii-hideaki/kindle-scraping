const ALARM_NAME = "highlightFetch";

// 初回・起動時にアラームを登録
chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ Extension installed. Creating alarm (30秒ごと)");
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 0.5 });
});

chrome.runtime.onStartup.addListener(() => {
  console.log("🚀 Chrome起動時にアラーム再登録");
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 0.5 });
});

// アラーム発火時の処理
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  console.log("⏰ Alarm fired at", new Date().toLocaleTimeString());

  // Kindleノートページのタブを探す
  const tabs = await chrome.tabs.query({ url: "https://read.amazon.co.jp/notebook*" });
  if (tabs.length === 0) {
    console.log("⚠️ Kindleノートページが開いていません。処理をスキップ。");
    return;
  }

  const tab = tabs[0]; // 最初のノートページを対象
  console.log("📤 メッセージ送信 to content.js");

  // content.js にハイライト取得リクエストを送信
  chrome.tabs.sendMessage(tab.id, { action: "getHighlights" }, (response) => {
    if (chrome.runtime.lastError) {
      console.log("⚠️ エラー:", chrome.runtime.lastError.message);
      return;
    }
    console.log("📚 取得結果:", response?.books);
  });
});
