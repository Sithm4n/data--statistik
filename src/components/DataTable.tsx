import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Edit2, Check, X as XIcon, Trash2 } from 'lucide-react';

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
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col shrink-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">No</th>
              <th className="px-6 py-3 text-blue-600">Tahun</th>
              {type === 'eWalidata' && (
                <>
                  <th className="px-6 py-3">Kode DSSD</th>
                  <th className="px-6 py-3">Uraian DSSD</th>
                  <th className="px-6 py-3">Satuan</th>
                  <th className="px-6 py-3">Definisi Operasional</th>
                  <th className="px-6 py-3">Tag Urusan</th>
                  <th className="px-6 py-3">Produsen Data</th>
                  <th className="px-6 py-3">Waktu Upload</th>
                  <th className="px-6 py-3">Terakhir Diubah</th>
                  <th className="px-6 py-3">Aksi</th>
                </>
              )}
              {type === 'sektoral' && (
                <>
                  <th className="px-6 py-3">Kode Data</th>
                  <th className="px-6 py-3">Uraian DSSD</th>
                  <th className="px-6 py-3">Satuan</th>
                  <th className="px-6 py-3">Definisi Operasional</th>
                  <th className="px-6 py-3">Tag Urusan</th>
                  <th className="px-6 py-3">Produsen Data</th>
                  <th className="px-6 py-3">Info Sub Kegiatan</th>
                  <th className="px-6 py-3">Waktu Upload</th>
                  <th className="px-6 py-3">Terakhir Diubah</th>
                  <th className="px-6 py-3">Aksi</th>
                </>
              )}
              {type === 'spasial' && (
                <>
                  <th className="px-6 py-3">Kode Data</th>
                  <th className="px-6 py-3">Nama Informasi Geospasial</th>
                  <th className="px-6 py-3">Format Penyimpanan Data</th>
                  <th className="px-6 py-3">Skala</th>
                  <th className="px-6 py-3">Produsen Data</th>
                  <th className="px-6 py-3">Waktu Upload</th>
                  <th className="px-6 py-3">Terakhir Diubah</th>
                  <th className="px-6 py-3">Aksi</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[12px]">
            {currentRows.map((row, index) => {
              const globalIndex = indexOfFirstRow + index;
              const isEditing = editingRowIndex === globalIndex;

              return (
              <tr key={index} className={`transition-colors ${isEditing ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                <td className="px-6 py-2 text-slate-400">{row.No}</td>
                <td className="px-6 py-2 text-blue-700 font-bold whitespace-nowrap bg-blue-50/50">{row.Tahun || '-'}</td>
                {type === 'eWalidata' && (
                  <>
                    <td className="px-6 py-2 whitespace-nowrap text-blue-600">
                      {isEditing ? <input className="w-full px-2 py-1 border rounded" value={editFormData['Kode DSSD'] || ''} onChange={e => setEditFormData({...editFormData, 'Kode DSSD': e.target.value})} /> : row['Kode DSSD']}
                    </td>
                    <td className="px-6 py-2 text-slate-800 font-sans">
                      {isEditing ? <input className="w-full px-2 py-1 border rounded" value={editFormData['Uraian DSSD'] || ''} onChange={e => setEditFormData({...editFormData, 'Uraian DSSD': e.target.value})} /> : row['Uraian DSSD']}
                    </td>
                    <td className="px-6 py-2">
                      {isEditing ? <input className="w-full px-2 py-1 border rounded" value={editFormData.Satuan || ''} onChange={e => setEditFormData({...editFormData, Satuan: e.target.value})} /> : (
                        <span className={`px-2 py-0.5 rounded ${
                          row.Satuan?.toLowerCase().includes('laporan') ? 'bg-emerald-50 text-emerald-600' :
                          row.Satuan?.toLowerCase().includes('dokumen') ? 'bg-blue-50 text-blue-600' :
                          row.Satuan?.toLowerCase().includes('orang') ? 'bg-amber-50 text-amber-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {row.Satuan}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-2 min-w-[300px] whitespace-normal font-sans text-slate-600 leading-relaxed">
                      {isEditing ? <textarea className="w-full px-2 py-1 border rounded min-h-[60px]" value={editFormData['Definisi Operasional'] || ''} onChange={e => setEditFormData({...editFormData, 'Definisi Operasional': e.target.value})} /> : row['Definisi Operasional']}
                    </td>
                    <td className="px-6 py-2 font-sans text-slate-600">
                      {isEditing ? <input className="w-full px-2 py-1 border rounded" value={editFormData['Tag urusan'] || ''} onChange={e => setEditFormData({...editFormData, 'Tag urusan': e.target.value})} /> : row['Tag urusan']}
                    </td>
                    <td className="px-6 py-2 font-sans text-slate-600">
                      {isEditing ? <input className="w-full px-2 py-1 border rounded" value={editFormData['Produsen Data'] || ''} onChange={e => setEditFormData({...editFormData, 'Produsen Data': e.target.value})} /> : row['Produsen Data']}
                    </td>
                  </>
                )}
                {type === 'sektoral' && (
                  <>
                    <td className="px-6 py-2 whitespace-nowrap text-blue-600">
                      {isEditing ? <input className="w-full px-2 py-1 border rounded" value={editFormData['Kode Data'] || ''} onChange={e => setEditFormData({...editFormData, 'Kode Data': e.target.value})} /> : row['Kode Data']}
                    </td>
                    <td className="px-6 py-2 text-slate-800 font-sans">
                      {isEditing ? <input className="w-full px-2 py-1 border rounded" value={editFormData['Uraian DSSD'] || ''} onChange={e => setEditFormData({...editFormData, 'Uraian DSSD': e.target.value})} /> : row['Uraian DSSD']}
                    </td>
                    <td className="px-6 py-2">
                      {isEditing ? <input className="w-full px-2 py-1 border rounded" value={editFormData.Satuan || ''} onChange={e => setEditFormData({...editFormData, Satuan: e.target.value})} /> : (
                        <span className={`px-2 py-0.5 rounded ${
                          row.Satuan?.toLowerCase().includes('laporan') ? 'bg-emerald-50 text-emerald-600' :
                          row.Satuan?.toLowerCase().includes('dokumen') ? 'bg-blue-50 text-blue-600' :
                          row.Satuan?.toLowerCase().includes('orang') ? 'bg-amber-50 text-amber-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {row.Satuan}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-2 min-w-[300px] whitespace-normal font-sans text-slate-600 leading-relaxed">
                      {isEditing ? <textarea className="w-full px-2 py-1 border rounded min-h-[60px]" value={editFormData['Definisi Operasional'] || ''} onChange={e => setEditFormData({...editFormData, 'Definisi Operasional': e.target.value})} /> : row['Definisi Operasional']}
                    </td>
                    <td className="px-6 py-2 font-sans text-slate-600">
                      {isEditing ? <input className="w-full px-2 py-1 border rounded" value={editFormData['Tag urusan'] || ''} onChange={e => setEditFormData({...editFormData, 'Tag urusan': e.target.value})} /> : row['Tag urusan']}
                    </td>
                    <td className="px-6 py-2 font-sans text-slate-600">
                      {isEditing ? <input className="w-full px-2 py-1 border rounded" value={editFormData['Produsen Data'] || ''} onChange={e => setEditFormData({...editFormData, 'Produsen Data': e.target.value})} /> : row['Produsen Data']}
                    </td>
                    <td className="px-6 py-2 font-sans text-slate-600">
                      {isEditing ? <input className="w-full px-2 py-1 border rounded" value={editFormData['Info Sub Kegiatan'] || ''} onChange={e => setEditFormData({...editFormData, 'Info Sub Kegiatan': e.target.value})} /> : row['Info Sub Kegiatan']}
                    </td>
                  </>
                )}
                {type === 'spasial' && (
                  <>
                    <td className="px-6 py-2 whitespace-nowrap text-blue-600">
                       {isEditing ? <input className="w-full px-2 py-1 border rounded" value={editFormData['Kode Data'] || ''} onChange={e => setEditFormData({...editFormData, 'Kode Data': e.target.value})} /> : row['Kode Data']}
                    </td>
                    <td className="px-6 py-2 text-slate-800 font-sans">
                       {isEditing ? <input className="w-full px-2 py-1 border rounded" value={editFormData['Nama Informasi Geospasial'] || ''} onChange={e => setEditFormData({...editFormData, 'Nama Informasi Geospasial': e.target.value})} /> : row['Nama Informasi Geospasial']}
                    </td>
                    <td className="px-6 py-2 font-sans text-slate-600">
                      {isEditing ? <input className="w-full px-2 py-1 border rounded" value={editFormData['Format penyimpanan data'] || editFormData['Format Penyimpanan Data'] || editFormData['Format penyimpanan'] || ''} onChange={e => setEditFormData({...editFormData, 'Format penyimpanan data': e.target.value})} /> : (
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-600 font-medium">
                          {row['Format penyimpanan data'] || row['Format Penyimpanan Data'] || row['Format penyimpanan'] || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-2 font-sans text-slate-600">
                      {isEditing ? <input className="w-full px-2 py-1 border rounded" value={editFormData['Skala'] || ''} onChange={e => setEditFormData({...editFormData, 'Skala': e.target.value})} /> : row['Skala']}
                    </td>
                    <td className="px-6 py-2 font-sans text-slate-600">
                      {isEditing ? <input className="w-full px-2 py-1 border rounded" value={editFormData['Produsen Data'] || ''} onChange={e => setEditFormData({...editFormData, 'Produsen Data': e.target.value})} /> : row['Produsen Data']}
                    </td>
                  </>
                )}
                <td className="px-6 py-2 text-slate-500 font-sans text-xs whitespace-nowrap">
                  {row._uploadTime || '-'}
                </td>
                <td className="px-6 py-2 text-slate-500 font-sans text-xs whitespace-nowrap">
                  {row._lastModified || '-'}
                </td>
                <td className="px-6 py-2 font-sans whitespace-nowrap">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} className="p-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200" title="Simpan">
                        <Check size={16} />
                      </button>
                      <button onClick={handleCancelEdit} className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200" title="Batal">
                        <XIcon size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleEditClick(row, globalIndex)} className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200" title="Edit">
                        <Edit2 size={14} /> Edit
                      </button>
                      <button onClick={() => {
                        if (window.confirm('Yakin ingin menghapus baris data ini?')) {
                          onDelete?.(row);
                        }
                      }} className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100" title="Hapus">
                        <Trash2 size={14} /> Hapus
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
            })}
            {currentRows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-slate-500 font-sans">
                  Tidak ada data untuk sheet ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-slate-200 mt-auto">
        <div className="text-xs text-slate-500 font-sans">
          Menampilkan <span className="font-semibold text-slate-700">{data.length > 0 ? indexOfFirstRow + 1 : 0}</span> hingga{' '}
          <span className="font-semibold text-slate-700">{Math.min(indexOfLastRow, data.length)}</span> dari{' '}
          <span className="font-semibold text-slate-700">{data.length}</span> data
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1 border border-slate-200 rounded text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1 border border-slate-200 rounded text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
