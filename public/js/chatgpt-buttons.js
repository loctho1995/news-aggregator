// public/js/chatgpt-buttons.js
(function(){
  function openChatGPTWithPrompt(prompt) {
    try {
      const encoded = encodeURIComponent(prompt.trim());
      const urlCandidates = [
        `https://chatgpt.com/?q=${encoded}`,
        `https://chat.openai.com/?q=${encoded}`
      ];
      let opened = false;
      for (const u of urlCandidates) {
        const w = window.open(u, "_blank", "noopener,noreferrer");
        if (w && !w.closed) {
          opened = true;
          break;
        }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(prompt).catch(() => {});
      }
      if (!opened) {
        alert("Không mở được ChatGPT tự động. Prompt đã được copy — hãy dán vào ChatGPT nhé.");
      }
    } catch (e) {
      console.error("openChatGPTWithPrompt error:", e);
      alert("Không mở được ChatGPT. Vui lòng thử lại.");
    }
  }

  const prompts = {
    security: "tổng hợp và tóm tắt đầy đủ các ý chính về các tin tức trong 7 ngày gần đây từ tất cả các bài báo, blog liên quan tới bảo mật trên thế giới. có đính kèm link bài báo và ngày tháng của tin tức",
    engineering: "tổng hợp và tóm tắt đầy đủ các ý chính về các tin tức trong 7 ngày gần đây từ tất cả các bài báo, blog liên quan tới engine lập trình, phần mềm mới, framework, open source, tool kit, ngôn ngữ lập trình, kĩ thuật lập trình mới trên thế giới. Có đính kèm link bài báo và ngày tháng của tin tức",
    game: "tổng hợp và tóm tắt đầy đủ các ý chính về các tin tức trong 7 ngày gần đây từ tất cả các bài báo, blog liên quan tới ngành công nghiệp game, engine lập trình game, kĩ thuật lập trình game. Có đính kèm link bài báo và ngày tháng của tin tức"
  };

  function bind(id, promptKey) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", () => openChatGPTWithPrompt(prompts[promptKey]));
  }

  function init() {
    bind("btn-security", "security");
    bind("btn-engine", "engineering");
    bind("btn-game", "game");
  }

  window.initChatGPTHeaderButtons = init;

  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(init, 0);
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
