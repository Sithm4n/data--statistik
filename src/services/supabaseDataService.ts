import { supabase } from './supabaseClient';
import { AllData, DataEWalidata, DataSektoral, DataSpasial, UploadRecord } from '../types';

// Helper to safely format dates into ISO-8601 for PostgreSQL timestamptz
function toSafeIsoString(dateVal?: any): string {
  if (!dateVal) return new Date().toISOString();
  if (typeof dateVal === 'string') {
    const parsed = Date.parse(dateVal);
    if (!isNaN(parsed)) return new Date(parsed).toISOString();
  } else if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    return dateVal.toISOString();
  }
  return new Date().toISOString();
}

// Helper to chunk arrays for bulk insertion
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Helper to fetch all rows across pagination limits (Supabase defaults to 1,000 max rows per query)
async function fetchAllRowsByUploadId(table: string, uploadId: string): Promise<any[]> {
  let allRows: any[] = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('upload_id', uploadId)
      .range(from, from + step - 1);

    if (error) {
      console.warn(`Error fetching ${table} rows for upload ${uploadId}:`, error);
      break;
    }

    if (data && data.length > 0) {
      allRows = allRows.concat(data);
      if (data.length < step) {
        hasMore = false;
      } else {
        from += step;
      }
    } else {
      hasMore = false;
    }
  }

  return allRows;
}

export const supabaseDataService = {
  /**
   * Menyimpan Upload Record baru beserta seluruh baris datanya (mendukung 10k+ baris dengan batching)
   */
  async saveUploadRecord(record: UploadRecord): Promise<{ success: boolean; error?: string }> {
    try {
      const safeUploadedAt = toSafeIsoString(record.uploadTime);

      // 1. Simpan metadata upload
      const { error: uploadErr } = await supabase
        .from('uploads')
        .upsert({
          id: record.id,
          filename: record.filename,
          year: record.year,
          total_rows: record.totalRows,
          uploaded_at: safeUploadedAt,
          uploaded_by: 'adminstatistik'
        });

      if (uploadErr) {
        console.error('Gagal menyimpan metadata upload ke Supabase:', uploadErr);
        return { success: false, error: uploadErr.message };
      }

      const BATCH_SIZE = 400;
      const nowIso = new Date().toISOString();

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
          last_modified: toSafeIsoString(item._lastModified)
        }));

        const chunks = chunkArray(ewaliRows, BATCH_SIZE);
        for (const chunk of chunks) {
          const { error } = await supabase.from('data_ewalidata').insert(chunk);
          if (error) {
            console.error('Error batch e-walidata chunk:', error);
            return { success: false, error: error.message };
          }
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
          last_modified: toSafeIsoString(item._lastModified)
        }));

        const chunks = chunkArray(sektoralRows, BATCH_SIZE);
        for (const chunk of chunks) {
          const { error } = await supabase.from('data_sektoral').insert(chunk);
          if (error) {
            console.error('Error batch sektoral chunk:', error);
            return { success: false, error: error.message };
          }
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
          last_modified: toSafeIsoString(item._lastModified)
        }));

        const chunks = chunkArray(spasialRows, BATCH_SIZE);
        for (const chunk of chunks) {
          const { error } = await supabase.from('data_spasial').insert(chunk);
          if (error) {
            console.error('Error batch spasial chunk:', error);
            return { success: false, error: error.message };
          }
        }
      }

      return { success: true };
    } catch (err: any) {
      console.error('Supabase upload exception:', err);
      return { success: false, error: err?.message || 'Gagal menyimpan ke cloud' };
    }
  },

  /**
   * Mengambil semua riwayat upload beserta data dari Supabase (dengan paginasi lengkap)
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
        // Ambil data untuk tiap upload dengan penanganan paging 1000+ baris
        const [ewalidataRows, sektoralRows, spasialRows] = await Promise.all([
          fetchAllRowsByUploadId('data_ewalidata', up.id),
          fetchAllRowsByUploadId('data_sektoral', up.id),
          fetchAllRowsByUploadId('data_spasial', up.id)
        ]);

        const eWalidata: DataEWalidata[] = (ewalidataRows || []).map((row: any) => ({
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

        const sektoral: DataSektoral[] = (sektoralRows || []).map((row: any) => ({
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

        const spasial: DataSpasial[] = (spasialRows || []).map((row: any) => ({
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
  },

  /**
   * Mengupdate baris tunggal pada Supabase saat diedit di web
   */
  async updateSingleRow(tabType: keyof AllData, rowId: string, updatedData: any): Promise<boolean> {
    try {
      const tableMap: Record<keyof AllData, string> = {
        eWalidata: 'data_ewalidata',
        sektoral: 'data_sektoral',
        spasial: 'data_spasial'
      };

      const tableName = tableMap[tabType];
      if (!tableName) return false;

      let payload: any = {
        last_modified: new Date().toISOString()
      };

      if (tabType === 'eWalidata') {
        if (updatedData.No !== undefined) payload.no_urut = String(updatedData.No);
        if (updatedData['Kode DSSD'] !== undefined) payload.kode_dssd = updatedData['Kode DSSD'];
        if (updatedData['Uraian DSSD'] !== undefined) payload.uraian_dssd = updatedData['Uraian DSSD'];
        if (updatedData.Satuan !== undefined) payload.satuan = updatedData.Satuan;
        if (updatedData['Definisi Operasional'] !== undefined) payload.definisi_operasional = updatedData['Definisi Operasional'];
        if (updatedData['Tag urusan'] !== undefined) payload.tag_urusan = updatedData['Tag urusan'];
        if (updatedData['Produsen Data'] !== undefined) payload.produsen_data = updatedData['Produsen Data'];
      } else if (tabType === 'sektoral') {
        if (updatedData.No !== undefined) payload.no_urut = String(updatedData.No);
        if (updatedData['Kode Data'] !== undefined) payload.kode_data = updatedData['Kode Data'];
        if (updatedData['Uraian DSSD'] !== undefined) payload.uraian_dssd = updatedData['Uraian DSSD'];
        if (updatedData.Satuan !== undefined) payload.satuan = updatedData.Satuan;
        if (updatedData['Definisi Operasional'] !== undefined) payload.definisi_operasional = updatedData['Definisi Operasional'];
        if (updatedData['Tag urusan'] !== undefined) payload.tag_urusan = updatedData['Tag urusan'];
        if (updatedData['Produsen Data'] !== undefined) payload.produsen_data = updatedData['Produsen Data'];
        if (updatedData['Info Sub Kegiatan'] !== undefined) payload.info_sub_kegiatan = updatedData['Info Sub Kegiatan'];
      } else if (tabType === 'spasial') {
        if (updatedData.No !== undefined) payload.no_urut = String(updatedData.No);
        if (updatedData['Kode Data'] !== undefined) payload.kode_data = updatedData['Kode Data'];
        if (updatedData['Nama Informasi Geospasial'] !== undefined) payload.nama_geospasial = updatedData['Nama Informasi Geospasial'];
        const formatVal = updatedData['Format penyimpanan'] || updatedData['Format penyimpanan data'] || updatedData['Format Penyimpanan Data'];
        if (formatVal !== undefined) payload.format_penyimpanan = formatVal;
        if (updatedData.Skala !== undefined) payload.skala = updatedData.Skala;
        if (updatedData['Produsen Data'] !== undefined) payload.produsen_data = updatedData['Produsen Data'];
      }

      const { error } = await supabase.from(tableName).update(payload).eq('id', rowId);
      if (error) {
        console.warn('Gagal update row di Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Exception update row di Supabase:', err);
      return false;
    }
  },

  /**
   * Bulk delete baris berdasarkan filter (misal: Tahun)
   */
  async bulkDeleteRows(tabType: keyof AllData, filterKey: string, filterValue: string): Promise<boolean> {
    try {
      const tableMap: Record<keyof AllData, string> = {
        eWalidata: 'data_ewalidata',
        sektoral: 'data_sektoral',
        spasial: 'data_spasial'
      };

      const tableName = tableMap[tabType];
      if (!tableName) return false;

      const colName = filterKey === 'Tahun' ? 'tahun' : filterKey;
      const { error } = await supabase.from(tableName).delete().eq(colName, filterValue);
      return !error;
    } catch (err) {
      console.warn('Exception bulk delete di Supabase:', err);
      return false;
    }
  }
};
