import React, { useState, useMemo, useEffect } from 'react';
import { AllData, UploadRecord } from '../types';
import { Printer, Settings2, FileText, ChevronDown, Check, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';

interface PrintDocumentProps {
  data: AllData | null;
  uploads: UploadRecord[];
}

const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const PrintDocument: React.FC<PrintDocumentProps> = ({ data, uploads }) => {
  const [selectedProdusen, setSelectedProdusen] = useState<string>('__ALL__');
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  
  const numberToWordsID = (num: number): string => {
    if (num === 0) return "Nol";
    const words = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    let result = "";
    if (num < 12) result = words[num];
    else if (num < 20) result = words[num - 10] + " Belas";
    else if (num < 100) result = words[Math.floor(num / 10)] + " Puluh " + words[num % 10];
    else if (num < 200) result = "Seratus " + numberToWordsID(num - 100);
    else if (num < 1000) result = words[Math.floor(num / 100)] + " Ratus " + numberToWordsID(num % 100);
    else if (num < 2000) result = "Seribu " + numberToWordsID(num - 1000);
    else if (num < 1000000) result = numberToWordsID(Math.floor(num / 1000)) + " Ribu " + numberToWordsID(num % 1000);
    return result.trim().replace(/\s+/g, ' ');
  };

  // Date automation settings
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-01');
  const [dateTextMode, setDateTextMode] = useState<'terbilang' | 'angka'>('terbilang');
  const [autoFillDate, setAutoFillDate] = useState<boolean>(true);
  const [marginSize, setMarginSize] = useState<string>('15mm');
  const [forceLampiranSignNewPage, setForceLampiranSignNewPage] = useState<boolean>(false);
  
  // Nomor surat prefix & suffix matching Google Stitch Design
  const [nomorPrefix, setNomorPrefix] = useState<string>('500.14/');
  const [nomorSuffix, setNomorSuffix] = useState<string>('/35.07.315/2026');

  // Custom signatures state
  const [form, setForm] = useState({
    hari: 'Selasa',
    tanggalTeks: 'Satu',
    bulanTeks: 'September',
    tahunTeks: 'Dua Ribu Dua Puluh Enam',
    tanggalAcara: '1 September 2026',
    namaWalidata: 'Drs. ATSALIS SUPRIYANTO, M.Si.',
    nipWalidata: '196711301988091001',
    namaKoordinator: 'Ir. TOMIE HERAWANTO, M.P.',
    nipKoordinator: '196611261993031004',
    namaProdusen: 'YUDHI HINDHARTO, S.T., M.Si.',
    nipProdusen: '197206121998031007',
    jabatanProdusen: 'Kepala Perangkat Daerah',
  });

  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  // Full composite nomor surat with non-breaking space for ~4 digits
  const fullNomorSurat = `${nomorPrefix}\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0${nomorSuffix}`;

  // Update date fields whenever selectedDate or dateTextMode changes
  const applyDateAutomation = (dateStr: string, mode: 'terbilang' | 'angka') => {
    if (!dateStr) return;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const dateObj = new Date(year, month, day);
    const dayName = INDONESIAN_DAYS[dateObj.getDay()];
    const monthName = INDONESIAN_MONTHS[month];

    const tanggalTeks = mode === 'terbilang' ? numberToWordsID(day) : day.toString();
    const bulanTeks = monthName;
    const tahunTeks = mode === 'terbilang' ? numberToWordsID(year) : year.toString();
    const tanggalAcara = `${day} ${monthName} ${year}`;

    setForm(prev => ({
      ...prev,
      hari: dayName,
      tanggalTeks,
      bulanTeks,
      tahunTeks,
      tanggalAcara
    }));
  };

  const handleDateChange = (newDateStr: string) => {
    setSelectedDate(newDateStr);
    applyDateAutomation(newDateStr, dateTextMode);
  };

  const handleModeChange = (newMode: 'terbilang' | 'angka') => {
    setDateTextMode(newMode);
    applyDateAutomation(selectedDate, newMode);
  };

  const handleSetToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    setSelectedDate(dateStr);
    applyDateAutomation(dateStr, dateTextMode);
  };

  // Extract unique Produsen Data and Years
  const availableProdusen = useMemo(() => {
    if (!data) return [];
    const allProdusen = new Set<string>();
    data.eWalidata.forEach(item => { if (item['Produsen Data']) allProdusen.add(item['Produsen Data']); });
    data.sektoral.forEach(item => { if (item['Produsen Data']) allProdusen.add(item['Produsen Data']); });
    data.spasial.forEach(item => { if (item['Produsen Data']) allProdusen.add(item['Produsen Data']); });
    return Array.from(allProdusen).sort();
  }, [data]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    uploads.forEach(up => years.add(up.year));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [uploads]);

  useEffect(() => {
    if (availableYears.length > 0 && selectedYears.length === 0) {
      setSelectedYears([availableYears[0]]);
    }
  }, [availableYears]);

  const toggleYear = (year: string) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year) 
        : [...prev, year]
    );
  };

  // Determine list of producers to generate documents for
  const producersToPrint = useMemo(() => {
    if (!data || availableProdusen.length === 0) return [];
    if (selectedProdusen === '__ALL__') {
      return availableProdusen;
    }
    return availableProdusen.includes(selectedProdusen) ? [selectedProdusen] : [];
  }, [availableProdusen, selectedProdusen, data]);

  // Calculate total data count across selected producers and years
  const totalDataCount = useMemo(() => {
    if (!data || producersToPrint.length === 0 || selectedYears.length === 0) return 0;
    
    let count = 0;
    const filterFn = (item: any) => 
      producersToPrint.includes(item['Produsen Data']) && 
      selectedYears.includes(item.Tahun);

    count += data.eWalidata.filter(filterFn).length;
    count += data.sektoral.filter(filterFn).length;
    count += data.spasial.filter(filterFn).length;
    return count;
  }, [data, producersToPrint, selectedYears]);

  const handlePrint = () => {
    window.print();
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-32 text-slate-400 print:hidden">
        <FileText className="w-16 h-16 opacity-30 mb-4" />
        <p className="text-lg">Data belum tersedia. Silakan unggah data terlebih dahulu.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-4.5rem)] font-sans print:block print:w-full print:min-h-0 print:h-auto print:p-0 print:m-0 print:bg-white">
      <style>
        {`
          @media print {
            /* Sembunyikan SEMUA scrollbar untuk menghilangkan bar panjang di sisi kanan */
            html, body, #root, * {
              scrollbar-width: none !important;
              -ms-overflow-style: none !important;
            }
            ::-webkit-scrollbar {
              display: none !important;
              width: 0px !important;
              height: 0px !important;
            }

            @page {
              size: A4 portrait;
              margin-top: ${marginSize};
              margin-bottom: ${marginSize};
              margin-left: 15mm;
              margin-right: 15mm;
            }

            body, html {
              background-color: #ffffff !important;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: Arial, Helvetica, sans-serif !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Sembunyikan SEMUA elemen navigasi, header web, dan kontrol konfigurasi saat dicetak */
            header,
            aside,
            nav,
            [class*="print:hidden"],
            .print\\:hidden {
              display: none !important;
              visibility: hidden !important;
              height: 0 !important;
              width: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              position: absolute !important;
              top: -9999px !important;
              left: -9999px !important;
              opacity: 0 !important;
              pointer-events: none !important;
            }

            /* Reset wrapper utama agar dokumen mengisi halaman penuh tanpa bar hitam */
            #root,
            #root > div,
            main {
              background-color: #ffffff !important;
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
              overflow: visible !important;
              display: block !important;
              position: static !important;
              box-shadow: none !important;
              border: none !important;
            }

            * {
              box-shadow: none !important;
              text-shadow: none !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .print-page-break {
              page-break-after: always !important;
              break-after: page !important;
            }
            .print-page-break-before {
              page-break-before: always !important;
              break-before: page !important;
            }
            .print-producer-break {
              page-break-before: always !important;
              break-before: page !important;
            }

            table {
              page-break-inside: auto;
              width: 100% !important;
              max-width: 100% !important;
              background-color: #ffffff !important;
            }
            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            thead {
              display: table-header-group;
            }
            tfoot {
              display: table-footer-group;
            }
            .avoid-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              break-after: auto !important;
            }
            .force-new-page {
              page-break-before: always !important;
              break-before: page !important;
            }
          }
        `}
      </style>
      
      {/* --- CONFIGURATION PANEL (Google Stitch Design 1) --- */}
      <div className="print:hidden p-4 sm:p-6 lg:p-8 flex flex-col gap-6 bg-[#060911]/90 backdrop-blur-2xl border-b border-white/10 relative z-20">
        
        {/* Banner Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-slate-800/90 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_-5px_rgba(56,189,248,0.35)] shrink-0">
              <Settings2 className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Konfigurasi Cetak Dokumen PDF</h2>
              <p className="text-xs text-slate-400 mt-0.5">Sesuaikan data surat, pengisian tanggal otomatis, jarak margin, dan tanda tangan</p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-5">
            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 font-medium block">Total Data</span>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-cyan-400 font-mono">
                  {totalDataCount} Baris
                </span>
                {selectedProdusen === '__ALL__' && (
                  <span className="text-[11px] font-semibold text-sky-300 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded-full font-mono">
                    {availableProdusen.length} OPD
                  </span>
                )}
              </div>
            </div>

            <button 
              onClick={handlePrint}
              disabled={totalDataCount === 0}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-400 via-cyan-400 to-sky-500 text-slate-950 font-semibold text-sm shadow-[0_0_20px_-3px_rgba(14,165,233,0.45)] hover:brightness-110 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4 stroke-[2.2]" />
              <span>{selectedProdusen === '__ALL__' ? `Cetak Semua (${availableProdusen.length} OPD)` : 'Cetak Dokumen'}</span>
            </button>
          </div>
        </div>

        {/* 3 Column Grid Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Filter Produsen & Tahun */}
          <div className="bg-slate-900/65 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/20 transition-colors duration-300">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold text-xs ring-1 ring-cyan-500/30">1</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">Filter Produsen & Tahun</h3>
              </div>

              {/* Produsen Data Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Produsen Data</label>
                <div className="relative">
                  <select 
                    value={selectedProdusen}
                    onChange={(e) => setSelectedProdusen(e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all duration-200 cursor-pointer appearance-none pr-9 font-medium"
                  >
                    <option value="__ALL__" className="bg-slate-900 text-cyan-300 font-semibold">
                      ⚡ Cetak Semua Sekaligus ({availableProdusen.length} Produsen Data)
                    </option>
                    <option disabled className="bg-slate-900 text-slate-500">──────── Per Produsen Data ────────</option>
                    {availableProdusen.map(p => (
                      <option className="bg-slate-900 text-slate-100" key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {selectedProdusen === '__ALL__' && (
                  <div className="mt-2 p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-2 text-[11px] text-cyan-300 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Mode cetak semua aktif: Berita Acara & Lampiran seluruh {availableProdusen.length} OPD digabung dalam 1 berkas cetak.</span>
                  </div>
                )}
              </div>

              {/* Tahun Data Multi-Select */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Tahun Data ({selectedYears.length} Dipilih)
                </label>
                <div className="relative">
                  <div 
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none cursor-pointer flex items-center justify-between"
                    onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                  >
                    <span className="truncate">
                      {selectedYears.length === 0 ? 'Pilih Tahun' : selectedYears.join(', ')}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  </div>

                  {isYearDropdownOpen && (
                    <div className="absolute top-[100%] mt-1 left-0 right-0 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 py-2 max-h-60 overflow-y-auto">
                      {availableYears.map(year => (
                        <div 
                          key={year}
                          className="px-4 py-2 flex items-center gap-3 hover:bg-slate-800 cursor-pointer text-slate-200 text-xs transition-colors"
                          onClick={() => toggleYear(year)}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedYears.includes(year) ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'}`}>
                            {selectedYears.includes(year) && <Check className="w-3 h-3 text-slate-950 font-bold" />}
                          </div>
                          <span className="font-mono">{year}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Nomor Surat Prefix & Suffix */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Nomor Surat</label>
                <div className="flex items-center gap-2">
                  <div className="w-1/3">
                    <input
                      type="text"
                      value={nomorPrefix}
                      onChange={(e) => setNomorPrefix(e.target.value)}
                      placeholder="500.14/"
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
                    />
                  </div>
                  <div className="w-2/3">
                    <input
                      type="text"
                      value={nomorSuffix}
                      onChange={(e) => setNomorSuffix(e.target.value)}
                      placeholder="/35.07.315/2026"
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="mt-6 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span>Identifikasi Dokumen</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Siap diverifikasi
              </span>
            </div>
          </div>

          {/* Column 2: Otomatisasi Tanggal & Jarak */}
          <div className="bg-slate-900/65 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/20 transition-colors duration-300">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold text-xs ring-1 ring-cyan-500/30">2</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">Otomatisasi Tanggal & Jarak</h3>
              </div>

              {/* Tanggal Acara Picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    Pilih Tanggal Acara
                  </label>
                  <button
                    type="button"
                    onClick={handleSetToday}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Hari Ini
                  </button>
                </div>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={e => handleDateChange(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
                />
              </div>

              {/* Checkbox auto fill */}
              <div className="p-3 rounded-xl bg-slate-800/30 border border-white/5 space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-200">
                  <input 
                    type="checkbox" 
                    checked={autoFillDate} 
                    onChange={e => setAutoFillDate(e.target.checked)}
                    className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                  />
                  <span>Isi Tanggal Otomatis ke Paragraf</span>
                </label>

                {autoFillDate && (
                  <div className="flex items-center gap-4 pt-1.5 border-t border-white/5 text-xs text-slate-300 pl-6">
                    <span className="text-[11px] text-slate-400">Format:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="dateMode" 
                        checked={dateTextMode === 'terbilang'} 
                        onChange={() => handleModeChange('terbilang')}
                        className="text-cyan-500 focus:ring-cyan-500"
                      />
                      <span>Terbilang</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="dateMode" 
                        checked={dateTextMode === 'angka'} 
                        onChange={() => handleModeChange('angka')}
                        className="text-cyan-500 focus:ring-cyan-500"
                      />
                      <span>Angka</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Margin Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Jarak Header & Footer (Margin Cetak)</label>
                <div className="relative">
                  <select 
                    value={marginSize}
                    onChange={e => setMarginSize(e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 appearance-none pr-9 cursor-pointer"
                  >
                    <option value="15mm" className="bg-slate-900 text-slate-100">Standar Aman (15 mm) - Direkomendasikan</option>
                    <option value="10mm" className="bg-slate-900 text-slate-100">Kompak (10 mm) - Muat Lebih Banyak</option>
                    <option value="20mm" className="bg-slate-900 text-slate-100">Lebar (20 mm) - Format Formal</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Signature Separation Option */}
              <div className="p-3 rounded-xl bg-slate-800/30 border border-white/5">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs font-medium text-slate-200">
                  <input 
                    type="checkbox" 
                    checked={forceLampiranSignNewPage} 
                    onChange={e => setForceLampiranSignNewPage(e.target.checked)}
                    className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4 mt-0.5"
                  />
                  <div>
                    <span>Taruh Tanda Tangan Lampiran di Halaman Baru</span>
                    <p className="text-[11px] text-slate-400 font-normal mt-0.5 leading-relaxed">
                      *Default sistem otomatis mencegah tanda tangan terpotong dan menaruhnya utuh di halaman bawah jika ruang tidak cukup.
                    </p>
                  </div>
                </label>
              </div>

            </div>

            <div className="mt-6 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span>Engine Layout PDF</span>
              <span className="text-cyan-400 font-mono">AutoPage-v2.4</span>
            </div>
          </div>

          {/* Column 3: Data Penanda Tangan */}
          <div className="bg-slate-900/65 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/20 transition-colors duration-300">
            <div className="space-y-3.5">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold text-xs ring-1 ring-cyan-500/30">3</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">Data Penanda Tangan</h3>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Jabatan Produsen Data</label>
                <input 
                  type="text" 
                  value={form.jabatanProdusen} 
                  onChange={e => setForm({...form, jabatanProdusen: e.target.value})}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Nama Produsen</label>
                  <input 
                    type="text" 
                    value={form.namaProdusen} 
                    onChange={e => setForm({...form, namaProdusen: e.target.value})} 
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">NIP Produsen</label>
                  <input 
                    type="text" 
                    value={form.nipProdusen} 
                    onChange={e => setForm({...form, nipProdusen: e.target.value})} 
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Nama Walidata</label>
                  <input 
                    type="text" 
                    value={form.namaWalidata} 
                    onChange={e => setForm({...form, namaWalidata: e.target.value})} 
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">NIP Walidata</label>
                  <input 
                    type="text" 
                    value={form.nipWalidata} 
                    onChange={e => setForm({...form, nipWalidata: e.target.value})} 
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Nama Koordinator</label>
                  <input 
                    type="text" 
                    value={form.namaKoordinator} 
                    onChange={e => setForm({...form, namaKoordinator: e.target.value})} 
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">NIP Koordinator</label>
                  <input 
                    type="text" 
                    value={form.nipKoordinator} 
                    onChange={e => setForm({...form, nipKoordinator: e.target.value})} 
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400" 
                  />
                </div>
              </div>

            </div>

            <div className="mt-6 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span>Otorisasi</span>
              <span className="inline-flex items-center gap-1.5 text-cyan-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Tersinkronisasi SK
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* --- PRINT PREVIEW CONTAINER --- */}
      <div className="p-4 sm:p-8 print:p-0 print:m-0 print:pb-0 bg-[#060911]/60 print:bg-white flex-1 overflow-x-auto overflow-y-auto print:overflow-visible print:block print:w-full print:min-h-0 print:h-auto w-full pb-28 lg:pb-12">
        
        {/* Render each producer document */}
        {producersToPrint.map((prodName, prodIndex) => {
          const prodEWalidata = (data.eWalidata || []).filter(item => item['Produsen Data'] === prodName && selectedYears.includes(item.Tahun));
          const prodSektoral = (data.sektoral || []).filter(item => item['Produsen Data'] === prodName && selectedYears.includes(item.Tahun));
          const prodSpasial = (data.spasial || []).filter(item => item['Produsen Data'] === prodName && selectedYears.includes(item.Tahun));
          const prodTotal = prodEWalidata.length + prodSektoral.length + prodSpasial.length;

          return (
            <div 
              key={prodName}
              className={`w-[210mm] min-h-[297mm] mx-auto bg-white text-black shadow-2xl print:shadow-none print:mx-0 print:w-full print:max-w-none print:min-h-0 print:h-auto print:overflow-visible print:[-webkit-print-color-adjust:exact] print:[color-adjust:exact] mb-12 print:mb-0 ${prodIndex > 0 ? 'print-producer-break' : ''}`}
              style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
            >
              
              {/* Web preview divider for batch printing */}
              {selectedProdusen === '__ALL__' && (
                <div className="print:hidden p-3 bg-slate-900 border-b border-cyan-500/20 text-cyan-300 flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">
                      {prodIndex + 1}
                    </span>
                    DOKUMEN OPD ({prodIndex + 1}/{producersToPrint.length}): {prodName}
                  </span>
                  <span className="bg-cyan-500/10 px-2 py-0.5 rounded text-cyan-400 font-bold">
                    {prodTotal} Baris Data
                  </span>
                </div>
              )}

              {/* Page 1: Berita Acara Penetapan */}
              <div className="p-[15mm] print:p-0 print-page-break">
                
                {/* KOP Surat */}
                <div className="flex items-center border-b-[3px] border-double border-black pb-3 mb-4">
                  <div className="w-[70px] h-[85px] flex items-center justify-center shrink-0">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Logo_Kabupaten_Malang_-_Seal_of_Malang_Regency.svg/500px-Logo_Kabupaten_Malang_-_Seal_of_Malang_Regency.svg.png" 
                      alt="Logo Kab Malang" 
                      className="max-w-full max-h-full object-contain" 
                    />
                  </div>
                  <div className="flex-1 text-center leading-[1.15]">
                    <div className="text-[14pt]">PEMERINTAH KABUPATEN MALANG</div>
                    <div className="text-[18pt] font-bold tracking-wide">DINAS KOMUNIKASI DAN INFORMATIKA</div>
                    <div className="text-[10pt]">Jalan K.H. Agus Salim No. 7 Gedung J Lantai 3, Malang, Jawa Timur</div>
                    <div className="text-[10pt]">Telepon/ Faksimile (0341) 408788 Laman : https://kominfo.malangkab.go.id</div>
                    <div className="text-[10pt]">Pos-el : kominfo@malangkab.go.id, Kode Pos : 65119</div>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center font-bold mb-3 leading-[1.15]">
                  <div className="text-[14pt] mb-1">BERITA ACARA</div>
                  <div className="text-[12pt] uppercase">DAFTAR DATA STATISTIK SEKTORAL DAERAH</div>
                  <div className="text-[12pt] uppercase">{prodName}</div>
                  <div className="text-[12pt] uppercase">KABUPATEN MALANG</div>
                  <div className="text-[12pt] font-normal mt-1">Nomor : {fullNomorSurat}</div>
                </div>

                {/* Content */}
                <div className="text-justify text-[12pt] mb-3 leading-[1.15]">
                  <p className="indent-8 mb-2">
                    Pada Hari ini, <strong>{autoFillDate ? (form.hari || '.....') : '.....'}</strong> tanggal <strong>{autoFillDate ? (form.tanggalTeks || '.....') : '.....'}</strong> bulan <strong>{autoFillDate ? (form.bulanTeks || '.....') : '.....'}</strong> tahun <strong>{autoFillDate ? (form.tahunTeks || '.....') : '.....'}</strong>, bertempat di Kabupaten Malang, 
                    dilaksanakan Penetapan Daftar Data Statistik Sektoral Daerah pada 
                    <strong> {prodName} </strong> 
                    dan disepakati empat hal sebagai berikut :
                  </p>

                  <table className="w-full text-[12pt] align-top leading-[1.15]">
                    <tbody>
                      <tr>
                        <td className="w-24">KESATU</td>
                        <td className="w-4">:</td>
                        <td className="text-justify">
                          Daftar Data sebagaimana terlampir pada Berita Acara ini, ditetapkan 
                          sejumlah <strong>{prodTotal} ({numberToWordsID(prodTotal)})</strong> Data Statistik Sektoral Daerah (DSSD).
                        </td>
                      </tr>
                      <tr>
                        <td>KEDUA</td>
                        <td>:</td>
                        <td className="text-justify">
                          Daftar Data tersebut digunakan sebagai dasar bagi Kepala Perangkat 
                          Daerah selaku Produsen Data dalam menyampaikan ke Walidata sesuai 
                          urusan tugas dan kewenangannya.
                        </td>
                      </tr>
                      <tr>
                        <td>KETIGA</td>
                        <td>:</td>
                        <td className="text-justify">
                          Daftar Data dimaksud mencakup klasifikasi tentang Kode DSSD, Uraian 
                          DSSD, Satuan, dan Periode.
                        </td>
                      </tr>
                      <tr>
                        <td>KEEMPAT</td>
                        <td>:</td>
                        <td className="text-justify">
                          Badan Perencanaan dan Pembangunan Daerah Kabupaten Malang selaku 
                          Koordinator Data telah memverifikasi daftar data tersebut dan akan 
                          digunakan sebagai acuan dalam perencanaan pembangunan.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Date & Signatures Table (Print-safe Layout) */}
                <div className="text-[12pt] text-center leading-[1.15] avoid-break" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <div className="mb-4">
                    Malang, {form.tanggalAcara}<br/>
                    Tim Pelaksana Satu Data Kabupaten Malang
                  </div>

                  <table className="w-full border-0 mb-4 avoid-break" style={{ border: 'none', borderCollapse: 'collapse', pageBreakInside: 'avoid', breakInside: 'avoid', width: '100%', background: 'transparent' }}>
                    <tbody>
                      <tr style={{ border: 'none' }}>
                        <td style={{ width: '50%', border: 'none', textAlign: 'center', verticalAlign: 'top', padding: '0 8px' }}>
                          <div className="font-normal leading-tight">
                            Produsen Data,<br/>
                            {form.jabatanProdusen || `Kepala ${prodName}`}<br/>
                            Kabupaten Malang
                          </div>
                        </td>
                        <td style={{ width: '50%', border: 'none', textAlign: 'center', verticalAlign: 'top', padding: '0 8px' }}>
                          <div className="font-normal leading-tight">
                            Walidata,<br/>
                            Kepala Dinas Komunikasi dan Informatika<br/>
                            Kabupaten Malang
                          </div>
                        </td>
                      </tr>
                      <tr style={{ border: 'none' }}>
                        <td style={{ height: '60px', border: 'none', padding: 0 }}></td>
                        <td style={{ height: '60px', border: 'none', padding: 0 }}></td>
                      </tr>
                      <tr style={{ border: 'none' }}>
                        <td style={{ width: '50%', border: 'none', textAlign: 'center', verticalAlign: 'bottom', padding: '0 8px' }}>
                          <div className="font-bold underline">{form.namaProdusen}</div>
                          <div>NIP. {form.nipProdusen}</div>
                        </td>
                        <td style={{ width: '50%', border: 'none', textAlign: 'center', verticalAlign: 'bottom', padding: '0 8px' }}>
                          <div className="font-bold underline">{form.namaWalidata}</div>
                          <div>NIP. {form.nipWalidata}</div>
                        </td>
                      </tr>
                      <tr style={{ border: 'none' }}>
                        <td colSpan={2} style={{ border: 'none', textAlign: 'center', paddingTop: '16px', paddingBottom: 0 }}>
                          <div style={{ display: 'inline-block', width: '320px', textAlign: 'center' }}>
                            <div className="font-normal leading-tight">
                              Koordinator,<br/>
                              Kepala Badan Perencanaan Pembangunan Daerah<br/>
                              Kabupaten Malang
                            </div>
                            <div className="h-[60px]"></div>
                            <div className="font-bold underline">{form.namaKoordinator}</div>
                            <div>NIP. {form.nipKoordinator}</div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Page 2: Lampiran Berita Acara */}
              <div className="p-[15mm] print:p-0 print-page-break-before">
                
                {/* Lampiran Header box without border */}
                <div className="p-2 mb-6 text-xs w-[300px] ml-auto">
                  <table className="w-full">
                    <tbody>
                      <tr><td colSpan={3}>Lampiran Berita Acara</td></tr>
                      <tr><td colSpan={3}>Daftar Data Statistik Sektoral Daerah (DSSD)</td></tr>
                      <tr><td className="w-16">Nomor</td><td className="w-2">:</td><td>{fullNomorSurat}</td></tr>
                      <tr><td>Tanggal</td><td>:</td><td>{form.tanggalAcara}</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="text-center font-bold mb-6 uppercase text-sm">
                  <div>LAMPIRAN BERITA ACARA</div>
                  <div>DAFTAR DATA STATISTIK SEKTORAL DAERAH</div>
                  <div>{prodName}</div>
                  <div>KABUPATEN MALANG</div>
                </div>

                {/* Tables Container */}
                <div className="text-[11px] print:text-[10px]">
                  
                  {/* E-Walidata Table */}
                  <table className="w-full border-collapse border border-black mb-0">
                    <thead>
                      <tr className="bg-gray-100 font-bold text-center">
                        <th colSpan={5} className="border border-black p-1">Data E-Walidata</th>
                      </tr>
                      <tr className="bg-gray-100 font-bold text-center">
                        <th className="border border-black p-1 w-8">No</th>
                        <th className="border border-black p-1 w-32">Kode</th>
                        <th className="border border-black p-1">Judul Data</th>
                        <th className="border border-black p-1 w-24">Satuan</th>
                        <th className="border border-black p-1 w-16">Periode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prodEWalidata.length > 0 ? prodEWalidata.map((item, index) => (
                        <tr key={index} className="text-center">
                          <td className="border border-black p-1">{index + 1}</td>
                          <td className="border border-black p-1">{item['Kode DSSD'] || '-'}</td>
                          <td className="border border-black p-1 text-left">{item['Uraian DSSD'] || '-'}</td>
                          <td className="border border-black p-1">{item.Satuan || '-'}</td>
                          <td className="border border-black p-1">{item.Tahun || '-'}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="border border-black p-2 text-center text-gray-500 italic">Tidak ada data</td></tr>
                      )}
                    </tbody>
                  </table>

                  {/* Sektoral Table */}
                  <table className="w-full border-collapse border border-black mb-0 border-t-0">
                    <thead>
                      <tr className="bg-gray-100 font-bold text-center border-t border-black">
                        <th colSpan={5} className="border border-black p-1 border-t-0">Data Sektoral</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prodSektoral.length > 0 ? prodSektoral.map((item, index) => (
                        <tr key={index} className="text-center">
                          <td className="border border-black p-1 w-8">{prodEWalidata.length + index + 1}</td>
                          <td className="border border-black p-1 w-32">{item['Kode Data'] || '-'}</td>
                          <td className="border border-black p-1 text-left">{item['Uraian DSSD'] || '-'}</td>
                          <td className="border border-black p-1 w-24">{item.Satuan || '-'}</td>
                          <td className="border border-black p-1 w-16">{item.Tahun || '-'}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="border border-black p-2 text-center text-gray-500 italic border-t-0">Tidak ada data</td></tr>
                      )}
                    </tbody>
                  </table>

                  {/* Spasial Table */}
                  <table className="w-full border-collapse border border-black mb-8 border-t-0">
                    <thead>
                      <tr className="bg-gray-100 font-bold text-center border-t border-black">
                        <th colSpan={5} className="border border-black p-1 border-t-0">Data Spasial</th>
                      </tr>
                      <tr className="bg-gray-100 font-bold text-center">
                        <th className="border border-black p-1 w-8">No</th>
                        <th className="border border-black p-1 w-32">Kode</th>
                        <th className="border border-black p-1">Nama Data</th>
                        <th className="border border-black p-1 w-24">Format Data</th>
                        <th className="border border-black p-1 w-16">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prodSpasial.length > 0 ? prodSpasial.map((item, index) => (
                        <tr key={index} className="text-center">
                          <td className="border border-black p-1">{prodEWalidata.length + prodSektoral.length + index + 1}</td>
                          <td className="border border-black p-1">{item['Kode Data'] || '-'}</td>
                          <td className="border border-black p-1 text-left">{item['Nama Informasi Geospasial'] || '-'}</td>
                          <td className="border border-black p-1">{item['Format penyimpanan data'] || item['Format Penyimpanan Data'] || item['Format penyimpanan'] || '-'}</td>
                          <td className="border border-black p-1">{item.Tahun || '-'}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="border border-black p-2 text-center text-gray-500 italic border-t-0">Tidak ada data</td></tr>
                      )}
                    </tbody>
                  </table>

                  {/* Final Signature on Lampiran - Bulletproof Table Layout for Print */}
                  <table 
                    className={`w-full border-0 ${forceLampiranSignNewPage ? 'force-new-page pt-8' : 'mt-8'} avoid-break`}
                    style={{ 
                      pageBreakInside: 'avoid', 
                      breakInside: 'avoid',
                      ...(forceLampiranSignNewPage ? { pageBreakBefore: 'always', breakBefore: 'page' } : {}),
                      border: 'none',
                      borderCollapse: 'collapse',
                      width: '100%',
                      backgroundColor: 'transparent'
                    }}
                  >
                    <tbody>
                      <tr style={{ border: 'none' }}>
                        <td style={{ width: '45%', border: 'none', padding: 0 }}></td>
                        <td style={{ width: '55%', border: 'none', textAlign: 'center', padding: 0 }}>
                          <div 
                            className="text-sm avoid-break" 
                            style={{ 
                              display: 'inline-block',
                              width: '280px',
                              textAlign: 'center',
                              pageBreakInside: 'avoid',
                              breakInside: 'avoid'
                            }}
                          >
                            <div className="font-normal leading-normal">
                              Produsen Data,<br/>
                              {form.jabatanProdusen || `Kepala ${prodName}`}<br/>
                              Kabupaten Malang
                            </div>
                            <div style={{ height: '60px' }}></div>
                            <div className="font-bold underline leading-normal">{form.namaProdusen}</div>
                            <div className="leading-normal">NIP. {form.nipProdusen}</div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
};
