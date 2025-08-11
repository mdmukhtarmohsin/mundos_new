'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  Bot,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { DashboardOverview as DashboardOverviewType } from '@/types';

interface DashboardOverviewProps {
  data: DashboardOverviewType;
}

export function DashboardOverview({ data }: DashboardOverviewProps) {
  const metrics = [
    {
      title: 'Total Leads',
      value: data.lead_metrics.total_leads,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      subtitle: `Total leads in system`,
    },
    {
      title: 'Active Leads',
      value: data.lead_metrics.active_leads,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      subtitle: `Currently engaged leads`,
    },
    {
      title: 'Converted',
      value: data.lead_metrics.converted_leads,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      subtitle: `Successfully converted`,
    },
    {
      title: 'Conversion Rate',
      value: `${data.lead_metrics.conversion_rate}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      subtitle: `Overall conversion rate`,
    },
    {
      title: 'AI Response Rate',
      value: `${data.engagement_metrics.response_rate}%`,
      icon: Bot,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      subtitle: `AI response success rate`,
    },
    {
      title: 'Financial Explainers',
      value: data.asset_metrics.financial_explainers_created,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      subtitle: `Total explainers created`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric) => (
        <Card key={metric.title} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {metric.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${metric.bgColor}`}>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
            <div className="text-xs text-gray-500 mt-1">{metric.subtitle}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 