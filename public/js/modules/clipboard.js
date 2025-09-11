// public/js/modules/clipboard.js
// Copy text vào clipboard + toast thông báo nhỏ

export async function copyText(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast("Đã copy link bài báo.");
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      showToast("Đã copy link bài báo.");
    } catch {
      showToast("Không copy được. Hãy copy thủ công.");
    } finally {
      document.body.removeChild(ta);
    }
  }
}

export function showToast(message) {
  const el = document.createElement('div');
  el.className = 'fixed top-4 right-4 z-50 max-w-sm px-4 py-2 bg-gray-900 text-white rounded-lg shadow-lg';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}
