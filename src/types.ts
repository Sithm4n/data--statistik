export interface DataEWalidata {
  No: string | number;
  'Kode DSSD'?: string;
  'Uraian DSSD'?: string;
  Satuan?: string;
  'Definisi Operasional'?: string;
  'Tag urusan'?: string;
  'Produsen Data'?: string;
}

export interface DataSektoral {
  No: string | number;
  'Kode Data'?: string;
  'Uraian DSSD'?: string;
  Satuan?: string;
  'Definisi Operasional'?: string;
  'Tag urusan'?: string;
  'Produsen Data'?: string;
  'Info Sub Kegiatan'?: string;
}

export interface DataSpasial {
  No: string | number;
  'Kode Data'?: string;
  'Nama Informasi Geospasial'?: string;
  'Format penyimpanan'?: string;
  Skala?: string;
  'Produsen Data'?: string;
}

export type AllData = {
  eWalidata: DataEWalidata[];
  sektoral: DataSektoral[];
  spasial: DataSpasial[];
}

export type ChartData = {
  name: string;
  value: number;
};

