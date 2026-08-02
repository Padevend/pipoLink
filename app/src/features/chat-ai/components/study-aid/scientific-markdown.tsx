import katex from 'katex';
import MarkdownIt from 'markdown-it';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
});

const KATEX_CSS = `
.katex{font:normal 1.15em KaTeX_Main,Times New Roman,serif;line-height:1.2;position:relative;text-indent:0;text-rendering:auto}.katex *{-ms-high-contrast-adjust:none!important;border-color:currentColor}.katex .katex-version:after{content:"0.18.1"}.katex .katex-mathml{border:0;-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;overflow:hidden;padding:0;position:absolute;width:1px}.katex .katex-html>.katex-newline{display:block}.katex .katex-base{position:relative;white-space:nowrap;width:-webkit-min-content;width:-moz-min-content;width:min-content}.katex .katex-base,.katex .katex-strut{display:inline-block}.katex .textbf{font-weight:700}.katex .textit{font-style:italic}.katex .textrm{font-family:KaTeX_Main}.katex .textsf{font-family:KaTeX_SansSerif}.katex .texttt{font-family:KaTeX_Typewriter}.katex .mathnormal{font-family:KaTeX_Math;font-style:italic}.katex .mathit{font-family:KaTeX_Main;font-style:italic}.katex .mathrm{font-style:normal}.katex .mathbf{font-family:KaTeX_Main;font-weight:700}.katex .boldsymbol{font-family:KaTeX_Math;font-style:italic;font-weight:700}.katex .amsrm,.katex .mathbb,.katex .textbb{font-family:KaTeX_AMS}.katex .mathcal{font-family:KaTeX_Caligraphic}.katex .mathfrak,.katex .textfrak{font-family:KaTeX_Fraktur}.katex .mathboldfrak,.katex .textboldfrak{font-family:KaTeX_Fraktur;font-weight:700}.katex .mathtt{font-family:KaTeX_Typewriter}.katex .mathscr,.katex .textscr{font-family:KaTeX_Script}.katex .mathsf,.katex .textsf{font-family:KaTeX_SansSerif}.katex .mathboldsf,.katex .textboldsf{font-family:KaTeX_SansSerif;font-weight:700}.katex .mathitsf,.katex .mathsfit,.katex .textitsf{font-family:KaTeX_SansSerif;font-style:italic}.katex .mainrm{font-family:KaTeX_Main;font-style:normal}.katex .vlist-t{border-collapse:collapse;display:inline-table;table-layout:fixed}.katex .vlist-r{display:table-row}.katex .vlist{display:table-cell;position:relative;vertical-align:bottom}.katex .vlist>span{display:block;height:0;position:relative}.katex .vlist>span>span{display:inline-block}.katex .vlist>span>.pstrut{overflow:hidden;width:0}.katex .vlist-t2{margin-right:-2px}.katex .vlist-s{display:table-cell;font-size:1px;min-width:2px;vertical-align:bottom;width:2px}.katex .katex-vbox{align-items:baseline;display:inline-flex;flex-direction:column}.katex .katex-thinbox{display:inline-flex;flex-direction:row;max-width:0;width:0}.katex .msupsub{text-align:left}.katex .mfrac>span>span{text-align:center}.katex .mfrac .frac-line{border-bottom-style:solid;display:inline-block;width:100%}.katex .katex-hdashline,.katex .katex-hline,.katex .katex-overline .overline-line,.katex .katex-rule,.katex .katex-underline .underline-line,.katex .mfrac .frac-line{min-height:1px}.katex .mspace{display:inline-block}.katex .katex-smash{display:inline;line-height:0}.katex .clap,.katex .llap,.katex .rlap{position:relative;width:0}.katex .clap>.katex-inner,.katex .llap>.katex-inner,.katex .rlap>.katex-inner{position:absolute}.katex .clap>.katex-fix,.katex .llap>.katex-fix,.katex .rlap>.katex-fix{display:inline-block}.katex .llap>.katex-inner{right:0}.katex .clap>.katex-inner,.katex .rlap>.katex-inner{left:0}.katex .clap>.katex-inner>span{margin-left:-50%;margin-right:50%}.katex .katex-rule{border:0 solid;display:inline-block;position:relative}.katex .katex-hline,.katex .katex-overline .overline-line,.katex .katex-underline .underline-line{border-bottom-style:solid;display:inline-block;width:100%}.katex .katex-hdashline{border-bottom-style:dashed;display:inline-block;width:100%}.katex .sqrt>.katex-root{margin-left:.2777777778em;margin-right:-.5555555556em}.katex-display{display:block;margin:1em 0;text-align:center;overflow-x:auto;overflow-y:hidden;padding:4px 0}.katex-display>.katex{display:inline-block;text-align:center;white-space:nowrap}
`;

function renderMathInContent(text: string): string {
  if (!text) return '';
  // 1. Display math $$ ... $$ or \[ ... \]
  let processed = text.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g, (match) => {
    const raw = match.startsWith('$$') ? match.slice(2, -2) : match.slice(2, -2);
    try {
      return katex.renderToString(raw.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return match;
    }
  });

  // 2. Inline math $ ... $ or \( ... \)
  processed = processed.replace(/(\$[^$\n]+\$|\\\([\s\S]*?\\\))/g, (match) => {
    const raw = match.startsWith('$') ? match.slice(1, -1) : match.slice(2, -2);
    try {
      return katex.renderToString(raw.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return match;
    }
  });

  return processed;
}

const AUTO_HEIGHT_SCRIPT = `
  (function() {
    function postHeight() {
      var height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      window.ReactNativeWebView.postMessage(String(height));
    }
    window.addEventListener('load', postHeight);
    if (window.ResizeObserver) {
      new ResizeObserver(postHeight).observe(document.body);
    }
    setTimeout(postHeight, 100);
    setTimeout(postHeight, 300);
  })();
  true;
`;

export interface ScientificMarkdownProps {
  content: string;
  isDark?: boolean;
}

export const ScientificMarkdown = React.memo(function ScientificMarkdown({
  content,
  isDark = false,
}: ScientificMarkdownProps) {
  const [height, setHeight] = useState(30);

  const htmlContent = useMemo(() => {
    const withMath = renderMathInContent(content);
    const renderedHtml = md.render(withMath);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            ${KATEX_CSS}
            * { box-sizing: border-box; }
            html, body {
              margin: 0;
              padding: 0;
              background-color: transparent;
              font-family: 'Source Serif 4', Georgia, 'Times New Roman', serif;
              font-size: 14px;
              line-height: 1.6;
              color: ${isDark ? '#E4E4E7' : '#27272A'};
              -webkit-text-size-adjust: 100%;
            }
            h1, h2, h3, h4 {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-weight: 700;
              margin-top: 1.2em;
              margin-bottom: 0.4em;
              color: ${isDark ? '#FAFAFA' : '#09090B'};
            }
            h1 { font-size: 1.25rem; }
            h2 { font-size: 1.1rem; }
            h3 { font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.05em; color: #F97316; }
            p { margin: 0.6em 0; }
            p:first-child { margin-top: 0; }
            p:last-child { margin-bottom: 0; }
            ul, ol { padding-left: 1.4em; margin: 0.6em 0; }
            li { margin-bottom: 0.3em; }
            code {
              font-family: monospace;
              font-size: 0.85em;
              background-color: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'};
              padding: 2px 5px;
              border-radius: 4px;
            }
            pre {
              background-color: ${isDark ? '#18181B' : '#09090B'};
              color: #34D399;
              padding: 12px;
              border-radius: 8px;
              overflow-x: auto;
              font-size: 0.85em;
            }
            pre code { background: none; padding: 0; color: inherit; }
            blockquote {
              margin: 0.8em 0;
              padding-left: 12px;
              color: ${isDark ? '#A1A1AA' : '#52525B'};
              font-style: italic;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 1em 0;
              font-size: 0.9em;
            }
            th, td {
              border: 1px solid ${isDark ? '#27272A' : '#E4E4E7'};
              padding: 8px 12px;
              text-align: left;
            }
            th {
              background-color: ${isDark ? '#18181B' : '#F4F4F5'};
              font-weight: 600;
            }
            hr {
              border: none;
              border-top: 1px solid ${isDark ? '#27272A' : '#E4E4E7'};
              margin: 1.5em 0;
            }
          </style>
        </head>
        <body>
          <div id="content">${renderedHtml}</div>
        </body>
      </html>
    `;
  }, [content, isDark]);

  return (
    <View style={{ height: Math.max(height, 20), width: '100%' }}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        injectedJavaScript={AUTO_HEIGHT_SCRIPT}
        onMessage={(event) => {
          const newHeight = Number(event.nativeEvent.data);
          if (!isNaN(newHeight) && newHeight > 0) {
            setHeight(newHeight);
          }
        }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: 'transparent' }}
      />
    </View>
  );
});
