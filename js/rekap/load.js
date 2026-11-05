/* ============================================================
   REKAP — LOAD (Ambil data rekap dari GAS) ok
   ============================================================
   - loadRekap: ambil data untuk rentang tanggal awal–akhir
   - Data disimpan di APP.rekapRawData, flag APP.rekapLoaded = true
   - renderRekapFromCache dipanggil setelah data siap
   ============================================================ */

(function () {

  const APP = window.APP = window.APP || {};
  const $ = APP.$;
  const showToast = APP.showToast;
  const callGAS = APP.callGAS;

  /* ============================================================
     LOAD REKAP
     ============================================================ */
  function loadRekap() {
    const awal = $('rekapTanggalAwal');
    const akhir = $('rekapTanggalAkhir');
    if (!awal || !akhir) return;

    const tglAwal = awal.value;
    const tglAkhir = akhir.value;
    if (!tglAwal || !tglAkhir) {
      showToast('Tanggal awal/akhir belum dipilih.', 'error');
      return;
    }
    if (tglAwal > tglAkhir) {
      showToast('Tanggal awal > akhir.', 'error');
      return;
    }

    const btn = $('btnLoadRekap');
    if (btn) btn.disabled = true;

    APP.ensureSyncOverlay();
    const ov = $('syncOverlay');
    if (ov) ov.classList.add('active');

    callGAS({ action: 'getRekap', tanggalAwal: tglAwal, tanggalAkhir: tglAkhir })
      .then(function (res) {
        if (ov) ov.classList.remove('active');
        if (btn) btn.disabled = false;

        if (!res || !res.success) {
          showToast('Gagal rekap: ' + ((res && res.error) || 'unknown'), 'error');
          return;
        }

        /* Normalisasi data */
        const raw = (res.data || []).map(function (row) {
          let suhuArr = [];
          if (Array.isArray(row.suhu)) {
            suhuArr = row.suhu.map(function (v) {
              return (v == null) ? '' : String(v);
            });
          } else if (row.suhu != null) {
            try {
              const parsed = JSON.parse(row.suhu);
              if (Array.isArray(parsed)) {
                suhuArr = parsed.map(function (v) {
                  return (v == null) ? '' : String(v);
                });
              }
            } catch (e) { /* biarkan kosong */ }
          }

          return {
            id: row.id,
            tanggal: row.tanggal,
            mesin: row.mesin,
            noSPK: row.noSPK,
            shift: row.shift,
            speed: row.speed,
            suhu: suhuArr
          };
        });

        APP.setRekapLoaded(true);
        APP.setRekapRawData(raw);

        /* Render tabel */
        if (APP.renderRekapFromCache) APP.renderRekapFromCache();

        /* Summary text */
        const sum = $('rekapSummary');
        if (sum) {
          const txt = raw.length + ' baris dalam rentang ' +
            APP.ymdToDDMMYY(tglAwal) + ' – ' + APP.ymdToDDMMYY(tglAkhir);
          sum.textContent = txt;
          APP.setLastRekapText(txt);
        }
      })
      .catch(function (err) {
        if (ov) ov.classList.remove('active');
        if (btn) btn.disabled = false;
        showToast('Gagal rekap: ' + (err && err.message ? err.message : err), 'error');
      });
  }
  APP.loadRekap = loadRekap;

})();
