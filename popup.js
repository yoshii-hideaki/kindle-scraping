document.getElementById("load").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Kindleノートページでのみ実行
  if (!tab.url.includes("read.amazon.co.jp/notebook")) {
    document.getElementById("result").textContent =
      "Kindleノートページを開いてください。";
    return;
  }

  // content script にメッセージを送信
  chrome.tabs.sendMessage(tab.id, { action: "getHighlights" }, (response) => {
    const container = document.getElementById("result");
    container.innerHTML = "";

    if (!response?.books?.length) {
      container.textContent = "ハイライトが見つかりません。";
      return;
    }

    response.books.forEach((book) => {
      // タイトル部分
      const titleDiv = document.createElement("div");
      titleDiv.style.marginTop = "12px";
      titleDiv.style.fontWeight = "bold";
      titleDiv.textContent = `${book.title} (${book.asin})`;
      container.appendChild(titleDiv);

      // 各ハイライト
      book.highlights.forEach((text) => {
        const hl = document.createElement("div");
        hl.className = "highlight";
        hl.textContent = text;
        container.appendChild(hl);
      });
    });
  });
});
