// public/js/modules/ai.js
// Fixed version with better error handling and UI safety

export function openAISummary(title, link) {
  // Validate inputs
  if (!link || typeof link !== 'string') {
    console.warn('Invalid link provided to openAISummary:', link);
    return false;
  }

  try {
    // Create prompt
    const prompt = `Tóm tắt bài viết: ${link}`;
    const encodedPrompt = encodeURIComponent(prompt);
    const chatGPTUrl = `https://chat.openai.com/?q=${encodedPrompt}`;

    // Show notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white rounded-lg shadow-lg flex items-center gap-2 transition-all';
    notification.style.zIndex = '10000'; // Ensure it's above everything
    notification.innerHTML = `
      <svg class="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
      </svg>
      <span>Đang mở ChatGPT...</span>
    `;
    document.body.appendChild(notification);

    // Try to open window
    const newWindow = window.open(chatGPTUrl, '_blank', 'noopener,noreferrer');
    
    // Check if window was blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Popup was blocked, show error and fallback
      notification.innerHTML = `
        <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <span>Popup bị chặn! Đang copy link...</span>
      `;
      
      // Copy link as fallback
      copyToClipboard(chatGPTUrl);
      
      // Show instructions
      setTimeout(() => {
        notification.innerHTML = `
          <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Đã copy link! Paste vào trình duyệt.</span>
        `;
      }, 500);
      
      // Remove notification after longer delay
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
      }, 3500);
    } else {
      // Success - remove notification quickly
      notification.innerHTML = `
        <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>Đã mở ChatGPT!</span>
      `;
      
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
      }, 1500);
    }

    // Try to copy prompt to clipboard (silent fail if blocked)
    try {
      navigator.clipboard.writeText(prompt).catch(() => {
        // Silently fail if clipboard access is denied
      });
    } catch {
      // Fallback for older browsers
    }

    return true;
  } catch (error) {
    console.error('Error in openAISummary:', error);
    
    // Show error notification
    const errorNotification = document.createElement('div');
    errorNotification.className = 'fixed top-4 right-4 z-50 px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg';
    errorNotification.style.zIndex = '10000';
    errorNotification.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <span>Có lỗi xảy ra!</span>
      </div>
    `;
    document.body.appendChild(errorNotification);
    
    setTimeout(() => {
      errorNotification.style.opacity = '0';
      setTimeout(() => errorNotification.remove(), 300);
    }, 2000);
    
    return false;
  }
}

// Helper function to copy to clipboard with fallback
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    // Modern way
    navigator.clipboard.writeText(text).catch(err => {
      console.warn('Clipboard API failed:', err);
      fallbackCopy(text);
    });
  } else {
    // Fallback
    fallbackCopy(text);
  }
}

// Fallback copy method
function fallbackCopy(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.top = '-9999px';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  
  try {
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
  } catch (err) {
    console.error('Fallback copy failed:', err);
  } finally {
    document.body.removeChild(textArea);
  }
}