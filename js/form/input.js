/* ============================================================
   FORM — OVERLAY INPUT (SPK + Speed + Suhu Dinamis)
   ============================================================
   - SPK lookup dari masterSPK (cache offline)
   - Validasi: kode jenis SPK harus cocok dengan prefix mesin
   - Speed: input angka (tanpa min/max)
   - Suhu: dinamis per mesin (jumlah & label dari mesinDetailMap)
   - Mode: tambah / edit (pending / server)
   ============================================================ */

(function () {

  const APP = window.APP = window.APP || {};
  const $ = APP.$;
  const showToast = APP.showToast;
  const playBeepSuccess = APP.playBeepSuccess;
  const playBeepFail = APP.playBeepFail;
  const vibrate = APP.vibrate;

  /* ============================================================
     STATE LOKAL INPUT
     ============================================================ */
  let currentMesin = null;
  let currentSPKData = null;
  let currentSPKValid = false;

  let formMode = 'tambah';          /* 'tambah' | 'edit' */
  let editId = null;                /* ID server (kalau edit server) */
  let pendingEditIndex = null;      /* index pending (kalau edit pending) */
  let formOriginList = false;       /* true kalau dibuka dari overlay list */

  let lookupSeq = 0;
  let lookupDebounceTimer = null;

  /* Confirm state */
  let confirmId = null;
  let confirmMesin = null;
  let pendingDeleteIndex = null;

  /* ============================================================
     GETTER internal (dipakai modul form lain)
     ============================================================ */
  function getCurrentMesin() { return currentMesin; }
  APP.getCurrentMesin = getCurrentMesin;

  function getFormMode() { return formMode; }
  APP.getFormMode = getFormMode;

  function getEditId() { return editId; }
  APP.getEditId = getEditId;

  function getPendingEditIndex() { return pendingEditIndex; }
  APP.getPendingEditIndex = getPendingEditIndex;

  function isFormOriginList() { return formOriginList; }
  APP.isFormOriginList = isFormOriginList;

  function getCurrentSPKData() { return currentSPKData; }
  APP.getCurrentSPKData = getCurrentSPKData;

  function isCurrentSPKValid() { return currentSPKValid; }
  APP.isCurrentSPKValid = isCurrentSPKValid;

  /* ============================================================
     KLIK MESIN → buka list / input
     ============================================================ */
  function onMesinClick(namaMesin) {
    if (APP.getIsSyncing()) return;

    const hasilInput = APP.getHasilInput();
    const pendingInput = APP.getPendingInput();
    const adaServer = hasilInput[namaMesin] && hasilInput[namaMesin].length > 0;
    const adaPending = pendingInput[namaMesin] && pendingInput[namaMesin].length > 0;

    if (adaServer || adaPending) {
      APP.openListOverlay(namaMesin);
    } else {
      openInputOverlay(namaMesin, 'tambah', null, null, false);
    }
  }
  APP.onMesinClick = onMesinClick;

  /* ============================================================
     OPEN INPUT OVERLAY
     ============================================================ */
  function openInputOverlay(namaMesin, mode, id, pIndex, fromList) {
    closeConfirmOverlay();

    const overlayList = $('overlayList');
    if (overlayList) overlayList.classList.remove('active');

    formMode = mode || 'tambah';
    editId = id || null;
    pendingEditIndex = (typeof pIndex === 'number') ? pIndex : null;
    currentMesin = namaMesin;
    currentSPKData = null;
    currentSPKValid = false;
    formOriginList = !!fromList;

    /* Judul modal */
    const title = $('modalTitle');
    if (title) {
      let label = namaMesin;
      if (formMode === 'edit') label += ' · Edit Baris';
      else label += ' · Tambah Baris';
      title.textContent = label;
    }

    /* Nilai awal (kalau edit) */
    let initSPK = '';
    let initSpeed = '';
    let initSuhu = [];

    if (formMode === 'edit') {
      const detail = APP.getMesinDetailMap()[namaMesin];
      const suhuLen = detail && detail.suhuLabels ? detail.suhuLabels.length : 0;

      if (pendingEditIndex !== null) {
        const p = (APP.getPendingInput()[namaMesin] || [])[pendingEditIndex];
        if (p) {
          initSPK = p.noSPK || '';
          initSpeed = p.speed || '';
          initSuhu = Array.isArray(p.suhu) ? p.suhu.slice() : [];
        }
      } else if (editId) {
        const rows = APP.getHasilInput()[namaMesin] || [];
        const found = rows.find(function (r) { return r.id === editId; });
        if (found) {
          initSPK = found.noSPK || '';
          initSpeed = found.speed || '';
          initSuhu = Array.isArray(found.suhu) ? found.suhu.slice() : [];
        }
      }

      /* Normalisasi panjang initSuhu sesuai suhuLabels */
      if (!Array.isArray(initSuhu)) initSuhu = [];
      while (initSuhu.length < suhuLen) initSuhu.push('');
    }

    /* Set input SPK & Speed */
    const spkInput = $('spkInput');
    const speedInput = $('speedInput');
    if (spkInput) spkInput.value = initSPK;
    if (speedInput) speedInput.value = initSpeed;

    /* Build suhu inputboxes (dinamis) — dari js/form/suhu.js */
    if (APP.buildSuhuInputs) APP.buildSuhuInputs(namaMesin, initSuhu);

    /* Reset info SPK */
    resetSPKInfo();
    if (initSPK) {
      onSPKInputChange(true);
    } else {
      const btnOk = $('btnOk');
      if (btnOk) btnOk.disabled = true;
    }

    /* Tampilkan overlay */
    const overlay = $('overlayInput');
    if (overlay) overlay.classList.add('active');
    setTimeout(function () {
      if (spkInput) spkInput.focus();
    }, 120);
  }
  APP.openInputOverlay = openInputOverlay;

  /* ============================================================
     CLOSE INPUT OVERLAY
     ============================================================ */
  function closeInputOverlay() {
    const overlay = $('overlayInput');
    if (overlay) overlay.classList.remove('active');

    const wasFromList = formOriginList;
    const lastMesin = currentMesin;

    /* Reset */
    currentMesin = null;
    currentSPKData = null;
    currentSPKValid = false;
    editId = null;
    pendingEditIndex = null;
    formMode = 'tambah';
    formOriginList = false;

    if (lookupDebounceTimer) {
      clearTimeout(lookupDebounceTimer);
      lookupDebounceTimer = null;
    }

    /* Bersihkan input suhu */
    const suhuContainer = $('suhuContainer');
    if (suhuContainer) suhuContainer.innerHTML = '';

    /* Kalau dibuka dari list → balik ke list */
    if (wasFromList && lastMesin) {
      const overlayList = $('overlayList');
      if (overlayList) overlayList.classList.add('active');
      if (APP.renderList) APP.renderList(lastMesin);
    }
  }
  APP.closeInputOverlay = closeInputOverlay;

  /* ============================================================
     SPK INFO (kotak preview)
     ============================================================ */
  function resetSPKInfo() {
    const box = $('spkInfo');
    const val = $('spkInfoValue');
    if (!box || !val) return;
    box.classList.remove('error', 'success');
    val.textContent = '—';
  }

  function setSPKInfo(text, state) {
    const box = $('spkInfo');
    const val = $('spkInfoValue');
    if (!box || !val) return;
    box.classList.remove('error', 'success');
    if (state === 'error') box.classList.add('error');
    if (state === 'success') box.classList.add('success');
    val.textContent = text;
  }

  /* ============================================================
     SPK LOOKUP
     ============================================================ */
  function onSPKInputChange(immediate) {
    const el = $('spkInput');
    if (!el) return;

    /* Sanitasi: hanya angka */
    const before = el.value;
    const after = before.replace(/[^0-9]/g, '');
    if (before !== after) el.value = after;

    const noSPK = after.trim();

    if (noSPK === '') {
      if (lookupDebounceTimer) {
        clearTimeout(lookupDebounceTimer);
        lookupDebounceTimer = null;
      }
      resetSPKInfo();
      currentSPKData = null;
      currentSPKValid = false;
      updateOkState();
      return;
    }

    setSPKInfo('Mencari No SPK ' + noSPK + ' ...', '');

    if (lookupDebounceTimer) {
      clearTimeout(lookupDebounceTimer);
      lookupDebounceTimer = null;
    }

    if (immediate) {
      runSPKLookup(noSPK);
      return;
    }

    lookupDebounceTimer = setTimeout(function () {
      lookupDebounceTimer = null;
      runSPKLookup(noSPK);
    }, 400);
  }
  APP.onSPKInputChange = onSPKInputChange;

  function flushSPKLookup() {
    if (lookupDebounceTimer) {
      clearTimeout(lookupDebounceTimer);
      lookupDebounceTimer = null;
    }
    const el = $('spkInput');
    if (!el) return;
    const noSPK = (el.value || '').replace(/[^0-9]/g, '').trim();
    if (noSPK !== '') runSPKLookup(noSPK);
  }
  APP.flushSPKLookup = flushSPKLookup;

  function runSPKLookup(noSPK) {
    const seq = ++lookupSeq;

    /* Pastikan master SPK sudah loaded */
    if (!APP.getMasterSPKLoaded()) {
      if (APP.getMasterSPKLoading()) {
        setTimeout(function () {
          if (seq === lookupSeq) runSPKLookup(noSPK);
        }, 500);
        return;
      } else {
        APP.loadMasterSPK();
        setTimeout(function () {
          if (seq === lookupSeq) runSPKLookup(noSPK);
        }, 1000);
        return;
      }
    }

    const masterSPK = APP.getMasterSPK();
    const key = String(noSPK).trim();
    const data = masterSPK[key];

    /* Cocokkan kode jenis SPK dengan prefix mesin */
    let errorMsg = '';
    let valid = false;

    if (!data) {
      errorMsg = 'No SPK "' + key + '" tidak ditemukan di database.';
    } else {
      const kodeSPK = String(data.kodeJenis || '').toUpperCase();
      const prefixMesin = String(currentMesin || '').substring(0, 2).toUpperCase();

      if (kodeSPK !== prefixMesin) {
        errorMsg = 'Jenis plastik tidak cocok! Mesin: ' + prefixMesin + ' · SPK: ' + kodeSPK;
      } else {
        valid = true;
      }
    }

    handleLookupResult({
      success: true,
      found: !!data,
      valid: valid,
      error: errorMsg,
      data: data || null
    });
  }

  /* ============================================================
     HANDLE LOOKUP RESULT
     ============================================================ */
  function handleLookupResult(res) {
    if (!res || !res.success) {
      currentSPKData = null;
      currentSPKValid = false;
      setSPKInfo((res && res.error) || 'Gagal mencari SPK.', 'error');
      playBeepFail();
      vibrate();
      updateOkState();
      return;
    }

    if (!res.found) {
      currentSPKData = null;
      currentSPKValid = false;
      setSPKInfo(res.error || 'No SPK tidak ditemukan.', 'error');
      playBeepFail();
      vibrate();
      updateOkState();
      return;
    }

    if (!res.valid) {
      currentSPKData = res.data || null;
      currentSPKValid = false;
      setSPKInfo(res.error || 'Jenis plastik tidak cocok.', 'error');
      playBeepFail();
      vibrate();
      updateOkState();
      return;
    }

    /* Valid */
    currentSPKData = res.data;
    currentSPKValid = true;

    /* Preview notasi baru: <Jenis> <Tebal> x <Lebar> x <PanjangPot>    BD <BD> */
    const teks = APP.formatSPKInfo(res.data);
    setSPKInfo(teks, 'success');
    playBeepSuccess();
    updateOkState();
  }

  /* ============================================================
     UPDATE OK STATE (enable/disable tombol OK)
     ============================================================ */
  function updateOkState() {
    const btnOk = $('btnOk');
    if (!btnOk) return;

    const speedEl = $('speedInput');
    const speedOk = speedEl && speedEl.value.trim() !== '';

    const spkOk = currentSPKValid;

    /* Suhu: semua boleh kosong, tapi kalau ada yang bukan angka → invalid.
       Validasi detail suhu ada di js/form/suhu.js via APP.isSuhuValid() */
    const suhuOk = APP.isSuhuValid ? APP.isSuhuValid() : true;

    btnOk.disabled = !(spkOk && speedOk && suhuOk);
  }
  APP.updateOkState = updateOkState;

  /* ============================================================
     CONFIRM DELETE (untuk Hapus di list)
     ============================================================ */
  function openConfirmOverlay(id, mesin, pIndex) {
    confirmId = id || null;
    confirmMesin = mesin || null;
    pendingDeleteIndex = (typeof pIndex === 'number') ? pIndex : null;

    const txt = $('confirmText');
    if (txt) {
      if (id) txt.textContent = 'Yakin hapus data ini? Tindakan tidak bisa dibatalkan.';
      else txt.textContent = 'Yakin hapus baris yang belum tersimpan ini?';
    }
    const overlay = $('overlayConfirm');
    if (overlay) overlay.classList.add('active');
  }
  APP.openConfirmOverlay = openConfirmOverlay;

  function closeConfirmOverlay() {
    const overlay = $('overlayConfirm');
    if (overlay) overlay.classList.remove('active');
    confirmId = null;
    confirmMesin = null;
    pendingDeleteIndex = null;
  }
  APP.closeConfirmOverlay = closeConfirmOverlay;

  /* ============================================================
     GETTER confirm state (dipakai di crud.js)
     ============================================================ */
  function getConfirmState() {
    return {
      id: confirmId,
      mesin: confirmMesin,
      pendingIndex: pendingDeleteIndex
    };
  }
  APP.getConfirmState = getConfirmState;

})();
