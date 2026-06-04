import { useMemo } from 'react';

interface Props {
  content: string;
  className?: string;
}

function parseMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) =>
      `<img src="${src}" alt="${alt}" class="md-img" />`
    )
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) =>
      `<a href="${href}" target="_blank" rel="noopener noreferrer" class="md-link">${label}</a>`
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="md-li">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul class="md-ul">${match}</ul>`)
    .replace(/\n/g, '<br />');
}

export default function MarkdownRenderer({ content, className = '' }: Props) {
  const html = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div
      className={`md-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
