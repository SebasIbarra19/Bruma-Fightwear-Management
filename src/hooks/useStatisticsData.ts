import { useEffect, useState } from 'react';
import type { StatisticsPayload } from '@/lib/database/adapters/dashboard-adapter';

/** Presets del selector de período. `null` en días = histórico completo. */
export const RANGE_PRESETS = [
  { id: '7d', label: '7 días', days: 7 },
  { id: '30d', label: '30 días', days: 30 },
  { id: '90d', label: '90 días', days: 90 },
  { id: 'all', label: 'Todo', days: null },
] as const;

export type RangePresetId = (typeof RANGE_PRESETS)[number]['id'];

/** `YYYY-MM-DD` en hora local, que es lo que el SP compara contra `fecha::date`. */
function toIsoDate(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

interface UseStatisticsDataResult {
  data: StatisticsPayload | null;
  loading: boolean;
  error: string | null;
  preset: RangePresetId;
  setPreset: (p: RangePresetId) => void;
}

export function useStatisticsData(inicial: RangePresetId = '30d'): UseStatisticsDataResult {
  const [data, setData] = useState<StatisticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<RangePresetId>(inicial);

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    setError(null);

    const dias = RANGE_PRESETS.find((r) => r.id === preset)?.days ?? null;
    const query = new URLSearchParams();
    if (dias !== null) {
      const desde = new Date();
      desde.setDate(desde.getDate() - dias);
      query.set('start', toIsoDate(desde));
      query.set('end', toIsoDate(new Date()));
    }

    fetch(`/api/statistics?${query}`)
      .then((r) => r.json())
      .then((result) => {
        // Sin este guard, cambiar de preset rápido puede dejar pintada la
        // respuesta de un rango viejo que llegó tarde.
        if (cancelado) return;
        if (result.success) setData(result.data);
        else setError(result.error?.message || 'Error cargando estadísticas');
      })
      .catch((e) => !cancelado && setError(e.message))
      .finally(() => !cancelado && setLoading(false));

    return () => {
      cancelado = true;
    };
  }, [preset]);

  return { data, loading, error, preset, setPreset };
}
