/* ============================================================
   FORM — SPEED INPUT
   ============================================================
   Di extruder ada validasi min/max + RENTANG_SATUAN.
   Di cutting:
   - Tidak ada validasi min/max
   - Tidak ada RENTANG_SATUAN
   - Hanya sanitasi angka (desimal koma) + update OK state
   - Satuan label "pcs/menit" ditampilkan di HTML (index.html)
   ============================================================ */

(function () {

  const APP = window.APP = window.APP || {};
  const $ = APP.$;

  /* ============================================================
     ON SPEED CHANGE
     ============================================================
     Dipanggil saat user mengetik di #speedInput
     ============================================================ */
  function onSpeedChange() {
    const el = $('speedInput');
    if (!el) return;

    sanitizeSpeedInput(el);
    APP.updateOkState();
  }
  APP.onSpeedChange = onSpeedChange;

  /* ============================================================
     SANITASI INPUT SPEED
     ============================================================
     - Titik → koma
     - Hanya angka & koma
     - Hanya 1 koma
     ============================================================ */
  function sanitizeSpeedInput(el) {
    let v = el.value;

    /* Titik → koma */
    v = v.replace(/\./g, ',');

    /* Hanya angka & koma */
    v = v.replace(/[^0-9,]/g, '');

    /* Hanya 1 koma */
    const firstComma = v.indexOf(',');
    if (firstComma !== -1) {
      const head = v.substring(0, firstComma + 1);
      const tail = v.substring(firstComma + 1).replace(/,/g, '');
      v = head + tail;
    }

    if (v !== el.value) el.value = v;
  }
  APP.sanitizeSpeedInput = sanitizeSpeedInput;

  /* ============================================================
     GET SPEED VALUE (string bersih)
     ============================================================ */
  function getSpeedValue() {
    const el = $('speedInput');
    if (!el) return '';
    return (el.value || '').trim();
  }
  APP.getSpeedValue = getSpeedValue;

  /* ============================================================
     RESET SPEED
     ============================================================ */
  function resetSpeed() {
    const el = $('speedInput');
    if (el) el.value = '';
  }
  APP.resetSpeed = resetSpeed;

})();
