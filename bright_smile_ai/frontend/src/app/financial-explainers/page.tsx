'use client';

import { Layout } from '@/components/layout/Layout';
import { FinancialExplainers } from '@/components/financial/FinancialExplainers';

export default function FinancialExplainersPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-3xl font-bold text-gray-900">Financial Explainers</h1>
          <p className="mt-2 text-sm text-gray-600">
            Generate and manage personalized financial treatment plans for patient leads
          </p>
        </div>
        
        <FinancialExplainers />
      </div>
    </Layout>
  );
} 