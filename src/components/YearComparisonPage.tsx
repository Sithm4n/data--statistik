import React, { useState, useMemo } from 'react';
import { AllData, UploadRecord, ComparisonItem, ComparisonSummary } from '../types';
import { 
  GitCompare, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  Download, 
  Printer, 
  Filter, 
  ArrowRightLeft, 
  AlertCircle, 
  CheckCircle2, 
  PlusCircle, 
  XCircle, 
  HelpCircle,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { compareYearData } from '../utils/comparisonService';
import * as XLSX from 'xlsx';

interface YearComparisonPageProps {
  data: AllData | null;
  uploads: UploadRecord[];
  onNavigateToUpload?: () => void;
}

export const YearComparisonPage: React.FC<YearComparisonPageProps> = ({ 
  data, 
  uploads,
  onNavigateToUpload 
}) => {
  // Extract all available years from uploads and data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    uploads.forEach(u => {
      if (u.year) yearsSet.add(u.year);
    });
    if (data) {
      data.eWalidata.forEach(r => r.Tahun && yearsSet.add(r.Tahun));
      data.sektoral.forEach(r => r.Tahun && yearsSet.add(r.Tahun));
      data.spasial.forEach(r => r.Tahun && yearsSet.add(r.Tahun));
    }
    const arr = Array.from(yearsSet).sort();
    if (arr.length === 0) return ['2024', '2025'];
    if (arr.length === 1) return [arr[0], (parseInt(arr[0]) + 1).toString()];
    return arr;
  }, [uploads, data]);

  // Default baseYear and compareYear
  const [baseYear, setBaseYear] = useState<string>(() => {
    if (availableYears.length >= 2) return availableYears[0];
    return '2024';
  });

  const [compareYear, setCompareYear] = useState<string>(() => {
    if (availableYears.length >= 2) return availableYears[availableYears.length - 1];
    return '2025';
  });

  const [selectedCategory, setSelectedCategory] = useState<'sektoral' | 'eWalidata' | 'spasial' | 'all'>('sektoral');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MODIFIED' | 'NEW' | 'REMOVED' | 'SAME'>('ALL');
  const [selectedProdusen, setSelectedProdusen] = useState<string>('__ALL__');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'table' | 'producers'>('table');

  // Swap years
  const handleSwapYears = () => {
    setBaseYear(compareYear);
    setCompareYear(baseYear);
  };

  // Extract rows for baseYear and compareYear
  const comparisonResult = useMemo(() => {
    if (!data) return { items: [], summary: null };

    const getRowsForYear = (cat: 'sektoral' | 'eWalidata' | 'spasial', year: string) => {
      return (data[cat] || []).filter(r => (r.Tahun || '') === year);
    };

    let allItems: ComparisonItem[] = [];

    if (selectedCategory === 'all' || selectedCategory === 'sektoral') {
      const baseSektoral = getRowsForYear('sektoral', baseYear);
      const compSektoral = getRowsForYear('sektoral', compareYear);
      const res = compareYearData(baseSektoral, compSektoral, 'sektoral', baseYear, compareYear);
      allItems.push(...res.items);
    }

    if (selectedCategory === 'all' || selectedCategory === 'eWalidata') {
      const baseEWalidata = getRowsForYear('eWalidata', baseYear);
      const compEWalidata = getRowsForYear('eWalidata', compareYear);
      const res = compareYearData(baseEWalidata, compEWalidata, 'eWalidata', baseYear, compareYear);
      allItems.push(...res.items);
    }

    if (selectedCategory === 'all' || selectedCategory === 'spasial') {
      const baseSpasial = getRowsForYear('spasial', baseYear);
      const compSpasial = getRowsForYear('spasial', compareYear);
      const res = compareYearData(baseSpasial, compSpasial, 'spasial', baseYear, compareYear);
      allItems.push(...res.items);
    }

    // Recompute overall summary
    const newCount = allItems.filter(i => i.status === 'NEW').length;
    const modifiedCount = allItems.filter(i => i.status === 'MODIFIED').length;
    const sameCount = allItems.filter(i => i.status === 'SAME').length;
    const removedCount = allItems.filter(i => i.status === 'REMOVED').length;

    // Count distinct base and compare
    const totalBase = (selectedCategory === 'all' 
      ? getRowsForYear('sektoral', baseYear).length + getRowsForYear('eWalidata', baseYear).length + getRowsForYear('spasial', baseYear).length
      : getRowsForYear(selectedCategory, baseYear).length);

    const totalCompare = (selectedCategory === 'all'
      ? getRowsForYear('sektoral', compareYear).length + getRowsForYear('eWalidata', compareYear).length + getRowsForYear('spasial', compareYear).length
      : getRowsForYear(selectedCategory, compareYear).length);

    const diff = totalCompare - totalBase;
    const percentChange = totalBase > 0 ? (diff / totalBase) * 100 : totalCompare > 0 ? 100 : 0;

    const summary: ComparisonSummary = {
      baseYear,
      compareYear,
      totalBase,
      totalCompare,
      newCount,
      modifiedCount,
      removedCount,
      sameCount,
      percentChange: Math.round(percentChange * 10) / 10,
    };

    return { items: allItems, summary };
  }, [data, baseYear, compareYear, selectedCategory]);

  // Unique Produsen options
  const produsenList = useMemo(() => {
    const set = new Set<string>();
    comparisonResult.items.forEach(i => {
      if (i.produsen) set.add(i.produsen);
    });
    return Array.from(set).sort();
  }, [comparisonResult.items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return comparisonResult.items.filter(item => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (selectedProdusen !== '__ALL__' && item.produsen !== selectedProdusen) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchUraian = item.uraian?.toLowerCase().includes(q) || item.uraianBase?.toLowerCase().includes(q);
        const matchKode = item.kode?.toLowerCase().includes(q) || item.kodeBase?.toLowerCase().includes(q);
        const matchProd = item.produsen?.toLowerCase().includes(q);
        if (!matchUraian && !matchKode && !matchProd) return false;
      }
      return true;
    });
  }, [comparisonResult.items, statusFilter, selectedProdusen, searchQuery]);

  // Producer breakdown summary
  const producerBreakdown = useMemo(() => {
    const map = new Map<string, {
      name: string;
      baseCount: number;
      compareCount: number;
      newCount: number;
      modCount: number;
      remCount: number;
      sameCount: number;
    }>();

    comparisonResult.items.forEach(item => {
      const prod = item.produsen || 'Tidak Teridentifikasi';
      if (!map.has(prod)) {
        map.set(prod, {
          name: prod,
          baseCount: 0,
          compareCount: 0,
          newCount: 0,
          modCount: 0,
          remCount: 0,
          sameCount: 0,
        });
      }
      const entry = map.get(prod)!;
      if (item.status === 'NEW') {
        entry.compareCount++;
        entry.newCount++;
      } else if (item.status === 'REMOVED') {
        entry.baseCount++;
        entry.remCount++;
      } else if (item.status === 'MODIFIED') {
        entry.baseCount++;
        entry.compareCount++;
        entry.modCount++;
      } else if (item.status === 'SAME') {
        entry.baseCount++;
        entry.compareCount++;
        entry.sameCount++;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.compareCount - a.compareCount);
  }, [comparisonResult.items]);

  // Export Comparison to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const rows = filteredItems.map((item, idx) => ({
      No: idx + 1,
      Kategori: item.category === 'sektoral' ? 'Data Sektoral' : item.category === 'eWalidata' ? 'e-Walidata' : 'Data Spasial',
      'Status Perubahan': item.status === 'NEW' ? 'BARU' : item.status === 'MODIFIED' ? 'BERUBAH' : item.status === 'REMOVED' ? 'DIHAPUS' : 'SAMA',
      'Tren': item.trend === 'UP' ? 'Naik' : item.trend === 'DOWN' ? 'Turun' : 'Tetap',
      'Produsen Data': item.produsen,
      [`Kode (${baseYear})`]: item.kodeBase || '-',
      [`Kode (${compareYear})`]: item.kodeCompare || '-',
      [`Uraian Indikator (${baseYear})`]: item.uraianBase || '-',
      [`Uraian Indikator (${compareYear})`]: item.uraianCompare || '-',
      [`Satuan (${baseYear})`]: item.satuanBase || '-',
      [`Satuan (${compareYear})`]: item.satuanCompare || '-',
      'Tag Urusan': item.urusan || '-',
      'Catatan Perbedaan': item.differences.join('; ') || 'Sesuai'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, `Perbandingan ${baseYear}-${compareYear}`);

    // Add summary sheet
    if (comparisonResult.summary) {
      const summaryRows = [
        { Parameter: 'Tahun Basis', Nilai: comparisonResult.summary.baseYear },
        { Parameter: 'Tahun Pembanding', Nilai: comparisonResult.summary.compareYear },
        { Parameter: `Total Data ${baseYear}`, Nilai: comparisonResult.summary.totalBase },
        { Parameter: `Total Data ${compareYear}`, Nilai: comparisonResult.summary.totalCompare },
        { Parameter: 'Selisih Total', Nilai: comparisonResult.summary.totalCompare - comparisonResult.summary.totalBase },
        { Parameter: 'Persentase Perubahan', Nilai: `${comparisonResult.summary.percentChange}%` },
        { Parameter: 'Indikator Baru (+)', Nilai: comparisonResult.summary.newCount },
        { Parameter: 'Indikator Berubah (Beda)', Nilai: comparisonResult.summary.modifiedCount },
        { Parameter: 'Indikator Hilang/Dihapus (-)', Nilai: comparisonResult.summary.removedCount },
        { Parameter: 'Indikator Tetap Sama', Nilai: comparisonResult.summary.sameCount },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Statistik');
    }

    XLSX.writeFile(wb, `Laporan_Perbandingan_Data_${baseYear}_vs_${compareYear}.xlsx`);
  };

  const summary = comparisonResult.summary;

  return (
    <div className="space-y-6 pb-24 lg:pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-surface-container-low/90 via-surface-container/70 to-surface-container-low/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-primary/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold tracking-wide">
              <GitCompare className="w-3.5 h-3.5" />
              <span>Modul Analisis Perbandingan Antartahun</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
              Perbandingan Data Tahun ke Tahun
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Mendeteksi secara otomatis indikator yang naik, turun, baru bertambah, atau berbeda/mengalami perubahan redaksional antara tahun {baseYear} dan {compareYear}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container hover:text-on-primary-container transition-all shadow-md cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Laporan Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-highest/60 border border-outline-variant/30 text-on-surface text-xs font-semibold hover:bg-surface-variant/40 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-primary" />
              <span>Cetak Hasil</span>
            </button>
          </div>
        </div>

        {/* Year Selector & Scope Controls Bar */}
        <div className="mt-6 pt-6 border-t border-outline-variant/15 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Base Year */}
          <div className="md:col-span-3">
            <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 block">
              1. Tahun Basis (Awal)
            </label>
            <div className="relative">
              <select
                value={baseYear}
                onChange={(e) => setBaseYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface font-semibold text-sm focus:border-primary focus:outline-none appearance-none cursor-pointer"
              >
                {availableYears.map(yr => (
                  <option key={`base-${yr}`} value={yr} className="bg-slate-900 text-white">
                    Tahun {yr}
                  </option>
                ))}
              </select>
              <Calendar className="w-4 h-4 text-primary absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center">
            <button
              onClick={handleSwapYears}
              title="Tukar Tahun Pembanding"
              className="p-2.5 rounded-xl bg-surface-container-highest/50 hover:bg-primary/20 border border-outline-variant/30 text-primary hover:text-on-surface transition-all cursor-pointer group"
            >
              <ArrowRightLeft className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            </button>
          </div>

          {/* Compare Year */}
          <div className="md:col-span-3">
            <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 block">
              2. Tahun Pembanding (Akhir)
            </label>
            <div className="relative">
              <select
                value={compareYear}
                onChange={(e) => setCompareYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface font-semibold text-sm focus:border-primary focus:outline-none appearance-none cursor-pointer"
              >
                {availableYears.map(yr => (
                  <option key={`comp-${yr}`} value={yr} className="bg-slate-900 text-white">
                    Tahun {yr}
                  </option>
                ))}
              </select>
              <Calendar className="w-4 h-4 text-cyan-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Category Switcher */}
          <div className="md:col-span-5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 block">
              3. Lingkup Data Statistik
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-surface-container/60 p-1 rounded-xl border border-outline-variant/30">
              <button
                onClick={() => setSelectedCategory('sektoral')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === 'sektoral' 
                    ? 'bg-primary text-on-primary shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Data Sektoral
              </button>
              <button
                onClick={() => setSelectedCategory('eWalidata')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === 'eWalidata' 
                    ? 'bg-primary text-on-primary shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                e-Walidata
              </button>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === 'all' 
                    ? 'bg-primary text-on-primary shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Semua Kategori
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notice if base and compare years are identical or no data */}
      {baseYear === compareYear && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
          <span>Tahun Basis dan Tahun Pembanding sama ({baseYear}). Silakan pilih tahun yang berbeda untuk melihat selisih kenaikan atau perbedaannya.</span>
        </div>
      )}

      {/* KPI Cards: Comparison Summary */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Card 1: Volume Perubahan (Net) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low/70 border border-outline-variant/20 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Volume Data</span>
              {summary.percentChange >= 0 ? (
                <span className="inline-flex items-center text-xs font-bold text-emerald-400 gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +{summary.percentChange}%
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-bold text-rose-400 gap-0.5">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  {summary.percentChange}%
                </span>
              )}
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-on-surface font-mono">
                {summary.totalCompare}
              </div>
              <div className="text-[11px] text-on-surface-variant mt-1">
                Tahun {baseYear}: <span className="font-semibold text-on-surface">{summary.totalBase} data</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-outline-variant/15 text-[11px] font-medium flex items-center justify-between">
              <span className="text-on-surface-variant">Selisih Bersih:</span>
              <span className={`font-mono font-bold ${summary.totalCompare >= summary.totalBase ? 'text-emerald-400' : 'text-rose-400'}`}>
                {summary.totalCompare >= summary.totalBase ? `+${summary.totalCompare - summary.totalBase}` : summary.totalCompare - summary.totalBase}
              </span>
            </div>
          </div>

          {/* Card 2: Indikator Baru */}
          <div 
            onClick={() => setStatusFilter(statusFilter === 'NEW' ? 'ALL' : 'NEW')}
            className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-md cursor-pointer transition-all ${
              statusFilter === 'NEW' 
                ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/40' 
                : 'bg-surface-container-low/70 border-outline-variant/20 hover:border-emerald-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Data Baru (+)</span>
              <PlusCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              +{summary.newCount}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2">
              Indikator yang baru terdaftar pada Tahun {compareYear}
            </p>
            <div className="mt-3 pt-2 border-t border-outline-variant/15 text-[10px] text-emerald-400/90 font-medium">
              {statusFilter === 'NEW' ? '● Sedang difilter' : 'Klik untuk memfilter'}
            </div>
          </div>

          {/* Card 3: Indikator Berbeda / Berubah (Special Highlight) */}
          <div 
            onClick={() => setStatusFilter(statusFilter === 'MODIFIED' ? 'ALL' : 'MODIFIED')}
            className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-md cursor-pointer transition-all ${
              statusFilter === 'MODIFIED' 
                ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40' 
                : 'bg-surface-container-low/70 border-outline-variant/20 hover:border-amber-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Berbeda / Berubah</span>
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
              {summary.modifiedCount}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2">
              Uraian, satuan, atau kode mengalami penyesuaian
            </p>
            <div className="mt-3 pt-2 border-t border-outline-variant/15 text-[10px] text-amber-400/90 font-medium">
              {statusFilter === 'MODIFIED' ? '● Sedang difilter' : 'Klik untuk melihat beda'}
            </div>
          </div>

          {/* Card 4: Indikator Tetap Sama */}
          <div 
            onClick={() => setStatusFilter(statusFilter === 'SAME' ? 'ALL' : 'SAME')}
            className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-md cursor-pointer transition-all ${
              statusFilter === 'SAME' 
                ? 'bg-sky-500/20 border-sky-400 ring-2 ring-sky-400/40' 
                : 'bg-surface-container-low/70 border-outline-variant/20 hover:border-sky-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-sky-400 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Tetap / Identik (=)</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-sky-400 font-mono">
              {summary.sameCount}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2">
              Tidak mengalami perubahan antara {baseYear} & {compareYear}
            </p>
            <div className="mt-3 pt-2 border-t border-outline-variant/15 text-[10px] text-sky-400/90 font-medium">
              {statusFilter === 'SAME' ? '● Sedang difilter' : 'Klik untuk memfilter'}
            </div>
          </div>

          {/* Card 5: Tidak Dicatat Lagi / Hilang */}
          <div 
            onClick={() => setStatusFilter(statusFilter === 'REMOVED' ? 'ALL' : 'REMOVED')}
            className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-md cursor-pointer transition-all ${
              statusFilter === 'REMOVED' 
                ? 'bg-rose-500/20 border-rose-400 ring-2 ring-rose-400/40' 
                : 'bg-surface-container-low/70 border-outline-variant/20 hover:border-rose-500/40'
            }`}
          >
            <div className="flex items-center justify-between text-rose-400 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">Tidak Dicatat (-)</span>
              <XCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono">
              -{summary.removedCount}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2">
              Ada di {baseYear}, tapi tidak tercatat di {compareYear}
            </p>
            <div className="mt-3 pt-2 border-t border-outline-variant/15 text-[10px] text-rose-400/90 font-medium">
              {statusFilter === 'REMOVED' ? '● Sedang difilter' : 'Klik untuk memfilter'}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area: View Toggle (Table Diff vs Producer Breakdown) */}
      <div className="bg-surface-container-low/60 backdrop-blur-xl rounded-3xl border border-outline-variant/20 p-4 sm:p-6 shadow-md space-y-4">
        {/* Navigation Tabs & Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-outline-variant/15 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('table')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'table'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Daftar Indikator ({filteredItems.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('producers')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'producers'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Ringkasan Per Produsen ({producerBreakdown.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Status Badge Bar */}
            <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl border border-outline-variant/30 text-[11px]">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === 'ALL' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setStatusFilter('MODIFIED')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  statusFilter === 'MODIFIED' ? 'bg-amber-400 text-slate-900 font-bold' : 'text-amber-400 hover:bg-amber-400/10'
                }`}
              >
                <span>🟡 Berubah</span>
              </button>
              <button
                onClick={() => setStatusFilter('NEW')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  statusFilter === 'NEW' ? 'bg-emerald-400 text-slate-900 font-bold' : 'text-emerald-400 hover:bg-emerald-400/10'
                }`}
              >
                <span>🟢 Baru</span>
              </button>
              <button
                onClick={() => setStatusFilter('REMOVED')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  statusFilter === 'REMOVED' ? 'bg-rose-400 text-slate-900 font-bold' : 'text-rose-400 hover:bg-rose-400/10'
                }`}
              >
                <span>🔴 Hilang</span>
              </button>
            </div>

            {/* Produsen Filter Dropdown */}
            <select
              value={selectedProdusen}
              onChange={(e) => setSelectedProdusen(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary max-w-[200px] truncate"
            >
              <option value="__ALL__">Semua Produsen Data</option>
              {produsenList.map(p => (
                <option key={`p-${p}`} value={p}>{p}</option>
              ))}
            </select>

            {/* Search Box */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari uraian atau kode..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Tab 1: Detailed Difference Table */}
        {activeTab === 'table' && (
          <div className="overflow-x-auto">
            {filteredItems.length === 0 ? (
              <div className="py-16 text-center text-on-surface-variant">
                <HelpCircle className="w-10 h-10 mx-auto opacity-30 mb-3" />
                <p className="text-sm font-medium">Tidak ada data yang cocok dengan kriteria filter.</p>
                <button
                  onClick={() => { setStatusFilter('ALL'); setSelectedProdusen('__ALL__'); setSearchQuery(''); }}
                  className="mt-3 text-xs text-primary font-semibold hover:underline"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container/80 text-on-surface-variant font-mono uppercase tracking-wider border-b border-outline-variant/20">
                    <th className="py-3 px-3.5 w-12 text-center">No</th>
                    <th className="py-3 px-3.5 w-32">Status & Tren</th>
                    <th className="py-3 px-3.5 min-w-[180px]">Produsen Data</th>
                    <th className="py-3 px-3.5 w-36">Kode Data</th>
                    <th className="py-3 px-3.5 min-w-[280px]">Uraian Indikator Data</th>
                    <th className="py-3 px-3.5 w-28">Satuan</th>
                    <th className="py-3 px-3.5 min-w-[200px]">Detail Perubahan ({baseYear} → {compareYear})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15">
                  {filteredItems.map((item, idx) => {
                    const isMod = item.status === 'MODIFIED';
                    const isNew = item.status === 'NEW';
                    const isRem = item.status === 'REMOVED';

                    return (
                      <tr 
                        key={item.id} 
                        className={`transition-colors ${
                          isMod 
                            ? 'bg-amber-500/5 hover:bg-amber-500/10' 
                            : isNew 
                              ? 'bg-emerald-500/5 hover:bg-emerald-500/10' 
                              : isRem
                                ? 'bg-rose-500/5 hover:bg-rose-500/10'
                                : 'hover:bg-surface-variant/20'
                        }`}
                      >
                        <td className="py-3 px-3.5 text-center font-mono text-on-surface-variant">
                          {idx + 1}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          {isMod && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-400 font-bold border border-amber-400/40 text-[11px] shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                              BERUBAH
                            </span>
                          )}
                          {isNew && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-400/20 text-emerald-400 font-bold border border-emerald-400/40 text-[11px]">
                              <TrendingUp className="w-3 h-3" />
                              BARU (+)
                            </span>
                          )}
                          {isRem && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-400/20 text-rose-400 font-bold border border-rose-400/40 text-[11px]">
                              <TrendingDown className="w-3 h-3" />
                              HILANG (-)
                            </span>
                          )}
                          {!isMod && !isNew && !isRem && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-500/15 text-slate-300 font-medium text-[11px]">
                              <Minus className="w-3 h-3 opacity-60" />
                              TETAP (=)
                            </span>
                          )}
                        </td>

                        {/* Produsen */}
                        <td className="py-3 px-3.5 font-medium text-on-surface">
                          {item.produsen || '-'}
                        </td>

                        {/* Kode */}
                        <td className="py-3 px-3.5 font-mono text-[11px]">
                          {isMod && item.kodeBase && item.kodeCompare && item.kodeBase !== item.kodeCompare ? (
                            <div className="space-y-0.5">
                              <span className="text-on-surface-variant line-through text-[10px] block">{item.kodeBase}</span>
                              <span className="text-amber-400 font-bold block">{item.kodeCompare}</span>
                            </div>
                          ) : (
                            <span className="text-on-surface">{item.kode || '-'}</span>
                          )}
                        </td>

                        {/* Uraian */}
                        <td className="py-3 px-3.5">
                          {isMod && item.uraianBase && item.uraianCompare && item.uraianBase !== item.uraianCompare ? (
                            <div className="space-y-1">
                              <div className="text-[11px] text-on-surface-variant line-through">
                                {item.uraianBase}
                              </div>
                              <div className="text-amber-300 font-medium bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20">
                                {item.uraianCompare}
                              </div>
                            </div>
                          ) : (
                            <span className="text-on-surface font-medium leading-relaxed">
                              {item.uraian || '-'}
                            </span>
                          )}
                        </td>

                        {/* Satuan */}
                        <td className="py-3 px-3.5">
                          {isMod && item.satuanBase && item.satuanCompare && item.satuanBase !== item.satuanCompare ? (
                            <div>
                              <span className="text-on-surface-variant line-through text-[10px] block">{item.satuanBase}</span>
                              <span className="text-amber-400 font-bold block">{item.satuanCompare}</span>
                            </div>
                          ) : (
                            <span className="text-on-surface-variant">{item.satuan || '-'}</span>
                          )}
                        </td>

                        {/* Differences Description */}
                        <td className="py-3 px-3.5">
                          {item.differences.length > 0 ? (
                            <div className="space-y-1">
                              {item.differences.map((diff, dIdx) => (
                                <span 
                                  key={`diff-${dIdx}`}
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium mr-1 mb-1 ${
                                    isMod 
                                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                      : isNew 
                                        ? 'bg-emerald-400/20 text-emerald-300'
                                        : 'bg-rose-400/20 text-rose-300'
                                  }`}
                                >
                                  {diff}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">Identik</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Producer Summary Breakdown */}
        {activeTab === 'producers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/80 text-on-surface-variant font-mono uppercase tracking-wider border-b border-outline-variant/20">
                  <th className="py-3 px-3.5 w-12 text-center">No</th>
                  <th className="py-3 px-3.5">Perangkat Daerah (Produsen Data)</th>
                  <th className="py-3 px-3.5 text-center">Tahun {baseYear}</th>
                  <th className="py-3 px-3.5 text-center">Tahun {compareYear}</th>
                  <th className="py-3 px-3.5 text-center">Tren Volume</th>
                  <th className="py-3 px-3.5 text-center">Data Baru (+)</th>
                  <th className="py-3 px-3.5 text-center">Berubah (🟡)</th>
                  <th className="py-3 px-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {producerBreakdown.map((prod, idx) => {
                  const diff = prod.compareCount - prod.baseCount;
                  return (
                    <tr key={`prod-b-${idx}`} className="hover:bg-surface-variant/20 transition-colors">
                      <td className="py-3 px-3.5 text-center font-mono text-on-surface-variant">{idx + 1}</td>
                      <td className="py-3 px-3.5 font-bold text-on-surface">{prod.name}</td>
                      <td className="py-3 px-3.5 text-center font-mono">{prod.baseCount}</td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-primary">{prod.compareCount}</td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {diff > 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            +{diff} (Naik)
                          </span>
                        ) : diff < 0 ? (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            {diff} (Turun)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <Minus className="w-3.5 h-3.5" />
                            Tetap
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono text-emerald-400 font-semibold">
                        {prod.newCount > 0 ? `+${prod.newCount}` : '-'}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono text-amber-400 font-semibold">
                        {prod.modCount > 0 ? `${prod.modCount}` : '-'}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <button
                          onClick={() => {
                            setSelectedProdusen(prod.name);
                            setActiveTab('table');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-primary/20 text-primary text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
