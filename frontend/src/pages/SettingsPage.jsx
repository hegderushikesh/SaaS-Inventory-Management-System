import React from 'react';
import { PageHeader, Card, CardHeader, CardTitle, CardContent } from '../components/ui';

export const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage organization defaults and low-stock threshold configuration"
      />
      <Card>
        <CardHeader>
          <CardTitle>Organization Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Default low-stock threshold settings will be configured here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
