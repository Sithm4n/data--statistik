import React, { useMemo, useState } from 'react';
import { AllData, ChartData } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Filter, Trash2, Search, Download, X, Database, FileText, Users, Box } from 'lucide-react';
import { DataTable } from './DataTable';
import * as XLSX from 'xlsx';

interface DashboardProps {
  data: AllData;
  onEditRow: (tabType: keyof AllData, rowIndex: number, newRowData: any) => void;
  onDeleteRow: (tabType: keyof AllData, row: any) => void;
  onBulkDelete: (tabType: keyof AllData, filterKey: string, filterValue: string) => void;
}

const COLORS = ['#38bdf8', '#0ea5e9', '#22d3ee', '#bec6e0', '#958da1'];

const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent, value }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.3;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  return (
    <text x={x} y={y} fill="#ccc3d8" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} className="font-mono">
      <tspan x={x} dy="-0.6em" fontWeight="bold" fill="#e0e3e5">{`${(percent * 100).toFixed(1)}%`}</tspan>
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
      delete copy._rowId;
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
      .slice(0, 5);
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
      .slice(0, 5);
  }, [currentData]);

  const totalLaporan = activeTab !== 'spasial' ? currentData.filter((d: any) => d.Satuan?.toLowerCase().includes('laporan')).length : 0;
  const totalDokumen = activeTab !== 'spasial' ? currentData.filter((d: any) => d.Satuan?.toLowerCase().includes('dokumen')).length : 0;
  const totalOrang = activeTab !== 'spasial' ? currentData.filter((d: any) => d.Satuan?.toLowerCase().includes('orang')).length : 0;

  return (
    <div className="flex flex-col w-full min-h-full">
      <div className="relative w-full overflow-hidden shrink-0">
        {/* Ambient Glows */}
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[150%] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-[10%] -right-[10%] w-[40%] h-[120%] bg-tertiary/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 px-8 py-8 flex flex-col gap-6">
          {/* Top Action Bar */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-surface-container-low/50 backdrop-blur-xl border border-primary/20 rounded-2xl">
              <button
                onClick={() => setActiveTab('eWalidata')}
                className={`px-6 py-2.5 rounded-xl font-medium text-base transition-all ${
                  activeTab === 'eWalidata' 
                    ? 'bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(2,132,199,0.2)]' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30'
                }`}
              >
                e-Walidata <span className={`ml-1 text-sm ${activeTab === 'eWalidata' ? 'text-on-primary-container/70' : 'opacity-60'}`}>({data.eWalidata.length.toLocaleString()})</span>
              </button>
              <button
                onClick={() => setActiveTab('sektoral')}
                className={`px-6 py-2.5 rounded-xl font-medium text-base transition-all ${
                  activeTab === 'sektoral' 
                    ? 'bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(2,132,199,0.2)]' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30'
                }`}
              >
                Sektoral <span className={`ml-1 text-sm ${activeTab === 'sektoral' ? 'text-on-primary-container/70' : 'opacity-60'}`}>({data.sektoral.length.toLocaleString()})</span>
              </button>
              <button
                onClick={() => setActiveTab('spasial')}
                className={`px-6 py-2.5 rounded-xl font-medium text-base transition-all ${
                  activeTab === 'spasial' 
                    ? 'bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(2,132,199,0.2)]' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30'
                }`}
              >
                Spasial <span className={`ml-1 text-sm ${activeTab === 'spasial' ? 'text-on-primary-container/70' : 'opacity-60'}`}>({data.spasial.length.toLocaleString()})</span>
              </button>
            </div>

            {/* Global Actions */}
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative w-full lg:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder={`Cari di data ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-surface-container-lowest/40 backdrop-blur-md border border-outline-variant/30 rounded-xl text-base text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:bg-surface-container-low/60 transition-all shadow-sm"
                />
              </div>
              <button
                onClick={() => setShowBulkDelete(true)}
                className="flex items-center justify-center gap-2 h-12 px-5 rounded-xl bg-error-container/10 border border-error/20 text-error hover:bg-error-container/20 transition-colors shrink-0"
              >
                <Trash2 className="w-5 h-5" />
                <span className="font-medium text-base hidden sm:block">Hapus Massal</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 h-12 px-5 rounded-xl bg-surface-container-high/50 backdrop-blur-md border border-outline-variant/30 text-on-surface hover:bg-surface-variant transition-colors shrink-0"
              >
                <Download className="w-5 h-5" />
                <span className="font-medium text-base hidden sm:block">Ekspor Excel</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-surface-container/30 backdrop-blur-lg border border-primary/20 rounded-2xl">
            <div className="flex items-center gap-2 text-on-surface-variant mr-2">
              <Filter className="w-5 h-5" />
              <span className="font-mono text-xs uppercase tracking-wider font-medium">Filter</span>
            </div>
            
            {Object.entries(filterOptions).map(([key, options]) => (
              <select
                key={key}
                value={activeFilters[key] || ''}
                onChange={(e) => setActiveFilters(prev => ({ ...prev, [key]: e.target.value }))}
                className="appearance-none bg-surface-variant/20 border border-outline-variant/20 text-on-surface rounded-lg px-4 py-2 pr-10 focus:outline-none focus:border-primary/50 transition-colors bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23ccc3d8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2em_1.2em] bg-[right_0.5rem_center] bg-no-repeat cursor-pointer max-w-xs"
              >
                <option value="">Semua {key}</option>
                {options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ))}
            
            {Object.values(activeFilters).some(Boolean) && (
              <button
                onClick={() => setActiveFilters({})}
                className="ml-auto text-primary hover:text-primary-fixed-dim text-sm font-medium transition-colors"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="px-8 pb-8 flex flex-col gap-6 z-10 relative">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat Card 1 */}
          <div className="relative overflow-hidden bg-surface-container-low/40 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="flex flex-col gap-2 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Database className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-mono text-xs text-on-surface-variant uppercase tracking-wider font-medium">Total Data (Baris)</h3>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-bold text-on-surface tabular-nums bg-gradient-to-r from-on-surface to-on-surface-variant bg-clip-text text-transparent">
                  {currentData.length.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant/70 mt-1">Rows Processed in {activeTab}</p>
            </div>
          </div>

          {/* Stat Card 2 */}
          <div className="relative overflow-hidden bg-surface-container-low/40 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-tertiary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="flex flex-col gap-2 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-tertiary/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-tertiary" />
                </div>
                <h3 className="font-mono text-xs text-on-surface-variant uppercase tracking-wider font-medium">
                  {activeTab === 'spasial' ? 'Format Shapefile' : 'Total Laporan'}
                </h3>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-bold text-on-surface tabular-nums">
                  {activeTab === 'spasial' 
                    ? formatSpasialData.find(f => f.name.toLowerCase().includes('shapefile'))?.value || 0 
                    : totalLaporan.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant/70 mt-1">
                {activeTab === 'spasial' ? 'Format penyimanan data' : 'Berdasarkan satuan Laporan'}
              </p>
            </div>
          </div>

          {/* Stat Card 3 */}
          <div className="relative overflow-hidden bg-surface-container-low/40 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="flex flex-col gap-2 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Box className="w-4 h-4 text-secondary" />
                </div>
                <h3 className="font-mono text-xs text-on-surface-variant uppercase tracking-wider font-medium">
                  {activeTab === 'spasial' ? 'Format GeoJSON' : 'Total Dokumen'}
                </h3>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-bold text-on-surface tabular-nums">
                  {activeTab === 'spasial' 
                    ? formatSpasialData.find(f => f.name.toLowerCase().includes('geojson'))?.value || 0 
                    : totalDokumen.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant/70 mt-1">
                {activeTab === 'spasial' ? 'Format penyimanan data' : 'Berdasarkan satuan Dokumen'}
              </p>
            </div>
          </div>

          {/* Stat Card 4 */}
          <div className="relative overflow-hidden bg-surface-container-low/40 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-inverse-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="flex flex-col gap-2 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-inverse-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-inverse-primary" />
                </div>
                <h3 className="font-mono text-xs text-on-surface-variant uppercase tracking-wider font-medium">
                  {activeTab === 'spasial' ? 'Format KML' : 'Total Orang'}
                </h3>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-bold text-on-surface tabular-nums">
                  {activeTab === 'spasial' 
                    ? formatSpasialData.find(f => f.name.toLowerCase().includes('kml'))?.value || 0 
                    : totalOrang.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant/70 mt-1">
                {activeTab === 'spasial' ? 'Format penyimanan data' : 'Berdasarkan satuan Orang'}
              </p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
          {/* Chart 1 */}
          <div className="flex flex-col bg-surface-container-low/40 backdrop-blur-xl border border-primary/20 rounded-3xl p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold text-on-surface">
                {activeTab === 'spasial' ? 'Distribusi Format Data' : 'Distribusi Berdasarkan Satuan'}
              </h2>
              <div className="px-3 py-1 rounded-full bg-surface-variant/30 border border-outline-variant/20 font-mono text-xs text-on-surface-variant font-medium">Interactive</div>
            </div>
            <div className="relative flex-1 w-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeTab === 'spasial' ? formatSpasialData : satuanData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#323537" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#ccc3d8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    tickLine={{ stroke: '#4a4455' }}
                    axisLine={{ stroke: '#4a4455' }}
                    tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val}
                    angle={-35}
                    textAnchor="end"
                  />
                  <YAxis 
                    tick={{ fill: '#ccc3d8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    tickLine={{ stroke: '#4a4455' }}
                    axisLine={{ stroke: '#4a4455' }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(39, 42, 44, 0.9)', 
                      borderColor: 'rgba(74, 68, 85, 0.5)',
                      borderRadius: '12px',
                      color: '#e0e3e5',
                      backdropFilter: 'blur(12px)'
                    }}
                    itemStyle={{ color: '#22d3ee' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#22d3ee" 
                    strokeWidth={3} 
                    dot={{ fill: '#101415', stroke: '#22d3ee', strokeWidth: 2, r: 4 }} 
                    activeDot={{ r: 6, fill: '#22d3ee', stroke: '#101415' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2 */}
          <div className="flex flex-col bg-surface-container-low/40 backdrop-blur-xl border border-primary/20 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold text-on-surface">
                {activeTab === 'spasial' ? 'Top 5 Produsen Data' : 'Top 5 Kategori Tag Urusan'}
              </h2>
              <div className="px-3 py-1 rounded-full bg-surface-variant/30 border border-outline-variant/20 font-mono text-xs text-on-surface-variant font-medium">Top Categories</div>
            </div>
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8 relative z-10 min-h-[250px]">
              <div className="relative w-full h-[250px] sm:w-[50%]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activeTab === 'spasial' ? produsenData : urusanData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="transparent"
                      label={renderCustomLabel}
                      labelLine={false}
                    >
                      {(activeTab === 'spasial' ? produsenData : urusanData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(39, 42, 44, 0.9)', 
                        borderColor: 'rgba(74, 68, 85, 0.5)',
                        borderRadius: '12px',
                        color: '#e0e3e5',
                        backdropFilter: 'blur(12px)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-3 w-full sm:w-[50%]">
                {(activeTab === 'spasial' ? produsenData : urusanData).map((item, index) => (
                  <div key={index} className="flex items-start gap-3 group">
                    <div className="w-3 h-3 rounded-full mt-1 shrink-0 group-hover:scale-125 transition-transform" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <div className="flex flex-col">
                      <span className="text-sm text-on-surface line-clamp-2" title={item.name}>{item.name}</span>
                      <span className="text-xs text-on-surface-variant">{item.value} data</span>
                    </div>
                  </div>
                ))}
              </div>
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

      {/* Bulk Delete Modal */}
      {showBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dim/80 backdrop-blur-sm">
          <div className="bg-surface-container-high rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-200 border border-outline-variant/30">
            <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
              <h3 className="text-lg font-bold text-on-surface">Hapus Data Massal</h3>
              <button onClick={() => setShowBulkDelete(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-on-surface-variant">
                Pilih kolom dan nilai untuk menghapus semua data yang sesuai di sheet <strong>{activeTab}</strong>.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">Berdasarkan Kolom</label>
                  <select
                    value={bulkDeleteKey}
                    onChange={(e) => {
                      setBulkDeleteKey(e.target.value);
                      setBulkDeleteValue('');
                    }}
                    className="block w-full border-outline-variant/30 rounded-xl bg-surface border py-2.5 px-4 text-on-surface focus:ring-error focus:border-error transition-all"
                  >
                    <option value="">-- Pilih Kolom --</option>
                    {Object.keys(filterOptions).map(key => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                </div>
                
                {bulkDeleteKey && (
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-2">Nilai yang akan dihapus</label>
                    <select
                      value={bulkDeleteValue}
                      onChange={(e) => setBulkDeleteValue(e.target.value)}
                      className="block w-full border-outline-variant/30 rounded-xl bg-surface border py-2.5 px-4 text-on-surface focus:ring-error focus:border-error transition-all"
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
            <div className="px-6 py-4 bg-surface-container border-t border-outline-variant/20 flex justify-end gap-3">
              <button
                onClick={() => setShowBulkDelete(false)}
                className="px-5 py-2.5 text-sm font-medium text-on-surface hover:text-white bg-surface-variant/50 border border-outline-variant/30 rounded-xl hover:bg-surface-variant transition-colors"
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
                className="px-5 py-2.5 text-sm font-medium text-on-error bg-error rounded-xl hover:bg-error-container disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,180,171,0.2)] transition-all"
              >
                Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
