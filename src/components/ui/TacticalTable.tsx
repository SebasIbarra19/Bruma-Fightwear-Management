import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  className?: string;
  headerClassName?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

interface TacticalTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  
  // Pagination
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  itemsLabel?: string;
  /**
   * Filas por página. Sin esto, el pie tenía que INFERIR el tamaño dividiendo
   * `totalItems / totalPages`, que solo da entero cuando la última página está
   * llena: con 103 registros en páginas de 10 imprimía literalmente
   * "Showing 1-9.36 of 103 records". Afectaba a Inventory, Movements y
   * Activity Log por igual.
   *
   * Es opcional para no romper a quien ya pasa las otras props; cuando falta,
   * se cae al cálculo viejo pero redondeado, que al menos nunca muestra
   * decimales.
   */
  pageSize?: number;
}

export function TacticalTable<T>({
  columns,
  data,
  loading = false,
  keyExtractor,
  onRowClick,
  emptyTitle = "Sector Clear",
  emptyDescription = "No records match your tactical search parameters.",
  emptyActionLabel,
  onEmptyAction,
  
  currentPage = 0,
  totalPages = 0,
  totalItems = 0,
  onPageChange,
  itemsLabel = "items",
  pageSize
}: TacticalTableProps<T>) {

  if (loading) {
    return (
      <div className="bg-obsidian/40 border border-bone/10 rounded-[4px] overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto tactical-scrollbar">
          <table className="w-full">
            <thead>
              <tr className="border-b border-bone/10">
                {columns.map((col) => (
                  <th 
                    key={col.key} 
                    className={cn(
                      "text-left px-6 py-4 text-[10px] text-bone/50 font-geist uppercase tracking-widest",
                      col.headerClassName
                    )}
                  >
                    <Skeleton className="w-16 h-3 rounded-[2px]" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="border-b border-bone/5">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4">
                      <Skeleton className="w-full h-5 rounded-[2px]" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-obsidian/40 border border-bone/10 rounded-[4px] overflow-hidden backdrop-blur-md">
      <div className="overflow-x-auto tactical-scrollbar">
        <table className="w-full">
          <thead>
            <tr className="border-b border-bone/10">
              {columns.map((col) => (
                <th 
                  key={col.key} 
                  className={cn(
                    "text-left px-6 py-4 text-[10px] text-bone/50 font-geist uppercase tracking-widest",
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item, i) => (
                <tr 
                  key={String(keyExtractor(item))} 
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "border-b border-bone/5 transition-colors hover:bg-bone/5",
                    i % 2 === 0 ? "" : "bg-obsidian/20",
                    onRowClick ? "cursor-pointer" : ""
                  )}
                >
                  {columns.map((col) => (
                    <td 
                      key={col.key} 
                      className={cn(
                        "px-6 py-4 font-geist text-sm text-bone/80",
                        col.className
                      )}
                    >
                      {col.render ? col.render(item, i) : String((item as any)[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <EmptyState 
                    title={emptyTitle} 
                    description={emptyDescription} 
                    actionLabel={emptyActionLabel}
                    onAction={onEmptyAction}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && onPageChange && (() => {
        // `data` es la página ya cortada por quien usa el componente, así que su
        // largo ES el tamaño real de ESTA página — incluida la última, que suele
        // venir incompleta. Se prefiere a dividir `totalItems / totalPages`,
        // que era la fuente del "1-9.36".
        const porPagina = pageSize ?? Math.ceil(totalItems / totalPages)
        const desde = currentPage * porPagina + 1
        const hasta = Math.min(desde + data.length - 1, totalItems)
        return (
        <div className="flex items-center justify-between px-6 py-4 border-t border-bone/10 bg-obsidian/30">
          <p className="text-[10px] uppercase tracking-widest text-bone/50 font-geist">
            Showing {desde}-{hasta} of {totalItems} {itemsLabel}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 0}
              onClick={() => onPageChange(currentPage - 1)}
              className="px-4 py-2 rounded-[2px] border border-bone/20 text-[10px] uppercase tracking-widest font-geist text-bone/70 hover:bg-bone/10 disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => onPageChange(currentPage + 1)}
              className="px-4 py-2 rounded-[2px] border border-bone/20 text-[10px] uppercase tracking-widest font-geist text-bone/70 hover:bg-bone/10 disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
        )
      })()}
    </div>
  );
}
