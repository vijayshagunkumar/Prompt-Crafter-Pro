// Utility functions
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function updateStats(text, charElId, wordElId, lineElId) {
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lineCount = text.split("\n").length;

  try {
    const charEl = document.getElementById(charElId);
    const wordEl = document.getElementById(wordElId);
    const lineEl = document.getElementById(lineElId);
    
    if (charEl) charEl.textContent = `${charCount} characters`;
    if (wordEl) wordEl.textContent = `${wordCount} words`;
    if (lineEl) lineEl.textContent = `${lineCount} lines`;
  } catch (error) {
    console.log('Stats elements not found - ignoring');
  }
}

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text)
    .then(() => true)
    .catch(err => {
      console.error('Failed to copy:', err);
      return false;
    });
}

export function downloadFile(filename, content, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function truncateText(text, maxLength = 80) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
