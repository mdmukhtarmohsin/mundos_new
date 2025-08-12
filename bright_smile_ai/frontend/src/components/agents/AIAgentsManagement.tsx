'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  AlertTriangle, 
  MessageSquare, 
  Play,
  RefreshCw,
  Search,
  Shield,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { apiService } from '@/lib/api';
import { CampaignHistory } from '@/types';
import { toast } from 'sonner';

interface AgentStatus {
  system_health: {
    status: string;
    total_events: number;
    error_events: number;
    ai_interactions: number;
  };
  risk_analysis: {
    total_active_leads: number;
    high_risk_count: number;
  };
  recent_activity: Array<{
    event_type: string;
    details: string;
    created_at: string;
    severity: string;
  }>;
  agents: {
    [key: string]: {
      status: string;
      description: string;
    };
  };
}

interface ActionResult {
  type: 'outreach' | 'risk' | 'scan';
  success: boolean;
  message: string;
  results?: any;
  timestamp: string;
}

export function AIAgentsManagement() {
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [campaignHistory, setCampaignHistory] = useState<CampaignHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [outreachRunning, setOutreachRunning] = useState(false);
  const [riskAnalysisRunning, setRiskAnalysisRunning] = useState(false);
  const [scanningRunning, setScanningRunning] = useState(false);
  const [actionResults, setActionResults] = useState<ActionResult[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [status, history] = await Promise.all([
        apiService.getAgentStatus(),
        apiService.getCampaignHistory(),
      ]);
      
      setAgentStatus(status);
      setCampaignHistory(history);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load agent data');
    } finally {
      setLoading(false);
    }
  };

  const addActionResult = (result: ActionResult) => {
    setActionResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
    
    // Dispatch custom event to notify other components
    const event = new CustomEvent('ai-action-completed', { 
      detail: result 
    });
    window.dispatchEvent(event);
  };

  const triggerOutreach = async () => {
    try {
      setOutreachRunning(true);
      const result = await apiService.triggerOutreach();
      toast.success(result.message);
      
      addActionResult({
        type: 'outreach',
        success: result.success,
        message: result.message,
        results: result.results,
        timestamp: new Date().toISOString()
      });
      
      fetchData();
    } catch (error) {
      console.error('Failed to trigger outreach:', error);
      toast.error('Failed to trigger outreach campaign');
      
      addActionResult({
        type: 'outreach',
        success: false,
        message: 'Failed to trigger outreach campaign',
        timestamp: new Date().toISOString()
      });
    } finally {
      setOutreachRunning(false);
    }
  };

  const analyzeRisk = async () => {
    try {
      setRiskAnalysisRunning(true);
      const result = await apiService.analyzeRisk();
      toast.success(result.message);
      
      addActionResult({
        type: 'risk',
        success: result.success,
        message: result.message,
        results: result.results,
        timestamp: new Date().toISOString()
      });
      
      fetchData();
    } catch (error) {
      console.error('Failed to analyze risk:', error);
      toast.error('Failed to analyze risk');
      
      addActionResult({
        type: 'risk',
        success: false,
        message: 'Failed to analyze risk',
        timestamp: new Date().toISOString()
      });
    } finally {
      setRiskAnalysisRunning(false);
    }
  };

  const scanLeads = async () => {
    try {
      setScanningRunning(true);
      const result = await apiService.scanLeadsForOpportunities();
      toast.success(result.message);
      
      addActionResult({
        type: 'scan',
        success: result.success,
        message: result.message,
        results: result.results,
        timestamp: new Date().toISOString()
      });
      
      fetchData();
    } catch (error) {
      console.error('Failed to scan leads:', error);
      toast.error('Failed to scan leads');
      
      addActionResult({
        type: 'scan',
        success: false,
        message: 'Failed to scan leads',
        timestamp: new Date().toISOString()
      });
    } finally {
      setScanningRunning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-800' },
      unhealthy: { label: 'Unhealthy', className: 'bg-red-100 text-red-800' },
      healthy: { label: 'Healthy', className: 'bg-green-100 text-green-800' },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">System Health</CardTitle>
            <Bot className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {agentStatus ? getStatusBadge(agentStatus.system_health.status) : 'N/A'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {agentStatus?.system_health.ai_interactions || 0} AI interactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Leads</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {agentStatus?.risk_analysis.total_active_leads || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {agentStatus?.risk_analysis.high_risk_count || 0} high risk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {agentStatus?.system_health.total_events || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {agentStatus?.system_health.error_events || 0} errors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Agent Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Proactive Outreach</h4>
              <p className="text-sm text-gray-600">
                Trigger outreach campaigns to cold leads.
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
              <h4 className="font-medium text-gray-900">Risk Analysis</h4>
              <p className="text-sm text-gray-600">
                Analyze all active leads for risk factors.
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

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Lead Scanning</h4>
              <p className="text-sm text-gray-600">
                Scan leads for engagement opportunities.
              </p>
              <Button
                onClick={scanLeads}
                disabled={scanningRunning}
                variant="outline"
                className="w-full"
              >
                {scanningRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Scan Leads
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Results */}
      {actionResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Action Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {actionResults.map((result, index) => {
                const ActionIcon = getActionIcon(result.type);
                return (
                  <div key={index} className={`border rounded-lg p-4 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ActionIcon className="h-5 w-5 text-gray-600" />
                        <h4 className="font-medium text-gray-900">
                          {getActionTitle(result.type)}
                        </h4>
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(result.timestamp)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700">{result.message}</p>
                      
                      {result.results && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <h5 className="font-medium text-gray-900 mb-2">Results:</h5>
                          <div className="text-sm text-gray-600 space-y-1">
                            {Object.entries(result.results).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                                <span className="font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {agentStatus?.recent_activity && agentStatus.recent_activity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agentStatus.recent_activity.slice(0, 5).map((activity, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">
                      {activity.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(activity.created_at)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{activity.details}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Campaign History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaignHistory.length > 0 ? (
              campaignHistory.slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {campaign.campaign_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {formatDate(campaign.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${campaign.success ? 'text-green-600' : 'text-red-600'}`}>
                        {campaign.success ? 'Success' : 'Failed'}
                      </div>
                      <div className="text-sm text-gray-500">Status</div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-sm text-gray-700">{campaign.details}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No campaign history available</p>
                <p className="text-sm">Campaigns will appear here after they are executed</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 