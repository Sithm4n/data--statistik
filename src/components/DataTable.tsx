import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Edit2, Check, X as XIcon, Trash2, MoreHorizontal } from 'lucide-react';

interface DataTableProps {
  data: any[];
  type: 'eWalidata' | 'sektoral' | 'spasial';
  onEdit?: (rowIndex: number, newRowData: any) => void;
  onDelete?: (row: any) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ data, type, onEdit, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const rowsPerPage = 10;
  
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = data.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(data.length / rowsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleEditClick = (row: any, globalIndex: number) => {
    setEditingRowIndex(globalIndex);
    setEditFormData({ ...row });
  };

  const handleSaveEdit = () => {
    if (editingRowIndex !== null && onEdit) {
      onEdit(editingRowIndex, editFormData);
    }
    setEditingRowIndex(null);
    setEditFormData(null);
  };

  const handleCancelEdit = () => {
    setEditingRowIndex(null);
    setEditFormData(null);
  };

  return (
    <div className="flex flex-col bg-surface-container-low/40 backdrop-blur-xl border border-primary/20 rounded-3xl overflow-hidden mt-2">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container/60 backdrop-blur-xl border-b border-primary/20">
              <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider whitespace-nowrap w-16">No</th>
              <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Tahun</th>
              {type === 'eWalidata' && (
                <>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Kode DSSD</th>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider min-w-[200px]">Uraian DSSD</th>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Satuan</th>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider min-w-[300px]">Definisi Operasional</th>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Tag Urusan</th>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider min-w-[150px]">Produsen Data</th>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Waktu Upload</th>
                </>
              )}
              {type === 'sektoral' && (
                <>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Kode Data</th>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider min-w-[200px]">Uraian DSSD</th>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Satuan</th>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider min-w-[300px]">Definisi Operasional</th>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Tag Urusan</th>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider min-w-[150px]">Produsen Data</th>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Info Sub Kegiatan</th>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Waktu Upload</th>
                </>
              )}
              {type === 'spasial' && (
                <>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Kode Data</th>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider min-w-[200px]">Nama Informasi Geospasial</th>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Format</th>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Skala</th>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider min-w-[150px]">Produsen Data</th>
                  <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Waktu Upload</th>
                </>
              )}
              <th className="py-4 px-6 font-mono text-xs text-on-surface-variant uppercase tracking-wider whitespace-nowrap text-right sticky right-0 bg-surface-container/90 backdrop-blur-md shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.1)]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {currentRows.map((row, index) => {
              const globalIndex = indexOfFirstRow + index;
              const isEditing = editingRowIndex === globalIndex;

              return (
              <tr key={index} className={`transition-colors group ${isEditing ? 'bg-surface-variant/40' : 'hover:bg-surface-variant/20'}`}>
                <td className="py-5 px-6 font-sans text-sm text-on-surface-variant">{row.No}</td>
                <td className="py-5 px-6 font-sans text-base text-primary font-bold">{row.Tahun || '-'}</td>
                
                {type === 'eWalidata' && (
                  <>
                    <td className="py-5 px-6 font-mono text-xs text-secondary tracking-widest whitespace-nowrap">
                      {isEditing ? <input className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-on-surface focus:border-primary focus:outline-none" value={editFormData['Kode DSSD'] || ''} onChange={e => setEditFormData({...editFormData, 'Kode DSSD': e.target.value})} /> : <span className="bg-secondary/10 text-secondary px-2 py-1 rounded">{row['Kode DSSD']}</span>}
                    </td>
                    <td className="py-5 px-6 font-sans text-sm text-on-surface">
                      {isEditing ? <input className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-on-surface focus:border-primary focus:outline-none" value={editFormData['Uraian DSSD'] || ''} onChange={e => setEditFormData({...editFormData, 'Uraian DSSD': e.target.value})} /> : row['Uraian DSSD']}
                    </td>
                    <td className="py-5 px-6">
                      {isEditing ? <input className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-on-surface focus:border-primary focus:outline-none" value={editFormData.Satuan || ''} onChange={e => setEditFormData({...editFormData, Satuan: e.target.value})} /> : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          row.Satuan?.toLowerCase().includes('laporan') ? 'bg-primary-container/20 text-primary-fixed border-primary/20' :
                          row.Satuan?.toLowerCase().includes('dokumen') ? 'bg-tertiary-container/20 text-tertiary border-tertiary/20' :
                          row.Satuan?.toLowerCase().includes('orang') ? 'bg-secondary-container/20 text-secondary border-secondary/20' :
                          'bg-surface-variant/50 text-on-surface-variant border-outline-variant/30'
                        }`}>
                          {row.Satuan}
                        </span>
                      )}
                    </td>
                    <td className="py-5 px-6 font-sans text-sm text-on-surface-variant min-w-[300px]">
                      {isEditing ? <textarea className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-on-surface focus:border-primary focus:outline-none min-h-[60px]" value={editFormData['Definisi Operasional'] || ''} onChange={e => setEditFormData({...editFormData, 'Definisi Operasional': e.target.value})} /> : <div className="line-clamp-3" title={row['Definisi Operasional']}>{row['Definisi Operasional']}</div>}
                    </td>
                    <td className="py-5 px-6 font-sans text-sm text-on-surface-variant">
                      {isEditing ? <input className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-on-surface focus:border-primary focus:outline-none" value={editFormData['Tag urusan'] || ''} onChange={e => setEditFormData({...editFormData, 'Tag urusan': e.target.value})} /> : row['Tag urusan']}
                    </td>
                    <td className="py-5 px-6 font-sans text-sm text-on-surface">
                      {isEditing ? <input className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-on-surface focus:border-primary focus:outline-none" value={editFormData['Produsen Data'] || ''} onChange={e => setEditFormData({...editFormData, 'Produsen Data': e.target.value})} /> : row['Produsen Data']}
                    </td>
                  </>
                )}
                
                {type === 'sektoral' && (
                  <>
                    <td className="py-5 px-6 font-mono text-xs text-secondary tracking-widest whitespace-nowrap">
                      {isEditing ? <input className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-on-surface focus:border-primary focus:outline-none" value={editFormData['Kode Data'] || ''} onChange={e => setEditFormData({...editFormData, 'Kode Data': e.target.value})} /> : <span className="bg-secondary/10 text-secondary px-2 py-1 rounded">{row['Kode Data']}</span>}
                    </td>
                    <td className="py-5 px-6 font-sans text-sm text-on-surface">
                      {isEditing ? <input className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-on-surface focus:border-primary focus:outline-none" value={editFormData['Uraian DSSD'] || ''} onChange={e => setEditFormData({...editFormData, 'Uraian DSSD': e.target.value})} /> : row['Uraian DSSD']}
                    </td>
                    <td className="py-5 px-6">
                      {isEditing ? <input className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-on-surface focus:border-primary focus:outline-none" value={editFormData.Satuan || ''} onChange={e => setEditFormData({...editFormData, Satuan: e.target.value})} /> : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          row.Satuan?.toLowerCase().includes('laporan') ? 'bg-primary-container/20 text-primary-fixed border-primary/20' :
                          row.Satuan?.toLowerCase().includes('dokumen') ? 'bg-tertiary-container/20 text-tertiary border-tertiary/20' :
                          row.Satuan?.toLowerCase().includes('orang') ? 'bg-secondary-container/20 text-secondary border-secondary/20' :
                          'bg-surface-variant/50 text-on-surface-variant border-outline-variant/30'
                        }`}>
                          {row.Satuan}
                        </span>
                      )}
                    </td>
                    <td className="py-5 px-6 font-sans text-sm text-on-surface-variant min-w-[300px]">
                      {isEditing ? <textarea className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-on-surface focus:border-primary focus:outline-none min-h-[60px]" value={editFormData['Definisi Operasional'] || ''} onChange={e => setEditFormData({...editFormData, 'Definisi Operasional': e.target.value})} /> : <div className="line-clamp-3" title={row['Definisi Operasional']}>{row['Definisi Operasional']}</div>}
                    </td>
                    <td className="py-5 px-6 font-sans text-sm text-on-surface-variant">
                      {isEditing ? <input className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-on-surface focus:border-primary focus:outline-none" value={editFormData['Tag urusan'] || ''} onChange={e => setEditFormData({...editFormData, 'Tag urusan': e.target.value})} /> : row['Tag urusan']}
                    </td>
                    <td className="py-5 px-6 font-sans text-sm text-on-surface">
                      {isEditing ? <input className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-on-surface focus:border-primary focus:outline-none" value={editFormData['Produsen Data'] || ''} onChange={e => setEditFormData({...editFormData, 'Produsen Data': e.target.value})} /> : row['Produsen Data']}
                    </td>
                    <td className="py-5 px-6 font-sans text-sm text-on-surface-variant">
                      {isEditing ? <input className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-on-surface focus:border-primary focus:outline-none" value={editFormData['Info Sub Kegiatan'] || ''} onChange={e => setEditFormData({...editFormData, 'Info Sub Kegiatan': e.target.value})} /> : row['Info Sub Kegiatan']}
                    </td>
                  </>
                )}
                
                {type === 'spasial' && (
                  <>
                    <td className="py-5 px-6 font-mono text-xs text-secondary tracking-widest whitespace-nowrap">
                       {isEditing ? <input className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-on-surface focus:border-primary focus:outline-none" value={editFormData['Kode Data'] || ''} onChange={e => setEditFormData({...editFormData, 'Kode Data': e.target.value})} /> : <span className="bg-secondary/10 text-secondary px-2 py-1 rounded">{row['Kode Data']}</span>}
                    </td>
                    <td className="py-5 px-6 font-sans text-sm text-on-surface">
                       {isEditing ? <input className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-on-surface focus:border-primary focus:outline-none" value={editFormData['Nama Informasi Geospasial'] || ''} onChange={e => setEditFormData({...editFormData, 'Nama Informasi Geospasial': e.target.value})} /> : row['Nama Informasi Geospasial']}
                    </td>
                    <td className="py-5 px-6 font-sans text-sm text-on-surface-variant">
                      {isEditing ? <input className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-on-surface focus:border-primary focus:outline-none" value={editFormData['Format penyimpanan data'] || editFormData['Format Penyimpanan Data'] || editFormData['Format penyimpanan'] || ''} onChange={e => setEditFormData({...editFormData, 'Format penyimpanan data': e.target.value})} /> : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-tertiary-container/20 text-tertiary border-tertiary/20 uppercase tracking-widest font-mono">
                          {row['Format penyimpanan data'] || row['Format Penyimpanan Data'] || row['Format penyimpanan'] || '-'}
                        </span>
                      )}
                    </td>
                    <td className="py-5 px-6 font-sans text-sm text-on-surface-variant whitespace-nowrap">
                      {isEditing ? <input className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-on-surface focus:border-primary focus:outline-none" value={editFormData['Skala'] || ''} onChange={e => setEditFormData({...editFormData, 'Skala': e.target.value})} /> : row['Skala']}
                    </td>
                    <td className="py-5 px-6 font-sans text-sm text-on-surface">
                      {isEditing ? <input className="w-full px-2 py-1 border border-outline-variant rounded bg-surface text-on-surface focus:border-primary focus:outline-none" value={editFormData['Produsen Data'] || ''} onChange={e => setEditFormData({...editFormData, 'Produsen Data': e.target.value})} /> : row['Produsen Data']}
                    </td>
                  </>
                )}
                <td className="py-5 px-6 font-sans text-sm text-on-surface-variant whitespace-nowrap">
                  {row._uploadTime || '-'}<br/>
                  {row._lastModified && <span className="text-[10px] opacity-60 block mt-0.5">Edit: {row._lastModified}</span>}
                </td>
                
                <td className="py-5 px-6 text-right whitespace-nowrap sticky right-0 bg-surface/40 backdrop-blur-sm group-hover:bg-surface-variant/40 transition-colors shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] border-l border-outline-variant/10">
                  {isEditing ? (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={handleSaveEdit} className="w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-primary/20 transition-colors" title="Simpan">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={handleCancelEdit} className="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error/20 transition-colors" title="Batal">
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditClick(row, globalIndex)} className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => {
                        if (window.confirm('Yakin ingin menghapus baris data ini?')) {
                          onDelete?.(row);
                        }
                      }} className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error-container/20 hover:text-error transition-colors" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
            })}
            {currentRows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-on-surface-variant font-sans">
                  <div className="flex flex-col items-center gap-2">
                    <MoreHorizontal className="w-8 h-8 opacity-50" />
                    <p>Tidak ada data untuk sheet ini.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10 bg-surface-container-lowest/30">
        <span className="font-sans text-sm text-on-surface-variant">
          Menampilkan {data.length > 0 ? indexOfFirstRow + 1 : 0}-{Math.min(indexOfLastRow, data.length)} dari {data.length.toLocaleString('id-ID')} data
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage <= 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1 mx-2">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let pageNum = currentPage;
              if (currentPage < 3) pageNum = i + 1;
              else if (currentPage > totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              
              if (pageNum <= 0 || pageNum > totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => paginate(pageNum)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-sans text-sm transition-colors ${
                    currentPage === pageNum 
                      ? 'bg-primary text-on-primary font-bold shadow-[0_0_10px_rgba(56,189,248,0.3)]' 
                      : 'text-on-surface hover:bg-surface-variant'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
