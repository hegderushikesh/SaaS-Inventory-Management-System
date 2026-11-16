import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Boxes,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingDown,
  Calendar,
  Building2,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useDashboardSummary } from '../hooks/useDashboard';
import {
  PageHeader,
  MetricCard,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  DataTable,
  MetricCardSkeleton,
  TableSkeleton,
  EmptyState
} from '../components/ui';

import { ProductModal } from '../components/products/ProductModal';
import { AdjustStockModal } from '../components/products/AdjustStockModal';

export const DashboardPage = () => {
  const { user, organization } = useAuth();
  const navigate = useNavigate();

  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useDashboardSummary();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProductForAdjustment, setSelectedProductForAdjustment] = useState(null);

  // Formatted date string
  const todayDateString = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  // Columns for Low Stock Products Table
  const lowStockColumns = [
    {
      key: 'name',
      header: 'Product Name',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.name}</span>
          <span className="text-xs text-slate-400 font-mono tracking-tight">{row.sku}</span>
        </div>
      )
    },
    {
      key: 'sku',
      header: 'SKU',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
          {row.sku}
        </span>
      )
    },
    {
      key: 'quantity_on_hand',
      header: 'Available Quantity',
      render: (row) => (
        <span
          className={`font-semibold ${row.quantity_on_hand === 0
              ? 'text-red-600'
              : 'text-amber-700'
            }`}
        >
          {row.quantity_on_hand} {row.quantity_on_hand === 1 ? 'unit' : 'units'}
        </span>
      )
    },
    {
      key: 'effective_low_stock_threshold',
      header: 'Minimum Threshold',
      render: (row) => (
        <span className="text-slate-600 font-medium">
          {row.effective_low_stock_threshold} units
          {row.low_stock_threshold === null && (
            <span className="text-[11px] text-slate-400 ml-1.5 font-normal">(Org default)</span>
          )}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        if (row.quantity_on_hand === 0) {
          return (
            <Badge variant="danger" dot>
              Out of Stock
            </Badge>
          );
        }
        return (
          <Badge variant="warning" dot>
            Low Stock
          </Badge>
        );
      }
    },
    {
      key: 'action',
      header: 'Action',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedProductForAdjustment(row)}
            leftIcon={SlidersHorizontal}
          >
            Adjust Stock
          </Button>
        </div>
      )
    }
  ];

  return (
          <div className="space-y-7">
            {/* 1. Welcome Section & Quick Actions */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {todayDateString}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5 text-blue-600 font-semibold bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100">
                    <Building2 className="w-3 h-3 text-blue-500" />
                    {organization?.name || 'Workspace'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Welcome back, {user?.name || user?.email?.split('@')[0] || 'Manager'}!
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Real-time inventory levels, stock alerts, and quick adjustments.
                </p>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
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

                <Link to="/products">
                    <Button variant="secondary" size="md" rightIcon={ArrowRight}>
                      View All Products
                    </Button>
                </Link>

                <Button
                  variant="primary"
                  size="md"
                  leftIcon={Plus}
                  onClick={() => setIsAddModalOpen(true)}
                >
                  Add Product
                </Button>
              </div>
            </div>

            {/* Error State Banner */}
            {isError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-red-800 text-xs">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    {error?.response?.data?.message || 'Failed to load dashboard metrics. Please check connection.'}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="border-red-300 text-red-700 hover:bg-red-100">
                  Retry
                </Button>
              </div>
            )}

            {/* 2. Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
              {isLoading ? (
                <>
                  <MetricCardSkeleton />
                  <MetricCardSkeleton />
                  <MetricCardSkeleton />
                </>
              ) : (
                <>
                  <MetricCard
                    title="Total Products"
                    value={summary?.totalProducts ?? 0}
                    subtitle="Registered catalog items"
                    icon={Package}
                    variant="primary"
                  />

                  <MetricCard
                    title="Total Available Stock"
                    value={summary?.totalStock ?? 0}
                    subtitle="Aggregate units on hand"
                    icon={Boxes}
                    variant="default"
                  />

                  <MetricCard
                    title="Low Stock Items"
                    value={summary?.lowStockCount ?? 0}
                    subtitle={
                      (summary?.lowStockCount ?? 0) > 0
                        ? 'Require inventory replenishment'
                        : 'All inventory levels are healthy'
                    }
                    icon={AlertTriangle}
                    variant={(summary?.lowStockCount ?? 0) > 0 ? 'warning' : 'success'}
                    badgeText={
                      (summary?.lowStockCount ?? 0) > 0 ? 'Action Needed' : 'Healthy'
                    }
                    badgeVariant={
                      (summary?.lowStockCount ?? 0) > 0 ? 'warning' : 'success'
                    }
                  />
                </>
              )}
            </div>

            {/* 3. Low Stock Products Table / Section */}
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                      Critical Stock Alerts
                    </h2>
                    {!isLoading && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        {summary?.lowStockCount ?? 0} items
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Products with available units at or below their effective low-stock threshold.
                  </p>
                </div>

                <Link
                  to="/products"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition-colors"
                >
                  Manage entire catalog <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Content handling: Loading, Empty, or Data Table */}
              {isLoading ? (
                <TableSkeleton rows={4} cols={6} />
              ) : summary?.totalProducts === 0 ? (
                /* Empty state: No products created yet */
                <EmptyState
                  icon={Package}
                  title="Your inventory is empty"
                  description="Start by adding your first product to track stock quantities, SKUs, and automatic low-stock alerts."
                  actionLabel="Add First Product"
                  actionIcon={Plus}
                  onAction={() => setIsAddModalOpen(true)}
                />
              ) : summary?.lowStockCount === 0 ? (
                /* Healthy state: Products exist, but none are low stock */
                <Card className="p-8 text-center bg-white">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-3 shadow-2xs">
                    <CheckCircle2 className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    All inventory levels are healthy
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    None of your {summary.totalProducts} products are currently at or below minimum threshold.
                  </p>
                  <div className="mt-4">
                    <Link to="/products">
                      <Button variant="secondary" size="sm" rightIcon={ArrowRight}>
                        View Product Catalog
                      </Button>
                    </Link>
                  </div>
                </Card>
              ) : (
                /* Real Data Table */
                <DataTable
                  columns={lowStockColumns}
                  data={summary?.lowStockProducts || []}
                />
              )}
            </div>

            {/* Quick Add Product Modal */}
            <ProductModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
            />

            {/* Inline Quick Stock Adjustment Modal */}
            <AdjustStockModal
              product={selectedProductForAdjustment}
              isOpen={Boolean(selectedProductForAdjustment)}
              onClose={() => setSelectedProductForAdjustment(null)}
            />
          </div>
  );
};

      export default DashboardPage;
