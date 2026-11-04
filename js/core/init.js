/* ============================================================
   CORE — INIT (Bootstrapper aplikasi)
   ============================================================
   Urutan init:
   1. Set tanggal default (cutoff 06:00) + shift otomatis + footer tahun
   2. Init tabs
   3. Init kontrol rekap (tanggal & shift filter)
   4. Bind event form (dipanggil dari js/form/events.js)
   5. Bind event help (tombol ? → fetch help.html → overlay)
   6. Tampilkan sync overlay
   7. Load konfigurasi (Max Jejer dari sheet Mesin J2)
   8. Load daftar mesin + detail mesin (dengan suhuLabels)
   9. Load master SPK (DB Drive)
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
     LOAD KONFIGURASI (Max Jejer dari sheet Mesin J2)
     ============================================================
     GAS action: getKonfigurasi → { success, data: { maxJejer } }
     ============================================================ */
  function loadKonfigurasi() {
    APP.callGAS({ action: 'getKonfigurasi' })
      .then(function (res) {
        if (res && res.success && res.data) {
          const mj = Number(res.data.maxJejer);
          if (!isNaN(mj) && mj >= 1) {
            APP.setMaxJejer(mj);
          } else {
            APP.setMaxJejer(1);
          }
        } else {
          console.warn('Gagal memuat konfigurasi:', res ? res.error : 'unknown');
          APP.setMaxJejer(1);
        }
      })
      .catch(function (err) {
        console.warn('Error memuat konfigurasi:', err);
        APP.setMaxJejer(1);
      });
  }
  APP.loadKonfigurasi = loadKonfigurasi;

  /* ============================================================
     LOAD DAFTAR MESIN + DETAIL (suhuLabels)
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

        if (APP.renderMesin) APP.renderMesin();
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
     HITUNG TANGGAL DEFAULT (cutoff 06:00)
     ============================================================ */
  function getTanggalDefault() {
    const now = new Date();
    const jam = now.getHours();
    if (jam < 6) {
      now.setDate(now.getDate() - 1);
    }
    return APP.ymd(now);
  }
  APP.getTanggalDefault = getTanggalDefault;

  /* ============================================================
     HITUNG SHIFT DEFAULT (cutoff 06:00, 8 jam/shift)
     ============================================================ */
  function getShiftDefault() {
    const jam = new Date().getHours();
    if (jam >= 6 && jam < 14) return 'SHIFT-PAGI';
    if (jam >= 14 && jam < 22) return 'SHIFT-SORE';
    return 'SHIFT-MALAM';
  }
  APP.getShiftDefault = getShiftDefault;

  /* ============================================================
     HELP OVERLAY (Aturan Main / Cara Pakai)
     ============================================================ */
  let helpHtmlCache = null;
  let helpLoading = false;

  function openHelpOverlay() {
    const overlay = $('overlayHelp');
    if (!overlay) return;

    const container = $('helpContainer');
    if (!container) return;

    if (helpHtmlCache !== null) {
      container.innerHTML = helpHtmlCache;
      overlay.classList.add('active');
      return;
    }

    if (helpLoading) {
      overlay.classList.add('active');
      return;
    }

    helpLoading = true;
    container.innerHTML = '<div class="loading-wrap"><span class="loading"></span> Memuat bantuan...</div>';
    overlay.classList.add('active');

    fetch('help.html', { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (html) {
        helpHtmlCache = html;
        container.innerHTML = html;
      })
      .catch(function (err) {
        console.warn('Gagal memuat help.html:', err);
        container.innerHTML =
          '<div class="list-empty" style="color:#ff6b8a;">' +
          'Gagal memuat bantuan. Pastikan file <code>help.html</code> ada di folder yang sama dengan <code>index.html</code>.' +
          '</div>';
      })
      .finally(function () {
        helpLoading = false;
      });
  }
  APP.openHelpOverlay = openHelpOverlay;

  function closeHelpOverlay() {
    const overlay = $('overlayHelp');
    if (overlay) overlay.classList.remove('active');
  }
  APP.closeHelpOverlay = closeHelpOverlay;

  function bindHelpEvents() {
    const btnHelp = $('btnHelp');
    if (btnHelp) btnHelp.addEventListener('click', openHelpOverlay);

    const btnCloseHelp = $('btnCloseHelp');
    if (btnCloseHelp) btnCloseHelp.addEventListener('click', closeHelpOverlay);

    const btnTutupHelp = $('btnTutupHelp');
    if (btnTutupHelp) btnTutupHelp.addEventListener('click', closeHelpOverlay);

    const overlayHelp = $('overlayHelp');
    if (overlayHelp) {
      overlayHelp.addEventListener('click', function (e) {
        if (e.target === overlayHelp) closeHelpOverlay();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        const ov = $('overlayHelp');
        if (ov && ov.classList.contains('active')) closeHelpOverlay();
      }
    });
  }
  APP.bindHelpEvents = bindHelpEvents;

  /* ============================================================
     BOOTSTRAP (DOMContentLoaded)
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {

    /* 1. Nilai default tanggal (cutoff 06:00) + shift otomatis */
    const t = $('tanggal');
    if (t) t.value = getTanggalDefault();

    const s = $('shift');
    if (s) s.value = getShiftDefault();

    const ft = $('footerTahun');
    if (ft) ft.textContent = new Date().getFullYear();

    /* 2. Init tabs */
    if (APP.initTabs) APP.initTabs();

    /* 3. Init kontrol rekap */
    if (APP.initRekapControls) APP.initRekapControls();

    /* 4. Bind event form */
    if (APP.bindFormEvents) APP.bindFormEvents();

    /* 5. Bind event help */
    bindHelpEvents();

    /* 6. Tampilkan overlay + set flag syncing */
    APP.ensureSyncOverlay();
    const ov = $('syncOverlay');
    if (ov) ov.classList.add('active');
    APP.setIsSyncing(true);

    /* 7. Load konfigurasi (Max Jejer) — paralel, tidak memblokir */
    loadKonfigurasi();

    /* 8. Load daftar mesin */
    loadDaftarMesin();

    /* 9. Load master SPK paralel */
    loadMasterSPK();
  });

})();
