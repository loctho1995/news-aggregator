// public/js/modules/enhance-ai-copy.js
// HOTFIX: tự chèn nút Copy vào popup tóm tắt nếu chưa có (#modalCopyBtn)

import { openAISummary } from './ai.js';
import { copyText, showToast } from './clipboard.js';

/** Utils **/
function q(sel, root=document){ return root.querySelector(sel); }
function qa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

function findArticleLinkInCard(card) {
  const aOpen = card.querySelector('a[data-role="open-link"], a.source-link, a[href^="http"]');
  if (aOpen && aOpen.href) return aOpen.href;
  if (card.dataset && card.dataset.link) return card.dataset.link;
  const ds = card.dataset || {};
  for (const k of Object.keys(ds)) {
    const v = ds[k];
    if (typeof v === 'string' && v.startsWith('http')) return v;
  }
  return null;
}

function ensureCopyBtnInCard(card) {
  let copyBtn = card.querySelector('.copy-link-btn');
  if (!copyBtn) {
    let actions = card.querySelector('.card-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'card-actions';
      card.appendChild(actions);
    }
    copyBtn = document.createElement('button');
    copyBtn.className = 'copy-link-btn btn btn-secondary';
    copyBtn.title = 'Copy link bài báo';
    copyBtn.setAttribute('aria-label', 'Copy link');
    copyBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span>Copy</span>
    `;
    actions.appendChild(copyBtn);
  }
  return copyBtn;
}

function bindCardHandlers(card) {
  const link = findArticleLinkInCard(card);
  const aiBtn = card.querySelector('.ai-summary-btn, .btn-ai-summary');
  if (aiBtn && link) {
    aiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const titleEl = card.querySelector('.title, h3, h2');
      const title = titleEl ? (titleEl.textContent || '').trim() : '';
      openAISummary(title, link);
    });
  }
  const copyBtn = ensureCopyBtnInCard(card);
  if (copyBtn && link) {
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyText(link);
    });
  }
}

function scanAllCards() { qa('.news-card').forEach(bindCardHandlers); }

function setupCardsObserver() {
  const root = q('#newsList, .news-list, main, body') || document.body;
  const obs = new MutationObserver(() => scanAllCards());
  obs.observe(root, { childList: true, subtree: true });
  scanAllCards();
}

/** Modal (popup tóm tắt) **/
function getModalEl() { return q('#summaryModal, .summary-modal') || document.body; }
function getModalLink() {
  const openLink = q('#modalOpenLink, a#modalOpenLink');
  if (openLink && openLink.href) return openLink.href;
  const modal = getModalEl();
  const attr = modal.getAttribute && modal.getAttribute('data-link');
  return attr || null;
}
function getModalTitle() {
  const t = q('#modalTitle, .modal-title, .summary-title');
  return t ? (t.textContent || '').trim() : '';
}

function ensureModalCopyBtn() {
  let cp = q('#modalCopyBtn');
  if (!cp) {
    // cố gắng đặt cạnh nút AI nếu có
    const ai = q('#modalAIBtn');
    const btn = document.createElement('button');
    btn.id = 'modalCopyBtn';
    btn.className = 'btn btn-secondary';
    btn.title = 'Copy link bài báo';
    btn.setAttribute('aria-label', 'Copy link');
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span>Copy</span>
    `;
    if (ai && ai.parentElement) {
      ai.parentElement.insertBefore(btn, ai.nextSibling);
    } else {
      // nếu không có AI button, thêm vào footer của modal nếu tìm thấy
      const footer = q('.modal-footer, #modalFooter, .summary-footer') || getModalEl();
      footer.appendChild(btn);
    }
    cp = btn;
  }
  return cp;
}

function bindModalButtons() {
  const link = getModalLink();
  const title = getModalTitle();
  const ai = q('#modalAIBtn');
  if (ai && link) {
    ai.onclick = (e) => { e?.stopPropagation?.(); openAISummary(title, link); };
  }
  const cp = ensureModalCopyBtn();
  if (cp && link) {
    cp.onclick = (e) => { e?.stopPropagation?.(); copyText(link); };
  }
}

function setupModalObserver() {
  const target = getModalEl();
  const obs = new MutationObserver(() => bindModalButtons());
  obs.observe(target, { attributes: true, childList: true, subtree: true });
  bindModalButtons();
}

/** Styles **/
function injectBasicButtonStyles() {
  if (document.getElementById('ai-copy-basic-css')) return;
  const style = document.createElement('style');
  style.id = 'ai-copy-basic-css';
  style.textContent = `
    .btn { display:inline-flex; align-items:center; gap:.4rem; padding:.4rem .6rem; border-radius:.5rem; border:1px solid #e5e7eb; background:#fff; cursor:pointer; }
    .btn:hover { background:#f3f4f6; }
    .btn-secondary { color:#111827; }
    .btn svg { width:18px; height:18px; }
    .card-actions { display:flex; flex-wrap:wrap; gap:.5rem; align-items:center; }
  `;
  document.head.appendChild(style);
}

/** Init **/
function init() {
  injectBasicButtonStyles();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupCardsObserver();
      setupModalObserver();
    });
  } else {
    setupCardsObserver();
    setupModalObserver();
  }
}
init();
