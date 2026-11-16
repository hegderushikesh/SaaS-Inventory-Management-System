import React from 'react';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  ShoppingBag,
  ExternalLink,
  Plus
} from 'lucide-react';

import { Modal, Button, Badge } from '../ui';

export const SupplierDetailModal = ({
  supplier,
  isOpen,
  onClose,
  onCreatePo
}) => {
  if (!supplier) return null;

  const formattedCreated = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(supplier.created_at));

  const purchaseOrders = supplier.purchase_orders || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplier.supplier_name}
      description={supplier.company_name || 'Vendor Profile & Procurement History'}
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-between w-full">
          {onCreatePo && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={Plus}
              onClick={() => {
                onClose();
                onCreatePo(supplier);
              }}
            >
              Create Purchase Order
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose} className="ml-auto">
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Contact Overview Card */}
        <div className="p-4 bg-slate-50/90 border border-slate-200/80 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Contact Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Email */}
            <div className="p-2.5 bg-white rounded-lg border border-slate-200/70">
              <span className="text-[11px] text-slate-400 block mb-0.5">Email</span>
              {supplier.email ? (
                <a
                  href={`mailto:${supplier.email}`}
                  className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{supplier.email}</span>
                </a>
              ) : (
                <span className="text-slate-400">Not provided</span>
              )}
            </div>

            {/* Phone */}
            <div className="p-2.5 bg-white rounded-lg border border-slate-200/70">
              <span className="text-[11px] text-slate-400 block mb-0.5">Phone</span>
              {supplier.phone ? (
                <a
                  href={`tel:${supplier.phone}`}
                  className="font-medium text-slate-800 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{supplier.phone}</span>
                </a>
              ) : (
                <span className="text-slate-400">Not provided</span>
              )}
            </div>
          </div>

          {/* Address */}
          {supplier.address && (
            <div className="p-2.5 bg-white rounded-lg border border-slate-200/70 text-xs flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Physical Address</span>
                <span className="text-slate-800 font-medium leading-relaxed">{supplier.address}</span>
              </div>
            </div>
          )}
        </div>

        {/* Vendor Notes & Terms */}
        {supplier.notes && (
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Notes & Terms</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium pl-5">
              {supplier.notes}
            </p>
          </div>
        )}

        {/* Purchase Orders Activity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
              <span>Linked Purchase Orders</span>
            </div>
            <span className="text-slate-400 text-[11px]">
              {purchaseOrders.length} order(s) found
            </span>
          </div>

          {purchaseOrders.length === 0 ? (
            <div className="p-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400">
              No purchase orders issued to this supplier yet.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {purchaseOrders.map((po) => (
                <div
                  key={po.id}
                  className="p-2.5 bg-white border border-slate-200/80 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-mono font-semibold text-slate-900 block">
                      {po.po_number}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {po.order_date}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        po.status === 'RECEIVED'
                          ? 'success'
                          : po.status === 'ORDERED'
                          ? 'primary'
                          : 'default'
                      }
                    >
                      {po.status}
                    </Badge>
                    <span className="font-semibold font-mono text-slate-900 tabular-nums">
                      ${parseFloat(po.total_amount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Supplier ID: {supplier.id}</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Registered on {formattedCreated}
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default SupplierDetailModal;
