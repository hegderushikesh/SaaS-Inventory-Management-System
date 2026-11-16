import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  Search,
  X,
  Filter,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  Calendar,
  Package,
  Layers
} from 'lucide-react';

import { useStockMovements } from '../hooks/useStockMovements';
import { useProducts } from '../hooks/useProducts';
import { useDebounce } from '../hooks/useDebounce';

import {
  PageHeader,
  Button,
  Badge,
  Input,
  DataTable,
  TableSkeleton,
  EmptyState
} from '../components/ui';

import { RecordMovementModal } from '../components/stock-movements/RecordMovementModal';
import { MovementDetailModal } from '../components/stock-movements/MovementDetailModal';

export const StockMovementsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialProductId = searchParams.get('product_id') || '';

  // Filter states
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 350);
  const [selectedProduct, setSelectedProduct] = useState(initialProductId);
  const [selectedMovementType, setSelectedMovementType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedMovementForDetail, setSelectedMovementForDetail] = useState(null);

  // Fetch products for filter dropdown
  const { data: productsData } = useProducts({ limit: 100, sortBy: 'name', sortOrder: 'ASC' });
  const productsList = productsData?.data || [];

  // Query stock movements
  const {
    data: responseData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useStockMovements({
    page: currentPage,
    limit: 10,
    search: debouncedSearch,
    product_id: selectedProduct || undefined,
    movement_type: selectedMovementType || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });

  const movements = responseData?.data || [];
  const pagination = responseData?.meta;

  const hasActiveFilters = Boolean(
    debouncedSearch || selectedProduct || selectedMovementType || startDate || endDate
  );

  const clearAllFilters = () => {
    setSearchInput('');
    setSelectedProduct('');
    setSelectedMovementType('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    setSearchParams({});
  };

  const renderMovementTypeBadge = (type) => {
    switch (type) {
      case 'IN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowDownLeft className="w-3 h-3 stroke-[2.2]" />
            Stock In
          </span>
        );
      case 'OUT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <ArrowUpRight className="w-3 h-3 stroke-[2.2]" />
            Stock Out
          </span>
        );
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <SlidersHorizontal className="w-3 h-3 stroke-[2.2]" />
            Adjustment
          </span>
        );
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  // Columns definition
  const columns = [
    {
      key: 'created_at',
      header: 'Date & Time',
      render: (row) => {
        const dateObj = new Date(row.created_at);
        const formattedDate = new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }).format(dateObj);
        const formattedTime = new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).format(dateObj);

        return (
          <div className="tabular-nums">
            <span className="text-slate-900 font-medium block text-xs">{formattedDate}</span>
            <span className="text-[11px] text-slate-400 block">{formattedTime}</span>
          </div>
        );
      }
    },
    {
      key: 'product',
      header: 'Product',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block leading-tight text-xs">
            {row.product?.name || '—'}
          </span>
          <span className="text-[11px] font-mono text-slate-500 mt-0.5 block">
            {row.product?.sku || '—'}
          </span>
        </div>
      )
    },
    {
      key: 'movement_type',
      header: 'Movement Type',
      render: (row) => renderMovementTypeBadge(row.movement_type)
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (row) => {
        const delta = row.new_quantity - row.previous_quantity;
        return (
          <span
            className={`font-semibold text-xs tabular-nums ${
              delta >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {delta > 0 ? `+${row.quantity}` : delta < 0 ? `-${row.quantity}` : `${row.quantity}`} units
          </span>
        );
      }
    },
    {
      key: 'stock_flow',
      header: 'Stock Flow',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs tabular-nums">
          <span className="text-slate-500 font-medium">{row.previous_quantity}</span>
          <span className="text-slate-400">→</span>
          <span className="font-semibold text-slate-900">{row.new_quantity}</span>
        </div>
      )
    },
    {
      key: 'reason',
      header: 'Reason & Reference',
      render: (row) => (
        <div className="max-w-xs">
          <span className="text-xs text-slate-700 block truncate" title={row.reason}>
            {row.reason}
          </span>
          {row.reference_number && (
            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded font-mono text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
              Ref: {row.reference_number}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'creator',
      header: 'User',
      render: (row) => (
        <span className="text-xs text-slate-600 truncate block max-w-[130px]" title={row.creator?.email}>
          {row.creator?.name || row.creator?.email || 'System'}
        </span>
      )
    },
    {
      key: 'action',
      header: 'Action',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedMovementForDetail(row)}
          leftIcon={Eye}
        >
          Details
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & CTA */}
      <PageHeader
        title="Stock Movements"
        subtitle="Complete immutable audit trail of inventory receipts, dispatches, and stock level adjustments."
        actions={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => refetch()}
              disabled={isFetching}
              leftIcon={RefreshCw}
              className={isFetching ? 'animate-pulse' : ''}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={Plus}
              onClick={() => setIsRecordModalOpen(true)}
            >
              Record Movement
            </Button>
          </>
        }
      />

      {/* 2. Comprehensive Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Search
            </label>
            <Input
              placeholder="Search product, SKU, reason, ref..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={Search}
              rightIcon={
                searchInput ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      setCurrentPage(1);
                    }}
                    className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null
              }
            />
          </div>

          {/* Product Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Filter by Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 bg-white border border-slate-200 text-xs text-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600 cursor-pointer"
            >
              <option value="">All Products</option>
              {productsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Movement Type Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Movement Type
            </label>
            <select
              value={selectedMovementType}
              onChange={(e) => {
                setSelectedMovementType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 bg-white border border-slate-200 text-xs text-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600 cursor-pointer"
            >
              <option value="">All Types (IN, OUT, ADJUSTMENT)</option>
              <option value="IN">Stock In (Receipt)</option>
              <option value="OUT">Stock Out (Dispatch)</option>
              <option value="ADJUSTMENT">Adjustment (Count Correction)</option>
            </select>
          </div>

          {/* Date Range Inputs */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 px-2 bg-white border border-slate-200 text-xs text-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600"
                title="Start Date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 px-2 bg-white border border-slate-200 text-xs text-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600"
                title="End Date"
              />
            </div>
          </div>
        </div>

        {/* Clear Filters Indicator */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Active filters applied. Showing filtered movements.
            </span>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Error State Banner */}
      {isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-red-800 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              {error?.response?.data?.message || 'Failed to retrieve stock movement history.'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 3. Table or Empty States */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={8} />
      ) : movements.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={Filter}
            title="No matching stock movements"
            description="No inventory records matched your selected search criteria, type, or date range."
            actionLabel="Reset Filters"
            onAction={clearAllFilters}
          />
        ) : (
          <EmptyState
            icon={Layers}
            title="No stock movements recorded"
            description="Your organization has not recorded any inventory movements yet. Record your first receipt or dispatch to build an audit history."
            actionLabel="Record First Movement"
            actionIcon={Plus}
            onAction={() => setIsRecordModalOpen(true)}
          />
        )
      ) : (
        <DataTable
          columns={columns}
          data={movements}
          pagination={
            pagination
              ? {
                  page: pagination.page,
                  limit: pagination.limit,
                  total: pagination.total,
                  totalPages: pagination.totalPages,
                  onPageChange: (newPage) => setCurrentPage(newPage)
                }
              : null
          }
        />
      )}

      {/* Record Stock Movement Modal */}
      <RecordMovementModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
      />

      {/* View Movement Detail Modal */}
      <MovementDetailModal
        movement={selectedMovementForDetail}
        isOpen={Boolean(selectedMovementForDetail)}
        onClose={() => setSelectedMovementForDetail(null)}
      />
    </div>
  );
};

export default StockMovementsPage;
