/* ============================================================
   REKAP — RENDER TABEL
   ============================================================
   - Tabel: baris = mesin, kolom = tanggal × shift (filtered)
   - Cell = speed (gabung dengan " · " kalau multi)
   - Tidak ada below-min (tidak ada validasi min/max)
   - Double click / long press pada cell → bukaInfoDetail
   - Double click / long press pada nama mesin → bukaRekapMesin
   - Field jejer disertakan supaya tampil di detail cell
   ============================================================ */

(function () {

  const APP = window.APP = window.APP || {};
  const $ = APP.$;

  const LONG_PRESS_DURATION = 500;
  let pressTimer = null;

  /* ============================================================
     RENDER REKAP FROM CACHE
     ============================================================ */
  function renderRekapFromCache() {
    if (!APP.getRekapLoaded()) return;

    const table = $('rekapTable');
    const thead = $('rekapThead');
    const tbody = $('rekapTbody');
    const empty = $('rekapEmpty');
    if (!table || !thead || !tbody) return;

    const awal = $('rekapTanggalAwal').value;
    const akhir = $('rekapTanggalAkhir').value;
    if (!awal || !akhir) return;

    const shiftChecked = APP.getCheckedValues('filterShift');

    /* Kalau tidak ada shift dipilih → kosongkan */
    if (shiftChecked.length === 0) {
      thead.innerHTML = '';
      tbody.innerHTML = '';
      table.classList.add('hidden');
      if (empty) {
        empty.classList.remove('hidden');
        empty.textContent = 'Pilih minimal satu shift.';
      }
      return;
    }

    /* Daftar tanggal (max 7 hari) */
    const tanggalList = [];
    for (let i = 0; i < 7; i++) {
      const tgl = APP.addDays(awal, i);
      if (tgl > akhir) break;
      tanggalList.push(tgl);
    }

    /* Daftar mesin (semua, urut sheet) */
    const mesinList = APP.getDaftarMesin();
    if (!mesinList || mesinList.length === 0) {
      thead.innerHTML = '';
      tbody.innerHTML = '';
      table.classList.add('hidden');
      if (empty) {
        empty.classList.remove('hidden');
        empty.textContent = 'Tidak ada mesin.';
      }
      return;
    }

    /* Index data: map[mesin][tanggal][shift] = [ { id, noSPK, speed, jejer, suhu } ] */
    const map = {};
    APP.getRekapRawData().forEach(function (r) {
      if (shiftChecked.indexOf(r.shift) === -1) return;
      if (!map[r.mesin]) map[r.mesin] = {};
      if (!map[r.mesin][r.tanggal]) map[r.mesin][r.tanggal] = {};
      if (!map[r.mesin][r.tanggal][r.shift]) map[r.mesin][r.tanggal][r.shift] = [];
      map[r.mesin][r.tanggal][r.shift].push({
        id: r.id,
        noSPK: r.noSPK,
        speed: r.speed,
        jejer: r.jejer || '',
        suhu: r.suhu || []
      });
    });

    /* ==================== HEADER ==================== */
    thead.innerHTML = '';

    /* Baris 1: tanggal */
    const trTop = document.createElement('tr');
    const thMesinTop = document.createElement('th');
    thMesinTop.rowSpan = 2;
    thMesinTop.className = 'th-mesin header-mesin-top';
    thMesinTop.textContent = 'MESIN';
    trTop.appendChild(thMesinTop);

    tanggalList.forEach(function (tgl) {
      const th = document.createElement('th');
      th.colSpan = shiftChecked.length;
      th.className = 'th-group header-date';
      th.textContent = APP.ymdToDDMMYY(tgl);
      trTop.appendChild(th);
    });
    thead.appendChild(trTop);

    /* Baris 2: shift */
    const trBottom = document.createElement('tr');
    tanggalList.forEach(function () {
      shiftChecked.forEach(function (sh) {
        const th = document.createElement('th');
        th.className = 'th-shift header-shift';
        th.textContent = APP.SHIFT_LABEL[sh] || sh;
        trBottom.appendChild(th);
      });
    });
    thead.appendChild(trBottom);

    /* ==================== BODY ==================== */
    tbody.innerHTML = '';

    mesinList.forEach(function (mesin) {
      const tr = document.createElement('tr');

      /* Kolom mesin */
      const tdMesin = document.createElement('td');
      tdMesin.className = 'cell-mesin cell-mesin-highlight cell-clickable';
      tdMesin.textContent = mesin;
      tr.appendChild(tdMesin);

      const contextMesin = {
        mesin: mesin,
        tanggalList: tanggalList.slice(),
        shiftChecked: shiftChecked.slice()
      };

      tdMesin.addEventListener('dblclick', function () {
        if (APP.bukaRekapMesin) APP.bukaRekapMesin(contextMesin);
      });
      tdMesin.addEventListener('touchstart', function () {
        pressTimer = setTimeout(function () {
          APP.vibrate();
          if (APP.bukaRekapMesin) APP.bukaRekapMesin(contextMesin);
        }, LONG_PRESS_DURATION);
      }, { passive: true });
      tdMesin.addEventListener('touchend', function () {
        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      });
      tdMesin.addEventListener('touchmove', function () {
        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      });

      /* Kolom speed per tanggal × shift */
      tanggalList.forEach(function (tgl) {
        shiftChecked.forEach(function (sh) {
          const td = document.createElement('td');
          td.className = 'cell-speed';

          const arr = (map[mesin] && map[mesin][tgl] && map[mesin][tgl][sh]) || [];

          if (arr.length === 0) {
            td.textContent = '—';
          } else {
            td.textContent = arr.map(function (item) { return item.speed; }).join(' · ');
            if (arr.length > 1) td.classList.add('multi-data');
            td.dataset.items = JSON.stringify(arr);
            td.classList.add('cell-clickable');

            const contextData = {
              mesin: mesin,
              tanggal: APP.ymdToDDMMYY(tgl),
              shift: APP.SHIFT_LABEL[sh] || sh,
              items: arr
            };

            td.addEventListener('dblclick', function () {
              if (APP.bukaInfoDetail) APP.bukaInfoDetail(contextData);
            });
            td.addEventListener('touchstart', function () {
              pressTimer = setTimeout(function () {
                APP.vibrate();
                if (APP.bukaInfoDetail) APP.bukaInfoDetail(contextData);
              }, LONG_PRESS_DURATION);
            }, { passive: true });
            td.addEventListener('touchend', function () {
              if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
            });
            td.addEventListener('touchmove', function () {
              if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
            });
          }

          tr.appendChild(td);
        });
      });

      tbody.appendChild(tr);
    });

    table.classList.remove('hidden');
    if (empty) empty.classList.add('hidden');
  }
  APP.renderRekapFromCache = renderRekapFromCache;

})();
