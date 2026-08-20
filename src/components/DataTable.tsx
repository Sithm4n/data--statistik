import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableProps {
  data: any[];
  type: 'eWalidata' | 'sektoral' | 'spasial';
}

export const DataTable: React.FC<DataTableProps> = ({ data, type }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = data.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(data.length / rowsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col shrink-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <tr>
              {type === 'eWalidata' && (
                <>
                  <th className="px-6 py-3">No</th>
                  <th className="px-6 py-3">Kode DSSD</th>
                  <th className="px-6 py-3">Uraian DSSD</th>
                  <th className="px-6 py-3">Satuan</th>
                  <th className="px-6 py-3">Definisi Operasional</th>
                  <th className="px-6 py-3">Tag Urusan</th>
                  <th className="px-6 py-3">Produsen Data</th>
                </>
              )}
              {type === 'sektoral' && (
                <>
                  <th className="px-6 py-3">No</th>
                  <th className="px-6 py-3">Kode Data</th>
                  <th className="px-6 py-3">Uraian DSSD</th>
                  <th className="px-6 py-3">Satuan</th>
                  <th className="px-6 py-3">Definisi Operasional</th>
                  <th className="px-6 py-3">Tag Urusan</th>
                  <th className="px-6 py-3">Produsen Data</th>
                  <th className="px-6 py-3">Info Sub Kegiatan</th>
                </>
              )}
              {type === 'spasial' && (
                <>
                  <th className="px-6 py-3">No</th>
                  <th className="px-6 py-3">Kode Data</th>
                  <th className="px-6 py-3">Nama Informasi Geospasial</th>
                  <th className="px-6 py-3">Format Penyimpanan Data</th>
                  <th className="px-6 py-3">Skala</th>
                  <th className="px-6 py-3">Produsen Data</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[12px]">
            {currentRows.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-2 text-slate-400">{row.No}</td>
                {type === 'eWalidata' && (
                  <>
                    <td className="px-6 py-2 whitespace-nowrap text-blue-600">{row['Kode DSSD']}</td>
                    <td className="px-6 py-2 text-slate-800 font-sans">{row['Uraian DSSD']}</td>
                    <td className="px-6 py-2">
                      <span className={`px-2 py-0.5 rounded ${
                        row.Satuan?.toLowerCase().includes('laporan') ? 'bg-emerald-50 text-emerald-600' :
                        row.Satuan?.toLowerCase().includes('dokumen') ? 'bg-blue-50 text-blue-600' :
                        row.Satuan?.toLowerCase().includes('orang') ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {row.Satuan}
                      </span>
                    </td>
                    <td className="px-6 py-2 min-w-[300px] whitespace-normal font-sans text-slate-600 leading-relaxed">{row['Definisi Operasional']}</td>
                    <td className="px-6 py-2 font-sans text-slate-600">{row['Tag urusan']}</td>
                    <td className="px-6 py-2 font-sans text-slate-600">{row['Produsen Data']}</td>
                  </>
                )}
                {type === 'sektoral' && (
                  <>
                    <td className="px-6 py-2 whitespace-nowrap text-blue-600">{row['Kode Data']}</td>
                    <td className="px-6 py-2 text-slate-800 font-sans">{row['Uraian DSSD']}</td>
                    <td className="px-6 py-2">
                      <span className={`px-2 py-0.5 rounded ${
                        row.Satuan?.toLowerCase().includes('laporan') ? 'bg-emerald-50 text-emerald-600' :
                        row.Satuan?.toLowerCase().includes('dokumen') ? 'bg-blue-50 text-blue-600' :
                        row.Satuan?.toLowerCase().includes('orang') ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {row.Satuan}
                      </span>
                    </td>
                    <td className="px-6 py-2 min-w-[300px] whitespace-normal font-sans text-slate-600 leading-relaxed">{row['Definisi Operasional']}</td>
                    <td className="px-6 py-2 font-sans text-slate-600">{row['Tag urusan']}</td>
                    <td className="px-6 py-2 font-sans text-slate-600">{row['Produsen Data']}</td>
                    <td className="px-6 py-2 font-sans text-slate-600">{row['Info Sub Kegiatan']}</td>
                  </>
                )}
                {type === 'spasial' && (
                  <>
                    <td className="px-6 py-2 whitespace-nowrap text-blue-600">{row['Kode Data']}</td>
                    <td className="px-6 py-2 text-slate-800 font-sans">{row['Nama Informasi Geospasial']}</td>
                    <td className="px-6 py-2 font-sans text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-600 font-medium">
                        {row['Format penyimpanan data'] || row['Format Penyimpanan Data'] || row['Format penyimpanan'] || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-2 font-sans text-slate-600">{row['Skala']}</td>
                    <td className="px-6 py-2 font-sans text-slate-600">{row['Produsen Data']}</td>
                  </>
                )}
              </tr>
            ))}
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
