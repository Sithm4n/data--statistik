import { AllData } from '../types';

export const mockData: AllData = {
  eWalidata: [
    {
      No: 2345,
      'Kode DSSD': '7.01.000071',
      'Uraian DSSD': 'Laporan Hasil Sinergitas',
      Satuan: 'Laporan',
      'Definisi Operasional': 'Laporan Hasil Sinergitas dengan Kepolisian Negara',
      'Tag urusan': 'Administrasi',
      'Produsen Data': 'Kecamatan Se-Kabupaten Malang'
    }
  ],
  sektoral: [
    {
      No: 1,
      'Kode Data': '35.07.405.001',
      'Uraian DSSD': 'Banyaknya (ASN) di Lingkungan',
      Satuan: 'Orang',
      'Definisi Operasional': 'Jumlah pegawai ASN yang berstatus aktif bekerja',
      'Tag urusan': 'Pemerintahan',
      'Produsen Data': 'Badan Kepegawaian dan Pengembangan Sumber Daya',
      'Info Sub Kegiatan': ''
    }
  ],
  spasial: [
    {
      No: 1,
      'Kode Data': 'DS.35.07.407.001',
      'Nama Informasi Geospasial': 'Peta Bahaya Banjir',
      'Format penyimpanan': 'Shp',
      Skala: '1:25000',
      'Produsen Data': 'Badan Penanggulangan Bencana Daerah'
    }
  ]
};
