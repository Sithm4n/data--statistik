import React, { useMemo, useState } from 'react';
import { AllData, ChartData } from '../types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Search } from 'lucide-react';
import { DataTable } from './DataTable';

interface DashboardProps {
  data: AllData;
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

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<TabType>('eWalidata');
  const [searchQuery, setSearchQuery] = useState('');

  const rawData = data[activeTab];

  const currentData = useMemo(() => {
    if (!searchQuery.trim()) return rawData;
    const query = searchQuery.toLowerCase();
    return rawData.filter((row: any) => 
      Object.values(row).some(val => 
        val && String(val).toLowerCase().includes(query)
      )
    );
  }, [rawData, searchQuery]);

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
            e-Walidata ({data.eWalidata.length})
          </button>
          <button
            onClick={() => setActiveTab('sektoral')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'sektoral' 
                ? 'bg-white text-emerald-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Sektoral ({data.sektoral.length})
          </button>
          <button
            onClick={() => setActiveTab('spasial')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'spasial' 
                ? 'bg-white text-amber-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            Spasial ({data.spasial.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
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
      </div>

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
              <div className="text-xs text-slate-400 mt-1">Dalam dataset</div>
            </div>

            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
              <div className="text-slate-400 text-xs font-semibold uppercase mb-1 tracking-wider">Total Dokumen</div>
              <div className="text-2xl font-bold text-slate-800">{totalDokumen.toLocaleString()}</div>
              <div className="text-xs text-slate-400 mt-1">Dalam dataset</div>
            </div>

            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
              <div className="text-slate-400 text-xs font-semibold uppercase mb-1 tracking-wider">Total Orang</div>
              <div className="text-2xl font-bold text-slate-800">{totalOrang.toLocaleString()}</div>
              <div className="text-xs text-slate-400 mt-1">Dalam dataset</div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm col-span-3">
              <div className="text-slate-400 text-xs font-semibold uppercase mb-1 tracking-wider">Format Penyimpanan Terbanyak</div>
              <div className="text-2xl font-bold text-slate-800">{formatSpasialData[0]?.name || '-'}</div>
              <div className="text-xs text-slate-400 mt-1">{formatSpasialData[0]?.value || 0} file dengan format ini</div>
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
      <DataTable data={currentData} type={activeTab} />
    </div>
  );
};
