// ===============================
// Kindle ノートページの情報抽出
// ===============================

// 1冊分のハイライトを取得
function getHighlights() {
  const items = [];
  document.querySelectorAll('.kp-notebook-highlight').forEach((el) => {
    const text = el.innerText.trim();
    if (text) items.push(text);
  });
  return items;
}

// 現在表示中の本のタイトル
function getBookTitles(asin) {
  // 各本を表す要素を取得
  const bookEl = document.getElementById(asin);
  if (!bookEl) return "タイトル不明";

  // タイトル部分を探す（HTML構造に応じて調整）
  const titleEl = bookEl.querySelector(".kp-notebook-searchable, h2, .a-text-bold");
  return titleEl ? titleEl.innerText.trim() : "タイトル不明";
}


// ノートページに表示されている全ての本のASIN一覧を取得
function getAllBookASINs() {
  const books = document.querySelectorAll('.kp-notebook-library-each-book');
  return Array.from(books).map(book => book.id);
}

// ハイライトがロードされるまで待つ
async function waitForHighlights() {
  return new Promise((resolve) => {
    const observer = new MutationObserver((mutations) => {
      if (document.querySelector('.kp-notebook-highlight')) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}


// 複数本分のハイライトを順に取得
async function getAllHighlights() {
  const asins = getAllBookASINs();
  const results = [];

  for (const asin of asins) {
    const bookEl = document.getElementById(asin);
    if (!bookEl) continue;

    // 本をクリックしてハイライトをロード
    const link = bookEl.querySelector("a");
    if (link) link.click();

    // ページのハイライトがロードされるまで待機
    await waitForHighlights();

    const title = getBookTitles(asin);
    const highlights = getHighlights();
    results.push({ asin, title, highlights });
  }

  return results;
}

// ===============================
// popup.js からのリクエストを受け取る
// ===============================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📩 popupから受信:", message);

  if (message.action === "getHighlights") {
    (async () => {
      const books = await getAllHighlights();
      console.log("✅ 取得結果:", books);
      sendResponse({ books });
    })();
    return true; // ← 非同期処理を待つために必要
  }
});
