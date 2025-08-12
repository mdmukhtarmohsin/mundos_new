'use client';

import { useState, useEffect } from 'react';
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
  Activity,
  CheckCircle,
  XCircle,
  Play,
  Search,
  Shield
} from 'lucide-react';
import { DashboardOverview as DashboardOverviewType } from '@/types';
import { apiService } from '@/lib/api';

interface DashboardOverviewProps {
  data: DashboardOverviewType;
}

interface ActionResult {
  type: 'outreach' | 'risk' | 'scan';
  success: boolean;
  message: string;
  results?: any;
  timestamp: string;
}

export function DashboardOverview({ data }: DashboardOverviewProps) {
  const [recentActions, setRecentActions] = useState<ActionResult[]>([]);
  const [agentStatus, setAgentStatus] = useState<any>(null);

  useEffect(() => {
    fetchRecentData();
    
    // Listen for AI action completion events
    const handleAIActionCompleted = () => {
      fetchRecentData();
    };
    
    window.addEventListener('ai-action-completed', handleAIActionCompleted);
    
    return () => {
      window.removeEventListener('ai-action-completed', handleAIActionCompleted);
    };
  }, []);

  const fetchRecentData = async () => {
    try {
      const [status] = await Promise.all([
        apiService.getAgentStatus(),
      ]);
      setAgentStatus(status);
    } catch (error) {
      console.error('Failed to fetch recent data:', error);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'outreach': return Play;
      case 'risk': return AlertTriangle;
      case 'scan': return Search;
      default: return Activity;
    }
  };

  const getActionTitle = (type: string) => {
    switch (type) {
      case 'outreach': return 'Proactive Outreach';
      case 'risk': return 'Risk Analysis';
      case 'scan': return 'Lead Scanning';
      default: return 'AI Action';
    }
  };

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
      title: 'System Health',
      value: data.system_health.status,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      subtitle: `System status`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
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

      {/* AI Activity Section */}
      {agentStatus && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent AI Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Recent AI Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {agentStatus.recent_activity && agentStatus.recent_activity.length > 0 ? (
                  agentStatus.recent_activity.slice(0, 3).map((activity: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900 text-sm">
                          {activity.event_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(activity.created_at)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{activity.details}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No recent AI activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                AI System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">System Health</span>
                  <Badge className={agentStatus.system_health.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {agentStatus.system_health.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">AI Interactions</span>
                  <span className="font-medium">{agentStatus.system_health.ai_interactions}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Leads</span>
                  <span className="font-medium">{agentStatus.risk_analysis.total_active_leads}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">High Risk Leads</span>
                  <span className="font-medium text-red-600">{agentStatus.risk_analysis.high_risk_count}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Events</span>
                  <span className="font-medium">{agentStatus.system_health.total_events}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Error Events</span>
                  <span className="font-medium text-red-600">{agentStatus.system_health.error_events}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 