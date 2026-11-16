import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sliders, Building2, Save, RefreshCw, AlertCircle, Info } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useSettings, useUpdateSettings } from '../hooks/useSettings';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Badge,
  Skeleton
} from '../components/ui';

const settingsSchema = z.object({
  default_low_stock_threshold: z.coerce
    .number({ invalid_type_error: 'Threshold must be a valid number' })
    .int('Threshold must be a whole integer')
    .min(0, 'Threshold cannot be negative (must be 0 or greater)')
});

export const SettingsPage = () => {
  const { user, organization } = useAuth();
  const { data: settings, isLoading, isError, error, isFetching, refetch } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      default_low_stock_threshold: 5
    }
  });

  useEffect(() => {
    if (settings) {
      reset({
        default_low_stock_threshold: settings.default_low_stock_threshold ?? 5
      });
    }
  }, [settings, reset]);

  const onSubmit = (data) => {
    updateSettingsMutation.mutate({
      default_low_stock_threshold: data.default_low_stock_threshold
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings"
        subtitle="Manage your organization inventory preferences and alert thresholds."
        actions={
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
        }
      />

      {/* Error State Banner */}
      {isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-red-800 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              {error?.response?.data?.message || 'Failed to load organization settings. Please check connection.'}
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

      {/* SECTION: Inventory Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Inventory Settings</CardTitle>
              <CardDescription>
                Configure automated stock thresholds and inventory health rules.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {isLoading ? (
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-full max-w-md rounded-lg" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="max-w-md">
                <Input
                  label="Default Low Stock Threshold"
                  type="number"
                  min="0"
                  required
                  error={errors.default_low_stock_threshold?.message}
                  helperText="This value determines when a product is considered low stock if it does not have an individual threshold."
                  {...register('default_low_stock_threshold')}
                />
              </div>

              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/70 flex items-start gap-3 text-xs text-slate-600">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-slate-800 block">
                    Threshold Hierarchy & Dashboard Recalculation
                  </span>
                  <p>
                    When an item has no individual threshold assigned, StockFlow falls back to this default.
                    If its available quantity is <strong>less than or equal to</strong> this number, it appears in your Critical Stock Alerts and increases the Low Stock count on your dashboard.
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <div className="text-xs text-slate-400">
                {isDirty ? 'Unsaved modifications pending' : 'All settings up to date'}
              </div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={updateSettingsMutation.isPending}
                disabled={!isDirty || updateSettingsMutation.isPending}
                leftIcon={Save}
              >
                Save Settings
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>

      {/* Organization Multi-Tenant Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Organization Workspace</CardTitle>
              <CardDescription>
                Multi-tenant logical isolation and tenant identification.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <span className="text-xs text-slate-400 font-medium block">Organization Name</span>
              <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                {organization?.name || 'Workspace'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <span className="text-xs text-slate-400 font-medium block">Organization ID (UUID)</span>
              <span className="font-mono text-xs text-slate-700 mt-0.5 block truncate">
                {organization?.id || '—'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <span className="text-xs text-slate-400 font-medium block">Active Administrator</span>
              <span className="font-medium text-slate-800 text-sm mt-0.5 block">
                {user?.name ? `${user.name} (${user.email})` : user?.email}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
              <span className="text-xs text-slate-400 font-medium block">Security Status</span>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="success" dot>
                  Row-Level Logical Isolation Active
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
