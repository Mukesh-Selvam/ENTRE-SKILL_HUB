/** Simple inline markdown: **bold** and line breaks */
export function renderMarkdown(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return <p key={i} className={i > 0 ? 'mt-1' : ''}>{parts}</p>;
  });
}

/** Returns true if the nav link should appear active (exact or prefix match) */
export function isNavActive(pathname, to) {
  if (to === '/') return pathname === '/';
  return pathname === to || pathname.startsWith(`${to}/`);
}
