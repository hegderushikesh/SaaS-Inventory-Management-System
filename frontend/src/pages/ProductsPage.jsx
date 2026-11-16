import React from 'react';
import { PageHeader, Card, CardHeader, CardTitle, CardContent } from '../components/ui';

export const ProductsPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Inventory"
        subtitle="Manage product catalog, SKUs, and stock quantities"
      />
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Products list and inventory controls will be displayed here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductsPage;
