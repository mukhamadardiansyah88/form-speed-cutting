/* ============================================================
   FORM — SUHU DINAMIS
   ============================================================
   Menghasilkan inputbox suhu sesuai jumlah & label suhu
   yang terisi di sheet Mesin untuk mesin tersebut.

   Contoh:
   - PT01 (labels: ["A"]) → 1 input "Suhu A"
   - PT26 (labels: ["A1","A2","A3","B1","B2","B3"]) → 6 input
   - PTPM (labels: ["Pisau","Rubber Tube 1",...]) → 6 input
   - Mesin tanpa suhu → tampil "Mesin ini tidak memiliki thermocontrol."
   ============================================================ */

(function () {

  const APP = window.APP = window.APP || {};
  const $ = APP.$;

  /* State lokal */
  let suhuInputs = [];  /* [{ label, el }, ...] */
  let suhuValid = true;

  /* ============================================================
     BUILD SUHU INPUTS
     ============================================================
     @param {string} namaMesin
     @param {Array} initValues — array nilai awal (boleh kosong)
     ============================================================ */
  function buildSuhuInputs(namaMesin, initValues) {
    const container = $('suhuContainer');
    if (!container) return;

    container.innerHTML = '';
    suhuInputs = [];
    suhuValid = true;

    const detail = APP.getMesinDetailMap()[namaMesin];
    const labels = (detail && Array.isArray(detail.suhuLabels)) ? detail.suhuLabels : [];

    /* Kalau tidak ada suhu */
    if (labels.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'suhu-empty';
      empty.textContent = 'Mesin ini tidak memiliki thermocontrol.';
      container.appendChild(empty);
      APP.updateOkState();
      return;
    }

    /* Section */
    const section = document.createElement('div');
    section.className = 'suhu-section';

    const title = document.createElement('div');
    title.className = 'suhu-section-title';
    title.textContent = 'Suhu Thermocontrol';
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'suhu-grid';

    labels.forEach(function (label, idx) {
      const item = document.createElement('div');
      item.className = 'suhu-item';

      /* Label */
      const lbl = document.createElement('label');
      lbl.setAttribute('for', 'suhuInput_' + idx);
      const lblText = document.createElement('span');
      lblText.className = 'suhu-label-text';
      lblText.textContent = 'Suhu ' + label;
      lbl.appendChild(lblText);
      const unitHint = document.createElement('span');
      unitHint.className = 'unit-hint';
      unitHint.textContent = '(' + APP.SATUAN_SUHU + ')';
      lbl.appendChild(unitHint);

      /* Input */
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.id = 'suhuInput_' + idx;
      inp.setAttribute('inputmode', 'decimal');
      inp.setAttribute('autocomplete', 'off');
      inp.placeholder = '0';
      inp.dataset.suhuIndex = String(idx);

      /* Nilai awal */
      const initVal = (initValues && initValues[idx] != null) ? initValues[idx] : '';
      inp.value = initVal != null ? String(initVal) : '';

      /* Event: sanitasi + validasi */
      inp.addEventListener('input', function () {
        sanitizeSuhuInput(inp);
        validateSuhuInputs();
        APP.updateOkState();
      });

      item.appendChild(lbl);
      item.appendChild(inp);
      grid.appendChild(item);

      suhuInputs.push({ label: label, el: inp });
    });

    section.appendChild(grid);
    container.appendChild(section);

    validateSuhuInputs();
    APP.updateOkState();
  }
  APP.buildSuhuInputs = buildSuhuInputs;

  /* ============================================================
     SANITASI INPUT SUHU
     ============================================================
     - Ganti titik jadi koma (untuk desimal)
     - Hanya angka & koma
     - Hanya 1 koma
     ============================================================ */
  function sanitizeSuhuInput(el) {
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

  /* ============================================================
     VALIDASI SUHU
     ============================================================
     Semua boleh kosong. Kalau diisi, harus angka valid (>0).
     ============================================================ */
  function validateSuhuInputs() {
    suhuValid = true;

    for (let i = 0; i < suhuInputs.length; i++) {
      const el = suhuInputs[i].el;
      const raw = (el.value || '').trim();
      if (raw === '') continue;

      const num = APP.speedKeAngka(raw);
      if (num === null || num <= 0) {
        suhuValid = false;
        break;
      }
    }
    return suhuValid;
  }
  APP.validateSuhuInputs = validateSuhuInputs;

  /* ============================================================
     GET VALID STATE (dipakai di input.js untuk enable OK)
     ============================================================ */
  function isSuhuValid() { return suhuValid; }
  APP.isSuhuValid = isSuhuValid;

  /* ============================================================
     GET NILAI SUHU
     ============================================================
     Return array string sepanjang labels, dengan "" untuk kosong.
     Contoh: ["180", "", "200", "", "", ""]
     ============================================================ */
  function getSuhuValues() {
    const out = [];
    for (let i = 0; i < suhuInputs.length; i++) {
      const raw = (suhuInputs[i].el.value || '').trim();
      out.push(raw);
    }
    return out;
  }
  APP.getSuhuValues = getSuhuValues;

  /* ============================================================
     RESET SUHU (kalau perlu)
     ============================================================ */
  function resetSuhu() {
    suhuInputs.forEach(function (item) {
      item.el.value = '';
    });
    suhuValid = true;
    const container = $('suhuContainer');
    if (container) container.innerHTML = '';
    suhuInputs = [];
  }
  APP.resetSuhu = resetSuhu;

})();
