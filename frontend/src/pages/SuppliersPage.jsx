import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  X,
  Mail,
  Phone,
  Building2,
  MapPin,
  FileText,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle,
  ShoppingBag
} from 'lucide-react';

import { useSuppliers } from '../hooks/useSuppliers';
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

import { SupplierModal } from '../components/suppliers/SupplierModal';
import { SupplierDetailModal } from '../components/suppliers/SupplierDetailModal';
import { DeleteSupplierModal } from '../components/suppliers/DeleteSupplierModal';
import { CreatePurchaseOrderModal } from '../components/purchase-orders/CreatePurchaseOrderModal';

export const SuppliersPage = () => {
  // Search, pagination & sorting
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 350);
  const [currentPage, setCurrentPage] = useState(1);
  const [sorting, setSorting] = useState({ sortBy: 'created_at', sortOrder: 'DESC' });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState(null);
  const [supplierForDetail, setSupplierForDetail] = useState(null);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [supplierForPo, setSupplierForPo] = useState(null);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);

  // Suppliers query
  const {
    data: responseData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useSuppliers({
    page: currentPage,
    limit: 10,
    search: debouncedSearch,
    sortBy: sorting.sortBy,
    sortOrder: sorting.sortOrder
  });

  const suppliers = responseData?.data || [];
  const pagination = responseData?.meta;

  const handleOpenCreatePo = (supplier = null) => {
    setSupplierForPo(supplier);
    setIsPoModalOpen(true);
  };

  // Table columns definition
  const columns = [
    {
      key: 'supplier_name',
      header: 'Supplier & Company',
      sortable: true,
      render: (row) => (
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 block leading-tight text-xs">
              {row.supplier_name}
            </span>
            {row.company_name ? (
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {row.company_name}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 block mt-0.5 italic">
                Independent Supplier
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'contact_info',
      header: 'Contact Information',
      render: (row) => (
        <div className="space-y-1 text-xs">
          {row.email ? (
            <a
              href={`mailto:${row.email}`}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors truncate max-w-[200px]"
              title={row.email}
            >
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{row.email}</span>
            </a>
          ) : null}

          {row.phone ? (
            <a
              href={`tel:${row.phone}`}
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
              title={row.phone}
            >
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{row.phone}</span>
            </a>
          ) : null}

          {!row.email && !row.phone && (
            <span className="text-slate-400 text-xs italic">No contact info</span>
          )}
        </div>
      )
    },
    {
      key: 'address',
      header: 'Address',
      render: (row) => (
        <div className="max-w-xs">
          {row.address ? (
            <span className="text-xs text-slate-600 line-clamp-1" title={row.address}>
              {row.address}
            </span>
          ) : (
            <span className="text-slate-400 text-xs">—</span>
          )}
        </div>
      )
    },
    {
      key: 'notes',
      header: 'Notes & Terms',
      render: (row) => (
        <div className="max-w-xs">
          {row.notes ? (
            <span className="text-xs text-slate-500 line-clamp-1" title={row.notes}>
              {row.notes}
            </span>
          ) : (
            <span className="text-slate-400 text-xs">—</span>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Date Added',
      sortable: true,
      render: (row) => {
        const formattedDate = new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }).format(new Date(row.created_at));

        return (
          <span className="text-xs text-slate-500 tabular-nums">
            {formattedDate}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenCreatePo(row)}
            title="Create purchase order for this supplier"
            leftIcon={ShoppingBag}
          >
            PO
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSupplierForDetail(row)}
            className="p-1.5 h-8 w-8 text-slate-500 hover:text-slate-900"
            title="View supplier details"
          >
            <Eye className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSupplierToEdit(row)}
            className="p-1.5 h-8 w-8 text-slate-500 hover:text-slate-900"
            title="Edit supplier"
          >
            <Edit className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSupplierToDelete(row)}
            className="p-1.5 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Delete supplier"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Suppliers"
        subtitle="Manage your vendor contacts, procurement directory, and purchase order fulfillment."
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
              variant="secondary"
              size="md"
              leftIcon={ShoppingBag}
              onClick={() => handleOpenCreatePo(null)}
            >
              Create Purchase Order
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={Plus}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Supplier
            </Button>
          </>
        }
      />

      {/* 2. Search & Sort Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search suppliers by name, company, email, or phone..."
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
                  className="p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
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
            <option value="supplier_name:ASC">Supplier Name (A-Z)</option>
            <option value="supplier_name:DESC">Supplier Name (Z-A)</option>
            <option value="company_name:ASC">Company Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-red-800 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              {error?.response?.data?.message || 'Failed to retrieve suppliers directory.'}
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
        <TableSkeleton rows={6} cols={6} />
      ) : suppliers.length === 0 ? (
        debouncedSearch ? (
          <EmptyState
            icon={Search}
            title={`No suppliers matching "${debouncedSearch}"`}
            description="Try searching with a different contact name, company name, or email keyword."
            actionLabel="Clear Search"
            onAction={() => {
              setSearchInput('');
              setCurrentPage(1);
            }}
          />
        ) : (
          <EmptyState
            icon={Truck}
            title="No suppliers in your directory"
            description="Your organization has not registered any vendors yet. Add your first supplier to streamline purchase ordering."
            actionLabel="Add Your First Supplier"
            actionIcon={Plus}
            onAction={() => setIsAddModalOpen(true)}
          />
        )
      ) : (
        <DataTable
          columns={columns}
          data={suppliers}
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

      {/* Add Supplier Modal */}
      <SupplierModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Supplier Modal */}
      <SupplierModal
        supplier={supplierToEdit}
        isOpen={Boolean(supplierToEdit)}
        onClose={() => setSupplierToEdit(null)}
      />

      {/* View Supplier Details Modal */}
      <SupplierDetailModal
        supplier={supplierForDetail}
        isOpen={Boolean(supplierForDetail)}
        onClose={() => setSupplierForDetail(null)}
        onCreatePo={(supp) => handleOpenCreatePo(supp)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteSupplierModal
        supplier={supplierToDelete}
        isOpen={Boolean(supplierToDelete)}
        onClose={() => setSupplierToDelete(null)}
      />

      {/* Create Purchase Order Modal with Supplier Selection */}
      <CreatePurchaseOrderModal
        preselectedSupplier={supplierForPo}
        isOpen={isPoModalOpen}
        onClose={() => {
          setIsPoModalOpen(false);
          setSupplierForPo(null);
        }}
      />
    </div>
  );
};

export default SuppliersPage;
