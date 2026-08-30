import React, { useState, useMemo, useEffect } from 'react';
import { AllData, UploadRecord } from '../types';
import { Printer, Settings2, FileText, ChevronDown, Check } from 'lucide-react';

interface PrintDocumentProps {
  data: AllData | null;
  uploads: UploadRecord[];
}

export const PrintDocument: React.FC<PrintDocumentProps> = ({ data, uploads }) => {
  const [selectedProdusen, setSelectedProdusen] = useState<string>('');
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  
  // Custom signatures state
  const [form, setForm] = useState({
    nomor: '500.14/      /35.07.315/2026',
    tanggalAcara: '1 September 2026',
    namaWalidata: 'Drs. ATSALIS SUPRIYANTO, M.Si.',
    nipWalidata: '196711301988091001',
    namaKoordinator: 'Ir. TOMIE HERAWANTO, M.P.',
    nipKoordinator: '196611261993031004',
    namaProdusen: 'YUDHI HINDHARTO, S.T., M.Si.',
    nipProdusen: '197206121998031007',
    jabatanProdusen: 'Plt. Kepala Dinas Pekerjaan Umum Sumber Daya Air',
  });

  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

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
    if (availableProdusen.length > 0 && !selectedProdusen) {
      setSelectedProdusen(availableProdusen[0]);
    }
    if (availableYears.length > 0 && selectedYears.length === 0) {
      setSelectedYears([availableYears[0]]);
    }
  }, [availableProdusen, availableYears]);

  const toggleYear = (year: string) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year) 
        : [...prev, year]
    );
  };

  // Filter Data based on selections
  const filteredData = useMemo(() => {
    if (!data || !selectedProdusen || selectedYears.length === 0) {
      return { eWalidata: [], sektoral: [], spasial: [] };
    }

    const filterFn = (item: any) => 
      item['Produsen Data'] === selectedProdusen && 
      selectedYears.includes(item.Tahun);

    return {
      eWalidata: data.eWalidata.filter(filterFn),
      sektoral: data.sektoral.filter(filterFn),
      spasial: data.spasial.filter(filterFn)
    };
  }, [data, selectedProdusen, selectedYears]);

  const totalDataCount = filteredData.eWalidata.length + filteredData.sektoral.length + filteredData.spasial.length;

  const handlePrint = () => {
    window.print();
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-32 text-on-surface-variant print:hidden">
        <FileText className="w-16 h-16 opacity-30 mb-4" />
        <p className="text-lg">Data belum tersedia. Silakan unggah data terlebih dahulu.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-5rem)]">
      
      {/* --- CONFIGURATION PANEL (Hidden on Print) --- */}
      <div className="print:hidden p-8 flex flex-col gap-6 border-b border-outline-variant/20 bg-surface-container-low/40 backdrop-blur-xl relative z-20">
        <div className="flex items-center gap-3 mb-2">
          <Settings2 className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-on-surface">Konfigurasi Cetak PDF</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Filters */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest font-mono">1. Filter Data</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-on-surface">Produsen Data</label>
              <select 
                value={selectedProdusen}
                onChange={(e) => setSelectedProdusen(e.target.value)}
                className="bg-surface-container-highest/50 border border-outline-variant/30 text-on-surface rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary/50 transition-colors"
              >
                {availableProdusen.map(p => (
                  <option className="bg-[#1a1d21] text-white" key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 relative">
              <label className="text-sm font-medium text-on-surface">Tahun Data (Pilih satu atau lebih)</label>
              <div 
                className="bg-surface-container-highest/50 border border-outline-variant/30 rounded-xl px-4 py-2.5 cursor-pointer flex items-center justify-between"
                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
              >
                <span className="text-on-surface">
                  {selectedYears.length === 0 ? 'Pilih Tahun' : selectedYears.join(', ')}
                </span>
                <ChevronDown className="w-4 h-4 text-on-surface-variant" />
              </div>
              
              {isYearDropdownOpen && (
                <div className="absolute top-[100%] mt-1 left-0 right-0 bg-[#1a1d21] border border-outline-variant/30 rounded-xl shadow-xl z-50 py-2 max-h-60 overflow-y-auto">
                  {availableYears.map(year => (
                    <div 
                      key={year}
                      className="px-4 py-2 flex items-center gap-3 hover:bg-surface-variant/30 cursor-pointer text-white"
                      onClick={() => toggleYear(year)}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedYears.includes(year) ? 'bg-primary border-primary' : 'border-outline-variant'}`}>
                        {selectedYears.includes(year) && <Check className="w-3.5 h-3.5 text-on-primary" />}
                      </div>
                      <span>{year}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Header Info */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest font-mono">2. Atribut Surat</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-on-surface-variant">Nomor Surat</label>
              <input 
                type="text" value={form.nomor} onChange={e => setForm({...form, nomor: e.target.value})}
                className="bg-surface-container/50 border border-outline-variant/30 text-on-surface rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-on-surface-variant">Tanggal Acara</label>
              <input 
                type="text" value={form.tanggalAcara} onChange={e => setForm({...form, tanggalAcara: e.target.value})}
                className="bg-surface-container/50 border border-outline-variant/30 text-on-surface rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-on-surface-variant">Jabatan Produsen (Di TTD)</label>
              <input 
                type="text" value={form.jabatanProdusen} onChange={e => setForm({...form, jabatanProdusen: e.target.value})}
                className="bg-surface-container/50 border border-outline-variant/30 text-on-surface rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Column 3: Signatures */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest font-mono">3. Penanda Tangan</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface-variant">Nama Produsen</label>
                <input type="text" value={form.namaProdusen} onChange={e => setForm({...form, namaProdusen: e.target.value})} className="bg-surface-container/50 border border-outline-variant/30 text-on-surface rounded-lg px-2 py-1.5 text-xs" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface-variant">NIP Produsen</label>
                <input type="text" value={form.nipProdusen} onChange={e => setForm({...form, nipProdusen: e.target.value})} className="bg-surface-container/50 border border-outline-variant/30 text-on-surface rounded-lg px-2 py-1.5 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface-variant">Nama Walidata</label>
                <input type="text" value={form.namaWalidata} onChange={e => setForm({...form, namaWalidata: e.target.value})} className="bg-surface-container/50 border border-outline-variant/30 text-on-surface rounded-lg px-2 py-1.5 text-xs" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface-variant">NIP Walidata</label>
                <input type="text" value={form.nipWalidata} onChange={e => setForm({...form, nipWalidata: e.target.value})} className="bg-surface-container/50 border border-outline-variant/30 text-on-surface rounded-lg px-2 py-1.5 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface-variant">Nama Koordinator</label>
                <input type="text" value={form.namaKoordinator} onChange={e => setForm({...form, namaKoordinator: e.target.value})} className="bg-surface-container/50 border border-outline-variant/30 text-on-surface rounded-lg px-2 py-1.5 text-xs" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-on-surface-variant">NIP Koordinator</label>
                <input type="text" value={form.nipKoordinator} onChange={e => setForm({...form, nipKoordinator: e.target.value})} className="bg-surface-container/50 border border-outline-variant/30 text-on-surface rounded-lg px-2 py-1.5 text-xs" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/10">
          <p className="text-sm font-medium text-on-surface-variant">
            Data Ditemukan: <span className="text-primary font-bold">{totalDataCount} Baris</span>
          </p>
          <button 
            onClick={handlePrint}
            disabled={totalDataCount === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-on-primary font-bold hover:brightness-110 transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-5 h-5" />
            Cetak Dokumen
          </button>
        </div>
      </div>

      {/* --- PRINT PREVIEW / ACTUAL PRINT DOCUMENT --- */}
      <div className="p-8 print:p-0 bg-surface-dim print:bg-white flex-1 overflow-y-auto w-full">
        
        {/* A4 Page Container */}
        <div className="w-[210mm] min-h-[297mm] mx-auto bg-white text-black shadow-2xl print:shadow-none print:mx-0 print:w-full print:[-webkit-print-color-adjust:exact] print:[color-adjust:exact]">
          
          {/* Page 1: Berita Acara */}
          <div className="p-[20mm] print:page-break-after-always">
            {/* KOP Surat */}
            <div className="flex items-center border-b-[3px] border-double border-black pb-4 mb-6">
              <div className="w-[70px] h-[90px] flex items-center justify-center shrink-0">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Logo_Kabupaten_Malang_-_Seal_of_Malang_Regency.svg/500px-Logo_Kabupaten_Malang_-_Seal_of_Malang_Regency.svg.png" alt="Logo Kab Malang" className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex-1 text-center font-serif">
                <div className="text-xl">PEMERINTAH KABUPATEN MALANG</div>
                <div className="text-2xl font-bold tracking-wide">DINAS KOMUNIKASI DAN INFORMATIKA</div>
                <div className="text-sm">Jalan K.H. Agus Salim No. 7 Gedung J Lantai 3, Malang, Jawa Timur</div>
                <div className="text-sm">Telepon/ Faksimile (0341) 408788 Laman : https://kominfo.malangkab.go.id</div>
                <div className="text-sm">Pos-el : kominfo@malangkab.go.id, Kode Pos : 65119</div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center font-bold mb-6 font-serif">
              <div className="text-lg underline decoration-1 underline-offset-4 mb-1">BERITA ACARA</div>
              <div className="text-base uppercase">DAFTAR DATA STATISTIK SEKTORAL DAERAH</div>
              <div className="text-base uppercase">{selectedProdusen || '[NAMA PRODUSEN DATA]'}</div>
              <div className="text-base uppercase">KABUPATEN MALANG</div>
              <div className="text-sm font-normal">Nomor : {form.nomor}</div>
            </div>

            {/* Content */}
            <div className="text-justify font-serif text-sm space-y-4 mb-10 leading-relaxed">
              <p className="indent-8">
                Pada Hari ini, ..... tanggal ..... bulan ..... tahun ....., bertempat di Kabupaten Malang, 
                dilaksanakan Penetapan Daftar Data Statistik Sektoral Daerah pada 
                <strong> {selectedProdusen || '[NAMA PRODUSEN DATA]'} </strong> 
                dan disepakati empat hal sebagai berikut :
              </p>

              <table className="w-full text-sm align-top">
                <tbody>
                  <tr>
                    <td className="w-24 pb-2">KESATU</td>
                    <td className="w-4 pb-2">:</td>
                    <td className="pb-2 text-justify">
                      Daftar Data sebagaimana terlampir pada Berita Acara ini, ditetapkan 
                      sejumlah <strong>{totalDataCount} ({/* Need a number to words converter ideally, skipping for now */})</strong> Data Statistik Sektoral Daerah (DSSD).
                    </td>
                  </tr>
                  <tr>
                    <td className="pb-2">KEDUA</td>
                    <td className="pb-2">:</td>
                    <td className="pb-2 text-justify">
                      Daftar Data tersebut digunakan sebagai dasar bagi Kepala Perangkat 
                      Daerah selaku Produsen Data dalam menyampaikan ke Walidata sesuai 
                      urusan tugas dan kewenangannya.
                    </td>
                  </tr>
                  <tr>
                    <td className="pb-2">KETIGA</td>
                    <td className="pb-2">:</td>
                    <td className="pb-2 text-justify">
                      Daftar Data dimaksud mencakup klasifikasi tentang Kode DSSD, Uraian 
                      DSSD, Satuan, dan Periode.
                    </td>
                  </tr>
                  <tr>
                    <td className="pb-2">KEEMPAT</td>
                    <td className="pb-2">:</td>
                    <td className="pb-2 text-justify">
                      Badan Perencanaan dan Pembangunan Daerah Kabupaten Malang selaku 
                      Koordinator Data telah memverifikasi daftar data tersebut dan akan 
                      digunakan sebagai acuan dalam perencanaan pembangunan.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Date & Signatures Grid */}
            <div className="font-serif text-sm text-center">
              <div className="mb-6">
                Malang, {form.tanggalAcara}<br/>
                Tim Pelaksana Satu Data Kabupaten Malang
              </div>

              <div className="grid grid-cols-2 gap-8 mb-12">
                <div>
                  <div className="font-bold mb-16">
                    Produsen Data,<br/>
                    {form.jabatanProdusen}<br/>
                    Kabupaten Malang
                  </div>
                  <div className="font-bold underline">{form.namaProdusen}</div>
                  <div>NIP. {form.nipProdusen}</div>
                </div>
                <div>
                  <div className="font-bold mb-16">
                    Walidata,<br/>
                    Kepala Dinas Komunikasi dan Informatika<br/>
                    Kabupaten Malang
                  </div>
                  <div className="font-bold underline">{form.namaWalidata}</div>
                  <div>NIP. {form.nipWalidata}</div>
                </div>
              </div>

              <div className="w-1/2 mx-auto">
                <div className="font-bold mb-16">
                  Koordinator,<br/>
                  Kepala Badan Perencanaan Pembangunan Daerah<br/>
                  Kabupaten Malang
                </div>
                <div className="font-bold underline">{form.namaKoordinator}</div>
                <div>NIP. {form.nipKoordinator}</div>
              </div>
            </div>
          </div>

          {/* Page 2: Lampiran */}
          <div className="p-[20mm] print:break-before-page">
             {/* Lampiran Header box */}
             <div className="border border-black p-2 mb-6 text-xs w-[300px] ml-auto font-serif">
                <table className="w-full">
                  <tbody>
                    <tr><td colSpan={3}>Lampiran Berita Acara</td></tr>
                    <tr><td colSpan={3}>Daftar Data Statistik Sektoral Daerah (DSSD)</td></tr>
                    <tr><td className="w-16">Nomor</td><td className="w-2">:</td><td>{form.nomor}</td></tr>
                    <tr><td>Tanggal</td><td>:</td><td>{form.tanggalAcara}</td></tr>
                  </tbody>
                </table>
             </div>

             <div className="text-center font-bold mb-6 font-serif uppercase text-sm">
              <div className="underline decoration-1 underline-offset-4">LAMPIRAN BERITA ACARA</div>
              <div>DAFTAR DATA STATISTIK SEKTORAL DAERAH</div>
              <div>{selectedProdusen || '[NAMA PRODUSEN DATA]'}</div>
              <div>KABUPATEN MALANG</div>
            </div>

            {/* Tables Container */}
            <div className="font-serif text-[11px] print:text-[10px]">
              
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
                  {filteredData.eWalidata.length > 0 ? filteredData.eWalidata.map((item, index) => (
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
                  {filteredData.sektoral.length > 0 ? filteredData.sektoral.map((item, index) => (
                    <tr key={index} className="text-center">
                      <td className="border border-black p-1 w-8">{filteredData.eWalidata.length + index + 1}</td>
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
                  {filteredData.spasial.length > 0 ? filteredData.spasial.map((item, index) => (
                    <tr key={index} className="text-center">
                      <td className="border border-black p-1">{filteredData.eWalidata.length + filteredData.sektoral.length + index + 1}</td>
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

              {/* Final Signature on Lampiran */}
              <div className="flex justify-end mt-12 mr-12 text-center font-serif text-sm">
                <div>
                  <div className="font-bold mb-16">
                    Produsen Data,<br/>
                    {form.jabatanProdusen}<br/>
                    Kabupaten Malang
                  </div>
                  <div className="font-bold underline">{form.namaProdusen}</div>
                  <div>NIP. {form.nipProdusen}</div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
