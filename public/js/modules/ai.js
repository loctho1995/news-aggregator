// public/js/modules/ai.js
// Mở ChatGPT với prompt tóm tắt bài báo và hiển thị thông báo nhỏ

export function openAISummary(title, link) {
  if (!link) return;

  const prompt = `Tóm tắt bài viết: ${link}`;
  const encodedPrompt = encodeURIComponent(prompt);
  const chatGPTUrl = `https://chat.openai.com/?q=${encodedPrompt}`;

  // Thông báo nổi nhỏ (2s)
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white rounded-lg shadow-lg flex items-center gap-2';
  notification.innerHTML = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
    </svg>
    <span>Đang mở ChatGPT với nội dung...</span>
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 2000);

  window.open(chatGPTUrl, '_blank');
  try { navigator.clipboard.writeText(prompt); } catch {}
}
