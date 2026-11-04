/* ============================================================
   FORM — BIND EVENTS
   ============================================================
   Binding event untuk tab Input:
   - Overlay input (SPK, Speed, Scan, OK, Cancel, Close)
   - Overlay list (Close, Tambah Baris)
   - Overlay confirm (Close, Cancel, Yes)
   - Kontrol tanggal & shift (onChange → syncData)
   - syncData: ambil data server, normalisasi field SPK lengkap
   ============================================================ */

(function () {

  const APP = window.APP = window.APP || {};
  const $ = APP.$;

  /* ============================================================
     NORMALISASI SUHU (array / string JSON → array string)
     ============================================================ */
  function normalizeSuhu(raw) {
    if (Array.isArray(raw)) {
      return raw.map(function (v) { return (v == null) ? '' : String(v); });
    }
    if (raw != null && typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map(function (v) { return (v == null) ? '' : String(v); });
        }
      } catch (e) { /* biarkan kosong */ }
    }
    return [];
  }

  /* ============================================================
     SYNC DATA — Ambil data server untuk tanggal & shift aktif
     ============================================================ */
  function syncData() {
    const ctx = APP.getTanggalShift();
    if (!ctx.tanggal || !ctx.shift) {
      APP.hideSyncLoading();
      return;
    }

    APP.showSyncLoading();

    APP.callGAS({ action: 'getData', tanggal: ctx.tanggal, shift: ctx.shift })
      .then(function (res) {
        if (!res || !res.success) {
          throw new Error((res && res.error) || 'Gagal memuat data.');
        }
        const data = res.data || [];

        /* Kelompokkan by mesin */
        const hasilInput = {};
        data.forEach(function (row) {
          const mesin = String(row.mesin || '').trim();
          if (!mesin) return;
          if (!hasilInput[mesin]) hasilInput[mesin] = [];

          hasilInput[mesin].push({
            id: row.id,
            noSPK: row.noSPK,
            speed: row.speed,
            suhu: normalizeSuhu(row.suhu),
            /* Field SPK lengkap dari server (kolom F–L sheet Inputan) */
            spk: {
              jenis: String(row.jenis || '').trim(),
              cetak: String(row.cetak || '').trim(),
              tebal: String(row.tebal || '').trim(),
              lebar: String(row.lebar || '').trim(),
              lipat: String(row.lipat || '').trim(),
              panjangPot: String(row.panjangPot || '').trim(),
              bd: String(row.bd || '').trim()
            }
          });
        });

        APP.setHasilInput(hasilInput);

        APP.hideSyncLoading();
        APP.refreshMesinButtons();
        APP.updateSummary();

        /* Kalau overlay list terbuka, render ulang */
        const overlayList = $('overlayList');
        const listMesin = APP.getListMesin();
        if (overlayList && overlayList.classList.contains('active') && listMesin) {
          APP.renderList(listMesin);
        }
      })
      .catch(function (err) {
        APP.hideSyncLoading();
        const summary = $('summary');
        if (summary) {
          summary.textContent = 'Gagal memuat data.';
          APP.setLastSummaryText(summary.textContent);
        }
        APP.showToast('Gagal memuat data: ' + (err && err.message ? err.message : err), 'error');
      });
  }
  APP.syncData = syncData;

  /* ============================================================
     ON KONTROL CHANGE (tanggal / shift berubah)
     ============================================================ */
  function onKontrolChange() {
    APP.setPendingInput({});
    syncData();
  }
  APP.onKontrolChange = onKontrolChange;

  /* ============================================================
     SCANNER HOOK
     ============================================================ */
  function openScanner() {
    Scanner.open(
      function (barcode) {
        const el = $('spkInput');
        if (el) {
          el.value = barcode;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          if (APP.onSPKInputChange) APP.onSPKInputChange(true);
        }
      },
      function () { /* onClose — tidak ada aksi */ }
    );
  }
  APP.openScanner = openScanner;

  /* ============================================================
     BIND FORM EVENTS
     ============================================================ */
  function bindFormEvents() {
    /* --- Overlay Input --- */
    const btnCloseInput = $('btnCloseInput');
    if (btnCloseInput) btnCloseInput.addEventListener('click', APP.closeInputOverlay);

    const btnCancelInput = $('btnCancelInput');
    if (btnCancelInput) btnCancelInput.addEventListener('click', APP.closeInputOverlay);

    const btnOk = $('btnOk');
    if (btnOk) btnOk.addEventListener('click', APP.onOk);

    const btnScan = $('btnScan');
    if (btnScan) btnScan.addEventListener('click', openScanner);

    /* --- SPK input --- */
    const spkInput = $('spkInput');
    if (spkInput) {
      spkInput.addEventListener('input', function () {
        APP.onSPKInputChange(false);
      });
      spkInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          APP.flushSPKLookup();
        }
      });
    }

    /* --- Speed input --- */
    const speedInput = $('speedInput');
    if (speedInput) {
      speedInput.addEventListener('input', APP.onSpeedChange);
    }

    /* --- Tombol Simpan batch --- */
    const btnSimpan = $('btnSimpan');
    if (btnSimpan) btnSimpan.addEventListener('click', APP.onSimpan);

    /* --- Kontrol tanggal & shift --- */
    const tanggal = $('tanggal');
    if (tanggal) tanggal.addEventListener('change', onKontrolChange);

    const shift = $('shift');
    if (shift) shift.addEventListener('change', onKontrolChange);

    /* --- Overlay List --- */
    const btnCloseList = $('btnCloseList');
    if (btnCloseList) btnCloseList.addEventListener('click', APP.closeListOverlay);

    const btnTambahBaris = $('btnTambahBaris');
    if (btnTambahBaris) {
      btnTambahBaris.addEventListener('click', function () {
        const listMesin = APP.getListMesin();
        if (!listMesin) return;
        APP.openInputOverlay(listMesin, 'tambah', null, null, true);
      });
    }

    /* --- Overlay Confirm --- */
    const btnCloseConfirm = $('btnCloseConfirm');
    if (btnCloseConfirm) btnCloseConfirm.addEventListener('click', APP.closeConfirmOverlay);

    const btnCancelConfirm = $('btnCancelConfirm');
    if (btnCancelConfirm) btnCancelConfirm.addEventListener('click', APP.closeConfirmOverlay);

    const btnYesConfirm = $('btnYesConfirm');
    if (btnYesConfirm) btnYesConfirm.addEventListener('click', APP.onHapusConfirmed);
  }
  APP.bindFormEvents = bindFormEvents;

})();
