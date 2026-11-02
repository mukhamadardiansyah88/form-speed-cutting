/* ============================================================
   FORM — RENDER GRID MESIN
   ============================================================
   Menampilkan 40 mesin dalam grid datar (tanpa grouping).
   Badge ✓ kalau mesin sudah ada data (server atau pending).
   ============================================================ */

(function () {

  const APP = window.APP = window.APP || {};
  const $ = APP.$;

  /* ============================================================
     RENDER MESIN
     ============================================================ */
  function renderMesin() {
    const container = $('mesinContainer');
    if (!container) return;
    container.innerHTML = '';

    const daftarMesin = APP.getDaftarMesin();
    const hasilInput = APP.getHasilInput();
    const pendingInput = APP.getPendingInput();

    if (!daftarMesin || daftarMesin.length === 0) {
      container.innerHTML = '<div class="loading-wrap">Tidak ada mesin terdaftar.</div>';
      APP.updateSummary();
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'mesin-grid';

    daftarMesin.forEach(function (nama) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mesin-btn';
      btn.textContent = nama;
      btn.dataset.mesin = nama;

      const adaServer = hasilInput[nama] && hasilInput[nama].length > 0;
      const adaPending = pendingInput[nama] && pendingInput[nama].length > 0;
      if (adaServer || adaPending) btn.classList.add('filled');

      btn.addEventListener('click', function () {
        if (APP.onMesinClick) APP.onMesinClick(nama);
      });

      grid.appendChild(btn);
    });

    container.appendChild(grid);
    APP.updateSummary();
  }
  APP.renderMesin = renderMesin;

  /* ============================================================
     REFRESH BADGE (tanpa render ulang grid)
     ============================================================
     Dipakai setelah tambah/edit/hapus baris — supaya tidak
     flicker render ulang. Cuma update class .filled.
     ============================================================ */
  function refreshMesinButtons() {
    const hasilInput = APP.getHasilInput();
    const pendingInput = APP.getPendingInput();

    document.querySelectorAll('.mesin-btn').forEach(function (btn) {
      const nama = btn.dataset.mesin;
      const adaServer = hasilInput[nama] && hasilInput[nama].length > 0;
      const adaPending = pendingInput[nama] && pendingInput[nama].length > 0;
      if (adaServer || adaPending) btn.classList.add('filled');
      else btn.classList.remove('filled');
    });
  }
  APP.refreshMesinButtons = refreshMesinButtons;

})();
