/**
 * Shared markdown → HTML renderer used across the platform.
 * Handles: headers, bold, italic, code, links, lists, blockquotes, hr.
 * Safe: HTML-escapes the input before processing.
 */

function applyInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

export function renderMarkdown(text) {
  if (!text) return '';

  // Escape HTML special chars first
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = escaped.split('\n');
  let html = '';
  let inUl = false;
  let inOl = false;

  const closeList = () => {
    if (inUl) { html += '</ul>'; inUl = false; }
    if (inOl) { html += '</ol>'; inOl = false; }
  };

  for (const line of lines) {
    // Headers — h3/h4/h5 to keep size sensible in context
    if (line.startsWith('### ')) { closeList(); html += `<h5 class="md-h3">${applyInline(line.slice(4))}</h5>`; continue; }
    if (line.startsWith('## '))  { closeList(); html += `<h4 class="md-h2">${applyInline(line.slice(3))}</h4>`; continue; }
    if (line.startsWith('# '))   { closeList(); html += `<h4 class="md-h1">${applyInline(line.slice(2))}</h4>`; continue; }

    // Unordered list
    if (/^[-*•] /.test(line)) {
      if (inOl) { html += '</ol>'; inOl = false; }
      if (!inUl) { html += '<ul>'; inUl = true; }
      html += `<li>${applyInline(line.replace(/^[-*•] /, ''))}</li>`;
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (olMatch) {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (!inOl) { html += '<ol>'; inOl = true; }
      html += `<li>${applyInline(olMatch[2])}</li>`;
      continue;
    }

    closeList();

    // Horizontal rule
    if (/^---+$/.test(line.trim())) { html += '<hr class="md-hr">'; continue; }

    // Blockquote
    if (line.startsWith('&gt; ')) { html += `<blockquote class="md-quote">${applyInline(line.slice(5))}</blockquote>`; continue; }

    // Empty line → spacing
    if (line.trim() === '') { html += '<div class="md-spacer"></div>'; continue; }

    // Regular paragraph
    html += `<p>${applyInline(line)}</p>`;
  }

  closeList();
  return html;
}
