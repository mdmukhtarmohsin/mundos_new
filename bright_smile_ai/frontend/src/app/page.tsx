'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { LeadFunnel } from '@/components/dashboard/LeadFunnel';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Bot, 
  DollarSign,
  Clock,
  Target,
  Activity,
  BarChart3,
  PieChart
} from 'lucide-react';
import { DashboardOverview as DashboardOverviewType } from '@/types';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardOverviewType | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [quickActions, setQuickActions] = useState({
    outreachRunning: false,
    riskAnalysisRunning: false,
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log('Fetching dashboard data from API...');
        const overview = await apiService.getDashboardOverview();
        console.log('Dashboard data received:', overview);
        setData(overview);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data on the client side
    if (isClient) {
      fetchDashboardData();
    }
  }, [isClient]);

  const triggerOutreach = async () => {
    try {
      setQuickActions(prev => ({ ...prev, outreachRunning: true }));
      const result = await apiService.triggerOutreach();
      toast.success(`Outreach campaign completed! ${result.results.leads_contacted} leads contacted.`);
    } catch (error) {
      console.error('Failed to trigger outreach:', error);
      toast.error('Failed to trigger outreach campaign');
    } finally {
      setQuickActions(prev => ({ ...prev, outreachRunning: false }));
    }
  };

  const analyzeRisk = async () => {
    try {
      setQuickActions(prev => ({ ...prev, riskAnalysisRunning: true }));
      const result = await apiService.analyzeRisk();
      toast.success(`Risk analysis completed! ${result.results.newly_at_risk} leads flagged at risk.`);
    } catch (error) {
      console.error('Failed to analyze risk:', error);
      toast.error('Failed to analyze risk');
    } finally {
      setQuickActions(prev => ({ ...prev, riskAnalysisRunning: false }));
    }
  };

  if (loading || !isClient) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor your AI Patient Advocate performance and lead management
          </p>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Proactive Outreach</h4>
                <p className="text-sm text-gray-600">
                  Trigger AI outreach campaigns to re-engage cold leads
                </p>
                <Button
                  onClick={triggerOutreach}
                  disabled={quickActions.outreachRunning}
                  className="w-full"
                >
                  {quickActions.outreachRunning ? 'Running...' : 'Trigger Outreach'}
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Risk Analysis</h4>
                <p className="text-sm text-gray-600">
                  Analyze all active leads for risk factors and interventions
                </p>
                <Button
                  onClick={analyzeRisk}
                  disabled={quickActions.riskAnalysisRunning}
                  variant="outline"
                  className="w-full"
                >
                  {quickActions.riskAnalysisRunning ? 'Analyzing...' : 'Analyze Risk'}
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Test API</h4>
                <p className="text-sm text-gray-600">
                  Test the dashboard API endpoint
                </p>
                <Button 
                  onClick={() => {
                    console.log('Testing API...');
                    apiService.getDashboardOverview().then(data => {
                      console.log('API test successful:', data);
                      toast.success('API test successful!');
                    }).catch(error => {
                      console.error('API test failed:', error);
                      toast.error('API test failed: ' + error.message);
                    });
                  }}
                  variant="outline" 
                  className="w-full"
                >
                  Test API
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Cards */}
        {data && <DashboardOverview data={data} />}

        {/* Lead Funnel */}
        <LeadFunnel />

        {/* Additional Dashboard Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <p>Recent activity will be displayed here when available</p>
                <p className="text-sm mt-2">This will show real system events and lead interactions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>System health status will be displayed here when available</p>
              <p className="text-sm mt-2">This will show real AI agent status and system health metrics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
