import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { AllData, DataSektoral } from '../types';
import { UploadCloud, AlertCircle, FileSpreadsheet, CheckCircle2, Download, ArrowRight, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { parseExcelSmart, normalizeSektoralRow } from '../utils/comparisonService';

interface FileUploadProps {
  onDataLoaded: (data: AllData, filename: string, year: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [activeUploadMode, setActiveUploadMode] = useState<'standard' | 'convert2025'>('standard');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('2025');

  // State for Special 2025 Converter Preview
  const [previewRows, setPreviewRows] = useState<DataSektoral[]>([]);
  const [convertedFilename, setConvertedFilename] = useState<string>('');
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Standard Smart Upload (Handles 3 sheets or single sheet automatically)
  const processStandardFile = (file: File) => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Mohon unggah file dengan format Excel (.xlsx atau .xls).');
      setIsLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Use smart parser which automatically handles standard sheets AND custom 2025 single sheets!
        const allData: AllData = parseExcelSmart(workbook, selectedYear);

        if (allData.eWalidata.length === 0 && allData.sektoral.length === 0 && allData.spasial.length === 0) {
           setError('Gagal membaca data dari Excel. Pastikan file berisi tabel data.');
           setIsLoading(false);
           return;
        }

        const totalRows = allData.eWalidata.length + allData.sektoral.length + allData.spasial.length;
        setSuccessMsg(`Berhasil membaca ${totalRows} baris data (e-Walidata: ${allData.eWalidata.length}, Sektoral: ${allData.sektoral.length}, Spasial: ${allData.spasial.length}).`);
        
        onDataLoaded(allData, file.name, selectedYear);
        setIsLoading(false);
      } catch (err: any) {
        setError(`Terjadi kesalahan: ${err.message}`);
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Gagal membaca file Excel');
      setIsLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  // Special 2025 Sektoral Converter (Preview, normalize columns, download standard .xlsx or import)
  const processConvertFile = (file: File) => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    setPreviewRows([]);

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Mohon unggah file dengan format Excel (.xlsx atau .xls).');
      setIsLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Read first or matching sheet
        const sheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('sektoral') || s.toLowerCase().includes('2025')) || workbook.SheetNames[0];
        const rawJson: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (!rawJson || rawJson.length === 0) {
          setError('File Excel kosong atau tidak memiliki baris data.');
          setIsLoading(false);
          return;
        }

        // Get detected raw columns
        const firstRow = rawJson[0] || {};
        const cols = Object.keys(firstRow);
        setDetectedColumns(cols);

        // Convert into standard DataSektoral
        const converted = rawJson.map((row, idx) => normalizeSektoralRow(row, idx, selectedYear));
        setPreviewRows(converted);
        setConvertedFilename(file.name);
        setSuccessMsg(`Berhasil mengonversi format Excel 2025! Terdeteksi ${converted.length} baris data dari kolom: ${cols.slice(0, 5).join(', ')}${cols.length > 5 ? '...' : ''}`);
        setIsLoading(false);
      } catch (err: any) {
        setError(`Gagal mengonversi file Excel 2025: ${err.message}`);
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (activeUploadMode === 'standard') {
        processStandardFile(e.dataTransfer.files[0]);
      } else {
        processConvertFile(e.dataTransfer.files[0]);
      }
    }
  }, [activeUploadMode, selectedYear]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (activeUploadMode === 'standard') {
        processStandardFile(e.target.files[0]);
      } else {
        processConvertFile(e.target.files[0]);
      }
    }
  };

  // Direct import converted 2025 data into database
  const handleImportConverted = () => {
    if (previewRows.length === 0) return;
    const allData: AllData = {
      eWalidata: [],
      sektoral: previewRows,
      spasial: []
    };
    onDataLoaded(allData, convertedFilename || 'Data_Sektoral_2025_Converted.xlsx', selectedYear);
  };

  // Download converted standardized Excel file with 3 sheets
  const handleDownloadStandardizedExcel = () => {
    if (previewRows.length === 0) return;
    const wb = XLSX.utils.book_new();

    const cleanSektoral = previewRows.map((r, i) => ({
      No: i + 1,
      'Kode Data': r['Kode Data'],
      'Uraian DSSD': r['Uraian DSSD'],
      Satuan: r.Satuan,
      'Definisi Operasional': r['Definisi Operasional'],
      'Tag urusan': r['Tag urusan'],
      'Produsen Data': r['Produsen Data'],
      'Info Sub Kegiatan': r['Info Sub Kegiatan'] || ''
    }));

    const wsSektoral = XLSX.utils.json_to_sheet(cleanSektoral);
    const wsEWalidata = XLSX.utils.json_to_sheet([]);
    const wsSpasial = XLSX.utils.json_to_sheet([]);

    XLSX.utils.book_append_sheet(wb, wsEWalidata, 'e-Walidata');
    XLSX.utils.book_append_sheet(wb, wsSektoral, 'Data Sektoral');
    XLSX.utils.book_append_sheet(wb, wsSpasial, 'Data Spasial');

    const downloadName = `Data_Sektoral_${selectedYear}_Standar_Terkonversi.xlsx`;
    XLSX.writeFile(wb, downloadName);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Mode Switcher Tabs */}
      <div className="flex bg-surface-container/60 p-1.5 rounded-2xl border border-primary/20 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setActiveUploadMode('standard')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeUploadMode === 'standard'
              ? 'bg-primary text-on-primary shadow-md'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Unggah Standar & Deteksi Otomatis</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveUploadMode('convert2025')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeUploadMode === 'convert2025'
              ? 'bg-primary text-on-primary shadow-md'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Konversi Format Sektoral 2025</span>
        </button>
      </div>

      {/* Year Selection Card */}
      <div className="bg-surface-container-low/40 backdrop-blur-xl p-4 rounded-2xl border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <label className="text-xs sm:text-sm font-semibold text-on-surface block">
            Tahun Periode Data:
          </label>
          <p className="text-[11px] text-on-surface-variant">
            Data yang diunggah akan otomatis dilabeli tahun ini untuk perbandingan.
          </p>
        </div>
        <select 
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-3.5 py-2 bg-surface-container-highest/60 border border-outline-variant/30 rounded-xl text-on-surface font-semibold focus:outline-none focus:border-primary/50 text-sm cursor-pointer"
        >
          {Array.from({length: 9}, (_, i) => 2022 + i).map(year => (
            <option key={year} value={year} className="bg-[#1a1d21] text-white">
              Tahun {year}
            </option>
          ))}
        </select>
      </div>

      {/* Main Drag-and-Drop Area */}
      <div 
        className={`flex flex-col items-center justify-center rounded-2xl border border-dashed px-4 sm:px-6 py-10 sm:py-14 transition-all duration-300 backdrop-blur-xl text-center ${
          isDragging ? 'border-primary bg-primary/10' : 'border-outline-variant/30 bg-surface-container-low/40 hover:bg-surface-container/60 hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadCloud className={`mx-auto h-12 w-12 mb-3 transition-colors ${isDragging ? 'text-primary' : 'text-on-surface-variant'}`} aria-hidden="true" />
        
        <div className="flex flex-col sm:flex-row items-center text-sm sm:text-base leading-6 text-on-surface-variant justify-center font-medium gap-1 sm:gap-0">
          <label
            htmlFor="file-upload"
            className="relative cursor-pointer rounded-lg bg-primary-container/20 sm:bg-transparent px-4 py-2 sm:p-0 font-bold text-primary focus-within:outline-none hover:text-primary-fixed transition-colors"
          >
            <span>{activeUploadMode === 'standard' ? 'Pilih file Excel (.xlsx / .xls)' : 'Pilih file Excel Sektoral 2025'}</span>
            <input id="file-upload" name="file-upload" type="file" accept=".xlsx,.xls" className="sr-only" onChange={handleFileInput} />
          </label>
          <p className="hidden sm:inline sm:pl-2">atau seret dan lepas ke sini</p>
        </div>

        <p className="text-xs sm:text-sm leading-5 text-on-surface-variant/70 mt-3 font-mono max-w-md">
          {activeUploadMode === 'standard' 
            ? 'Mendukung file Excel 3 Sheet (e-Walidata, Sektoral, Spasial) maupun file single-sheet.' 
            : 'Mendukung format khusus 2025 dengan kolom Nama Data / Indikator / OPD / dsb. Sistem akan otomatis menormalkan kolom.'}
        </p>
        
        {isLoading && (
          <div className="mt-6 flex items-center justify-center text-xs sm:text-sm text-primary font-bold uppercase tracking-wider font-mono">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Memproses & menormalkan data...
          </div>
        )}
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="p-4 bg-error-container/20 backdrop-blur-md rounded-2xl flex items-start border border-error/30">
          <AlertCircle className="h-5 w-5 text-error mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-xs sm:text-sm text-error font-medium">{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/15 backdrop-blur-md rounded-2xl flex items-start border border-emerald-500/30">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-xs sm:text-sm text-emerald-300 font-medium">{successMsg}</p>
        </div>
      )}

      {/* Converted 2025 Preview & Actions Section */}
      {previewRows.length > 0 && activeUploadMode === 'convert2025' && (
        <div className="bg-surface-container-low/70 backdrop-blur-xl rounded-2xl p-5 border border-primary/20 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/15 pb-4">
            <div>
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Hasil Konversi Format Data Sektoral 2025 ({previewRows.length} baris)
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Semua kolom telah dinormalisasi ke format standar Data Sektoral.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadStandardizedExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold border border-outline-variant/30 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .xlsx Standar</span>
              </button>

              <button
                type="button"
                onClick={handleImportConverted}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all shadow-md cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Impor ke Sistem ({selectedYear})</span>
              </button>
            </div>
          </div>

          {/* Preview Table (Top 5 Rows) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant font-mono uppercase tracking-wider">
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Kode Data</th>
                  <th className="py-2.5 px-3">Uraian DSSD (Terkonversi)</th>
                  <th className="py-2.5 px-3">Satuan</th>
                  <th className="py-2.5 px-3">Tag Urusan</th>
                  <th className="py-2.5 px-3">Produsen Data (OPD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 font-sans">
                {previewRows.slice(0, 5).map((row, idx) => (
                  <tr key={`prev-${idx}`} className="hover:bg-surface-variant/20">
                    <td className="py-2.5 px-3 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono text-primary">{row['Kode Data']}</td>
                    <td className="py-2.5 px-3 font-medium text-on-surface max-w-xs truncate">{row['Uraian DSSD']}</td>
                    <td className="py-2.5 px-3">{row.Satuan}</td>
                    <td className="py-2.5 px-3">{row['Tag urusan']}</td>
                    <td className="py-2.5 px-3 font-semibold">{row['Produsen Data']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewRows.length > 5 && (
              <p className="text-[11px] text-on-surface-variant/70 text-center py-2 italic font-mono">
                ...dan {previewRows.length - 5} baris lainnya siap diimpor.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Guide Card */}
      <div className="bg-surface-container-low/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-primary/20 shadow-sm">
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 sm:mb-4 font-mono flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
          Fleksibilitas Format Excel
        </h2>
        <p className="text-xs sm:text-sm text-on-surface mb-3 sm:mb-4">
          Sistem mendukung format standar maupun format kustom OPD/Klien 2025:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-surface-container/40 p-3.5 rounded-xl border border-outline-variant/10 text-xs space-y-1.5">
            <span className="font-bold text-primary block font-mono">Format Standar (3 Sheet):</span>
            <p className="text-on-surface-variant text-[11px]">
              Sheet: <strong>e-Walidata</strong>, <strong>Data Sektoral</strong>, dan <strong>Data Spasial</strong>.
            </p>
          </div>
          <div className="bg-surface-container/40 p-3.5 rounded-xl border border-outline-variant/10 text-xs space-y-1.5">
            <span className="font-bold text-amber-400 block font-mono">Format Kustom Sektoral 2025:</span>
            <p className="text-on-surface-variant text-[11px]">
              Toleran terhadap variasi nama kolom (contoh: <em>Nama Data, Indikator, Judul, OPD, Satuan, Keterangan</em>).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
