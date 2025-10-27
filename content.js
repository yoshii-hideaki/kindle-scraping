// Kindleのノートページからハイライトを抽出
function getHighlights() {
  const items = [];
  // Kindleのハイライト部分のDOMを取得
  document.querySelectorAll('.kp-notebook-highlight').forEach((el) => {
    const text = el.innerText.trim();
    if (text) items.push(text);
  });
  return items;
}

function getBookTitle() {
  const titleElement = document.querySelector('.kp-notebook-searchable');
  return titleElement ? titleElement.innerText.trim() : 'タイトル不明';
}

// popupからのメッセージに応答
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getHighlights") {
    sendResponse({
      title: getBookTitle(),
      highlights: getHighlights(),
    });
  }
});
