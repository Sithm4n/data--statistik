import React from 'react';
import { UploadRecord } from '../types';
import { FileSpreadsheet, Trash2, CheckCircle2, Inbox, RefreshCw, XCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface UploadLogsProps {
  uploads: UploadRecord[];
  onDeleteUpload: (id: string) => void;
}

export const UploadLogs: React.FC<UploadLogsProps> = ({ uploads, onDeleteUpload }) => {
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
    <div className="flex flex-col w-full px-8 py-12 gap-8 relative overflow-hidden min-h-[calc(100vh-5rem)]">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-tertiary-container/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      {/* Header Section */}
      <div className="flex flex-col gap-2 relative z-10">
        <h1 className="text-5xl font-bold text-on-surface tracking-tight bg-gradient-to-br from-on-surface to-on-surface-variant bg-clip-text text-transparent">Riwayat Unggah</h1>
        <p className="text-base text-on-surface-variant max-w-2xl">Kelola dan pantau seluruh file statistik yang pernah diunggah. Visualisasikan proses sinkronisasi data Anda secara real-time.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 z-10">
        {/* Card 1: Total */}
        <div className="flex items-center gap-6 p-6 rounded-2xl bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-on-surface/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-14 h-14 rounded-full bg-secondary-container/30 border border-secondary/20 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="text-secondary w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-bold text-on-surface leading-none mb-1">{totalFiles}</span>
            <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest font-medium">Total File</span>
          </div>
        </div>

        {/* Card 2: Berhasil */}
        <div className="flex items-center gap-6 p-6 rounded-2xl bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <CheckCircle2 className="text-primary w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-bold text-on-surface leading-none mb-1">{successCount}</span>
            <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest font-medium">Berhasil</span>
          </div>
        </div>

        {/* Card 3: Diproses */}
        <div className="flex items-center gap-6 p-6 rounded-2xl bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-tertiary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-14 h-14 rounded-full bg-tertiary-container/30 border border-tertiary/30 flex items-center justify-center shrink-0">
            <RefreshCw className="text-tertiary w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-bold text-on-surface leading-none mb-1 text-on-surface-variant/50">{processingCount}</span>
            <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest font-medium">Diproses</span>
          </div>
        </div>

        {/* Card 4: Gagal */}
        <div className="flex items-center gap-6 p-6 rounded-2xl bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/20 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-error/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-14 h-14 rounded-full bg-error-container/20 border border-error/30 flex items-center justify-center shrink-0">
            <XCircle className="text-error w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-bold text-on-surface leading-none mb-1 text-on-surface-variant/50">{failedCount}</span>
            <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest font-medium">Gagal</span>
          </div>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="flex flex-col flex-1 rounded-3xl bg-surface-container-lowest/60 backdrop-blur-2xl border border-outline-variant/20 shadow-[0_16px_40px_rgba(0,0,0,0.3)] relative z-10 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/40">
          <h2 className="text-xl font-medium text-on-surface">Daftar File</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container/40 backdrop-blur-md">
                <th className="px-6 py-4 font-mono text-xs text-on-surface-variant tracking-wider font-medium">NAMA FILE</th>
                <th className="px-6 py-4 font-mono text-xs text-on-surface-variant tracking-wider font-medium">TAHUN DATA</th>
                <th className="px-6 py-4 font-mono text-xs text-on-surface-variant tracking-wider font-medium">WAKTU DIUNGGAH</th>
                <th className="px-6 py-4 font-mono text-xs text-on-surface-variant tracking-wider font-medium text-right">JUMLAH BARIS</th>
                <th className="px-6 py-4 font-mono text-xs text-on-surface-variant tracking-wider font-medium text-center">STATUS</th>
                <th className="px-6 py-4 font-mono text-xs text-on-surface-variant tracking-wider font-medium text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface">
              {uploads.map((upload) => (
                <tr key={upload.id} className="group hover:bg-surface-variant/10 transition-colors border-b border-outline-variant/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-variant/50 flex items-center justify-center border border-outline-variant/20">
                        <FileSpreadsheet className="text-secondary w-4 h-4" />
                      </div>
                      <span className="font-medium text-on-surface group-hover:text-primary transition-colors">{upload.filename}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full bg-primary-container/20 text-primary border border-primary/20 font-mono text-xs font-medium">
                      {upload.year}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">{upload.uploadTime}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-on-surface">
                    {upload.totalRows.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-[11px] uppercase tracking-wide font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Berhasil
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleDownload(upload)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant/50 text-on-surface-variant hover:text-primary transition-colors" 
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if(window.confirm(`Hapus file ${upload.filename}? Data terkait juga akan terhapus dari dashboard.`)) {
                            onDeleteUpload(upload.id);
                          }
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-error-container/30 text-on-surface-variant hover:text-error transition-colors" 
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
    </div>
  );
};
