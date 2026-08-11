import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/shared/hooks/use-theme';

const MarkdownIt = require('markdown-it');

// ── Markdown-It instance with full features ───────────────────────────
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

// ── LaTeX pre-processing (before markdown-it parses) ──────────────────
// Protects math delimiters from markdown-it mangling them.

function escapeMathBlocks(text: string): string {
  if (!text) return '';

  // Protect display math: $$ ... $$ and \[ ... \]
  let result = text.replace(/(\$\$[\s\S]*?\$\$)/g, (match) => {
    const inner = match.slice(2, -2).trim();
    return `<div class="math-display" data-math="${encodeURIComponent(inner)}"></div>`;
  });

  result = result.replace(/(\\)\[[\s\S]*?\\]/g, (match) => {
    const inner = match.slice(2, -2).trim();
    return `<div class="math-display" data-math="${encodeURIComponent(inner)}"></div>`;
  });

  // Protect inline math: $ ... $ (not $$) and \( ... \)
  result = result.replace(/(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g, (_match, inner) => {
    return `<span class="math-inline" data-math="${encodeURIComponent(inner.trim())}"></span>`;
  });

  result = result.replace(/\\\([\s\S]*?\\\)/g, (match) => {
    const inner = match.slice(2, -2).trim();
    return `<span class="math-inline" data-math="${encodeURIComponent(inner)}"></span>`;
  });

  return result;
}

// ── Auto-height injection script ──────────────────────────────────────
const AUTO_HEIGHT_SCRIPT = `
  (function() {
    var lastHeight = 0;
    function postHeight() {
      var h = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        document.documentElement.offsetHeight
      );
      if (h !== lastHeight && h > 0) {
        lastHeight = h;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', value: h }));
      }
    }

    // Render KaTeX math elements after DOM ready
    function renderMath() {
      if (typeof katex === 'undefined') return;
      document.querySelectorAll('.math-display[data-math]').forEach(function(el) {
        try {
          katex.render(decodeURIComponent(el.getAttribute('data-math')), el, {
            displayMode: true,
            throwOnError: false,
            output: 'html',
            strict: false,
          });
        } catch(e) {
          el.textContent = decodeURIComponent(el.getAttribute('data-math'));
        }
      });
      document.querySelectorAll('.math-inline[data-math]').forEach(function(el) {
        try {
          katex.render(decodeURIComponent(el.getAttribute('data-math')), el, {
            displayMode: false,
            throwOnError: false,
            output: 'html',
            strict: false,
          });
        } catch(e) {
          el.textContent = decodeURIComponent(el.getAttribute('data-math'));
        }
      });
    }

    function init() {
      renderMath();
      postHeight();
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(init, 0);
    } else {
      document.addEventListener('DOMContentLoaded', init);
    }
    window.addEventListener('load', function() { renderMath(); postHeight(); });

    // Observe for late renders
    if (window.MutationObserver) {
      new MutationObserver(function() { setTimeout(postHeight, 50); })
        .observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    setTimeout(postHeight, 200);
    setTimeout(postHeight, 600);
    setTimeout(postHeight, 1200);
  })();
  true;
`;

// ── HTML template builder ─────────────────────────────────────────────
function buildHtml(renderedMarkdown: string, isDark: boolean): string {
  const bg = isDark ? '#09090B' : '#FFFFFF';
  const text = isDark ? '#E4E4E7' : '#27272A';
  const textMuted = isDark ? '#A1A1AA' : '#71717A';
  const textStrong = isDark ? '#FAFAFA' : '#09090B';
  const border = isDark ? '#27272A' : '#E4E4E7';
  const borderLight = isDark ? '#1E1E22' : '#F4F4F5';
  const codeBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  const codeBlockBg = isDark ? '#18181B' : '#0F0F11';
  const blockquoteBorder = isDark ? '#F97316' : '#F97316';
  const blockquoteBg = isDark ? 'rgba(249,115,22,0.06)' : 'rgba(249,115,22,0.04)';
  const tableBg = isDark ? '#18181B' : '#F9FAFB';
  const tableStripeBg = isDark ? '#1A1A1F' : '#F4F4F5';
  const accent = '#F97316';
  const linkColor = isDark ? '#FB923C' : '#EA580C';
  const mathBg = isDark ? 'rgba(249,115,22,0.08)' : 'rgba(249,115,22,0.05)';
  const mathBorder = isDark ? 'rgba(249,115,22,0.2)' : 'rgba(249,115,22,0.15)';
  const mathColor = isDark ? '#FDBA74' : '#C2410C';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      background: transparent;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13.5px;
      line-height: 1.72;
      color: ${text};
      -webkit-text-size-adjust: 100%;
      -webkit-font-smoothing: antialiased;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    /* ── Headings ── */
    h1, h2, h3, h4, h5, h6 {
      font-weight: 700;
      color: ${textStrong};
      margin-top: 1.4em;
      margin-bottom: 0.5em;
      line-height: 1.35;
    }
    h1 { font-size: 1.35rem; font-weight: 800; }
    h2 { font-size: 1.15rem; padding-bottom: 0.3em; border-bottom: 1px solid ${border}; }
    h3 { font-size: 1rem; color: ${accent}; }
    h4 { font-size: 0.92rem; font-weight: 600; }
    h5 { font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: ${textMuted}; }
    h6 { font-size: 0.82rem; font-weight: 600; color: ${textMuted}; }
    h1:first-child, h2:first-child, h3:first-child { margin-top: 0; }

    /* ── Paragraphs ── */
    p { margin: 0.65em 0; }
    p:first-child { margin-top: 0; }
    p:last-child { margin-bottom: 0; }

    /* ── Bold / Italic / Strikethrough ── */
    strong { font-weight: 700; color: ${textStrong}; }
    em { font-style: italic; }
    del, s { text-decoration: line-through; color: ${textMuted}; }
    mark { background: rgba(249,115,22,0.2); color: ${textStrong}; padding: 1px 4px; border-radius: 3px; }

    /* ── Links ── */
    a { color: ${linkColor}; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }

    /* ── Lists ── */
    ul, ol { padding-left: 1.5em; margin: 0.6em 0; }
    li { margin-bottom: 0.35em; }
    li > p { margin: 0.25em 0; }
    li::marker { color: ${accent}; font-weight: 600; }
    ul ul, ol ol, ul ol, ol ul { margin: 0.25em 0; }

    /* ── Task lists (GitHub style) ── */
    li.task-list-item { list-style: none; margin-left: -1.5em; }
    li.task-list-item input[type="checkbox"] {
      margin-right: 0.5em;
      accent-color: ${accent};
    }

    /* ── Blockquotes ── */
    blockquote {
      margin: 0.8em 0;
      padding: 0.6em 1em;
      border-left: 3px solid ${blockquoteBorder};
      background: ${blockquoteBg};
      border-radius: 0 6px 6px 0;
      color: ${textMuted};
    }
    blockquote p { margin: 0.3em 0; }
    blockquote blockquote { margin-left: 0; border-left-color: ${border}; }

    /* ── Inline code ── */
    code {
      font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
      font-size: 0.82em;
      background: ${codeBg};
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
      word-break: break-word;
    }

    /* ── Fenced code blocks ── */
    pre {
      background: ${codeBlockBg};
      color: #34D399;
      padding: 14px 16px;
      border-radius: 10px;
      margin: 0.8em 0;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      border: 1px solid ${isDark ? '#27272A' : '#E5E5E5'};
    }
    pre code {
      background: none;
      padding: 0;
      color: inherit;
      font-size: 0.82em;
      line-height: 1.65;
      border-radius: 0;
    }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
      font-size: 0.88em;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid ${border};
    }
    thead { background: ${tableBg}; }
    th {
      padding: 10px 14px;
      text-align: left;
      font-weight: 700;
      font-size: 0.82em;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: ${accent};
      border-bottom: 2px solid ${border};
    }
    td {
      padding: 9px 14px;
      border-bottom: 1px solid ${borderLight};
      vertical-align: top;
    }
    tr:nth-child(even) { background: ${tableStripeBg}; }
    tr:last-child td { border-bottom: none; }

    /* ── Horizontal rules ── */
    hr {
      border: none;
      border-top: 1px solid ${border};
      margin: 1.5em 0;
    }

    /* ── Images ── */
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 0.8em 0;
    }

    /* ── Definition lists ── */
    dl { margin: 0.8em 0; }
    dt { font-weight: 700; color: ${textStrong}; margin-top: 0.6em; }
    dd { margin-left: 1.5em; margin-bottom: 0.4em; color: ${textMuted}; }

    /* ── Footnotes ── */
    .footnote-ref { font-size: 0.75em; vertical-align: super; color: ${accent}; }
    .footnotes { font-size: 0.85em; margin-top: 2em; border-top: 1px solid ${border}; padding-top: 1em; color: ${textMuted}; }

    /* ── KaTeX math rendering ── */
    .math-display {
      margin: 0.8em 0;
      padding: 10px 14px;
      background: ${mathBg};
      border: 1px solid ${mathBorder};
      border-radius: 8px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      text-align: center;
    }
    .math-display .katex-display {
      margin: 0;
      padding: 0;
      overflow-x: auto;
    }
    .math-display .katex { color: ${mathColor}; font-size: 1.05em; }

    .math-inline .katex { color: ${mathColor}; font-size: 0.95em; }

    /* ── Admonitions (> **Note:** or > ⚠️) ── */
    blockquote > p > strong:first-child {
      color: ${accent};
    }

    /* ── Abbreviations ── */
    abbr { text-decoration: underline dotted; cursor: help; }

    /* ── Superscript / Subscript ── */
    sup { font-size: 0.75em; vertical-align: super; }
    sub { font-size: 0.75em; vertical-align: sub; }

    /* ── Selection color ── */
    ::selection { background: rgba(249,115,22,0.3); }
  </style>
</head>
<body>
  <div id="content">${renderedMarkdown}</div>
</body>
</html>`;
}

// ── Component ─────────────────────────────────────────────────────────
export interface ScientificMarkdownProps {
  content: string;
  isDark?: boolean;
}

export const ScientificMarkdown = React.memo(function ScientificMarkdown({
  content,
  isDark: isDarkProp,
}: ScientificMarkdownProps) {
  const { colorScheme } = useTheme();
  const isDark = isDarkProp ?? colorScheme === 'dark';
  const [height, setHeight] = useState(40);

  const htmlContent = useMemo(() => {
    // 1. Protect math delimiters from markdown-it mangling
    const withProtectedMath = escapeMathBlocks(content);
    // 2. Render markdown
    const renderedHtml = md.render(withProtectedMath);
    // 3. Build full HTML page
    return buildHtml(renderedHtml, isDark);
  }, [content, isDark]);

  return (
    <View style={{ height: Math.max(height, 24), width: '100%' }}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        injectedJavaScript={AUTO_HEIGHT_SCRIPT}
        onMessage={(event) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.type === 'height' && typeof msg.value === 'number' && msg.value > 0) {
              setHeight(msg.value + 2);
            }
          } catch {
            // Fallback: plain number (legacy)
            const n = Number(event.nativeEvent.data);
            if (!isNaN(n) && n > 0) setHeight(n + 2);
          }
        }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        style={{ backgroundColor: 'transparent', opacity: 0.99 }}
      />
    </View>
  );
});
