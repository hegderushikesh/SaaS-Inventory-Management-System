import React from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { TableSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

export const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to show in this view.',
  emptyActionLabel,
  onEmptyAction,
  pagination = null, // { page, limit, total, totalPages, onPageChange }
  sorting = null,    // { sortBy, sortOrder, onSortChange }
  className = ''
}) => {
  if (isLoading) {
    return <TableSkeleton rows={pagination?.limit || 5} cols={columns.length || 4} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  const handleSort = (columnKey, sortable) => {
    if (!sortable || !sorting || !sorting.onSortChange) return;

    if (sorting.sortBy === columnKey) {
      const nextOrder = sorting.sortOrder === 'ASC' ? 'DESC' : 'ASC';
      sorting.onSortChange(columnKey, nextOrder);
    } else {
      sorting.onSortChange(columnKey, 'ASC');
    }
  };

  const startRecord = pagination ? (pagination.page - 1) * pagination.limit + 1 : 1;
  const endRecord = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : data.length;

  return (
    <div className={`bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden flex flex-col ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/75">
              {columns.map((col) => {
                const isSorted = sorting && sorting.sortBy === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    onClick={() => handleSort(col.key, col.sortable)}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 select-none ${
                      col.sortable ? 'cursor-pointer hover:text-slate-800' : ''
                    } ${col.headerClassName || ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sorting.sortOrder === 'ASC' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-300" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                className="hover:bg-slate-50/60 transition-colors duration-100"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-sm whitespace-nowrap ${col.className || ''}`}
                  >
                    {col.render ? col.render(row, rowIdx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {pagination && pagination.total > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{startRecord}</span> to{' '}
            <span className="font-semibold text-slate-700">{endRecord}</span> of{' '}
            <span className="font-semibold text-slate-700">{pagination.total}</span> items
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-medium text-slate-700">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>

            <button
              type="button"
              disabled={pagination.page >= (pagination.totalPages || 1)}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
