import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { AllData } from '../types';
import { UploadCloud, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onDataLoaded: (data: AllData) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

        onDataLoaded(allData);
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
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 transition-colors bg-white ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:bg-slate-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadCloud className="mx-auto h-10 w-10 text-slate-400 mb-4" aria-hidden="true" />
        <div className="flex text-sm leading-6 text-slate-600 justify-center">
          <label
            htmlFor="file-upload"
            className="relative cursor-pointer rounded bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
          >
            <span>Unggah file Excel</span>
            <input id="file-upload" name="file-upload" type="file" accept=".xlsx,.xls" className="sr-only" onChange={handleFileInput} />
          </label>
          <p className="pl-1">atau seret dan lepas ke sini</p>
        </div>
        <p className="text-xs leading-5 text-slate-400 mt-2">Mendukung file dengan 3 Sheet: e-Walidata, Sektoral, Spasial (.xlsx)</p>
        
        {isLoading && (
          <div className="mt-4 flex items-center justify-center text-xs text-blue-600 font-semibold uppercase tracking-wider">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Memproses data...
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg flex items-start border border-red-100">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      <div className="mt-6 bg-slate-50 rounded-xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Panduan Format Data</h2>
        <p className="text-sm text-slate-600 mb-3">Pastikan file Excel memiliki 3 Sheet dengan struktur Header berikut:</p>
        
        <div className="space-y-4">
          <div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-2">1. e-Walidata</span>
            <div className="flex flex-wrap gap-2">
              {['No', 'Kode DSSD', 'Uraian DSSD', 'Satuan', 'Definisi Operasional', 'Tag urusan', 'Produsen Data'].map(header => (
                <span key={header} className="bg-white px-2 py-1 rounded text-xs font-mono text-slate-600 border border-slate-200">
                  {header}
                </span>
              ))}
            </div>
          </div>
          <div>
             <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block mb-2">2. Data Sektoral</span>
             <div className="flex flex-wrap gap-2">
              {['No', 'Kode Data', 'Uraian DSSD', 'Satuan', 'Definisi Operasional', 'Tag urusan', 'Produsen Data', 'Info Sub Kegiatan'].map(header => (
                <span key={header} className="bg-white px-2 py-1 rounded text-xs font-mono text-slate-600 border border-slate-200">
                  {header}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block mb-2">3. Data Spasial</span>
            <div className="flex flex-wrap gap-2">
              {['No', 'Kode Data', 'Nama Informasi Geospasial', 'Format penyimpanan', 'Skala', 'Produsen Data'].map(header => (
                <span key={header} className="bg-white px-2 py-1 rounded text-xs font-mono text-slate-600 border border-slate-200">
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
