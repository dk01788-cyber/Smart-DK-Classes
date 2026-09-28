(() => {
  const params = new URLSearchParams(location.search);
  const url = params.get('url') || '';
  const title = params.get('title') || 'Smart DK Classes PDF';
  const titleEl = document.getElementById('pdf-title');
  const pageLabel = document.getElementById('pdf-page-label');
  const status = document.getElementById('pdf-status');
  const wrap = document.getElementById('pdf-canvas-wrap');
  const canvas = document.getElementById('pdf-canvas');
  const ctx = canvas.getContext('2d');
  const stage = document.getElementById('pdf-stage');
  const download = document.getElementById('pdf-download');
  let pdf = null, pageNo = 1, zoom = 1, rendering = false, pending = false;

  titleEl.textContent = title;
  document.title = `${title} | Smart DK Classes`;
  download.href = url || '#';

  if (!url) {
    status.innerHTML = 'PDF link नहीं मिली। <a href="/">Home पर वापस जाएँ</a>';
    return;
  }
  if (!window.pdfjsLib) {
    status.innerHTML = `PDF Viewer load नहीं हो पाया। <a href="${url}" target="_blank" rel="noopener">PDF सीधे खोलें</a>`;
    return;
  }

  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  async function renderPage() {
    if (!pdf || rendering) { pending = true; return; }
    rendering = true; pending = false;
    try {
      const page = await pdf.getPage(pageNo);
      const unscaled = page.getViewport({ scale: 1 });
      const available = Math.max(280, Math.min(1120, stage.clientWidth - 18));
      const fitScale = available / unscaled.width;
      const scale = Math.max(.45, Math.min(3.2, fitScale * zoom));
      const viewport = page.getViewport({ scale });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      await page.render({ canvasContext: ctx, viewport, transform: dpr === 1 ? null : [dpr,0,0,dpr,0,0] }).promise;
      status.hidden = true;
      wrap.hidden = false;
      pageLabel.textContent = `Page ${pageNo} / ${pdf.numPages} • ${Math.round(zoom * 100)}%`;
      document.getElementById('pdf-prev').disabled = pageNo <= 1;
      document.getElementById('pdf-next').disabled = pageNo >= pdf.numPages;
    } catch (e) {
      status.hidden = false;
      wrap.hidden = true;
      status.innerHTML = `PDF दिखाने में समस्या आई। <a href="${url}" target="_blank" rel="noopener">PDF सीधे खोलें</a>`;
    } finally {
      rendering = false;
      if (pending) renderPage();
    }
  }

  document.getElementById('pdf-prev').addEventListener('click', () => { if (pageNo > 1) { pageNo--; renderPage(); stage.scrollTo({top:0,behavior:'smooth'}); } });
  document.getElementById('pdf-next').addEventListener('click', () => { if (pdf && pageNo < pdf.numPages) { pageNo++; renderPage(); stage.scrollTo({top:0,behavior:'smooth'}); } });
  document.getElementById('pdf-zoom-in').addEventListener('click', () => { zoom = Math.min(2.5, +(zoom + .15).toFixed(2)); renderPage(); });
  document.getElementById('pdf-zoom-out').addEventListener('click', () => { zoom = Math.max(.55, +(zoom - .15).toFixed(2)); renderPage(); });
  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(renderPage, 160); });

  window.pdfjsLib.getDocument({ url }).promise.then(doc => {
    pdf = doc;
    pageNo = 1;
    renderPage();
  }).catch(() => {
    status.innerHTML = `PDF load नहीं हो सकी। <a href="${url}" target="_blank" rel="noopener">PDF सीधे खोलें / Download करें</a>`;
  });
})();
