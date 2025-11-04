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
    const titleElement = document.getElementById("book-title");
    const asin = document.getElementById("asin");
    asin.innerHTML = "";
    container.innerHTML = "";
    titleElement.textContent = "";

    if (response?.highlights?.length) {
      titleElement.textContent = response.title;
      response.highlights.forEach((t) => {
        const div = document.createElement("div");
        div.className = "highlight";
        div.textContent = t;
        container.appendChild(div);
      });
      response.asin.forEach((el => {
        const tmp = document.createElement("div");
        tmp.className = "asin";
        tmp.textContent = el;
        asin.appendChild(tmp);
      }));
    } else {
      container.textContent = "ハイライトが見つかりません。";
    }
  });
});
