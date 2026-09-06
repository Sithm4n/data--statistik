import React, { useState } from 'react';
import { UploadRecord } from '../types';
import { FileSpreadsheet, Trash2, CheckCircle2, Inbox, RefreshCw, XCircle, Download, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface UploadLogsProps {
  uploads: UploadRecord[];
  onDeleteUpload: (id: string) => void;
}

export const UploadLogs: React.FC<UploadLogsProps> = ({ uploads, onDeleteUpload }) => {
  const [fileToDelete, setFileToDelete] = useState<UploadRecord | null>(null);
  const totalFiles = uploads.length;
  // Mocking status logic - in a real app this might have processing states
  const successCount = uploads.length;
  const processingCount = 0;
  const failedCount = 0;

  const handleDownload = (upload: UploadRecord) => {
    try {
      const workbook = XLSX.utils.book_new();

      // Helper function to remove internal fields
      const cleanDataForExport = (dataArray: any[]) => {
        return dataArray.map(item => {
          const cleaned = { ...item };
          // Remove internal tracking fields before export
          delete cleaned._lastModified;
          delete cleaned._uploadTime;
          delete cleaned._uploadId;
          delete cleaned._originalIndex;
          delete cleaned._rowId;
          return cleaned;
        });
      };

      if (upload.data.eWalidata && upload.data.eWalidata.length > 0) {
        const wsEWalidata = XLSX.utils.json_to_sheet(cleanDataForExport(upload.data.eWalidata));
        XLSX.utils.book_append_sheet(workbook, wsEWalidata, 'eWalidata');
      }
      
      if (upload.data.sektoral && upload.data.sektoral.length > 0) {
        const wsSektoral = XLSX.utils.json_to_sheet(cleanDataForExport(upload.data.sektoral));
        XLSX.utils.book_append_sheet(workbook, wsSektoral, 'Sektoral');
      }

      if (upload.data.spasial && upload.data.spasial.length > 0) {
        const wsSpasial = XLSX.utils.json_to_sheet(cleanDataForExport(upload.data.spasial));
        XLSX.utils.book_append_sheet(workbook, wsSpasial, 'Spasial');
      }

      // If workbook is completely empty (no sheets added), add an empty sheet to prevent errors
      if (workbook.SheetNames.length === 0) {
        const wsEmpty = XLSX.utils.json_to_sheet([{ "Info": "Tidak ada data" }]);
        XLSX.utils.book_append_sheet(workbook, wsEmpty, 'Data');
      }

      XLSX.writeFile(workbook, upload.filename);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Terjadi kesalahan saat mengunduh file.');
    }
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-8 py-6 sm:py-12 gap-6 sm:gap-8 relative overflow-hidden min-h-[calc(100vh-5rem)] pb-24 lg:pb-12">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[100px] sm:blur-[120px] -z-10 mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-tertiary-container/10 rounded-full blur-[80px] sm:blur-[100px] -z-10 pointer-events-none"></div>

      {/* Header Section */}
      <div className="flex flex-col gap-1.5 sm:gap-2 relative z-10">
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-on-surface tracking-tight bg-gradient-to-br from-on-surface to-on-surface-variant bg-clip-text text-transparent">Riwayat Unggah</h1>
        <p className="text-xs sm:text-base text-on-surface-variant max-w-2xl">Kelola dan pantau seluruh file statistik yang pernah diunggah. Visualisasikan proses sinkronisasi data Anda secara real-time.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 z-10">
        {/* Card 1: Total */}
        <div className="flex items-center gap-3 sm:gap-6 p-3.5 sm:p-6 rounded-2xl bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-on-surface/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-secondary-container/30 border border-secondary/20 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="text-secondary w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-2xl sm:text-4xl font-bold text-on-surface leading-none mb-1">{totalFiles}</span>
            <span className="font-mono text-[10px] sm:text-xs text-on-surface-variant uppercase tracking-wider font-medium truncate">Total File</span>
          </div>
        </div>

        {/* Card 2: Berhasil */}
        <div className="flex items-center gap-3 sm:gap-6 p-3.5 sm:p-6 rounded-2xl bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <CheckCircle2 className="text-primary w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-2xl sm:text-4xl font-bold text-on-surface leading-none mb-1">{successCount}</span>
            <span className="font-mono text-[10px] sm:text-xs text-on-surface-variant uppercase tracking-wider font-medium truncate">Berhasil</span>
          </div>
        </div>

        {/* Card 3: Diproses */}
        <div className="flex items-center gap-3 sm:gap-6 p-3.5 sm:p-6 rounded-2xl bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-tertiary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-tertiary-container/30 border border-tertiary/30 flex items-center justify-center shrink-0">
            <RefreshCw className="text-tertiary w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-2xl sm:text-4xl font-bold text-on-surface leading-none mb-1 text-on-surface-variant/50">{processingCount}</span>
            <span className="font-mono text-[10px] sm:text-xs text-on-surface-variant uppercase tracking-wider font-medium truncate">Diproses</span>
          </div>
        </div>

        {/* Card 4: Gagal */}
        <div className="flex items-center gap-3 sm:gap-6 p-3.5 sm:p-6 rounded-2xl bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-error/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-error-container/20 border border-error/30 flex items-center justify-center shrink-0">
            <XCircle className="text-error w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-2xl sm:text-4xl font-bold text-on-surface leading-none mb-1 text-on-surface-variant/50">{failedCount}</span>
            <span className="font-mono text-[10px] sm:text-xs text-on-surface-variant uppercase tracking-wider font-medium truncate">Gagal</span>
          </div>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="flex flex-col flex-1 rounded-2xl sm:rounded-3xl bg-surface-container-lowest/60 backdrop-blur-2xl border border-outline-variant/20 shadow-[0_16px_40px_rgba(0,0,0,0.3)] relative z-10 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/40">
          <h2 className="text-base sm:text-xl font-medium text-on-surface">Daftar File</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-surface-container/40 backdrop-blur-md">
                <th className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-[11px] sm:text-xs text-on-surface-variant tracking-wider font-medium">NAMA FILE</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-[11px] sm:text-xs text-on-surface-variant tracking-wider font-medium">TAHUN DATA</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-[11px] sm:text-xs text-on-surface-variant tracking-wider font-medium">WAKTU DIUNGGAH</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-[11px] sm:text-xs text-on-surface-variant tracking-wider font-medium text-right">JUMLAH BARIS</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-[11px] sm:text-xs text-on-surface-variant tracking-wider font-medium text-center">STATUS</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-[11px] sm:text-xs text-on-surface-variant tracking-wider font-medium text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm text-on-surface">
              {uploads.map((upload) => (
                <tr key={upload.id} className="group hover:bg-surface-variant/10 transition-colors border-b border-outline-variant/5">
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-surface-variant/50 flex items-center justify-center border border-outline-variant/20 shrink-0">
                        <FileSpreadsheet className="text-secondary w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <span className="font-medium text-on-surface group-hover:text-primary transition-colors truncate max-w-[200px] sm:max-w-none">{upload.filename}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-primary-container/20 text-primary border border-primary/20 font-mono text-[11px] sm:text-xs font-medium">
                      {upload.year}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-on-surface-variant whitespace-nowrap">{upload.uploadTime}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-mono text-xs sm:text-sm text-on-surface">
                    {upload.totalRows.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-[10px] sm:text-[11px] uppercase tracking-wide font-medium whitespace-nowrap">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Berhasil
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <button 
                        onClick={() => handleDownload(upload)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant/50 text-on-surface-variant hover:text-primary transition-colors" 
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setFileToDelete(upload)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-error-container/30 text-on-surface-variant hover:text-error transition-colors cursor-pointer" 
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {uploads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 opacity-40">
                      <div className="w-16 h-16 rounded-full bg-surface-variant/30 flex items-center justify-center border border-outline-variant/10">
                        <Inbox className="w-8 h-8 text-on-surface-variant" />
                      </div>
                      <p className="text-sm text-on-surface-variant">Belum ada file yang diunggah</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr className="border-b border-outline-variant/5">
                  <td className="px-6 py-12 text-center" colSpan={6}>
                    <div className="flex flex-col items-center justify-center gap-3 opacity-40">
                      <div className="w-16 h-16 rounded-full bg-surface-variant/30 flex items-center justify-center border border-outline-variant/10">
                        <Inbox className="w-8 h-8 text-on-surface-variant" />
                      </div>
                      <p className="text-sm text-on-surface-variant">Akhir dari riwayat unggahan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-container-low border border-error/30 rounded-3xl p-6 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-error-container/20 border border-error/30 text-error flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Hapus File Terunggah?</h3>
            <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
              Anda akan menghapus file <strong className="text-on-surface font-mono">{fileToDelete.filename}</strong>. Seluruh data terkait pada dashboard juga akan ikut dihapus.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 text-xs font-medium transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUpload(fileToDelete.id);
                  setFileToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-error text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md shadow-error/20 cursor-pointer"
              >
                Ya, Hapus File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
