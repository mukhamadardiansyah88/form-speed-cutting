/* ============================================================
   REKAP — FILTER (Kontrol Tanggal & Shift)
   ============================================================
   - Set tanggal awal default: hari ini - 6
   - Combo tanggal akhir otomatis: awal + 0..6 hari
   - Checkbox shift → render ulang saat berubah
   ============================================================ */

(function () {

  const APP = window.APP = window.APP || {};
  const $ = APP.$;

  /* ============================================================
     INIT KONTROL REKAP
     ============================================================ */
  function initRekapControls() {
    const awal = $('rekapTanggalAwal');
    const akhir = $('rekapTanggalAkhir');
    const btnLoad = $('btnLoadRekap');

    const today = APP.ymd(new Date());
    const hMinus6 = APP.addDays(today, -6);

    if (awal) {
      awal.value = hMinus6;
      awal.addEventListener('change', rebuildComboAkhir);
    }

    rebuildComboAkhir();

    if (btnLoad) btnLoad.addEventListener('click', APP.loadRekap);

    /* Checkbox shift → render ulang */
    const filterShift = $('filterShift');
    if (filterShift) {
      filterShift.addEventListener('change', APP.renderRekapFromCache);
    }
  }
  APP.initRekapControls = initRekapControls;

  /* ============================================================
     REBUILD COMBO TANGGAL AKHIR
     ============================================================
     Setelah user pilih tanggal awal → combo akhir berisi
     tanggal awal + 0..6 hari (max 7 hari).
     Default: awal + 6.
     ============================================================ */
  function rebuildComboAkhir() {
    const awal = $('rekapTanggalAwal');
    const akhir = $('rekapTanggalAkhir');
    if (!awal || !akhir) return;

    akhir.innerHTML = '';
    const start = awal.value;
    if (!start) return;

    for (let i = 0; i < 7; i++) {
      const tgl = APP.addDays(start, i);
      const opt = document.createElement('option');
      opt.value = tgl;
      opt.textContent = APP.ymdToLocale(tgl);
      akhir.appendChild(opt);
    }
    akhir.value = APP.addDays(start, 6);
  }
  APP.rebuildComboAkhir = rebuildComboAkhir;

  /* ============================================================
     GET CHECKED VALUES (helper)
     ============================================================
     Ambil array nilai checkbox yang dicentang di container.
     ============================================================ */
  function getCheckedValues(containerId) {
    const wrap = $(containerId);
    if (!wrap) return [];
    const arr = [];
    wrap.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      if (cb.checked) arr.push(cb.value);
    });
    return arr;
  }
  APP.getCheckedValues = getCheckedValues;

})();
