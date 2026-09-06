import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { AllData } from '../types';
import { UploadCloud, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onDataLoaded: (data: AllData, filename: string, year: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = (file: File) => {
    setIsLoading(true);
    setError(null);
    
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

        // Helper to trim object keys and values
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

        const eWalidataSheet = workbook.SheetNames.find(s => s.toLowerCase().includes('walidata') || s.includes('Sheet1')) || workbook.SheetNames[0];
        const sektoralSheet = workbook.SheetNames.find(s => s.toLowerCase().includes('sektoral') || s.includes('Sheet2')) || workbook.SheetNames[1];
        const spasialSheet = workbook.SheetNames.find(s => s.toLowerCase().includes('spasial') || s.includes('Sheet3')) || workbook.SheetNames[2];

        const allData: AllData = {
          eWalidata: eWalidataSheet ? cleanData(XLSX.utils.sheet_to_json(workbook.Sheets[eWalidataSheet])) : [],
          sektoral: sektoralSheet ? cleanData(XLSX.utils.sheet_to_json(workbook.Sheets[sektoralSheet])) : [],
          spasial: spasialSheet ? cleanData(XLSX.utils.sheet_to_json(workbook.Sheets[spasialSheet])) : [],
        };

        if (allData.eWalidata.length === 0 && allData.sektoral.length === 0 && allData.spasial.length === 0) {
           setError('Gagal membaca data dari Excel. Pastikan format kolom sesuai.');
           setIsLoading(false);
           return;
        }

        onDataLoaded(allData, file.name, selectedYear);
        setIsLoading(false);
      } catch (err: any) {
        setError(`Terjadi kesalahan: ${err.message}`);
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Gagal membaca file');
      setIsLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-20 lg:pb-8">
      <div className="bg-surface-container-low/40 backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <label className="text-xs sm:text-sm font-medium text-on-surface-variant">Tahun Data File yang Akan Diunggah:</label>
        <select 
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-3 py-2 bg-surface-container-highest/50 border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:border-primary/50 transition-colors font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23ccc3d8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2em_1.2em] bg-[right_0.5rem_center] bg-no-repeat cursor-pointer pr-8 text-sm"
        >
          {Array.from({length: 9}, (_, i) => 2022 + i).map(year => (
            <option key={year} value={year} className="bg-[#1a1d21] text-white">{year}</option>
          ))}
        </select>
      </div>
      <div 
        className={`flex flex-col items-center justify-center rounded-2xl border border-dashed px-4 sm:px-6 py-10 sm:py-16 transition-all duration-300 backdrop-blur-xl text-center ${
          isDragging ? 'border-primary bg-primary/10' : 'border-outline-variant/30 bg-surface-container-low/40 hover:bg-surface-container/60 hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadCloud className={`mx-auto h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 transition-colors ${isDragging ? 'text-primary' : 'text-on-surface-variant'}`} aria-hidden="true" />
        <div className="flex flex-col sm:flex-row items-center text-sm sm:text-base leading-6 text-on-surface-variant justify-center font-medium gap-1 sm:gap-0">
          <label
            htmlFor="file-upload"
            className="relative cursor-pointer rounded-lg bg-primary-container/20 sm:bg-transparent px-4 py-2 sm:p-0 font-bold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-surface hover:text-primary-fixed transition-colors"
          >
            <span>Pilih file Excel</span>
            <input id="file-upload" name="file-upload" type="file" accept=".xlsx,.xls" className="sr-only" onChange={handleFileInput} />
          </label>
          <p className="hidden sm:inline sm:pl-2">atau seret dan lepas ke sini</p>
        </div>
        <p className="text-xs sm:text-sm leading-5 text-on-surface-variant/70 mt-3 font-mono max-w-sm">Mendukung file dengan 3 Sheet: e-Walidata, Sektoral, Spasial (.xlsx)</p>
        
        {isLoading && (
          <div className="mt-6 flex items-center justify-center text-xs sm:text-sm text-primary font-bold uppercase tracking-wider font-mono">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Memproses data...
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3.5 sm:p-4 bg-error-container/20 backdrop-blur-md rounded-2xl flex items-start border border-error/30">
          <AlertCircle className="h-5 w-5 text-error mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-xs sm:text-sm text-error font-medium">{error}</p>
        </div>
      )}

      <div className="mt-6 bg-surface-container-low/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-primary/20 shadow-sm">
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 sm:mb-4 font-mono flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
          Panduan Format Data
        </h2>
        <p className="text-xs sm:text-sm text-on-surface mb-3 sm:mb-4">Pastikan file Excel memiliki 3 Sheet dengan struktur Header berikut:</p>
        
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-surface-container/40 p-3 sm:p-4 rounded-xl border border-outline-variant/10">
            <span className="text-xs font-bold text-primary uppercase tracking-widest block mb-2 sm:mb-3 font-mono">1. e-Walidata</span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {['No', 'Kode DSSD', 'Uraian DSSD', 'Satuan', 'Definisi Operasional', 'Tag urusan', 'Produsen Data'].map(header => (
                <span key={header} className="bg-surface px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-mono text-on-surface-variant border border-outline-variant/20 shadow-sm">
                  {header}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-surface-container/40 p-3 sm:p-4 rounded-xl border border-outline-variant/10">
             <span className="text-xs font-bold text-tertiary uppercase tracking-widest block mb-2 sm:mb-3 font-mono">2. Data Sektoral</span>
             <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {['No', 'Kode Data', 'Uraian DSSD', 'Satuan', 'Definisi Operasional', 'Tag urusan', 'Produsen Data', 'Info Sub Kegiatan'].map(header => (
                <span key={header} className="bg-surface px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-mono text-on-surface-variant border border-outline-variant/20 shadow-sm">
                  {header}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-surface-container/40 p-3 sm:p-4 rounded-xl border border-outline-variant/10">
            <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-2 sm:mb-3 font-mono">3. Data Spasial</span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {['No', 'Kode Data', 'Nama Informasi Geospasial', 'Format penyimpanan', 'Skala', 'Produsen Data'].map(header => (
                <span key={header} className="bg-surface px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-mono text-on-surface-variant border border-outline-variant/20 shadow-sm">
                  {header}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
