'use strict';

async function saveEmbedded() {
  if (!rawGiftText) return;

  const btn = document.getElementById('btn-save-offline');
  btn.disabled    = true;
  btn.textContent = 'Generating...';

  try {
    let combinedJs;

    // When re-saving from an already-offline HTML, all JS is in #combined-app inline script
    const combinedEl = document.getElementById('combined-app');
    if (combinedEl) {
      combinedJs = combinedEl.textContent;
    } else {
      // Development mode: fetch each external script file in load order
      const scriptEls = Array.from(document.querySelectorAll('script[src]'));
      const parts = await Promise.all(scriptEls.map(async el => {
        const resp = await fetch(el.src);
        if (!resp.ok) throw new Error('Could not read ' + el.getAttribute('src'));
        return await resp.text();
      }));
      combinedJs = parts.join('\n\n');
    }

    // Escape closing script tags so they don't break the bundled inline script block.
    // Match with or without the closing > — the HTML parser triggers on the opening sequence.
    const safeJs = combinedJs.replace(/<\/script/gi, '<\\/script');

    // Encode GIFT data: escape < to prevent tag sequences in questions from breaking the output
    const safeJson = JSON.stringify(rawGiftText).replace(/</g, '\\u003c');

    const cssEl    = document.querySelector('link[rel="stylesheet"]');
    const cssResp  = await fetch(cssEl.href);
    const css      = await cssResp.text();
    const fileName = (currentFileName || 'quiz').replace(/\.(gift|txt)$/i, '');

    // Build clean body HTML: strip scripts and clear dynamic-rendered content
    const bodyClone = document.body.cloneNode(true);
    bodyClone.querySelectorAll('link').forEach(l => l.remove());
    bodyClone.querySelectorAll('script').forEach(s => s.remove());
    const qc = bodyClone.querySelector('#quiz-container');
    if (qc) qc.innerHTML = '';
    const tt = bodyClone.querySelector('#topic-tabs');
    if (tt) tt.innerHTML = '';
    const saveBtn = bodyClone.querySelector('#btn-save-offline');
    if (saveBtn) saveBtn.classList.remove('visible');
    const fnEl = bodyClone.querySelector('#file-name');
    if (fnEl) fnEl.textContent = 'Embedded quiz';

    // Build the self-contained HTML.
    // Use string concatenation for tag sequences to keep this source safe when bundled.
    const CS = '<' + '/';
    const html = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '<meta charset="UTF-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      `<title>${fileName.replace(/</g, '&lt;')} — Offline Quiz</title>`,
      `<script>window.__EMBEDDED_GIFT__ = ${safeJson};${CS}script>`,
      `<style>\n${css}\n${CS}style>`,
      '</head>',
      '<body>',
      bodyClone.innerHTML,
      `<script id="combined-app">\n'use strict';\n${safeJs}\n${CS}script>`,
      '</body>',
      '</html>',
    ].join('\n');

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = fileName + '-offline.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (err) {
    alert(
      'Could not save offline file.\n\n' +
      err.message + '\n\n' +
      'Tip: use Chrome or Edge — Firefox blocks reading local files via fetch().'
    );
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg> Save for offline';
  }
}
