import React, { useState } from 'react';
import {
  Package,
  Boxes,
  AlertTriangle,
  DollarSign,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Edit,
  ExternalLink
} from 'lucide-react';

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  MetricCard,
  Badge,
  Input,
  Select,
  Textarea,
  Modal,
  TableSkeleton,
  EmptyState,
  PageHeader,
  DataTable
} from './components/ui';

import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sorting, setSorting] = useState({ sortBy: 'created_at', sortOrder: 'DESC' });

  const mockUser = {
    name: 'Jane Doe',
    email: 'jane@acmeelectronics.com'
  };

  const mockOrg = {
    name: 'Acme Electronics'
  };

  const mockProducts = [
    {
      id: '1',
      name: 'MacBook Pro 16" M3 Max',
      sku: 'MBP16-M3',
      quantity_on_hand: 24,
      cost_price: 2199.00,
      selling_price: 2499.00,
      status: 'in_stock',
      low_stock_threshold: 5
    },
    {
      id: '2',
      name: 'Dell UltraSharp 27" 4K Monitor',
      sku: 'MON-U2723QE',
      quantity_on_hand: 3,
      cost_price: 450.00,
      selling_price: 579.99,
      status: 'low_stock',
      low_stock_threshold: 5
    },
    {
      id: '3',
      name: 'Logitech MX Master 3S Wireless Mouse',
      sku: 'MS-MXM3S',
      quantity_on_hand: 48,
      cost_price: 65.00,
      selling_price: 99.99,
      status: 'in_stock',
      low_stock_threshold: 10
    },
    {
      id: '4',
      name: 'Keychron Q1 Pro Mechanical Keyboard',
      sku: 'KB-Q1PRO',
      quantity_on_hand: 0,
      cost_price: 130.00,
      selling_price: 199.00,
      status: 'out_of_stock',
      low_stock_threshold: 4
    }
  ];

  const tableColumns = [
    {
      key: 'name',
      header: 'Product Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-medium text-slate-900 block">{row.name}</span>
          <span className="text-xs text-slate-400 font-mono">{row.sku}</span>
        </div>
      )
    },
    {
      key: 'quantity_on_hand',
      header: 'Stock Level',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-slate-800">
          {row.quantity_on_hand} units
        </span>
      )
    },
    {
      key: 'selling_price',
      header: 'Price',
      sortable: true,
      render: (row) => (
        <span className="text-slate-700">
          ${parseFloat(row.selling_price).toFixed(2)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        if (row.quantity_on_hand === 0) {
          return <Badge variant="danger" dot>Out of Stock</Badge>;
        }
        if (row.quantity_on_hand <= row.low_stock_threshold) {
          return <Badge variant="warning" dot>Low Stock</Badge>;
        }
        return <Badge variant="success" dot>In Stock</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="sm" className="p-1.5 h-8 w-8 text-slate-500">
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="p-1.5 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        user={mockUser}
        organization={mockOrg}
        onLogout={() => alert('Logout clicked')}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          organization={mockOrg}
          user={mockUser}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Page Header */}
          <PageHeader
            title="Design System & UI Component Library"
            subtitle="StockFlow SaaS modern, minimal, light-themed component architecture"
            actions={
              <>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setShowSkeleton(!showSkeleton)}
                >
                  {showSkeleton ? 'Show Real UI' : 'Toggle Skeleton State'}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={Plus}
                  onClick={() => setModalOpen(true)}
                >
                  Open Preview Modal
                </Button>
              </>
            }
          />

          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Products"
              value="128"
              subtitle="Active inventory SKUs"
              icon={Package}
              variant="primary"
            />
            <MetricCard
              title="Total Units in Stock"
              value="2,450"
              subtitle="Across all catalog items"
              icon={Boxes}
              variant="default"
            />
            <MetricCard
              title="Low Stock Alert"
              value="4"
              subtitle="Items need restock"
              icon={AlertTriangle}
              variant="warning"
              badgeText="Action required"
              badgeVariant="warning"
            />
            <MetricCard
              title="Inventory Valuation"
              value="$48,290"
              subtitle="Retail value on hand"
              icon={DollarSign}
              variant="success"
            />
          </div>

          {/* Data Table Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                  Inventory Catalog Table
                </h2>
                <p className="text-xs text-slate-500">
                  Reusable DataTable with live sorting, status badges, and pagination.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-64">
                  <Input
                    placeholder="Search by product or SKU..."
                    leftIcon={Search}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </div>
                <Button variant="secondary" size="md" leftIcon={Filter}>
                  Filter
                </Button>
              </div>
            </div>

            <DataTable
              columns={tableColumns}
              data={mockProducts}
              isLoading={showSkeleton}
              pagination={{
                page: currentPage,
                limit: 10,
                total: 4,
                totalPages: 1,
                onPageChange: (newPage) => setCurrentPage(newPage)
              }}
              sorting={{
                sortBy: sorting.sortBy,
                sortOrder: sorting.sortOrder,
                onSortChange: (col, ord) => setSorting({ sortBy: col, sortOrder: ord })
              }}
            />
          </div>

          {/* Buttons & Badges Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Button System</CardTitle>
                  <CardDescription>Primary, secondary, outline, ghost, danger, and loading states</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                </div>
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
                  <Button variant="primary" size="sm">Small</Button>
                  <Button variant="primary" size="md">Medium</Button>
                  <Button variant="primary" size="lg">Large</Button>
                  <Button variant="primary" isLoading>Loading State</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Badge System</CardTitle>
                  <CardDescription>Status indicators for inventory health and lifecycle</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Badge variant="success" dot>In Stock (Healthy)</Badge>
                  <Badge variant="warning" dot>Low Stock (Threshold hit)</Badge>
                  <Badge variant="danger" dot>Out of Stock (Depleted)</Badge>
                  <Badge variant="primary">Enterprise</Badge>
                  <Badge variant="default">Draft</Badge>
                </div>
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                  Strictly follows the modern Stripe / Linear color hierarchy.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Inputs Showcase */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Form Elements</CardTitle>
                <CardDescription>Accessible inputs, dropdown selects, and textareas with validation error states</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Product Name"
                  placeholder="e.g. Wireless Ergonomic Mouse"
                  required
                  helperText="Unique name displayed on invoice"
                />
                <Input
                  label="Product SKU"
                  placeholder="e.g. MS-W-01"
                  required
                  error="SKU must be unique within your organization"
                />
                <Select
                  label="Category"
                  options={[
                    { value: 'electronics', label: 'Electronics & Gadgets' },
                    { value: 'accessories', label: 'Computer Accessories' },
                    { value: 'office', label: 'Office Supplies' }
                  ]}
                  helperText="Inventory grouping"
                />
                <div className="sm:col-span-3">
                  <Textarea
                    label="Description"
                    placeholder="Brief product description or warehouse notes..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Empty State Showcase */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Empty State Pattern</CardTitle>
                <CardDescription>Presented when filters return 0 results or inventory is fresh</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <EmptyState
                title="No low-stock items detected"
                description="All your inventory is currently above the configured low-stock thresholds. Great job maintaining healthy stock levels!"
                actionLabel="Add New Product"
                onAction={() => setModalOpen(true)}
                actionIcon={Plus}
              />
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Reusable Modal Dialog */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Inventory Product"
        description="Enter the item details to register it into your organization's catalog."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                alert('Product saved!');
                setModalOpen(false);
              }}
            >
              Save Product
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Product Name" placeholder="e.g. Ergonomic Office Chair" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="SKU" placeholder="e.g. CH-ERG-01" required />
            <Input label="Initial Quantity" type="number" defaultValue="25" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cost Price ($)" type="number" step="0.01" placeholder="0.00" />
            <Input label="Selling Price ($)" type="number" step="0.01" placeholder="0.00" />
          </div>
          <Input
            label="Low Stock Threshold"
            type="number"
            placeholder="Defaults to org setting (5)"
            helperText="Leave empty to use organization default threshold"
          />
        </div>
      </Modal>
    </div>
  );
}
