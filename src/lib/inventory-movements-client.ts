export interface LogMovementPayload {
  inventoryId: number | null;
  idVariante?: number;
  quantityChange: number;
  reason: string;
  tipoMovimiento?: string;
  forzar?: boolean;
}

export async function logInventoryMovement(payload: LogMovementPayload) {
  const res = await fetch('/api/inventory/adjust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inventoryId: payload.inventoryId,
      idVariante: payload.idVariante,
      quantityChange: payload.quantityChange,
      reason: payload.reason,
      tipoMovimiento: payload.tipoMovimiento,
      forzar: payload.forzar,
    }),
  });
  const result = await res.json();
  if (!result.success) {
    throw new Error(result.error?.message || 'Error al registrar el movimiento');
  }
  return result.data;
}
