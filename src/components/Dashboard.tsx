import React, { useMemo, useState } from 'react';
import { AllData, ChartData } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Filter, Trash2, Search, Download, X } from 'lucide-react';
import { DataTable } from './DataTable';
import * as XLSX from 'xlsx';

interface DashboardProps {
  data: AllData;
  onEditRow: (tabType: keyof AllData, rowIndex: number, newRowData: any) => void;
  onDeleteRow: (tabType: keyof AllData, row: any) => void;
  onBulkDelete: (tabType: keyof AllData, filterKey: string, filterValue: string) => void;
}

const COLORS = ['#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6']; // Blue shades from design

const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent, value }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.3;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  return (
    <text x={x} y={y} fill="#64748b" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11}>
      <tspan x={x} dy="-0.6em" fontWeight="bold" fill="#334155">{`${(percent * 100).toFixed(1)}%`}</tspan>
      <tspan x={x} dy="1.4em">{`(${value} data)`}</tspan>
    </text>
  );
};

type TabType = 'eWalidata' | 'sektoral' | 'spasial';

export const Dashboard: React.FC<DashboardProps> = ({ data, onEditRow, onDeleteRow, onBulkDelete }) => {
  const [activeTab, setActiveTab] = useState<TabType>('eWalidata');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [bulkDeleteKey, setBulkDeleteKey] = useState('');
  const [bulkDeleteValue, setBulkDeleteValue] = useState('');

  // Reset filters when tab changes
  React.useEffect(() => {
    setActiveFilters({});
    setSearchQuery('');
  }, [activeTab]);

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    
    const cleanForExport = (rows: any[]) => rows.map(r => {
      const copy = { ...r };
      delete copy._uploadId;
      delete copy._originalIndex;
      delete copy._uploadTime;
      return copy;
    });

    const wsEWalidata = XLSX.utils.json_to_sheet(cleanForExport(data.eWalidata));
    const wsSektoral = XLSX.utils.json_to_sheet(cleanForExport(data.sektoral));
    const wsSpasial = XLSX.utils.json_to_sheet(cleanForExport(data.spasial));

    XLSX.utils.book_append_sheet(wb, wsEWalidata, 'e-Walidata');
    XLSX.utils.book_append_sheet(wb, wsSektoral, 'Data Sektoral');
    XLSX.utils.book_append_sheet(wb, wsSpasial, 'Data Spasial');

    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    const filename = `Data_Statistik_Export_${dateStr}_${timeStr}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  const rawData = data[activeTab];

  const filterOptions = useMemo(() => {
    const options: Record<string, Set<string>> = {
      'Tahun': new Set(),
      'Produsen Data': new Set(),
    };
    if (activeTab === 'eWalidata' || activeTab === 'sektoral') {
      options['Satuan'] = new Set();
      options['Tag urusan'] = new Set();
    }
    if (activeTab === 'spasial') {
      options['Format Penyimpanan Data'] = new Set();
    }
    
    rawData.forEach(row => {
      if (row['Tahun']) options['Tahun'].add(String(row['Tahun']));
      if (row['Produsen Data']) options['Produsen Data'].add(String(row['Produsen Data']));
      
      if (activeTab !== 'spasial') {
        if (row['Satuan']) options['Satuan'].add(String(row['Satuan']));
        if (row['Tag urusan']) options['Tag urusan'].add(String(row['Tag urusan']));
      } else {
        const format = row['Format penyimpanan data'] || row['Format Penyimpanan Data'] || row['Format penyimpanan'];
        if (format) options['Format Penyimpanan Data'].add(String(format));
      }
    });
    
    return Object.entries(options).reduce((acc, [key, set]) => {
      acc[key] = Array.from(set).filter(Boolean).sort();
      return acc;
    }, {} as Record<string, string[]>);
  }, [rawData, activeTab]);

  const currentData = useMemo(() => {
    let filtered = rawData;

    // Apply specific column filters
    for (const [key, value] of Object.entries(activeFilters)) {
      if (!value) continue;
      
      filtered = filtered.filter((row: any) => {
        if (key === 'Format Penyimpanan Data' && activeTab === 'spasial') {
          const format = row['Format penyimpanan data'] || row['Format Penyimpanan Data'] || row['Format penyimpanan'];
          return String(format) === value;
        }
        return String(row[key]) === value;
      });
    }

    // Apply global search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((row: any) => 
        Object.values(row).some(val => 
          val && String(val).toLowerCase().includes(query)
        )
      );
    }

    return filtered;
  }, [rawData, searchQuery, activeFilters, activeTab]);

  // Aggregate data for charts based on active tab
  const satuanData = useMemo(() => {
    if (activeTab === 'spasial') return [];
    const counts: Record<string, number> = {};
    currentData.forEach((item: any) => {
      const satuan = item.Satuan?.trim() || 'Tidak Diketahui';
      counts[satuan] = (counts[satuan] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [currentData, activeTab]);

  const urusanData = useMemo(() => {
    if (activeTab === 'spasial') return [];
    const counts: Record<string, number> = {};
    currentData.forEach((item: any) => {
      const urusan = item['Tag urusan']?.trim() || 'Tidak Diketahui';
      counts[urusan] = (counts[urusan] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [currentData, activeTab]);

  const formatSpasialData = useMemo(() => {
    if (activeTab !== 'spasial') return [];
    const counts: Record<string, number> = {};
    currentData.forEach((item: any) => {
      const rawFormat = item['Format penyimpanan data'] || item['Format Penyimpanan Data'] || item['Format penyimpanan'];
      const format = rawFormat ? String(rawFormat).trim() : 'Tidak Diketahui';
      counts[format] = (counts[format] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [currentData, activeTab]);

  const produsenData = useMemo(() => {
    const counts: Record<string, number> = {};
    currentData.forEach((item: any) => {
      const produsen = item['Produsen Data']?.trim() || 'Tidak Diketahui';
      counts[produsen] = (counts[produsen] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [currentData]);

  const totalLaporan = activeTab !== 'spasial' ? currentData.filter((d: any) => d.Satuan?.toLowerCase().includes('laporan')).length : 0;
  const totalDokumen = activeTab !== 'spasial' ? currentData.filter((d: any) => d.Satuan?.toLowerCase().includes('dokumen')).length : 0;
  const totalOrang = activeTab !== 'spasial' ? currentData.filter((d: any) => d.Satuan?.toLowerCase().includes('orang')).length : 0;

  const totalAllRows = data.eWalidata.length + data.sektoral.length + data.spasial.length;

  return (
    <div className="w-full mx-auto p-8 flex flex-col gap-6">
      
      {/* Header / Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-lg self-start">
          <button
            onClick={() => setActiveTab('eWalidata')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'eWalidata' 
                ? 'bg-white text-blue-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            e-Walidata ({data.eWalidata.length.toLocaleString()})
          </button>
          <button
            onClick={() => setActiveTab('sektoral')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'sektoral' 
                ? 'bg-white text-emerald-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Sektoral ({data.sektoral.length.toLocaleString()})
          </button>
          <button
            onClick={() => setActiveTab('spasial')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'spasial' 
                ? 'bg-white text-amber-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Spasial ({data.spasial.length.toLocaleString()})
          </button>
        </div>

        {/* Search Bar and Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={`Cari di data ${activeTab}...`}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowBulkDelete(true)}
            className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors shadow-sm whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" />
            Hapus Massal
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Ekspor Excel
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mr-2">
          <Filter className="w-4 h-4" />
          Filter:
        </div>
        {Object.entries(filterOptions).map(([key, options]) => (
          <div key={key} className="flex flex-col">
            <select
              value={activeFilters[key] || ''}
              onChange={(e) => setActiveFilters(prev => ({ ...prev, [key]: e.target.value }))}
              className="block w-40 text-sm border-slate-200 rounded-lg bg-slate-50 border py-1.5 px-3 text-slate-700 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua {key}</option>
              {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        ))}
        {Object.values(activeFilters).some(Boolean) && (
          <button
            onClick={() => setActiveFilters({})}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium px-2 py-1"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Bulk Delete Modal */}
      {showBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Hapus Data Massal</h3>
              <button onClick={() => setShowBulkDelete(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Pilih kolom dan nilai untuk menghapus semua data yang sesuai di sheet <strong>{activeTab}</strong>.
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Berdasarkan Kolom</label>
                  <select
                    value={bulkDeleteKey}
                    onChange={(e) => {
                      setBulkDeleteKey(e.target.value);
                      setBulkDeleteValue('');
                    }}
                    className="block w-full border-slate-300 rounded-lg bg-white border py-2 px-3 text-slate-700 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">-- Pilih Kolom --</option>
                    {Object.keys(filterOptions).map(key => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                </div>
                
                {bulkDeleteKey && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nilai yang akan dihapus</label>
                    <select
                      value={bulkDeleteValue}
                      onChange={(e) => setBulkDeleteValue(e.target.value)}
                      className="block w-full border-slate-300 rounded-lg bg-white border py-2 px-3 text-slate-700 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">-- Pilih Nilai --</option>
                      {filterOptions[bulkDeleteKey]?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowBulkDelete(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                disabled={!bulkDeleteKey || !bulkDeleteValue}
                onClick={() => {
                  onBulkDelete(activeTab, bulkDeleteKey, bulkDeleteValue);
                  setShowBulkDelete(false);
                  setBulkDeleteKey('');
                  setBulkDeleteValue('');
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <div className="text-slate-400 text-xs font-semibold uppercase mb-1 tracking-wider">Total Data (Baris)</div>
          <div className="text-2xl font-bold text-slate-800">{currentData.length.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-1">Rows Processed in {activeTab}</div>
        </div>
        
        {activeTab !== 'spasial' ? (
          <>
            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
              <div className="text-slate-400 text-xs font-semibold uppercase mb-1 tracking-wider">Total Laporan</div>
              <div className="text-2xl font-bold text-slate-800">{totalLaporan.toLocaleString()}</div>
              <div className="text-xs text-slate-400 mt-1">Berdasarkan satuan Laporan</div>
            </div>

            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
              <div className="text-slate-400 text-xs font-semibold uppercase mb-1 tracking-wider">Total Dokumen</div>
              <div className="text-2xl font-bold text-slate-800">{totalDokumen.toLocaleString()}</div>
              <div className="text-xs text-slate-400 mt-1">Berdasarkan satuan Dokumen</div>
            </div>

            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
              <div className="text-slate-400 text-xs font-semibold uppercase mb-1 tracking-wider">Total Orang</div>
              <div className="text-2xl font-bold text-slate-800">{totalOrang.toLocaleString()}</div>
              <div className="text-xs text-slate-400 mt-1">Berdasarkan satuan Orang</div>
            </div>
          </>
        ) : (
          <>
            <div className="col-span-3 bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <div className="text-slate-400 text-xs font-semibold uppercase mb-1 tracking-wider">Format Penyimpanan Terbanyak</div>
                <div className="text-2xl font-bold text-slate-800">{formatSpasialData[0]?.name || '-'}</div>
                <div className="text-sm text-slate-500 mt-1">{formatSpasialData[0]?.value || 0} file menggunakan format ini</div>
              </div>
              <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xl">{Math.round(((formatSpasialData[0]?.value || 0) / currentData.length) * 100 || 0)}%</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-700">{activeTab === 'spasial' ? 'Distribusi Format Penyimpanan' : 'Distribusi Berdasarkan Satuan'}</h3>
            <div className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-mono">Plotly Interactivity Enabled</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={activeTab === 'spasial' ? formatSpasialData : satuanData}
                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{fill: '#94a3b8', fontSize: 11}} 
                  axisLine={{stroke: '#e2e8f0'}} 
                  tickLine={false} 
                  angle={-35} 
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', fontSize: '12px'}}
                  cursor={{fill: '#f8fafc'}}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{fontSize: '12px', color: '#64748b'}} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name="Jumlah" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#f59e0b' }} 
                  activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-700">{activeTab === 'spasial' ? 'Top 5 Produsen Data' : 'Top 5 Kategori Tag Urusan'}</h3>
            <div className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-mono">Top Categories</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeTab === 'spasial' ? produsenData : urusanData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={renderCustomLabel}
                  labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                >
                  {(activeTab === 'spasial' ? produsenData : urusanData).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', fontSize: '12px'}}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px', color: '#64748b'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable 
        data={currentData} 
        type={activeTab} 
        onEdit={(rowIndex, newRowData) => onEditRow(activeTab, rowIndex, newRowData)} 
        onDelete={(row) => onDeleteRow(activeTab, row)}
      />
    </div>
  );
};
