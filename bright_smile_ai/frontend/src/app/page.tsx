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
  PieChart,
  Search,
  Brain,
  Zap
} from 'lucide-react';
import { DashboardOverview as DashboardOverviewType } from '@/types';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardOverviewType | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [quickActions, setQuickActions] = useState({
    outreachRunning: false,
    riskAnalysisRunning: false,
    aiScanningRunning: false,
    comprehensiveAnalysisRunning: false,
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
      toast.success(`Outreach campaign completed! ${result.results.leads_contacted} leads contacted, ${result.results.ai_strategies_selected} AI strategies executed.`);
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
      toast.success(`Risk analysis completed! ${result.results.newly_at_risk} leads flagged at risk, ${result.results.aggressive_offers_sent} aggressive offers sent.`);
    } catch (error) {
      console.error('Failed to analyze risk:', error);
      toast.error('Failed to analyze risk');
    } finally {
      setQuickActions(prev => ({ ...prev, riskAnalysisRunning: false }));
    }
  };

  const scanLeadsForOpportunities = async () => {
    try {
      setQuickActions(prev => ({ ...prev, aiScanningRunning: true }));
      const result = await apiService.scanLeadsForOpportunities();
      toast.success(`AI lead scanning completed! ${result.results.opportunities_identified} opportunities found, ${result.results.proactive_messages_sent} messages sent.`);
    } catch (error) {
      console.error('Failed to scan leads:', error);
      toast.error('Failed to scan leads for opportunities');
    } finally {
      setQuickActions(prev => ({ ...prev, aiScanningRunning: false }));
    }
  };

  const runComprehensiveAnalysis = async () => {
    try {
      setQuickActions(prev => ({ ...prev, comprehensiveAnalysisRunning: true }));
      const result = await apiService.runComprehensiveAnalysis();
      toast.success(`Comprehensive analysis completed! ${result.results.total_opportunities} opportunities identified, ${result.results.total_interventions} interventions executed.`);
    } catch (error) {
      console.error('Failed to run comprehensive analysis:', error);
      toast.error('Failed to run comprehensive analysis');
    } finally {
      setQuickActions(prev => ({ ...prev, comprehensiveAnalysisRunning: false }));
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

        {/* Enhanced Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Quick AI Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* AI Lead Scanning */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">AI Lead Scanning</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Scan all leads for engagement opportunities using AI decision making
                </p>
                <Button
                  onClick={scanLeadsForOpportunities}
                  disabled={quickActions.aiScanningRunning}
                  variant="outline"
                  className="w-full"
                >
                  {quickActions.aiScanningRunning ? (
                    <>
                      <Search className="h-4 w-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Scan for Opportunities
                    </>
                  )}
                </Button>
              </div>

              {/* Comprehensive Analysis */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-gray-900">Comprehensive Analysis</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Run complete AI analysis combining lead scanning and risk assessment
                </p>
                <Button
                  onClick={runComprehensiveAnalysis}
                  disabled={quickActions.comprehensiveAnalysisRunning}
                  variant="outline"
                  className="w-full"
                >
                  {quickActions.comprehensiveAnalysisRunning ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Activity className="h-4 w-4 mr-2" />
                      Run Full Analysis
                    </>
                  )}
                </Button>
              </div>

              {/* Proactive Outreach */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium text-gray-900">Proactive Outreach</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Trigger AI outreach campaigns to re-engage cold leads
                </p>
                <Button
                  onClick={triggerOutreach}
                  disabled={quickActions.outreachRunning}
                  className="w-full"
                >
                  {quickActions.outreachRunning ? (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Trigger Outreach
                    </>
                  )}
                </Button>
              </div>

              {/* Risk Analysis */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-red-600" />
                  <h4 className="font-medium text-gray-900">Risk Analysis</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Analyze all active leads for risk factors and interventions
                </p>
                <Button
                  onClick={analyzeRisk}
                  disabled={quickActions.riskAnalysisRunning}
                  variant="outline"
                  className="w-full"
                >
                  {quickActions.riskAnalysisRunning ? (
                    <>
                      <Target className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4 mr-2" />
                      Analyze Risk
                    </>
                  )}
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
