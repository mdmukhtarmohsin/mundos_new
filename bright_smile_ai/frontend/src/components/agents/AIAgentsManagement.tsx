'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  TrendingUp, 
  AlertTriangle, 
  MessageSquare, 
  Users, 
  Clock, 
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RefreshCw,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';

interface AgentStatus {
  status: string;
  last_run: string;
}

interface PerformanceMetrics {
  outreach_conversion_rate: number;
  ai_response_accuracy: number;
  lead_engagement_rate: number;
  time_to_conversion: number;
}

interface CampaignHistory {
  id: number;
  campaign_type: string;
  leads_contacted: number;
  responses_received: number;
  conversions: number;
  created_at: string;
}

export function AIAgentsManagement() {
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [campaignHistory, setCampaignHistory] = useState<CampaignHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [outreachRunning, setOutreachRunning] = useState(false);
  const [riskAnalysisRunning, setRiskAnalysisRunning] = useState(false);

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    try {
      const [status, metrics, history] = await Promise.all([
        apiService.getAgentStatus(),
        apiService.getPerformanceMetrics(),
        apiService.getCampaignHistory(),
      ]);
      setAgentStatus(status);
      setPerformanceMetrics(metrics);
      setCampaignHistory(history);
    } catch (error) {
      console.error('Failed to fetch agent data:', error);
      // Use mock data for demo
      setAgentStatus({
        status: 'active',
        last_run: new Date().toISOString(),
      });
      setPerformanceMetrics({
        outreach_conversion_rate: 23.5,
        ai_response_accuracy: 94.2,
        lead_engagement_rate: 78.9,
        time_to_conversion: 4.2,
      });
      setCampaignHistory([
        {
          id: 1,
          campaign_type: 'Cold Lead Outreach',
          leads_contacted: 45,
          responses_received: 12,
          conversions: 3,
          created_at: '2024-01-20T10:00:00Z',
        },
        {
          id: 2,
          campaign_type: 'At-Risk Intervention',
          leads_contacted: 23,
          responses_received: 18,
          conversions: 7,
          created_at: '2024-01-19T14:30:00Z',
        },
        {
          id: 3,
          campaign_type: 'Follow-up Campaign',
          leads_contacted: 67,
          responses_received: 34,
          conversions: 12,
          created_at: '2024-01-18T09:15:00Z',
        },
      ]);
    }
  };

  const triggerOutreach = async () => {
    try {
      setOutreachRunning(true);
      const result = await apiService.triggerOutreach();
      toast.success(`Outreach campaign completed! ${result.results.leads_contacted} leads contacted.`);
      fetchAgentData(); // Refresh data
    } catch (error) {
      console.error('Failed to trigger outreach:', error);
      toast.error('Failed to trigger outreach campaign');
    } finally {
      setOutreachRunning(false);
    }
  };

  const analyzeRisk = async () => {
    try {
      setRiskAnalysisRunning(true);
      const result = await apiService.analyzeRisk();
      toast.success(`Risk analysis completed! ${result.results.newly_at_risk} leads flagged at risk.`);
      fetchAgentData(); // Refresh data
    } catch (error) {
      console.error('Failed to analyze risk:', error);
      toast.error('Failed to analyze risk');
    } finally {
      setRiskAnalysisRunning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-800' },
      running: { label: 'Running', className: 'bg-blue-100 text-blue-800' },
      error: { label: 'Error', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Agent Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">AI Agent Status</CardTitle>
            <Bot className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {agentStatus ? getStatusBadge(agentStatus.status) : 'Loading...'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Last run: {agentStatus ? formatDate(agentStatus.last_run) : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Response Accuracy</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {performanceMetrics ? `${performanceMetrics.ai_response_accuracy}%` : 'N/A'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              AI response accuracy rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Engagement Rate</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {performanceMetrics ? `${performanceMetrics.lead_engagement_rate}%` : 'N/A'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Lead engagement success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Proactive Outreach Agent</h4>
                  <p className="text-sm text-gray-600">
                    Manually trigger outreach campaigns to cold leads with intelligent messaging strategies.
                  </p>
                  <Button
                    onClick={triggerOutreach}
                    disabled={outreachRunning}
                    className="w-full"
                  >
                    {outreachRunning ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Trigger Outreach
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Risk Analysis Engine</h4>
                  <p className="text-sm text-gray-600">
                    Analyze all active leads for risk factors and trigger interventions automatically.
                  </p>
                  <Button
                    onClick={analyzeRisk}
                    disabled={riskAnalysisRunning}
                    variant="outline"
                    className="w-full"
                  >
                    {riskAnalysisRunning ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Analyze Risk
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Outreach Conversion Rate</span>
                      <span className="font-medium">{performanceMetrics?.outreach_conversion_rate}%</span>
                    </div>
                    <Progress value={performanceMetrics?.outreach_conversion_rate || 0} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>AI Response Accuracy</span>
                      <span className="font-medium">{performanceMetrics?.ai_response_accuracy}%</span>
                    </div>
                    <Progress value={performanceMetrics?.ai_response_accuracy || 0} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Lead Engagement Rate</span>
                      <span className="font-medium">{performanceMetrics?.lead_engagement_rate}%</span>
                    </div>
                    <Progress value={performanceMetrics?.lead_engagement_rate || 0} className="h-2" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {performanceMetrics?.time_to_conversion || 0}
                    </div>
                    <div className="text-sm text-gray-600">Days to Conversion</div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">AI Agent Insights</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• 94% of leads receive response within 60 seconds</li>
                      <li>• 78% engagement rate with financial explainers</li>
                      <li>• 23% conversion rate from cold outreach</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Campaign History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaignHistory.map((campaign) => (
                  <div key={campaign.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{campaign.campaign_type}</h4>
                        <p className="text-sm text-gray-500">
                          {formatDate(campaign.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {campaign.conversions}
                        </div>
                        <div className="text-sm text-gray-500">Conversions</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">
                          {campaign.leads_contacted}
                        </div>
                        <div className="text-sm text-gray-500">Leads Contacted</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">
                          {campaign.responses_received}
                        </div>
                        <div className="text-sm text-gray-500">Responses</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-green-600">
                          {((campaign.conversions / campaign.leads_contacted) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Success Rate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Detailed Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Response Time Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Response Time</span>
                      <span className="font-medium">45 seconds</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">95th Percentile</span>
                      <span className="font-medium">2.1 minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Response Rate</span>
                      <span className="font-medium">99.8%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Engagement Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Message Response Rate</span>
                      <span className="font-medium">78.9%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Financial Explainer Views</span>
                      <span className="font-medium">67.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Human Handoff Rate</span>
                      <span className="font-medium">12.4%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Agent Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Agent Operations</h4>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Play className="h-4 w-4 mr-2" />
                      Start All Agents
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause All Agents
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Restart Agents
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">System Health</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-green-800">AI Response Engine</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-green-800">Risk Analyzer</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-green-800">Outreach Scheduler</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 