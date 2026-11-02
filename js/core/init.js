/* ============================================================
   CORE — INIT (Bootstrapper aplikasi)
   ============================================================
   Urutan init:
   1. Set tanggal default + shift default + footer tahun
   2. Init tabs
   3. Init kontrol rekap (tanggal & shift filter)
   4. Bind event form (dipanggil dari js/form/events.js)
   5. Tampilkan sync overlay
   6. Load daftar mesin + detail mesin (dengan suhuLabels)
   7. Load master SPK (DB Drive)
   ============================================================ */

(function () {

  const APP = window.APP = window.APP || {};
  const $ = APP.$;

  /* ============================================================
     TABS
     ============================================================ */
  function switchTab(tab) {
    const pageForm = $('pageForm');
    const pageRekap = $('pageRekap');
    const btnForm = $('tabForm');
    const btnRekap = $('tabRekap');

    if (tab === 'rekap') {
      if (pageForm) pageForm.classList.add('hidden');
      if (pageRekap) pageRekap.classList.remove('hidden');
      if (btnForm) btnForm.classList.remove('active');
      if (btnRekap) btnRekap.classList.add('active');
    } else {
      if (pageRekap) pageRekap.classList.add('hidden');
      if (pageForm) pageForm.classList.remove('hidden');
      if (btnRekap) btnRekap.classList.remove('active');
      if (btnForm) btnForm.classList.add('active');
    }
  }
  APP.switchTab = switchTab;

  function initTabs() {
    const btnForm = $('tabForm');
    const btnRekap = $('tabRekap');
    if (btnForm) btnForm.addEventListener('click', function () { switchTab('form'); });
    if (btnRekap) btnRekap.addEventListener('click', function () { switchTab('rekap'); });
  }
  APP.initTabs = initTabs;

  /* ============================================================
     LOAD DAFTAR MESIN + DETAIL (suhuLabels)
     ============================================================
     getMesin      → array nama mesin urut sheet
     getMesinDetail → [{ mesin, supplier, suhuLabels: [...] }, ...]
     ============================================================ */
  function loadDaftarMesin() {
    const container = $('mesinContainer');
    if (container) {
      container.innerHTML = '<div class="loading-wrap"><span class="loading"></span> Memuat daftar mesin...</div>';
    }

    APP.callGAS({ action: 'getMesinDetail' })
      .then(function (res) {
        if (!res || !res.success) {
          throw new Error((res && res.error) || 'Gagal memuat detail mesin.');
        }
        const detailArr = res.data || [];

        /* Bangun mesinDetailMap + daftarMesin */
        const map = {};
        const list = [];
        detailArr.forEach(function (row) {
          const nama = String(row.mesin || '').trim();
          if (!nama) return;
          map[nama] = {
            mesin: nama,
            supplier: String(row.supplier || '').trim(),
            suhuLabels: Array.isArray(row.suhuLabels) ? row.suhuLabels : []
          };
          list.push(nama);
        });

        APP.setMesinDetailMap(map);
        APP.setDaftarMesin(list);

        /* Render grid mesin */
        if (APP.renderMesin) APP.renderMesin();

        /* Sync data tanggal+shift aktif */
        if (APP.syncData) APP.syncData();
      })
      .catch(function (err) {
        APP.hideSyncLoading();
        if (container) {
          container.innerHTML = '<div class="loading-wrap" style="color:#ff6b8a;">Gagal memuat mesin: ' +
            (err && err.message ? err.message : err) + '</div>';
        }
      });
  }
  APP.loadDaftarMesin = loadDaftarMesin;

  /* ============================================================
     LOAD MASTER SPK (cache DB Drive)
     ============================================================ */
  function loadMasterSPK() {
    if (APP.getMasterSPKLoaded() || APP.getMasterSPKLoading()) return;
    APP.setMasterSPKLoading(true);

    const tahun = String(CONFIG.DEFAULT_TAHUN || new Date().getFullYear());

    APP.callGAS({ action: 'getMasterSPK', tahun: tahun })
      .then(function (res) {
        if (res && res.success && res.data) {
          APP.setMasterSPK(res.data);
          APP.setMasterSPKLoaded(true);
        } else {
          console.warn('Gagal memuat master SPK:', res ? res.error : 'unknown');
        }
      })
      .catch(function (err) {
        console.warn('Error memuat master SPK:', err);
      })
      .finally(function () {
        APP.setMasterSPKLoading(false);
      });
  }
  APP.loadMasterSPK = loadMasterSPK;

  /* ============================================================
     BOOTSTRAP (DOMContentLoaded)
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {

    /* 1. Nilai default */
    const t = $('tanggal');
    if (t) t.value = APP.ymd(new Date());

    const s = $('shift');
    if (s) s.value = 'SHIFT-PAGI';

    const ft = $('footerTahun');
    if (ft) ft.textContent = new Date().getFullYear();

    /* 2. Init tabs */
    if (APP.initTabs) APP.initTabs();

    /* 3. Init kontrol rekap (tanggal + shift filter) */
    if (APP.initRekapControls) APP.initRekapControls();

    /* 4. Bind event form (dari js/form/events.js) */
    if (APP.bindFormEvents) APP.bindFormEvents();

    /* 5. Tampilkan overlay + set flag syncing */
    APP.ensureSyncOverlay();
    const ov = $('syncOverlay');
    if (ov) ov.classList.add('active');
    APP.setIsSyncing(true);

    /* 6. Load daftar mesin (yang di dalamnya akan memanggil syncData) */
    loadDaftarMesin();

    /* 7. Load master SPK secara paralel */
    loadMasterSPK();
  });

})();
