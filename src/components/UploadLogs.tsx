import React, { useState } from 'react';
import { UploadRecord } from '../types';
import { Clock, FileSpreadsheet, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface UploadLogsProps {
  uploads: UploadRecord[];
  onDeleteUpload: (id: string) => void;
}

export const UploadLogs: React.FC<UploadLogsProps> = ({ uploads, onDeleteUpload }) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const confirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteUpload(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
      
      {/* Page Title */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-navy">Riwayat Unggah</h2>
        <p className="text-muted text-sm mt-1">Kelola dan pantau seluruh file statistik yang pernah diunggah.</p>
      </div>

      {/* Upload Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
        <div className="bg-white p-4 border border-border-blue rounded-[14px] shadow-sm flex items-center gap-4">
          <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-navy">{uploads.length}</div>
            <div className="text-[11px] font-bold uppercase text-muted tracking-wide mt-1">Total File</div>
          </div>
        </div>
        <div className="bg-white p-4 border border-border-blue rounded-[14px] shadow-sm flex items-center gap-4">
          <div className="bg-[#159570]/10 p-2 rounded-lg text-[#159570]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-navy">{uploads.length}</div>
            <div className="text-[11px] font-bold uppercase text-muted tracking-wide mt-1">Berhasil</div>
          </div>
        </div>
        <div className="bg-white p-4 border border-border-blue rounded-[14px] shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 p-2 rounded-lg text-primary">
            <Loader2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-navy">0</div>
            <div className="text-[11px] font-bold uppercase text-muted tracking-wide mt-1">Diproses</div>
          </div>
        </div>
        <div className="bg-white p-4 border border-border-blue rounded-[14px] shadow-sm flex items-center gap-4">
          <div className="bg-red-100 p-2 rounded-lg text-[#DC3545]">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-navy">0</div>
            <div className="text-[11px] font-bold uppercase text-muted tracking-wide mt-1">Gagal</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[16px] shadow-sm border border-border-blue p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-navy">Daftar File</h2>
        </div>
        
        {uploads.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-navy">Belum ada riwayat unggah file.</p>
            <p className="text-sm">Silakan unggah file Excel pada halaman utama.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border-blue text-muted text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-3">Nama File</th>
                  <th className="px-6 py-3">Tahun Data</th>
                  <th className="px-6 py-3">Waktu Diunggah</th>
                  <th className="px-6 py-3">Jumlah Baris</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {uploads.map((upload) => (
                  <tr key={upload.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-navy flex items-center gap-2">
                      <div className="bg-[#159570]/10 p-1.5 rounded text-[#159570]">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      {upload.filename}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-sky text-primary px-2 py-1 rounded-md font-bold text-xs">
                        {upload.year}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted text-xs">{upload.timestamp}</td>
                    <td className="px-6 py-4 text-navy font-semibold">{upload.totalRows.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="bg-[#159570]/10 text-[#159570] px-2 py-1 rounded-md font-bold text-xs inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Berhasil
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setDeleteConfirmId(upload.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Hapus Data Ini"
                        aria-label="Hapus File"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal (Glassmorphism) */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[18px] shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-navy mb-2">Hapus file ini?</h3>
            <p className="text-muted text-sm mb-6 leading-relaxed">
              Data yang terkait dengan file akan ikut dihapus dari dashboard. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-bold text-navy bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-bold text-white bg-[#DC3545] hover:bg-red-700 rounded-lg transition-colors shadow-sm"
              >
                Hapus File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
