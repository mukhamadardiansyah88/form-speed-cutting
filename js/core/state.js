/* ============================================================
   CORE — STATE GLOBAL + GETTER/SETTER
   ============================================================
   Menyimpan semua state aplikasi di satu tempat.
   Modul lain (form/, rekap/) mengakses lewat window.APP.
   ============================================================ */

(function () {

  const APP = window.APP = window.APP || {};

  /* ============================================================
     STATE INTERNAL
     ============================================================ */

  /* Daftar mesin (array of string, urut sheet Mesin) */
  let daftarMesin = [];

  /* Detail mesin: { [namaMesin]: { mesin, supplier, suhuLabels: [..] } }
     suhuLabels = array label suhu yang terisi di sheet Mesin
     Contoh PT01: suhuLabels = ['A']
     Contoh PT26: suhuLabels = ['A1','A2','A3','B1','B2','B3']
     Contoh PTPM: suhuLabels = ['Pisau','Rubber Tube 1','Rubber Tube 2','Tank','Spray Gun 1','Spray Gun 2'] */
  let mesinDetailMap = {};

  /* Data tersimpan di server: { [mesin]: [ { id, noSPK, speed, suhu: [..] } ] } */
  let hasilInput = {};

  /* Data belum disimpan (pending): { [mesin]: [ { noSPK, speed, suhu: [..] } ] } */
  let pendingInput = {};

  /* Master SPK dari DB Drive (cache): { [noSPK]: { noSPK, jenisPlastik, kodeJenis, tebal, lebar, lipat, panjangPot, bd } } */
  let masterSPK = {};
  let masterSPKLoaded = false;
  let masterSPKLoading = false;

  /* Flag operasi */
  let isSyncing = false;
  let isSaving = false;

  /* Cache UI */
  let toastTimer = null;
  let lastSummaryText = '';
  let lastRekapText = '';

  /* Rekap */
  let rekapLoaded = false;
  let rekapRawData = [];

  /* ============================================================
     KONSTANTA
     ============================================================ */

  /* Label shift untuk tampilan */
  const SHIFT_LABEL = {
    'SHIFT-PAGI': 'PAGI',
    'SHIFT-SORE': 'SORE',
    'SHIFT-MALAM': 'MALAM'
  };

  /* Satuan (untuk label di inputbox) */
  const SATUAN_SPEED = 'pcs/menit';
  const SATUAN_SUHU = '°C';

  /* ============================================================
     GETTER / SETTER
     ============================================================ */

  /* --- Daftar Mesin --- */
  APP.getDaftarMesin = function () { return daftarMesin; };
  APP.setDaftarMesin = function (v) { daftarMesin = v; };

  /* --- Detail Mesin (suhuLabels per mesin) --- */
  APP.getMesinDetailMap = function () { return mesinDetailMap; };
  APP.setMesinDetailMap = function (v) { mesinDetailMap = v; };

  /* --- Hasil Input (server) --- */
  APP.getHasilInput = function () { return hasilInput; };
  APP.setHasilInput = function (v) { hasilInput = v; };

  /* --- Pending Input (belum disimpan) --- */
  APP.getPendingInput = function () { return pendingInput; };
  APP.setPendingInput = function (v) { pendingInput = v; };

  /* --- Master SPK --- */
  APP.getMasterSPK = function () { return masterSPK; };
  APP.setMasterSPK = function (v) { masterSPK = v; };

  APP.getMasterSPKLoaded = function () { return masterSPKLoaded; };
  APP.setMasterSPKLoaded = function (v) { masterSPKLoaded = v; };

  APP.getMasterSPKLoading = function () { return masterSPKLoading; };
  APP.setMasterSPKLoading = function (v) { masterSPKLoading = v; };

  /* --- Flag Operasi --- */
  APP.getIsSyncing = function () { return isSyncing; };
  APP.setIsSyncing = function (v) { isSyncing = v; };

  APP.getIsSaving = function () { return isSaving; };
  APP.setIsSaving = function (v) { isSaving = v; };

  /* --- Cache UI --- */
  APP.getToastTimer = function () { return toastTimer; };
  APP.setToastTimer = function (v) { toastTimer = v; };

  APP.getLastSummaryText = function () { return lastSummaryText; };
  APP.setLastSummaryText = function (v) { lastSummaryText = v; };

  APP.getLastRekapText = function () { return lastRekapText; };
  APP.setLastRekapText = function (v) { lastRekapText = v; };

  /* --- Rekap --- */
  APP.getRekapLoaded = function () { return rekapLoaded; };
  APP.setRekapLoaded = function (v) { rekapLoaded = v; };

  APP.getRekapRawData = function () { return rekapRawData; };
  APP.setRekapRawData = function (v) { rekapRawData = v; };

  /* ============================================================
     KONSTANTA EKSPOR
     ============================================================ */
  APP.SHIFT_LABEL = SHIFT_LABEL;
  APP.SATUAN_SPEED = SATUAN_SPEED;
  APP.SATUAN_SUHU = SATUAN_SUHU;

})();
