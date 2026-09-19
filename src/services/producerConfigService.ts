import { ProdusenSignerConfig } from '../types';

const STORAGE_KEY = 'produsen_signers_map_v2';

export const getSmartJabatan = (prodName: string): string => {
  if (!prodName) return 'Kepala Perangkat Daerah';
  const clean = prodName.trim();
  const lower = clean.toLowerCase();

  if (lower.startsWith('dinas ') || lower.startsWith('badan ') || lower.startsWith('bagian ')) {
    return `Kepala ${clean}`;
  }
  if (lower.startsWith('satuan polisi') || lower.startsWith('satpol')) {
    return 'Kepala Satuan Polisi Pamong Praja';
  }
  if (lower.startsWith('inspektorat')) {
    return 'Inspektur Daerah';
  }
  if (lower.startsWith('sekretariat dprd')) {
    return 'Sekretaris DPRD';
  }
  if (lower.startsWith('sekretariat daerah')) {
    return 'Sekretaris Daerah';
  }
  if (lower.startsWith('kecamatan ')) {
    const kecName = clean.replace(/^kecamatan\s+/i, '');
    return `Camat ${kecName}`;
  }
  if (lower.startsWith('rsud') || lower.startsWith('rumah sakit')) {
    return `Direktur ${clean}`;
  }
  
  return `Kepala ${clean}`;
};

export const producerConfigService = {
  loadProducerConfigs(availableProducers: string[]): Record<string, ProdusenSignerConfig> {
    let saved: Record<string, ProdusenSignerConfig> = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        saved = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Gagal membaca config produsen:', e);
    }

    const result: Record<string, ProdusenSignerConfig> = {};

    availableProducers.forEach(p => {
      const trimmed = p.trim();
      if (!trimmed) return;

      if (saved[trimmed]) {
        result[trimmed] = {
          ...saved[trimmed],
          selected: saved[trimmed].selected !== undefined ? saved[trimmed].selected : true
        };
      } else {
        result[trimmed] = {
          prodName: trimmed,
          jabatan: getSmartJabatan(trimmed),
          nama: 'YUDHI HINDHARTO, S.T., M.Si.',
          nip: '197206121998031007',
          selected: true
        };
      }
    });

    return result;
  },

  saveProducerConfigs(configs: Record<string, ProdusenSignerConfig>) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    } catch (e) {
      console.warn('Gagal menyimpan config produsen:', e);
    }
  },

  getProducerConfig(prodName: string): ProdusenSignerConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: Record<string, ProdusenSignerConfig> = JSON.parse(raw);
        if (saved[prodName]) {
          return saved[prodName];
        }
      }
    } catch (e) {
      console.warn('Gagal membaca config produsen:', e);
    }
    return {
      prodName,
      jabatan: getSmartJabatan(prodName),
      nama: 'YUDHI HINDHARTO, S.T., M.Si.',
      nip: '197206121998031007',
      selected: true
    };
  },

  updateSingleProducer(prodName: string, partial: Partial<ProdusenSignerConfig>) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      saved[prodName] = {
        ...(saved[prodName] || {
          prodName,
          jabatan: getSmartJabatan(prodName),
          nama: 'YUDHI HINDHARTO, S.T., M.Si.',
          nip: '197206121998031007',
          selected: true
        }),
        ...partial
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch (e) {
      console.warn('Gagal mengupdate produsen:', e);
    }
  }
};
