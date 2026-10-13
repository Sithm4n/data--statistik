import * as XLSX from 'xlsx';
import { AllData, DataEWalidata, DataSektoral, DataSpasial, ComparisonItem, ComparisonSummary } from '../types';

/**
 * Normalizes text for comparison (removes redundant spacing, ignores case)
 */
export const normalizeText = (text?: string): string => {
  if (!text) return '';
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
};

/**
 * Normalizes raw row object from Excel to standard DataSektoral
 * Handles variations in column naming (e.g. 2025 formats with 'Nama Data', 'Judul Data', 'OPD', 'Indikator')
 */
export const normalizeSektoralRow = (row: any, index: number, year: string): DataSektoral => {
  // Helper to find first matching key case-insensitively
  const getVal = (...keys: string[]): string => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
        return String(row[key]).trim();
      }
      // Check case-insensitive
      const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== '') {
        return String(row[foundKey]).trim();
      }
    }
    return '';
  };

  const noVal = getVal('No', 'NO', 'No.', 'Nomor', 'no', 'id') || String(index + 1);
  const kodeData = getVal(
    'Kode Data', 'Kode DSSD', 'Kode Indikator', 'Kode', 'KODE DATA', 'KODE', 
    'Kode_Data', 'Id Data', 'Kode Variabel', 'Kode Elemen'
  ) || `DSSD.${year}.${(index + 1).toString().padStart(3, '0')}`;
  
  const uraianDSSD = getVal(
    'Uraian DSSD', 'Uraian Data', 'Nama Data', 'Judul Data', 'Nama Indikator', 
    'Indikator', 'Uraian', 'Elemen Data', 'Variabel', 'Nama Variabel', 'DSSD',
    'Uraian DSSD / Indikator', 'Data', 'Judul'
  );

  const satuan = getVal('Satuan', 'SATUAN', 'Unit', 'Satuan Ukuran', 'Satuan Data', 'Satuan Indikator') || '-';
  
  const definisiOperasional = getVal(
    'Definisi Operasional', 'Definisi', 'DO', 'Definisi / Keterangan', 
    'Deskripsi', 'Keterangan', 'Penjelasan', 'Definisi Konsep'
  ) || '-';

  const tagUrusan = getVal(
    'Tag urusan', 'Tag Urusan', 'Urusan', 'Bidang Urusan', 
    'Urusan Pemerintahan', 'Sektor', 'Tag', 'Bidang'
  ) || 'Umum';

  const produsenData = getVal(
    'Produsen Data', 'Produsen', 'Perangkat Daerah', 'OPD', 
    'SKPD', 'Instansi', 'Unit Kerja', 'Walidata Pendukung'
  ) || 'Dinas / Badan Terkait';

  const subKegiatan = getVal(
    'Info Sub Kegiatan', 'Sub Kegiatan', 'Kegiatan', 'Program', 
    'Sub-Kegiatan', 'Program / Kegiatan', 'Sumber Data', 'Keterangan Tambahan'
  ) || '';

  return {
    No: noVal,
    'Kode Data': kodeData,
    'Uraian DSSD': uraianDSSD,
    Satuan: satuan,
    'Definisi Operasional': definisiOperasional,
    'Tag urusan': tagUrusan,
    'Produsen Data': produsenData,
    'Info Sub Kegiatan': subKegiatan,
    Tahun: year,
  };
};

/**
 * Normalizes raw row object for eWalidata
 */
export const normalizeEWalidataRow = (row: any, index: number, year: string): DataEWalidata => {
  const getVal = (...keys: string[]): string => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
        return String(row[key]).trim();
      }
      const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== '') {
        return String(row[foundKey]).trim();
      }
    }
    return '';
  };

  return {
    No: getVal('No', 'NO', 'No.', 'Nomor') || String(index + 1),
    'Kode DSSD': getVal('Kode DSSD', 'Kode Data', 'Kode', 'KODE DSSD', 'Kode Indikator') || `EWAL.${year}.${(index + 1).toString().padStart(3, '0')}`,
    'Uraian DSSD': getVal('Uraian DSSD', 'Uraian Data', 'Nama Data', 'Judul Data', 'Nama Indikator', 'Indikator', 'Uraian'),
    Satuan: getVal('Satuan', 'SATUAN', 'Unit') || '-',
    'Definisi Operasional': getVal('Definisi Operasional', 'Definisi', 'DO', 'Deskripsi') || '-',
    'Tag urusan': getVal('Tag urusan', 'Tag Urusan', 'Urusan', 'Bidang Urusan') || 'Umum',
    'Produsen Data': getVal('Produsen Data', 'Produsen', 'Perangkat Daerah', 'OPD', 'SKPD') || 'Dinas / Badan Terkait',
    Tahun: year,
  };
};

/**
 * Normalizes raw row object for Spasial
 */
export const normalizeSpasialRow = (row: any, index: number, year: string): DataSpasial => {
  const getVal = (...keys: string[]): string => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
        return String(row[key]).trim();
      }
      const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== '') {
        return String(row[foundKey]).trim();
      }
    }
    return '';
  };

  return {
    No: getVal('No', 'NO', 'No.', 'Nomor') || String(index + 1),
    'Kode Data': getVal('Kode Data', 'Kode Spasial', 'Kode', 'KODE') || `SPA.${year}.${(index + 1).toString().padStart(3, '0')}`,
    'Nama Informasi Geospasial': getVal('Nama Informasi Geospasial', 'Nama Informasi', 'Nama Data', 'Judul Data', 'Nama Peta', 'Uraian'),
    'Format penyimpanan': getVal('Format penyimpanan', 'Format penyimpanan data', 'Format Penyimpanan Data', 'Format Data', 'Format') || 'SHP / GeoJSON',
    Skala: getVal('Skala', 'SKALA', 'Scale') || '1:25.000',
    'Produsen Data': getVal('Produsen Data', 'Produsen', 'Perangkat Daerah', 'OPD', 'SKPD') || 'Dinas / Badan Terkait',
    Tahun: year,
  };
};

/**
 * Smart inspect and parse Excel workbook
 * Automatically detects whether it has 3 sheets or a single custom 2025 Sektoral sheet
 */
export const parseExcelSmart = (workbook: XLSX.WorkBook, defaultYear: string): AllData => {
  const cleanData = (sheetData: any[]) => {
    return sheetData.map(row => {
      const newRow: any = {};
      Object.keys(row).forEach(key => {
        const cleanKey = key.trim();
        newRow[cleanKey] = typeof row[key] === 'string' ? row[key].trim() : row[key];
      });
      return newRow;
    });
  };

  const sheetNames = workbook.SheetNames;
  
  // Find sheets
  const eWalidataSheetName = sheetNames.find(s => {
    const l = s.toLowerCase();
    return l.includes('walidata') || l.includes('e-walidata');
  });

  const sektoralSheetName = sheetNames.find(s => {
    const l = s.toLowerCase();
    return l.includes('sektoral') || l.includes('dssd') || l.includes('statistik');
  });

  const spasialSheetName = sheetNames.find(s => {
    const l = s.toLowerCase();
    return l.includes('spasial') || l.includes('geospasial') || l.includes('peta');
  });

  // If only 1 sheet exists, or no standard naming:
  if (sheetNames.length === 1 && !eWalidataSheetName && !spasialSheetName) {
    const singleSheetName = sheetNames[0];
    const rawRows = cleanData(XLSX.utils.sheet_to_json(workbook.Sheets[singleSheetName]));
    
    // Check if it's Sektoral (most common case for 2025 client files)
    const convertedSektoral = rawRows.map((r, i) => normalizeSektoralRow(r, i, defaultYear));
    return {
      eWalidata: [],
      sektoral: convertedSektoral,
      spasial: []
    };
  }

  // Multi-sheet or standard sheets
  const rawEWalidata = eWalidataSheetName ? cleanData(XLSX.utils.sheet_to_json(workbook.Sheets[eWalidataSheetName])) : [];
  const rawSektoral = sektoralSheetName ? cleanData(XLSX.utils.sheet_to_json(workbook.Sheets[sektoralSheetName])) : [];
  const rawSpasial = spasialSheetName ? cleanData(XLSX.utils.sheet_to_json(workbook.Sheets[spasialSheetName])) : [];

  return {
    eWalidata: rawEWalidata.map((r, i) => normalizeEWalidataRow(r, i, defaultYear)),
    sektoral: rawSektoral.map((r, i) => normalizeSektoralRow(r, i, defaultYear)),
    spasial: rawSpasial.map((r, i) => normalizeSpasialRow(r, i, defaultYear)),
  };
};

/**
 * Compare two sets of data between baseYear and compareYear
 */
export const compareYearData = (
  baseRows: any[],
  compareRows: any[],
  category: 'sektoral' | 'eWalidata' | 'spasial',
  baseYear: string,
  compareYear: string
): { items: ComparisonItem[]; summary: ComparisonSummary } => {
  const getKode = (r: any) => (r['Kode Data'] || r['Kode DSSD'] || '').trim();
  const getUraian = (r: any) => (r['Uraian DSSD'] || r['Nama Informasi Geospasial'] || r['Nama Data'] || '').trim();
  const getProdusen = (r: any) => (r['Produsen Data'] || r['Perangkat Daerah'] || '').trim();
  const getSatuan = (r: any) => (r['Satuan'] || r['Format penyimpanan'] || r['Format Penyimpanan Data'] || '').trim();
  const getDefinisi = (r: any) => (r['Definisi Operasional'] || r['Skala'] || '').trim();
  const getUrusan = (r: any) => (r['Tag urusan'] || '').trim();
  const getSubKeg = (r: any) => (r['Info Sub Kegiatan'] || '').trim();

  const items: ComparisonItem[] = [];

  // Map base rows for quick lookup by Kode and by (normalized Uraian + Produsen)
  const baseByKode = new Map<string, any>();
  const baseByName = new Map<string, any>();

  baseRows.forEach(row => {
    const kode = getKode(row);
    if (kode) baseByKode.set(kode.toLowerCase(), row);

    const nameKey = `${normalizeText(getUraian(row))}|${normalizeText(getProdusen(row))}`;
    baseByName.set(nameKey, row);
  });

  const matchedBaseKeys = new Set<any>();

  // Iterate over compareRows to detect NEW, MODIFIED, and SAME
  compareRows.forEach((compRow, idx) => {
    const compKode = getKode(compRow);
    const compUraian = getUraian(compRow);
    const compProdusen = getProdusen(compRow);
    const compSatuan = getSatuan(compRow);
    const compDef = getDefinisi(compRow);
    const compUrusan = getUrusan(compRow);
    const compSubKeg = getSubKeg(compRow);

    const nameKey = `${normalizeText(compUraian)}|${normalizeText(compProdusen)}`;

    // Try matching by kode first, then by name
    let matchedBase = compKode ? baseByKode.get(compKode.toLowerCase()) : null;
    if (!matchedBase) {
      matchedBase = baseByName.get(nameKey);
    }

    if (!matchedBase) {
      // NEW data in compare year
      items.push({
        id: `comp-new-${idx}`,
        category,
        kode: compKode,
        kodeCompare: compKode,
        uraian: compUraian,
        uraianCompare: compUraian,
        satuan: compSatuan,
        satuanCompare: compSatuan,
        definisi: compDef,
        definisiCompare: compDef,
        produsen: compProdusen,
        urusan: compUrusan,
        subKegiatan: compSubKeg,
        status: 'NEW',
        differences: ['Data Baru pada Tahun ' + compareYear],
        trend: 'UP',
      });
    } else {
      matchedBaseKeys.add(matchedBase);
      const baseKode = getKode(matchedBase);
      const baseUraian = getUraian(matchedBase);
      const baseSatuan = getSatuan(matchedBase);
      const baseDef = getDefinisi(matchedBase);
      const baseUrusan = getUrusan(matchedBase);

      const differences: string[] = [];
      if (normalizeText(baseKode) !== normalizeText(compKode) && baseKode && compKode) {
        differences.push(`Kode Berubah (${baseKode} → ${compKode})`);
      }
      if (normalizeText(baseUraian) !== normalizeText(compUraian)) {
        differences.push(`Uraian Indikator Berubah`);
      }
      if (normalizeText(baseSatuan) !== normalizeText(compSatuan)) {
        differences.push(`Satuan Berubah (${baseSatuan} → ${compSatuan})`);
      }
      if (normalizeText(baseDef) !== normalizeText(compDef) && baseDef !== '-' && compDef !== '-') {
        differences.push(`Definisi Operasional Diperbarui`);
      }
      if (normalizeText(baseUrusan) !== normalizeText(compUrusan) && baseUrusan && compUrusan) {
        differences.push(`Tag Urusan Berubah`);
      }

      if (differences.length > 0) {
        // MODIFIED
        items.push({
          id: `comp-mod-${idx}`,
          category,
          kode: compKode || baseKode,
          kodeBase: baseKode,
          kodeCompare: compKode,
          uraian: compUraian,
          uraianBase: baseUraian,
          uraianCompare: compUraian,
          satuan: compSatuan,
          satuanBase: baseSatuan,
          satuanCompare: compSatuan,
          definisi: compDef,
          definisiBase: baseDef,
          definisiCompare: compDef,
          produsen: compProdusen || getProdusen(matchedBase),
          urusan: compUrusan,
          subKegiatan: compSubKeg,
          status: 'MODIFIED',
          differences,
          trend: 'SAME',
        });
      } else {
        // SAME
        items.push({
          id: `comp-same-${idx}`,
          category,
          kode: compKode || baseKode,
          kodeBase: baseKode,
          kodeCompare: compKode,
          uraian: compUraian,
          uraianBase: baseUraian,
          uraianCompare: compUraian,
          satuan: compSatuan,
          satuanBase: baseSatuan,
          satuanCompare: compSatuan,
          definisi: compDef,
          definisiBase: baseDef,
          definisiCompare: compDef,
          produsen: compProdusen,
          urusan: compUrusan,
          subKegiatan: compSubKeg,
          status: 'SAME',
          differences: [],
          trend: 'SAME',
        });
      }
    }
  });

  // Check for REMOVED data (present in base, but missing in compare)
  let removedIdx = 0;
  baseRows.forEach(baseRow => {
    if (!matchedBaseKeys.has(baseRow)) {
      items.push({
        id: `comp-rem-${removedIdx++}`,
        category,
        kode: getKode(baseRow),
        kodeBase: getKode(baseRow),
        uraian: getUraian(baseRow),
        uraianBase: getUraian(baseRow),
        satuan: getSatuan(baseRow),
        satuanBase: getSatuan(baseRow),
        definisi: getDefinisi(baseRow),
        definisiBase: getDefinisi(baseRow),
        produsen: getProdusen(baseRow),
        urusan: getUrusan(baseRow),
        subKegiatan: getSubKeg(baseRow),
        status: 'REMOVED',
        differences: [`Tidak Ada Lagi pada Tahun ${compareYear}`],
        trend: 'DOWN',
      });
    }
  });

  const newCount = items.filter(i => i.status === 'NEW').length;
  const modifiedCount = items.filter(i => i.status === 'MODIFIED').length;
  const sameCount = items.filter(i => i.status === 'SAME').length;
  const removedCount = items.filter(i => i.status === 'REMOVED').length;

  const totalBase = baseRows.length;
  const totalCompare = compareRows.length;
  const diffTotal = totalCompare - totalBase;
  const percentChange = totalBase > 0 ? (diffTotal / totalBase) * 100 : totalCompare > 0 ? 100 : 0;

  const summary: ComparisonSummary = {
    baseYear,
    compareYear,
    totalBase,
    totalCompare,
    newCount,
    modifiedCount,
    removedCount,
    sameCount,
    percentChange: Math.round(percentChange * 10) / 10,
  };

  return { items, summary };
};
