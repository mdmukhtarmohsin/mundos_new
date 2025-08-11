'use client';

import { Layout } from '@/components/layout/Layout';
import { LeadManagement } from '@/components/leads/LeadManagement';

export default function LeadsPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage and track all patient leads with AI-powered insights and automation
          </p>
        </div>
        
        <LeadManagement />
      </div>
    </Layout>
  );
} 