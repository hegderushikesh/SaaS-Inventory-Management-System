import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  Calendar,
  User,
  Package,
  FileText,
  Hash,
  Layers
} from 'lucide-react';

import { Modal, Button, Badge } from '../ui';

export const MovementDetailModal = ({ movement, isOpen, onClose }) => {
  if (!movement) return null;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium'
  }).format(new Date(movement.created_at));

  const renderTypeBadge = (type) => {
    switch (type) {
      case 'IN':
        return (
          <Badge variant="success" dot>
            Stock In (Receipt)
          </Badge>
        );
      case 'OUT':
        return (
          <Badge variant="danger" dot>
            Stock Out (Dispatch)
          </Badge>
        );
      case 'ADJUSTMENT':
        return (
          <Badge variant="warning" dot>
            Adjustment (Audit)
          </Badge>
        );
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  const delta = movement.new_quantity - movement.previous_quantity;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Movement Record"
      description={`Audit log reference: ${movement.id}`}
      maxWidth="max-w-lg"
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Main Status & Transition Header */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Movement Type
            </span>
            <div>{renderTypeBadge(movement.movement_type)}</div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Quantity Changed
            </span>
            <span
              className={`text-lg font-bold font-mono tabular-nums ${
                delta >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {delta > 0 ? `+${movement.quantity}` : `-${movement.quantity}`} units
            </span>
          </div>
        </div>

        {/* Product Details */}
        <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Package className="w-4 h-4 text-blue-600" />
            <span>Product Information</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <span className="text-slate-400 block text-[11px]">Product Name</span>
              <span className="font-semibold text-slate-900 block mt-0.5">
                {movement.product?.name || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">SKU Code</span>
              <span className="font-mono text-slate-700 font-medium block mt-0.5">
                {movement.product?.sku || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Stock Transition Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl">
            <span className="text-[11px] font-medium text-slate-400 block">
              Previous Available Stock
            </span>
            <span className="text-base font-bold text-slate-800 font-mono tabular-nums mt-0.5 block">
              {movement.previous_quantity} units
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl">
            <span className="text-[11px] font-medium text-slate-400 block">
              New Available Stock
            </span>
            <span className="text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5 block">
              {movement.new_quantity} units
            </span>
          </div>
        </div>

        {/* Reason & Reference */}
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Reason for Movement</span>
            </div>
            <p className="font-medium text-slate-800 text-xs leading-relaxed">
              {movement.reason || 'No description provided'}
            </p>
          </div>

          {movement.reference_number && (
            <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>Reference Number</span>
              </div>
              <span className="font-mono font-semibold text-slate-700 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                {movement.reference_number}
              </span>
            </div>
          )}
        </div>

        {/* Audit Meta: User and Timestamp */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Recorded by:{' '}
              <strong className="text-slate-700 font-semibold">
                {movement.creator?.name || movement.creator?.email || 'System'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="tabular-nums">{formattedDate}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MovementDetailModal;
