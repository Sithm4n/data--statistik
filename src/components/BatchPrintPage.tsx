import React, { useState, useMemo, useEffect } from 'react';
import { AllData, UploadRecord, ProdusenSignerConfig } from '../types';
import { 
  Printer, 
  Settings2, 
  CheckSquare, 
  Square, 
  Search, 
  UserCheck, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  Building2, 
  FileSpreadsheet, 
  Sparkles, 
  CheckCircle2,
  Copy,
  Layers,
  Filter,
  Eye,
  Info
} from 'lucide-react';
import { producerConfigService, getSmartJabatan } from '../services/producerConfigService';

const DEFAULT_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Logo_Kabupaten_Malang_-_Seal_of_Malang_Regency.svg/500px-Logo_Kabupaten_Malang_-_Seal_of_Malang_Regency.svg.png';

interface BatchPrintPageProps {
  data: AllData | null;
  uploads: UploadRecord[];
}

const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const BatchPrintPage: React.FC<BatchPrintPageProps> = ({ data, uploads }) => {
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedProducers, setExpandedProducers] = useState<Record<string, boolean>>({});
  const [activePreviewProducer, setActivePreviewProducer] = useState<string | null>(null);

  // Date automation settings
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-01');
  const [dateTextMode, setDateTextMode] = useState<'terbilang' | 'angka'>('terbilang');
  const [autoFillDate, setAutoFillDate] = useState<boolean>(true);

  // Nomor surat configuration
  const [nomorPrefix, setNomorPrefix] = useState<string>('500.14/');
  const [nomorSuffix, setNomorSuffix] = useState<string>('/35.07.315/2026');

  // Walidata & Koordinator Signatures
  const [globalSigners, setGlobalSigners] = useState({
    hari: 'Selasa',
    tanggalTeks: 'Satu',
    bulanTeks: 'September',
    tahunTeks: 'Dua Ribu Dua Puluh Enam',
    tanggalAcara: '1 September 2026',
    namaWalidata: 'Drs. ATSALIS SUPRIYANTO, M.Si.',
    nipWalidata: '196711301988091001',
    namaKoordinator: 'Ir. TOMIE HERAWANTO, M.P.',
    nipKoordinator: '196611261993031004',
  });

  // Kop Logo state (persisted in localStorage)
  const [logoSrc] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('app-kop-logo');
      if (saved && (saved.startsWith('data:image/') || saved.startsWith('blob:'))) {
        return saved;
      }
      return '';
    } catch {
      return '';
    }
  });

  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  // Nomor Surat format with space for 4 digits
  const fullNomorSurat = `${nomorPrefix}\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0${nomorSuffix}`;

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

    setGlobalSigners(prev => ({
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

  // Extract available unique Produsen Data
  const availableProdusen = useMemo(() => {
    if (!data) return [];
    const allProdusen = new Set<string>();
    data.eWalidata.forEach(item => { if (item['Produsen Data']) allProdusen.add(item['Produsen Data'].trim()); });
    data.sektoral.forEach(item => { if (item['Produsen Data']) allProdusen.add(item['Produsen Data'].trim()); });
    data.spasial.forEach(item => { if (item['Produsen Data']) allProdusen.add(item['Produsen Data'].trim()); });
    return Array.from(allProdusen).filter(Boolean).sort();
  }, [data]);

  // Extract available Years
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

  // State mapping for each Produsen Data's individual signer configuration
  const [producerConfigs, setProducerConfigs] = useState<Record<string, ProdusenSignerConfig>>({});

  useEffect(() => {
    if (availableProdusen.length > 0) {
      const loaded = producerConfigService.loadProducerConfigs(availableProdusen);
      setProducerConfigs(loaded);
    }
  }, [availableProdusen]);

  // Handler to update a single producer's field
  const handleUpdateProducer = (prodName: string, updates: Partial<ProdusenSignerConfig>) => {
    setProducerConfigs(prev => {
      const updated = {
        ...prev,
        [prodName]: {
          ...prev[prodName],
          ...updates
        }
      };
      producerConfigService.saveProducerConfigs(updated);
      return updated;
    });
  };

  // Toggle selection for single producer
  const toggleProducerSelect = (prodName: string) => {
    const current = producerConfigs[prodName]?.selected ?? true;
    handleUpdateProducer(prodName, { selected: !current });
  };

  // Select all / Deselect all
  const selectAllProducers = (select: boolean) => {
    setProducerConfigs(prev => {
      const next: Record<string, ProdusenSignerConfig> = {};
      Object.keys(prev).forEach(key => {
        next[key] = {
          ...prev[key],
          selected: select
        };
      });
      producerConfigService.saveProducerConfigs(next);
      return next;
    });
  };

  // Apply one producer's signer config to all other producers
  const copySignerToAll = (sourceProd: string) => {
    const source = producerConfigs[sourceProd];
    if (!source) return;

    if (window.confirm(`Salin Nama (${source.nama}) dan NIP (${source.nip}) ke seluruh Produsen Data lainnya?`)) {
      setProducerConfigs(prev => {
        const next: Record<string, ProdusenSignerConfig> = {};
        Object.keys(prev).forEach(key => {
          next[key] = {
            ...prev[key],
            nama: source.nama,
            nip: source.nip
          };
        });
        producerConfigService.saveProducerConfigs(next);
        return next;
      });
    }
  };

  // Reset a producer to smart defaults
  const resetProducerToDefault = (prodName: string) => {
    handleUpdateProducer(prodName, {
      jabatan: getSmartJabatan(prodName),
      nama: 'YUDHI HINDHARTO, S.T., M.Si.',
      nip: '197206121998031007'
    });
  };

  // Filtered producer list by search query
  const filteredProducers = useMemo(() => {
    if (!searchQuery.trim()) return availableProdusen;
    const q = searchQuery.toLowerCase();
    return availableProdusen.filter(p => 
      p.toLowerCase().includes(q) || 
      (producerConfigs[p]?.nama || '').toLowerCase().includes(q) ||
      (producerConfigs[p]?.jabatan || '').toLowerCase().includes(q)
    );
  }, [availableProdusen, searchQuery, producerConfigs]);

  // Selected producers for print
  const selectedProducersToPrint = useMemo(() => {
    return availableProdusen.filter(p => producerConfigs[p]?.selected !== false);
  }, [availableProdusen, producerConfigs]);

  // Counts of rows per producer
  const producerCounts = useMemo(() => {
    if (!data) return {};
    const map: Record<string, { eWalidata: number; sektoral: number; spasial: number; total: number }> = {};

    availableProdusen.forEach(p => {
      const eCount = data.eWalidata.filter(r => (r['Produsen Data'] || '').trim() === p && selectedYears.includes(r.Tahun || '')).length;
      const sCount = data.sektoral.filter(r => (r['Produsen Data'] || '').trim() === p && selectedYears.includes(r.Tahun || '')).length;
      const spCount = data.spasial.filter(r => (r['Produsen Data'] || '').trim() === p && selectedYears.includes(r.Tahun || '')).length;
      map[p] = {
        eWalidata: eCount,
        sektoral: sCount,
        spasial: spCount,
        total: eCount + sCount + spCount
      };
    });

    return map;
  }, [data, availableProdusen, selectedYears]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16">
      
      {/* Top Header & Overview (Screen Only) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-low/60 backdrop-blur-xl p-6 rounded-3xl border border-outline-variant/20 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
              Cetak Massal Berita Acara per Produsen Data
            </h1>
          </div>
          <p className="text-sm text-on-surface-variant">
            Atur dan edit penanda tangan (Kepala Perangkat Daerah/Produsen Data) untuk setiap instansi secara individual sebelum dicetak sekaligus.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsGlobalSettingsOpen(prev => !prev)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface hover:bg-surface-variant/40 transition-colors text-sm font-medium"
          >
            <Settings2 className="w-4 h-4 text-primary" />
            <span>Pengaturan Global</span>
            {isGlobalSettingsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            onClick={handlePrint}
            disabled={selectedProducersToPrint.length === 0}
            className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Printer className="w-5 h-5" />
            <span>Cetak {selectedProducersToPrint.length} Produsen (PDF)</span>
          </button>
        </div>
      </div>

      {/* Global Settings Panel (Collapsible) */}
      {isGlobalSettingsOpen && (
        <div className="bg-surface-container-low/80 backdrop-blur-xl p-6 rounded-3xl border border-outline-variant/20 shadow-md flex flex-col gap-6 print:hidden">
          <div className="flex items-center justify-between border-b border-outline-variant/10 pb-4">
            <h2 className="text-base font-semibold text-on-surface flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              Pengaturan Kop, Tanggal & Penanda Tangan Global
            </h2>
            <span className="text-xs text-on-surface-variant">
              Berlaku untuk seluruh lembar Berita Acara
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Nomor Surat & Tanggal */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Format Nomor Surat</h3>
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Prefix Nomor</label>
                <input
                  type="text"
                  value={nomorPrefix}
                  onChange={e => setNomorPrefix(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant/40 text-on-surface text-sm focus:border-primary focus:outline-none"
                  placeholder="500.14/"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Suffix Nomor</label>
                <input
                  type="text"
                  value={nomorSuffix}
                  onChange={e => setNomorSuffix(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant/40 text-on-surface text-sm focus:border-primary focus:outline-none"
                  placeholder="/35.07.315/2026"
                />
              </div>
              <div className="p-2.5 rounded-xl bg-surface-variant/30 border border-outline-variant/20 text-xs text-on-surface-variant">
                Preview Nomor: <strong className="text-on-surface font-mono">{fullNomorSurat}</strong>
              </div>
            </div>

            {/* Tanggal Pelaksanaan */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Tanggal Penetapan</h3>
                <button
                  onClick={() => {
                    const today = new Date();
                    const yyyy = today.getFullYear();
                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                    const dd = String(today.getDate()).padStart(2, '0');
                    handleDateChange(`${yyyy}-${mm}-${dd}`);
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Gunakan Hari Ini
                </button>
              </div>

              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Pilih Tanggal</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant/40 text-on-surface text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Format Tanggal Isi</label>
                <div className="flex rounded-xl overflow-hidden border border-outline-variant/40">
                  <button
                    onClick={() => handleModeChange('terbilang')}
                    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${dateTextMode === 'terbilang' ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface-variant hover:text-on-surface'}`}
                  >
                    Terbilang (Satu)
                  </button>
                  <button
                    onClick={() => handleModeChange('angka')}
                    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${dateTextMode === 'angka' ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface-variant hover:text-on-surface'}`}
                  >
                    Angka (1)
                  </button>
                </div>
              </div>

              <div className="text-xs text-on-surface-variant">
                Tanggal Acara: <strong className="text-on-surface">{globalSigners.tanggalAcara}</strong>
              </div>
            </div>

            {/* Penanda Tangan Walidata & Koordinator */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Walidata & Koordinator</h3>
              
              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Nama Walidata (Diskominfo)</label>
                <input
                  type="text"
                  value={globalSigners.namaWalidata}
                  onChange={e => setGlobalSigners({ ...globalSigners, namaWalidata: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-surface border border-outline-variant/40 text-on-surface text-xs focus:border-primary focus:outline-none mb-1.5"
                />
                <input
                  type="text"
                  value={globalSigners.nipWalidata}
                  onChange={e => setGlobalSigners({ ...globalSigners, nipWalidata: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-surface border border-outline-variant/40 text-on-surface text-xs focus:border-primary focus:outline-none"
                  placeholder="NIP Walidata"
                />
              </div>

              <div>
                <label className="text-xs text-on-surface-variant block mb-1">Nama Koordinator (Bappeda)</label>
                <input
                  type="text"
                  value={globalSigners.namaKoordinator}
                  onChange={e => setGlobalSigners({ ...globalSigners, namaKoordinator: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-surface border border-outline-variant/40 text-on-surface text-xs focus:border-primary focus:outline-none mb-1.5"
                />
                <input
                  type="text"
                  value={globalSigners.nipKoordinator}
                  onChange={e => setGlobalSigners({ ...globalSigners, nipKoordinator: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-surface border border-outline-variant/40 text-on-surface text-xs focus:border-primary focus:outline-none"
                  placeholder="NIP Koordinator"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Selection Bar (Screen Only) */}
      <div className="bg-surface-container-low/40 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-outline-variant/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 print:hidden">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama Produsen Data / Kepala / NIP..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface border border-outline-variant/30 text-on-surface text-sm focus:border-primary focus:outline-none"
          />
        </div>

        {/* Year Filter & Quick Select */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Year selector dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-outline-variant/30 text-xs font-medium text-on-surface hover:bg-surface-variant/30 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>Tahun: {selectedYears.length > 0 ? selectedYears.join(', ') : 'Semua'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant" />
            </button>

            {isYearDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-container border border-outline-variant/30 rounded-2xl shadow-xl z-30 p-2 space-y-1">
                {availableYears.map(yr => (
                  <button
                    key={yr}
                    onClick={() => toggleYear(yr)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-surface-variant/50 text-on-surface transition-colors"
                  >
                    <span>Tahun {yr}</span>
                    {selectedYears.includes(yr) && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-outline-variant/20 hidden sm:block"></div>

          {/* Quick Select Buttons */}
          <button
            onClick={() => selectAllProducers(true)}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            Pilih Semua ({availableProdusen.length})
          </button>
          
          <button
            onClick={() => selectAllProducers(false)}
            className="px-3 py-2 rounded-xl text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 transition-colors"
          >
            Batal Semua
          </button>
        </div>
      </div>

      {/* Produsen Data Cards List with Inline Signer Editor (Screen Only) */}
      <div className="flex flex-col gap-3 print:hidden">
        <div className="flex items-center justify-between px-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          <span>Daftar Produsen Data ({filteredProducers.length} instansi)</span>
          <span>{selectedProducersToPrint.length} terpilih untuk dicetak</span>
        </div>

        {filteredProducers.length === 0 ? (
          <div className="p-12 text-center bg-surface-container-low/30 rounded-3xl border border-outline-variant/20">
            <Building2 className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-3" />
            <div className="text-on-surface font-semibold text-base mb-1">Tidak ada Produsen Data ditemukan</div>
            <p className="text-xs text-on-surface-variant">Coba ubah kata kunci pencarian Anda.</p>
          </div>
        ) : (
          filteredProducers.map((prodName, idx) => {
            const config = producerConfigs[prodName] || {
              prodName,
              jabatan: getSmartJabatan(prodName),
              nama: 'YUDHI HINDHARTO, S.T., M.Si.',
              nip: '197206121998031007',
              selected: true
            };
            const isSelected = config.selected !== false;
            const isExpanded = expandedProducers[prodName] ?? false;
            const countInfo = producerCounts[prodName] || { eWalidata: 0, sektoral: 0, spasial: 0, total: 0 };

            return (
              <div 
                key={prodName}
                className={`transition-all rounded-2xl border ${
                  isSelected 
                    ? 'bg-surface-container-low/60 border-primary/30 shadow-sm' 
                    : 'bg-surface-container-lowest/40 border-outline-variant/10 opacity-75'
                }`}
              >
                {/* Header Card Summary */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => toggleProducerSelect(prodName)}
                      className="mt-0.5 sm:mt-0 text-primary hover:scale-105 transition-transform shrink-0"
                      title={isSelected ? "Batal pilih" : "Pilih untuk dicetak"}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5 text-outline" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm sm:text-base text-on-surface truncate">
                          {prodName}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface-variant text-on-surface-variant font-mono">
                          {countInfo.total} data ({countInfo.eWalidata} e-Wali, {countInfo.sektoral} Sektoral, {countInfo.spasial} Spasial)
                        </span>
                      </div>
                      
                      <div className="text-xs text-on-surface-variant flex items-center gap-3 mt-1 truncate">
                        <span>Jabatan: <strong className="text-on-surface font-normal">{config.jabatan}</strong></span>
                        <span>•</span>
                        <span>Nama: <strong className="text-on-surface font-normal">{config.nama}</strong></span>
                        <span>•</span>
                        <span>NIP: <strong className="text-on-surface font-normal font-mono">{config.nip}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => setExpandedProducers(prev => ({ ...prev, [prodName]: !isExpanded }))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-medium text-on-surface hover:bg-surface-variant/40 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-primary" />
                      <span>{isExpanded ? 'Tutup Editor' : 'Edit Penanda Tangan'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Individual Signer Editor */}
                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-5 pt-2 border-t border-outline-variant/10 bg-surface/40 rounded-b-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
                      
                      {/* Jabatan Produsen Data */}
                      <div>
                        <label className="text-xs font-medium text-on-surface-variant block mb-1.5">
                          Jabatan Kepala / Penanda Tangan:
                        </label>
                        <input
                          type="text"
                          value={config.jabatan}
                          onChange={e => handleUpdateProducer(prodName, { jabatan: e.target.value })}
                          placeholder={`Kepala ${prodName}`}
                          className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant/40 text-on-surface text-xs focus:border-primary focus:outline-none"
                        />
                        <span className="text-[10px] text-on-surface-variant mt-1 block">
                          Contoh: Kepala Dinas Pendidikan / Kepala Perangkat Daerah
                        </span>
                      </div>

                      {/* Nama Kepala Produsen Data */}
                      <div>
                        <label className="text-xs font-medium text-on-surface-variant block mb-1.5">
                          Nama Lengkap & Gelar:
                        </label>
                        <input
                          type="text"
                          value={config.nama}
                          onChange={e => handleUpdateProducer(prodName, { nama: e.target.value })}
                          placeholder="Nama Kepala Instansi"
                          className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant/40 text-on-surface text-xs focus:border-primary focus:outline-none"
                        />
                        <span className="text-[10px] text-on-surface-variant mt-1 block">
                          Sesuai dengan nama pejabat penanda tangan SK
                        </span>
                      </div>

                      {/* NIP Kepala Produsen Data */}
                      <div>
                        <label className="text-xs font-medium text-on-surface-variant block mb-1.5">
                          NIP Penanda Tangan:
                        </label>
                        <input
                          type="text"
                          value={config.nip}
                          onChange={e => handleUpdateProducer(prodName, { nip: e.target.value })}
                          placeholder="19xxxxxxxxxxxxxx"
                          className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant/40 text-on-surface text-xs font-mono focus:border-primary focus:outline-none"
                        />
                        <span className="text-[10px] text-on-surface-variant mt-1 block">
                          Format NIP 18 digit
                        </span>
                      </div>
                    </div>

                    {/* Editor Footer Tools */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-outline-variant/10 text-xs">
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <Info className="w-3.5 h-3.5 text-primary" />
                        <span>Perubahan otomatis tersimpan untuk pencetakan dokumen ini</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copySignerToAll(prodName)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-variant/40 hover:bg-surface-variant text-on-surface text-[11px] transition-colors"
                          title="Terapkan Nama & NIP ini ke semua produsen data"
                        >
                          <Copy className="w-3 h-3 text-primary" />
                          <span>Salin Nama & NIP ke Semua Produsen</span>
                        </button>

                        <button
                          onClick={() => resetProducerToDefault(prodName)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-on-surface-variant hover:text-on-surface text-[11px] transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Default</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Bar on Bottom (Screen Only) */}
      <div className="sticky bottom-4 z-40 bg-surface-container-low/95 backdrop-blur-2xl p-4 rounded-2xl border border-primary/30 shadow-2xl flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
            <Printer className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <span className="font-semibold text-on-surface block text-sm">
              {selectedProducersToPrint.length} Produsen Data Siap Dicetak
            </span>
            <span className="text-on-surface-variant">
              Tiap produsen dicetak 2 halaman (Berita Acara & Lampiran) secara kontinu
            </span>
          </div>
        </div>

        <button
          onClick={handlePrint}
          disabled={selectedProducersToPrint.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm transition-all shadow-lg shadow-primary/25 disabled:opacity-50 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Dokumen Sekarang</span>
        </button>
      </div>

      {/* Printable Output Container (Rendered Continuous for Screen & Print) */}
      <div 
        id="print-area"
        className="w-full mt-6"
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      >
        <div className="text-center font-mono text-xs text-on-surface-variant mb-4 uppercase tracking-widest print:hidden">
          —— PRATINJAU DOKUMEN CETAK (PRINT PREVIEW) ——
        </div>

        {selectedProducersToPrint.map((prodName, prodIndex) => {
          const config = producerConfigs[prodName] || {
            prodName,
            jabatan: getSmartJabatan(prodName),
            nama: 'YUDHI HINDHARTO, S.T., M.Si.',
            nip: '197206121998031007',
            selected: true
          };

          // Filter rows for this specific producer
          const filterByProd = (item: any) => 
            (item['Produsen Data'] || '').trim() === prodName && 
            selectedYears.includes(item.Tahun || '');

          const prodEWalidata = (data?.eWalidata || []).filter(filterByProd);
          const prodSektoral = (data?.sektoral || []).filter(filterByProd);
          const prodSpasial = (data?.spasial || []).filter(filterByProd);
          const prodTotal = prodEWalidata.length + prodSektoral.length + prodSpasial.length;

          return (
            <div 
              key={prodName}
              className={`w-[210mm] min-h-[297mm] mx-auto bg-white text-black shadow-2xl print:shadow-none print:mx-0 print:w-full print:max-w-none print:min-h-0 print:h-auto print:overflow-visible mb-12 print:mb-0 ${
                prodIndex > 0 ? 'print-page-break-before' : ''
              }`}
              style={{ 
                fontFamily: 'Arial, Helvetica, sans-serif',
                pageBreakBefore: prodIndex > 0 ? 'always' : 'auto',
                breakBefore: prodIndex > 0 ? 'page' : 'auto'
              }}
            >
              
              {/* Screen-only separator bar */}
              <div className="bg-primary/10 border-b border-primary/20 text-primary px-6 py-2 text-xs font-mono flex items-center justify-between print:hidden">
                <span>Dokumen #{prodIndex + 1}: <strong>{prodName}</strong> ({prodTotal} Baris Data)</span>
                <span>Penanda Tangan: {config.nama} ({config.jabatan})</span>
              </div>

              {/* ================= PAGE 1: BERITA ACARA ================= */}
              <div 
                className="p-[12mm] sm:p-[15mm] print:p-0 print-page-break flex flex-col justify-between"
                style={{ 
                  pageBreakAfter: 'always', 
                  breakAfter: 'page',
                  boxSizing: 'border-box'
                }}
              >
                <div>
                  {/* Kop Surat */}
                  <div className="flex items-center border-b-[3px] border-double border-black pb-2.5 mb-3">
                    <div className="w-[68px] h-[82px] flex items-center justify-center shrink-0 mr-3">
                      <img 
                        src={logoSrc || DEFAULT_LOGO_URL} 
                        alt="Logo Kab Malang" 
                        className="max-w-full max-h-full object-contain"
                        crossOrigin="anonymous" 
                      />
                    </div>
                    <div className="flex-1 text-center leading-[1.18]">
                      <div className="text-[13pt] font-semibold tracking-wide">PEMERINTAH KABUPATEN MALANG</div>
                      <div className="text-[16pt] font-bold tracking-wider">DINAS KOMUNIKASI DAN INFORMATIKA</div>
                      <div className="text-[9.5pt]">Jalan K.H. Agus Salim No. 7 Gedung J Lantai 3, Malang, Jawa Timur</div>
                      <div className="text-[9.5pt]">Telepon/ Faksimile (0341) 408788 Laman : https://kominfo.malangkab.go.id</div>
                      <div className="text-[9.5pt]">Pos-el : kominfo@malangkab.go.id, Kode Pos : 65119</div>
                    </div>
                  </div>

                  {/* Title (No Underscore, Font Arial) */}
                  <div className="text-center font-bold mb-3 leading-[1.18]">
                    <div className="text-[13pt] mb-0.5">BERITA ACARA</div>
                    <div className="text-[11.5pt] uppercase">DAFTAR DATA STATISTIK SEKTORAL DAERAH</div>
                    <div className="text-[11.5pt] uppercase">{prodName}</div>
                    <div className="text-[11.5pt] uppercase">KABUPATEN MALANG</div>
                    <div className="text-[11pt] mt-1 font-normal">
                      Nomor : {fullNomorSurat}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="text-justify text-[11pt] mb-3 leading-[1.2]">
                    <p className="indent-8 mb-2">
                      Pada Hari ini, <strong>{autoFillDate ? (globalSigners.hari || '.....') : '.....'}</strong> tanggal <strong>{autoFillDate ? (globalSigners.tanggalTeks || '.....') : '.....'}</strong> bulan <strong>{autoFillDate ? (globalSigners.bulanTeks || '.....') : '.....'}</strong> tahun <strong>{autoFillDate ? (globalSigners.tahunTeks || '.....') : '.....'}</strong>, bertempat di Kabupaten Malang, 
                      dilaksanakan Penetapan Daftar Data Statistik Sektoral Daerah pada 
                      <strong> {prodName} </strong> 
                      dan disepakati empat hal sebagai berikut :
                    </p>

                    <table className="w-full text-[11pt] align-top leading-[1.2] border-0" style={{ border: 'none', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr style={{ border: 'none' }}>
                          <td style={{ width: '85px', verticalAlign: 'top', border: 'none', padding: '1.5px 0' }}>KESATU</td>
                          <td style={{ width: '15px', verticalAlign: 'top', border: 'none', padding: '1.5px 0' }}>:</td>
                          <td style={{ textAlign: 'justify', verticalAlign: 'top', border: 'none', padding: '1.5px 0' }}>
                            Daftar Data sebagaimana terlampir pada Berita Acara ini, ditetapkan 
                            sejumlah <strong>{prodTotal} ({numberToWordsID(prodTotal)})</strong> Data Statistik Sektoral Daerah (DSSD).
                          </td>
                        </tr>
                        <tr style={{ border: 'none' }}>
                          <td style={{ verticalAlign: 'top', border: 'none', padding: '1.5px 0' }}>KEDUA</td>
                          <td style={{ verticalAlign: 'top', border: 'none', padding: '1.5px 0' }}>:</td>
                          <td style={{ textAlign: 'justify', verticalAlign: 'top', border: 'none', padding: '1.5px 0' }}>
                            Daftar Data tersebut digunakan sebagai dasar bagi Kepala Perangkat 
                            Daerah selaku Produsen Data dalam menyampaikan ke Walidata sesuai 
                            urusan tugas dan kewenangannya.
                          </td>
                        </tr>
                        <tr style={{ border: 'none' }}>
                          <td style={{ verticalAlign: 'top', border: 'none', padding: '1.5px 0' }}>KETIGA</td>
                          <td style={{ verticalAlign: 'top', border: 'none', padding: '1.5px 0' }}>:</td>
                          <td style={{ textAlign: 'justify', verticalAlign: 'top', border: 'none', padding: '1.5px 0' }}>
                            Daftar Data dimaksud mencakup klasifikasi tentang Kode DSSD, Uraian 
                            DSSD, Satuan, dan Periode.
                          </td>
                        </tr>
                        <tr style={{ border: 'none' }}>
                          <td style={{ verticalAlign: 'top', border: 'none', padding: '1.5px 0' }}>KEEMPAT</td>
                          <td style={{ verticalAlign: 'top', border: 'none', padding: '1.5px 0' }}>:</td>
                          <td style={{ textAlign: 'justify', verticalAlign: 'top', border: 'none', padding: '1.5px 0' }}>
                            Badan Perencanaan dan Pembangunan Daerah Kabupaten Malang selaku 
                            Koordinator Data telah memverifikasi daftar data tersebut dan akan 
                            digunakan sebagai acuan dalam perencanaan pembangunan.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Signatures Table (Page 1) */}
                <div className="text-[11pt] text-center leading-[1.18] avoid-break mt-2" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <div className="mb-2.5">
                    Malang, {globalSigners.tanggalAcara}<br/>
                    Tim Pelaksana Satu Data Kabupaten Malang
                  </div>

                  <table className="w-full border-0 mb-1 avoid-break" style={{ border: 'none', borderCollapse: 'collapse', pageBreakInside: 'avoid', breakInside: 'avoid', width: '100%', background: 'transparent' }}>
                    <tbody>
                      <tr style={{ border: 'none' }}>
                        <td style={{ width: '50%', border: 'none', textAlign: 'center', verticalAlign: 'top', padding: '0 8px' }}>
                          <div className="font-normal leading-tight">
                            Produsen Data,<br/>
                            {config.jabatan || `Kepala ${prodName}`}<br/>
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
                        <td style={{ height: '48px', border: 'none', padding: 0 }}></td>
                        <td style={{ height: '48px', border: 'none', padding: 0 }}></td>
                      </tr>
                      <tr style={{ border: 'none' }}>
                        <td style={{ width: '50%', border: 'none', textAlign: 'center', verticalAlign: 'bottom', padding: '0 8px' }}>
                          <div className="font-bold underline">{config.nama}</div>
                          <div>NIP. {config.nip}</div>
                        </td>
                        <td style={{ width: '50%', border: 'none', textAlign: 'center', verticalAlign: 'bottom', padding: '0 8px' }}>
                          <div className="font-bold underline">{globalSigners.namaWalidata}</div>
                          <div>NIP. {globalSigners.nipWalidata}</div>
                        </td>
                      </tr>
                      <tr style={{ border: 'none' }}>
                        <td colSpan={2} style={{ border: 'none', textAlign: 'center', paddingTop: '10px', paddingBottom: 0 }}>
                          <div style={{ display: 'inline-block', width: '380px', textAlign: 'center' }}>
                            <div className="font-normal leading-tight">
                              Koordinator,<br/>
                              Kepala Badan Perencanaan Pembangunan Daerah<br/>
                              Kabupaten Malang
                            </div>
                            <div style={{ height: '48px' }}></div>
                            <div className="font-bold underline">{globalSigners.namaKoordinator}</div>
                            <div>NIP. {globalSigners.nipKoordinator}</div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ================= PAGE 2: LAMPIRAN BERITA ACARA ================= */}
              <div 
                className="p-[12mm] sm:p-[15mm] print:p-0"
                style={{ 
                  pageBreakBefore: 'always', 
                  breakBefore: 'page' 
                }}
              >
                
                {/* Lampiran Header box without border */}
                <div className="p-2 mb-6 text-xs w-[300px] ml-auto">
                  <table className="w-full">
                    <tbody>
                      <tr><td colSpan={3}>Lampiran Berita Acara</td></tr>
                      <tr><td colSpan={3}>Daftar Data Statistik Sektoral Daerah (DSSD)</td></tr>
                      <tr><td className="w-16">Nomor</td><td className="w-3">:</td><td>{fullNomorSurat}</td></tr>
                      <tr><td>Tanggal</td><td>:</td><td>{globalSigners.tanggalAcara}</td></tr>
                    </tbody>
                  </table>
                </div>

                {/* Title Lampiran (No Underscore, Font Arial) */}
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
                      <tr>
                        <th colSpan={7} className="border border-black p-1 text-left bg-gray-100 font-bold uppercase text-xs">
                          E-Walidata SIPD
                        </th>
                      </tr>
                      <tr className="text-center font-bold bg-gray-50">
                        <th className="border border-black p-1 w-8">No</th>
                        <th className="border border-black p-1 w-24">Kode DSSD</th>
                        <th className="border border-black p-1">Uraian DSSD</th>
                        <th className="border border-black p-1 w-16">Satuan</th>
                        <th className="border border-black p-1">Definisi Operasional</th>
                        <th className="border border-black p-1">Tag Urusan</th>
                        <th className="border border-black p-1">Produsen Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prodEWalidata.length > 0 ? (
                        prodEWalidata.map((row, idx) => (
                          <tr key={`ewali-${idx}`} className="align-top" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            <td className="border border-black p-1 text-center">{idx + 1}</td>
                            <td className="border border-black p-1 font-mono">{row['Kode DSSD']}</td>
                            <td className="border border-black p-1">{row['Uraian DSSD']}</td>
                            <td className="border border-black p-1 text-center">{row.Satuan}</td>
                            <td className="border border-black p-1 text-justify">{row['Definisi Operasional']}</td>
                            <td className="border border-black p-1">{row['Tag urusan']}</td>
                            <td className="border border-black p-1">{row['Produsen Data']}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="border border-black p-2 text-center text-gray-500 italic">
                            Tidak ada data E-Walidata untuk instansi ini pada tahun terpilih
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Sektoral Table */}
                  <table className="w-full border-collapse border border-black border-t-0 mb-0">
                    <thead>
                      <tr>
                        <th colSpan={8} className="border border-black p-1 text-left bg-gray-100 font-bold uppercase text-xs">
                          Statistik Sektoral
                        </th>
                      </tr>
                      <tr className="text-center font-bold bg-gray-50">
                        <th className="border border-black p-1 w-8">No</th>
                        <th className="border border-black p-1 w-24">Kode Data</th>
                        <th className="border border-black p-1">Uraian DSSD</th>
                        <th className="border border-black p-1 w-16">Satuan</th>
                        <th className="border border-black p-1">Definisi Operasional</th>
                        <th className="border border-black p-1">Tag Urusan</th>
                        <th className="border border-black p-1">Produsen Data</th>
                        <th className="border border-black p-1">Info Sub Kegiatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prodSektoral.length > 0 ? (
                        prodSektoral.map((row, idx) => (
                          <tr key={`sek-${idx}`} className="align-top" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            <td className="border border-black p-1 text-center">{idx + 1}</td>
                            <td className="border border-black p-1 font-mono">{row['Kode Data']}</td>
                            <td className="border border-black p-1">{row['Uraian DSSD']}</td>
                            <td className="border border-black p-1 text-center">{row.Satuan}</td>
                            <td className="border border-black p-1 text-justify">{row['Definisi Operasional']}</td>
                            <td className="border border-black p-1">{row['Tag urusan']}</td>
                            <td className="border border-black p-1">{row['Produsen Data']}</td>
                            <td className="border border-black p-1">{row['Info Sub Kegiatan']}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="border border-black p-2 text-center text-gray-500 italic">
                            Tidak ada data Statistik Sektoral untuk instansi ini pada tahun terpilih
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Spasial Table */}
                  <table className="w-full border-collapse border border-black border-t-0 mb-6">
                    <thead>
                      <tr>
                        <th colSpan={6} className="border border-black p-1 text-left bg-gray-100 font-bold uppercase text-xs">
                          Data Spasial
                        </th>
                      </tr>
                      <tr className="text-center font-bold bg-gray-50">
                        <th className="border border-black p-1 w-8">No</th>
                        <th className="border border-black p-1 w-24">Kode Data</th>
                        <th className="border border-black p-1">Nama Informasi Geospasial</th>
                        <th className="border border-black p-1 w-24">Format</th>
                        <th className="border border-black p-1 w-20">Skala</th>
                        <th className="border border-black p-1">Produsen Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prodSpasial.length > 0 ? (
                        prodSpasial.map((row, idx) => (
                          <tr key={`spa-${idx}`} className="align-top" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            <td className="border border-black p-1 text-center">{idx + 1}</td>
                            <td className="border border-black p-1 font-mono">{row['Kode Data']}</td>
                            <td className="border border-black p-1">{row['Nama Informasi Geospasial']}</td>
                            <td className="border border-black p-1 text-center">
                              {row['Format penyimpanan'] || row['Format penyimpanan data'] || row['Format Penyimpanan Data'] || '-'}
                            </td>
                            <td className="border border-black p-1 text-center">{row.Skala}</td>
                            <td className="border border-black p-1">{row['Produsen Data']}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="border border-black p-2 text-center text-gray-500 italic">
                            Tidak ada data Spasial untuk instansi ini pada tahun terpilih
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Signature on Lampiran */}
                <div className="avoid-break mt-6" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <table className="w-full border-0" style={{ border: 'none', borderCollapse: 'collapse', width: '100%', background: 'transparent' }}>
                    <tbody>
                      <tr style={{ border: 'none' }}>
                        <td style={{ width: '45%', border: 'none', padding: 0 }}></td>
                        <td style={{ width: '55%', border: 'none', textAlign: 'center', padding: 0 }}>
                          <div 
                            className="text-sm" 
                            style={{ 
                              display: 'inline-block',
                              width: '280px',
                              textAlign: 'center'
                            }}
                          >
                            <div className="font-normal leading-normal">
                              Produsen Data,<br/>
                              {config.jabatan || `Kepala ${prodName}`}<br/>
                              Kabupaten Malang
                            </div>
                            <div style={{ height: '60px' }}></div>
                            <div className="font-bold underline leading-normal">{config.nama}</div>
                            <div className="leading-normal">NIP. {config.nip}</div>
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
