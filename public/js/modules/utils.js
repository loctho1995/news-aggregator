// Utility functions

export function timeAgo(iso) {
  if (!iso) return "";
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now - then;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays} ngày trước`;
  if (diffHours > 0) return `${diffHours} giờ trước`;
  return "vừa xong";
}

export function truncate(text, maxLength = 500) {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
}

export function itemPassesFilters(item, filters) {
  if (filters.group && item.group !== filters.group) return false;
  if (filters.sources.length && !filters.sources.includes(item.sourceId)) return false;
  
  if (filters.query) {
    const query = filters.query.toLowerCase();
    const titleMatch = item.title && item.title.toLowerCase().includes(query);
    const summaryMatch = item.summary && item.summary.toLowerCase().includes(query);
    if (!titleMatch && !summaryMatch) return false;
  }
  
  return true;
}
