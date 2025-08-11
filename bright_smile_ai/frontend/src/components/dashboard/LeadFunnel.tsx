'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  DollarSign,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { apiService } from '@/lib/api';
import { LeadFunnel as LeadFunnelType, Lead } from '@/types';

interface LeadFunnelProps {
  className?: string;
}

export function LeadFunnel({ className }: LeadFunnelProps) {
  const [funnelData, setFunnelData] = useState<LeadFunnelType | null>(null);
  const [recentActivity, setRecentActivity] = useState<{
    id: number;
    event_type: string;
    details: string;
    created_at: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFunnelData();
  }, []);

  const fetchFunnelData = async () => {
    try {
      setLoading(true);
      const [funnel, activity] = await Promise.all([
        apiService.getLeadFunnel(),
        apiService.getRecentActivity(),
      ]);
      setFunnelData(funnel);
      setRecentActivity(activity.events || []);
    } catch (error) {
      console.error('Failed to fetch funnel data:', error);
      setFunnelData(null);
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-500',
      active: 'bg-green-500',
      at_risk: 'bg-yellow-500',
      cold: 'bg-gray-500',
      human_handoff: 'bg-purple-500',
      converted: 'bg-emerald-500',
      do_not_contact: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'New Leads',
      active: 'Active',
      at_risk: 'At Risk',
      cold: 'Cold',
      human_handoff: 'Human Handoff',
      converted: 'Converted',
      do_not_contact: 'Do Not Contact',
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      new: Users,
      active: TrendingUp,
      at_risk: Target,
      cold: Clock,
      human_handoff: MessageSquare,
      converted: DollarSign,
      do_not_contact: Clock,
    };
    return icons[status] || Users;
  };

  const calculateConversionRate = () => {
    if (!funnelData) return '0';
    return funnelData.key_metrics.conversion_rate.toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!funnelData) {
    return <div>No funnel data available</div>;
  }

  const funnelStages = [
    { key: 'new', label: 'New Leads' },
    { key: 'active', label: 'Active' },
    { key: 'at_risk', label: 'At Risk' },
    { key: 'cold', label: 'Cold' },
    { key: 'human_handoff', label: 'Human Handoff' },
    { key: 'converted', label: 'Converted' },
    { key: 'do_not_contact', label: 'Do Not Contact' },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Funnel Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Pipeline</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {Object.values(funnelData.funnel_counts).reduce((sum, count) => sum + count, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total leads in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {calculateConversionRate()}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Overall conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">Pipeline value will be calculated when financial data is available</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Engagement</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {funnelData.funnel_counts.active + funnelData.funnel_counts.at_risk}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Engaged leads
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Lead Pipeline Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {funnelStages.map((stage, index) => {
              const count = funnelData.funnel_counts[stage.key as keyof typeof funnelData.funnel_counts];
              const IconComponent = getStatusIcon(stage.key as keyof typeof funnelData.funnel_counts);
              const color = getStatusColor(stage.key as keyof typeof funnelData.funnel_counts);
              const totalLeads = Object.values(funnelData.funnel_counts).reduce((sum, c) => sum + c, 0);
              const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
              
              return (
                <div key={stage.key} className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3 w-32">
                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                    <IconComponent className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">{count} leads</span>
                      <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                  
                  <div className="w-20 text-right">
                    <Badge variant="outline" className="text-xs">
                      {count}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stage Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">High-Value Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-900">Active Leads</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">{funnelData.funnel_counts.active}</div>
                  <div className="text-sm text-green-700">High engagement</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="font-medium text-purple-900">Human Handoff</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-600">{funnelData.funnel_counts.human_handoff}</div>
                  <div className="text-sm text-purple-700">Ready for staff</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="font-medium text-emerald-900">Converted</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-600">{funnelData.funnel_counts.converted}</div>
                  <div className="text-sm text-emerald-700">Revenue generated</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attention Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="font-medium text-yellow-900">At Risk</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-yellow-600">{funnelData.funnel_counts.at_risk}</div>
                  <div className="text-sm text-yellow-700">Needs intervention</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">Cold Leads</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-600">{funnelData.funnel_counts.cold}</div>
                  <div className="text-sm text-gray-700">Outreach needed</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-blue-900">New Leads</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{funnelData.funnel_counts.new}</div>
                  <div className="text-sm text-blue-700">Initial contact</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Pipeline Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.details}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.event_type.replace(/_/g, ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Performance insights will be displayed here when available</p>
            <p className="text-sm mt-2">This will show real engagement rates, recovery rates, and conversion metrics</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 