APP.__debug.state()
// {
//   daftarMesin: ["PT01","PT02",...],
//   mesinDetailMap: { PT01: { mesin: "PT01", supplier: "Jaya Abadi", suhuLabels: ["A"] }, ... },
//   hasilInput: { PT01: [ { id, noSPK, speed, suhu } ] },
//   pendingInput: { PT02: [ { noSPK, speed, suhu } ] },
//   isSyncing: false,
//   isSaving: false,
//   rekapLoaded: false
// }

APP.__debug.mesin()
// Tabel: mesin | supplier | suhuLabels

APP.__debug.spk('12345')
// { noSPK: "12345", jenisPlastik: "PP Keunguan", ..., panjangPot: "25", bd: "18" }

APP.__debug.rekap()
// [ { id, tanggal, mesin, noSPK, shift, speed, suhu }, ... ]
