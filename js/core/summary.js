/* ============================================================
   CORE — SUMMARY (Ringkasan Total Baris + Tombol Simpan)
   ============================================================
   Di extruder ada rangkuman PP/PE/HD.
   Di cutting TIDAK ADA kategori, jadi rangkuman disederhanakan:
   - Total baris tersimpan (server)
   - Total baris pending (belum disimpan)
   - Jumlah mesin terisi
   - Status tombol Simpan
   ============================================================ */

(function () {

  const APP = window.APP = window.APP || {};
  const $ = APP.$;

  /* ============================================================
     HITUNG TOTAL
     ============================================================ */
  function hitungTotal() {
    const hasilInput = APP.getHasilInput();
    const pendingInput = APP.getPendingInput();

    let totalServer = 0;
    let totalPending = 0;
    let mesinServer = 0;
    let mesinPending = 0;

    Object.keys(hasilInput).forEach(function (mesin) {
      const len = (hasilInput[mesin] || []).length;
      if (len > 0) {
        totalServer += len;
        mesinServer++;
      }
    });

    Object.keys(pendingInput).forEach(function (mesin) {
      const len = (pendingInput[mesin] || []).length;
      if (len > 0) {
        totalPending += len;
        mesinPending++;
      }
    });

    return {
      totalServer: totalServer,
      totalPending: totalPending,
      mesinServer: mesinServer,
      mesinPending: mesinPending,
      totalMesin: mesinServer + mesinPending
    };
  }

  /* ============================================================
     UPDATE SUMMARY (teks + tombol Simpan)
     ============================================================ */
  function updateSummary() {
    const el = $('summary');
    const btn = $('btnSimpan');
    if (!el || !btn) return;

    /* Kalau sedang sync, jangan override */
    if (APP.getIsSyncing()) {
      const txt = 'Memuat data...';
      if (APP.getLastSummaryText() !== txt) {
        el.textContent = txt;
        APP.setLastSummaryText(txt);
      }
      btn.disabled = true;
      return;
    }

    const t = hitungTotal();
    let txt;

    if (t.totalServer === 0 && t.totalPending === 0) {
      txt = 'Belum ada data untuk tanggal & shift ini.';
      btn.disabled = true;
    } else {
      txt = t.totalServer + ' baris · ' + t.mesinServer + ' mesin tersimpan';
      if (t.totalPending > 0) {
        txt += ' · ' + t.totalPending + ' baris baru belum disimpan';
      }
      btn.disabled = (t.totalPending === 0);
    }

    if (APP.getLastSummaryText() !== txt) {
      el.textContent = txt;
      APP.setLastSummaryText(txt);
    }
  }
  APP.updateSummary = updateSummary;

})();
