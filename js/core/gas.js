/* ============================================================
   CORE — GAS (JSONP ke Google Apps Script) + Sync Overlay
   ============================================================
   - callGAS(params): Promise yang resolve dengan data dari GAS
   - showSyncLoading() / hideSyncLoading(): overlay full-screen
   ============================================================ */

(function () {

  const APP = window.APP = window.APP || {};
  const $ = APP.$;

  /* ============================================================
     JSONP CALL KE GAS
     ============================================================
     - Parameter `callback` ditambahkan otomatis
     - Timeout 12 detik
     - Script tag dihapus setelah selesai
     ============================================================ */
  function callGAS(params) {
    return new Promise(function (resolve, reject) {
      const cbName = 'jsonp_cb_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
      const script = document.createElement('script');
      let done = false;
      let timeoutId = null;

      function cleanup() {
        if (done) return;
        done = true;
        if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
        try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
        if (script) {
          script.onload = null;
          script.onerror = null;
          if (script.parentNode) script.parentNode.removeChild(script);
        }
      }

      window[cbName] = function (data) {
        cleanup();
        resolve(data);
      };

      const qs = new URLSearchParams(params).toString();
      script.src = CONFIG.GAS_URL + '?callback=' + encodeURIComponent(cbName) + '&' + qs;
      script.onerror = function () {
        cleanup();
        reject(new Error('JSONP gagal — cek koneksi atau URL GAS'));
      };
      script.onload = function () {
        if (!done) {
          cleanup();
          reject(new Error('Response GAS tidak memanggil callback'));
        }
      };

      document.body.appendChild(script);
      timeoutId = setTimeout(function () {
        if (!done) {
          cleanup();
          reject(new Error('JSONP timeout'));
        }
      }, 12000);
    });
  }
  APP.callGAS = callGAS;

  /* ============================================================
     SYNC OVERLAY
     ============================================================ */
  function ensureSyncOverlay() {
    if ($('syncOverlay')) return;
    const ov = document.createElement('div');
    ov.id = 'syncOverlay';
    ov.className = 'sync-overlay';
    ov.innerHTML =
      '<div class="sync-spinner">' +
        '<div class="ring r1"></div>' +
        '<div class="ring r2"></div>' +
        '<div class="ring r3"></div>' +
      '</div>' +
      '<div class="sync-text">Memuat Data</div>';
    document.body.appendChild(ov);
  }
  APP.ensureSyncOverlay = ensureSyncOverlay;

  function showSyncLoading() {
    APP.setIsSyncing(true);
    ensureSyncOverlay();
    const ov = $('syncOverlay');
    if (ov) ov.classList.add('active');
    document.querySelectorAll('.mesin-btn').forEach(function (b) { b.disabled = true; });
    const summary = $('summary');
    if (summary) {
      summary.textContent = 'Memuat data...';
      APP.setLastSummaryText(summary.textContent);
    }
  }
  APP.showSyncLoading = showSyncLoading;

  function hideSyncLoading() {
    APP.setIsSyncing(false);
    const ov = $('syncOverlay');
    if (ov) ov.classList.remove('active');
    document.querySelectorAll('.mesin-btn').forEach(function (b) { b.disabled = false; });
  }
  APP.hideSyncLoading = hideSyncLoading;

})();
