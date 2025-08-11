'use client';

import { Layout } from '@/components/layout/Layout';
import { AIAgentsManagement } from '@/components/agents/AIAgentsManagement';

export default function AIAgentsPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage and monitor AI agents for proactive outreach, risk analysis, and patient engagement
          </p>
        </div>
        
        <AIAgentsManagement />
      </div>
    </Layout>
  );
} 