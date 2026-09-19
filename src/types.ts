export interface DataEWalidata {
  No: string | number;
  'Kode DSSD'?: string;
  'Uraian DSSD'?: string;
  Satuan?: string;
  'Definisi Operasional'?: string;
  'Tag urusan'?: string;
  'Produsen Data'?: string;
  _lastModified?: string;
  _uploadTime?: string;
  Tahun?: string;
  _uploadId?: string;
  _originalIndex?: number;
  _rowId?: string;
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
  _lastModified?: string;
  _uploadTime?: string;
  Tahun?: string;
  _uploadId?: string;
  _originalIndex?: number;
  _rowId?: string;
}

export interface DataSpasial {
  No: string | number;
  'Kode Data'?: string;
  'Nama Informasi Geospasial'?: string;
  'Format penyimpanan'?: string;
  'Format penyimpanan data'?: string;
  'Format Penyimpanan Data'?: string;
  Skala?: string;
  'Produsen Data'?: string;
  _lastModified?: string;
  _uploadTime?: string;
  Tahun?: string;
  _uploadId?: string;
  _originalIndex?: number;
  _rowId?: string;
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

export type UploadLog = {
  filename: string;
  timestamp: string;
};

export interface UploadRecord {
  id: string;
  filename: string;
  timestamp?: string;
  uploadTime: string;
  year: string;
  data: AllData;
  totalRows: number;
}

export interface AuthUser {
  username: string;
  fullName: string;
  role: string;
  lastLogin?: string;
}

export interface LoginAttemptRecord {
  id: string;
  timestamp: number;
  dateFormatted: string;
  ipAddress: string;
  usernameAttempted: string;
  status: 'SUCCESS' | 'FAILED' | 'LOCKED';
  userAgent?: string;
}

export interface SecurityStatus {
  isLocked: boolean;
  lockoutRemainingSeconds: number;
  consecutiveFailures: number;
  maxAttempts: number;
  lockoutMinutes: number;
}

export interface ProdusenSignerConfig {
  prodName: string;
  jabatan: string;
  nama: string;
  nip: string;
  selected?: boolean;
}


