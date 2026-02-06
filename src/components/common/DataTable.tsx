import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
  mobileLabel?: string; // Label for mobile card view
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
  emptyMessage?: string;
  mobileCardView?: boolean;
  loading?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  className,
  emptyMessage = 'No data available',
  mobileCardView = false,
  loading = false,
}: DataTableProps<T>) {
  return (
    <div className={cn('w-full', className)}>
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground animate-pulse">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm">Fetching real-time data...</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          {mobileCardView && (
            <div className="block sm:hidden space-y-3">
              {data.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground bg-card rounded-lg border border-border">
                  {emptyMessage}
                </div>
              ) : (
                data.map((item, index) => (
                  <div key={index} className="bg-card rounded-lg border border-border p-4 shadow-sm space-y-2">
                    {columns.map((column) => (
                      <div key={String(column.key)} className="flex items-start justify-between gap-2">
                        <span className="text-sm text-muted-foreground font-medium min-w-[80px] flex-shrink-0">
                          {column.mobileLabel || column.header}:
                        </span>
                        <span className="text-sm text-right flex-1">
                          {column.render
                            ? column.render(item)
                            : String(item[column.key as keyof T] ?? '')}
                        </span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Desktop Table View */}
          <div className={cn(
            'table-responsive-wrapper px-1 sm:px-0',
            mobileCardView && 'hidden sm:block'
          )}>
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  {columns.map((column) => (
                    <th
                      key={String(column.key)}
                      className={cn('table-header py-3 px-4 whitespace-nowrap', column.className)}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => (
                    <tr key={index} className="border-b border-border/50 lg:hover:bg-muted/30 transition-colors">
                      {columns.map((column) => (
                        <td key={String(column.key)} className={cn('table-cell whitespace-nowrap', column.className)}>
                          {column.render
                            ? column.render(item)
                            : String(item[column.key as keyof T] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
