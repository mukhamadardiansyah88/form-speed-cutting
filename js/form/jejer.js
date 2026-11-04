/* ============================================================
   FORM — JEJER (Dropdown Dinamis)
   ============================================================
   Jejer = berapa banyak plastik rol disusun berjajar
   dalam sekali potong. Nilai: 1 .. maxJejer (dari sheet Mesin J2).

   - buildJejerInput(initValue): generate <select> 1..maxJejer
     * default kosong ("-- Pilih --") kalau initValue tidak valid
   - getJejerValue(): ambil nilai terpilih (string angka atau '')
   - isJejerValid(): true kalau sudah dipilih (bukan kosong)
   - resetJejer(): bersihkan container & kosongkan pilihan
   ============================================================ */

(function () {

  const APP = window.APP = window.APP || {};
  const $ = APP.$;

  /* State lokal */
  let jejerSelect = null;
  let jejerValid = false;

  /* ============================================================
     BUILD JEJER INPUT
     ============================================================
     @param {string|number|null} initValue — nilai awal (boleh kosong)
     ============================================================ */
  function buildJejerInput(initValue) {
    const container = $('jejerContainer');
    if (!container) return;

    container.innerHTML = '';
    jejerSelect = null;
    jejerValid = false;

    const maxJejer = APP.getMaxJejer() || 1;

    /* Section */
    const section = document.createElement('div');
    section.className = 'jejer-group';

    const lbl = document.createElement('label');
    lbl.setAttribute('for', 'jejerSelect');
    lbl.textContent = 'Jejer';
    section.appendChild(lbl);

    /* Select */
    const sel = document.createElement('select');
    sel.id = 'jejerSelect';
    sel.className = 'jejer-select';

    /* Opsi kosong */
    const optEmpty = document.createElement('option');
    optEmpty.value = '';
    optEmpty.textContent = '-- Pilih --';
    sel.appendChild(optEmpty);

    /* Opsi 1..maxJejer */
    for (let i = 1; i <= maxJejer; i++) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = String(i);
      sel.appendChild(opt);
    }

    /* Set nilai awal kalau valid */
    const initStr = (initValue == null) ? '' : String(initValue).trim();
    if (initStr !== '') {
      const n = Number(initStr);
      if (!isNaN(n) && n >= 1 && n <= maxJejer) {
        sel.value = String(Math.floor(n));
      }
    }

    /* Event change → update valid state + OK button */
    sel.addEventListener('change', function () {
      validateJejer();
      if (APP.updateOkState) APP.updateOkState();
    });

    section.appendChild(sel);
    container.appendChild(section);

    jejerSelect = sel;
    validateJejer();

    /* Update tombol OK setelah build */
    if (APP.updateOkState) APP.updateOkState();
  }
  APP.buildJejerInput = buildJejerInput;

  /* ============================================================
     VALIDASI
     ============================================================ */
  function validateJejer() {
    if (!jejerSelect) {
      jejerValid = false;
      return false;
    }
    const val = String(jejerSelect.value || '').trim();
    if (val === '') {
      jejerValid = false;
      return false;
    }
    const n = Number(val);
    const max = APP.getMaxJejer() || 1;
    jejerValid = (!isNaN(n) && n >= 1 && n <= max);
    return jejerValid;
  }

  /* ============================================================
     GET VALID STATE (dipakai di input.js updateOkState)
     ============================================================ */
  function isJejerValid() { return jejerValid; }
  APP.isJejerValid = isJejerValid;

  /* ============================================================
     GET NILAI JEJER
     ============================================================
     Return string angka (mis. "5") atau "" kalau belum dipilih.
     ============================================================ */
  function getJejerValue() {
    if (!jejerSelect) return '';
    const val = String(jejerSelect.value || '').trim();
    return val;
  }
  APP.getJejerValue = getJejerValue;

  /* ============================================================
     RESET
     ============================================================ */
  function resetJejer() {
    jejerSelect = null;
    jejerValid = false;
    const container = $('jejerContainer');
    if (container) container.innerHTML = '';
  }
  APP.resetJejer = resetJejer;

})();
