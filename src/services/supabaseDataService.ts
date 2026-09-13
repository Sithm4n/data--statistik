import { supabase } from './supabaseClient';
import { AllData, DataEWalidata, DataSektoral, DataSpasial, UploadRecord } from '../types';

// Helper to chunk arrays for bulk insertion
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export const supabaseDataService = {
  /**
   * Menyimpan Upload Record baru beserta seluruh baris datanya (mendukung 10k+ baris dengan batching)
   */
  async saveUploadRecord(record: UploadRecord): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Simpan metadata upload
      const { error: uploadErr } = await supabase
        .from('uploads')
        .upsert({
          id: record.id,
          filename: record.filename,
          year: record.year,
          total_rows: record.totalRows,
          uploaded_at: record.uploadTime || new Date().toISOString(),
          uploaded_by: 'adminstatistik'
        });

      if (uploadErr) {
        console.warn('Gagal menyimpan metadata upload ke Supabase:', uploadErr);
        return { success: false, error: uploadErr.message };
      }

      const BATCH_SIZE = 400;

      // 2. Simpan sheet e-Walidata (secara batch/chunk)
      if (record.data.eWalidata && record.data.eWalidata.length > 0) {
        const ewaliRows = record.data.eWalidata.map((item, idx) => ({
          upload_id: record.id,
          no_urut: String(item.No || idx + 1),
          kode_dssd: item['Kode DSSD'] || '',
          uraian_dssd: item['Uraian DSSD'] || '',
          satuan: item.Satuan || '',
          definisi_operasional: item['Definisi Operasional'] || '',
          tag_urusan: item['Tag urusan'] || '',
          produsen_data: item['Produsen Data'] || 'Umum',
          tahun: item.Tahun || record.year,
          last_modified: item._lastModified || new Date().toISOString()
        }));

        const chunks = chunkArray(ewaliRows, BATCH_SIZE);
        for (const chunk of chunks) {
          const { error } = await supabase.from('data_ewalidata').insert(chunk);
          if (error) console.warn('Error batch e-walidata chunk:', error);
        }
      }

      // 3. Simpan sheet Data Sektoral
      if (record.data.sektoral && record.data.sektoral.length > 0) {
        const sektoralRows = record.data.sektoral.map((item, idx) => ({
          upload_id: record.id,
          no_urut: String(item.No || idx + 1),
          kode_data: item['Kode Data'] || '',
          uraian_dssd: item['Uraian DSSD'] || '',
          satuan: item.Satuan || '',
          definisi_operasional: item['Definisi Operasional'] || '',
          tag_urusan: item['Tag urusan'] || '',
          produsen_data: item['Produsen Data'] || 'Umum',
          info_sub_kegiatan: item['Info Sub Kegiatan'] || '',
          tahun: item.Tahun || record.year,
          last_modified: item._lastModified || new Date().toISOString()
        }));

        const chunks = chunkArray(sektoralRows, BATCH_SIZE);
        for (const chunk of chunks) {
          const { error } = await supabase.from('data_sektoral').insert(chunk);
          if (error) console.warn('Error batch sektoral chunk:', error);
        }
      }

      // 4. Simpan sheet Data Spasial
      if (record.data.spasial && record.data.spasial.length > 0) {
        const spasialRows = record.data.spasial.map((item, idx) => ({
          upload_id: record.id,
          no_urut: String(item.No || idx + 1),
          kode_data: item['Kode Data'] || '',
          nama_geospasial: item['Nama Informasi Geospasial'] || '',
          format_penyimpanan: item['Format penyimpanan'] || item['Format penyimpanan data'] || item['Format Penyimpanan Data'] || '',
          skala: item.Skala || '',
          produsen_data: item['Produsen Data'] || 'Umum',
          tahun: item.Tahun || record.year,
          last_modified: item._lastModified || new Date().toISOString()
        }));

        const chunks = chunkArray(spasialRows, BATCH_SIZE);
        for (const chunk of chunks) {
          const { error } = await supabase.from('data_spasial').insert(chunk);
          if (error) console.warn('Error batch spasial chunk:', error);
        }
      }

      return { success: true };
    } catch (err: any) {
      console.error('Supabase upload exception:', err);
      return { success: false, error: err?.message || 'Gagal menyimpan ke cloud' };
    }
  },

  /**
   * Mengambil semua riwayat upload beserta data dari Supabase
   */
  async loadAllUploads(): Promise<UploadRecord[]> {
    try {
      const { data: uploadsList, error: upErr } = await supabase
        .from('uploads')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (upErr || !uploadsList || uploadsList.length === 0) {
        return [];
      }

      const results: UploadRecord[] = [];

      for (const up of uploadsList) {
        // Ambil data untuk tiap upload
        const [ewalidataRes, sektoralRes, spasialRes] = await Promise.all([
          supabase.from('data_ewalidata').select('*').eq('upload_id', up.id),
          supabase.from('data_sektoral').select('*').eq('upload_id', up.id),
          supabase.from('data_spasial').select('*').eq('upload_id', up.id)
        ]);

        const eWalidata: DataEWalidata[] = (ewalidataRes.data || []).map((row: any) => ({
          No: row.no_urut,
          'Kode DSSD': row.kode_dssd,
          'Uraian DSSD': row.uraian_dssd,
          Satuan: row.satuan,
          'Definisi Operasional': row.definisi_operasional,
          'Tag urusan': row.tag_urusan,
          'Produsen Data': row.produsen_data,
          Tahun: row.tahun,
          _uploadId: row.upload_id,
          _rowId: row.id,
          _lastModified: row.last_modified
        }));

        const sektoral: DataSektoral[] = (sektoralRes.data || []).map((row: any) => ({
          No: row.no_urut,
          'Kode Data': row.kode_data,
          'Uraian DSSD': row.uraian_dssd,
          Satuan: row.satuan,
          'Definisi Operasional': row.definisi_operasional,
          'Tag urusan': row.tag_urusan,
          'Produsen Data': row.produsen_data,
          'Info Sub Kegiatan': row.info_sub_kegiatan,
          Tahun: row.tahun,
          _uploadId: row.upload_id,
          _rowId: row.id,
          _lastModified: row.last_modified
        }));

        const spasial: DataSpasial[] = (spasialRes.data || []).map((row: any) => ({
          No: row.no_urut,
          'Kode Data': row.kode_data,
          'Nama Informasi Geospasial': row.nama_geospasial,
          'Format penyimpanan': row.format_penyimpanan,
          Skala: row.skala,
          'Produsen Data': row.produsen_data,
          Tahun: row.tahun,
          _uploadId: row.upload_id,
          _rowId: row.id,
          _lastModified: row.last_modified
        }));

        results.push({
          id: up.id,
          filename: up.filename,
          uploadTime: up.uploaded_at,
          year: up.year,
          totalRows: up.total_rows || (eWalidata.length + sektoral.length + spasial.length),
          data: {
            eWalidata,
            sektoral,
            spasial
          }
        });
      }

      return results;
    } catch (err) {
      console.warn('Gagal memuat uploads dari Supabase:', err);
      return [];
    }
  },

  /**
   * Menghapus seluruh file upload beserta baris data terkait di Supabase
   */
  async deleteUploadRecord(uploadId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('uploads').delete().eq('id', uploadId);
      if (error) {
        console.warn('Gagal menghapus upload di Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Exception saat menghapus upload di Supabase:', err);
      return false;
    }
  },

  /**
   * Menghapus baris tunggal dari tabel tertentu di Supabase
   */
  async deleteSingleRow(tabType: keyof AllData, rowId: string): Promise<boolean> {
    try {
      const tableMap: Record<keyof AllData, string> = {
        eWalidata: 'data_ewalidata',
        sektoral: 'data_sektoral',
        spasial: 'data_spasial'
      };

      const tableName = tableMap[tabType];
      if (!tableName) return false;

      const { error } = await supabase.from(tableName).delete().eq('id', rowId);
      return !error;
    } catch (err) {
      console.warn('Gagal delete row di Supabase:', err);
      return false;
    }
  }
};
