import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  X,
  SlidersHorizontal,
  Edit,
  Trash2,
  AlertCircle,
  RefreshCw,
  Filter,
  History
} from 'lucide-react';

import { useProducts } from '../hooks/useProducts';
import { useSettings } from '../hooks/useSettings';
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

import { ProductModal } from '../components/products/ProductModal';
import { AdjustStockModal } from '../components/products/AdjustStockModal';
import { DeleteProductModal } from '../components/products/DeleteProductModal';

export const ProductsPage = () => {
  // Search, pagination & sorting state
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 350);
  const [currentPage, setCurrentPage] = useState(1);
  const [sorting, setSorting] = useState({ sortBy: 'created_at', sortOrder: 'DESC' });

  // Organization settings for default low-stock threshold
  const { data: settings } = useSettings();
  const defaultThreshold = settings?.default_low_stock_threshold ?? 5;

  // Products query
  const {
    data: responseData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useProducts({
    page: currentPage,
    limit: 10,
    search: debouncedSearch,
    sortBy: sorting.sortBy,
    sortOrder: sorting.sortOrder
  });

  const products = responseData?.data || [];
  const pagination = responseData?.meta;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [productForStock, setProductForStock] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  // Helper to calculate effective threshold and status badge
  const renderStockStatus = (row) => {
    const effectiveThreshold =
      row.low_stock_threshold !== null && row.low_stock_threshold !== undefined
        ? row.low_stock_threshold
        : defaultThreshold;

    if (row.quantity_on_hand === 0) {
      return (
        <Badge variant="danger" dot>
          Out of Stock
        </Badge>
      );
    }

    if (row.quantity_on_hand <= effectiveThreshold) {
      return (
        <Badge variant="warning" dot>
          Low Stock
        </Badge>
      );
    }

    return (
      <Badge variant="success" dot>
        In Stock
      </Badge>
    );
  };

  // Columns definition
  const columns = [
    {
      key: 'name',
      header: 'Product Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block leading-tight">
            {row.name}
          </span>
          {row.description ? (
            <span className="text-xs text-slate-500 line-clamp-1 mt-0.5 max-w-xs">
              {row.description}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
              {row.sku}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'sku',
      header: 'SKU',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/70">
          {row.sku}
        </span>
      )
    },
    {
      key: 'quantity_on_hand',
      header: 'Available Quantity',
      sortable: true,
      render: (row) => {
        const effectiveThreshold =
          row.low_stock_threshold !== null && row.low_stock_threshold !== undefined
            ? row.low_stock_threshold
            : defaultThreshold;

        return (
          <div>
            <span
              className={`font-semibold text-sm ${row.quantity_on_hand === 0
                  ? 'text-red-600'
                  : row.quantity_on_hand <= effectiveThreshold
                    ? 'text-amber-700'
                    : 'text-slate-800'
                }`}
            >
              {row.quantity_on_hand} {row.quantity_on_hand === 1 ? 'unit' : 'units'}
            </span>
            <span className="text-[11px] text-slate-400 block">
              Min: {effectiveThreshold}
            </span>
          </div>
        );
      }
    },
    {
      key: 'cost_price',
      header: 'Cost Price',
      sortable: true,
      render: (row) => (
        <span className="text-slate-600 text-sm">
          {row.cost_price !== null && row.cost_price !== undefined
            ? `$${parseFloat(row.cost_price).toFixed(2)}`
            : '—'}
        </span>
      )
    },
    {
      key: 'selling_price',
      header: 'Selling Price',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-slate-900 text-sm">
          {row.selling_price !== null && row.selling_price !== undefined
            ? `$${parseFloat(row.selling_price).toFixed(2)}`
            : '—'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Stock Status',
      render: (row) => renderStockStatus(row)
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setProductForStock(row)}
            title="Adjust stock quantity"
            leftIcon={SlidersHorizontal}
          >
            Adjust
          </Button>

          <Link
            to={`/stock-movements?product_id=${row.id}`}
            className="p-1.5 h-8 w-8 inline-flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View stock movement history"
          >
            <History className="w-4 h-4" />
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setProductToEdit(row)}
            className="p-1.5 h-8 w-8 text-slate-500 hover:text-slate-900"
            title="Edit product"
          >
            <Edit className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setProductToDelete(row)}
            className="p-1.5 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Delete product"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & Add Product CTA */}
      <PageHeader
        title="Products"
        subtitle="Manage your product catalog, monitor real-time stock levels, and update inventory."
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
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Product
            </Button>
          </>
        }
      />

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search by product name or SKU..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setCurrentPage(1); // Reset page on query change
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
                  className="pointer-events-auto p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null
            }
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Sort by:</span>
          <select
            value={`${sorting.sortBy}:${sorting.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split(':');
              setSorting({ sortBy, sortOrder });
            }}
            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-blue-600 cursor-pointer"
          >
            <option value="created_at:DESC">Date Added (Newest)</option>
            <option value="created_at:ASC">Date Added (Oldest)</option>
            <option value="name:ASC">Product Name (A-Z)</option>
            <option value="name:DESC">Product Name (Z-A)</option>
            <option value="quantity_on_hand:ASC">Stock Level (Lowest First)</option>
            <option value="quantity_on_hand:DESC">Stock Level (Highest First)</option>
            <option value="selling_price:DESC">Price (High to Low)</option>
            <option value="selling_price:ASC">Price (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-red-800 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              {error?.response?.data?.message || 'Failed to retrieve products catalog. Please check connection.'}
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

      {/* 3. Product Table / Empty States */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : products.length === 0 ? (
        debouncedSearch ? (
          <EmptyState
            icon={Search}
            title={`No products matching "${debouncedSearch}"`}
            description="Try searching with a different product name or SKU keyword."
            actionLabel="Clear Search"
            onAction={() => {
              setSearchInput('');
              setCurrentPage(1);
            }}
          />
        ) : (
          <EmptyState
            icon={Package}
            title="No products in your catalog"
            description="Your organization has not added any products yet. Register your first item to begin tracking inventory."
            actionLabel="Add Your First Product"
            actionIcon={Plus}
            onAction={() => setIsAddModalOpen(true)}
          />
        )
      ) : (
        <DataTable
          columns={columns}
          data={products}
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
          sorting={{
            sortBy: sorting.sortBy,
            sortOrder: sorting.sortOrder,
            onSortChange: (col, ord) => setSorting({ sortBy: col, sortOrder: ord })
          }}
        />
      )}

      {/* Create Product Modal */}
      <ProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Product Modal */}
      <ProductModal
        product={productToEdit}
        isOpen={Boolean(productToEdit)}
        onClose={() => setProductToEdit(null)}
      />

      {/* Adjust Stock Modal */}
      <AdjustStockModal
        product={productForStock}
        isOpen={Boolean(productForStock)}
        onClose={() => setProductForStock(null)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteProductModal
        product={productToDelete}
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
      />
    </div>
  );
};

export default ProductsPage;
