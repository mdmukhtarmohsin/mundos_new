'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Clock,
  Target,
  BarChart3,
  Bot,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { apiService } from '@/lib/api';
import { DashboardOverview, LeadFunnel, RiskAnalysis, AIPerformance } from '@/types';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
  const [leadFunnel, setLeadFunnel] = useState<LeadFunnel | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [aiPerformance, setAiPerformance] = useState<AIPerformance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [overview, funnel, risk, ai] = await Promise.all([
        apiService.getDashboardOverview(),
        apiService.getLeadFunnel(),
        apiService.getRiskAnalysis(),
        apiService.getAIPerformance(),
      ]);
      
      setDashboardData(overview);
      setLeadFunnel(funnel);
      setRiskAnalysis(risk);
      setAiPerformance(ai);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!dashboardData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">Unable to load analytics data at this time.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-sm text-gray-600">
            Real-time insights into AI performance, lead conversion, and business metrics
          </p>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{dashboardData.lead_metrics.total_leads}</div>
              <div className="flex items-center space-x-2 mt-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">+{dashboardData.lead_metrics.new_leads_period}</span>
                <span className="text-xs text-gray-500">new this period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{dashboardData.lead_metrics.conversion_rate}%</div>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-sm text-gray-600">{dashboardData.lead_metrics.converted_leads} converted</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">AI Response Rate</CardTitle>
              <Bot className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{dashboardData.engagement_metrics.response_rate}%</div>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-sm text-gray-600">{dashboardData.engagement_metrics.ai_responses_period} responses</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Leads</CardTitle>
              <Activity className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{dashboardData.lead_metrics.active_leads}</div>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-sm text-gray-600">currently engaged</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lead Status Distribution */}
        {dashboardData.lead_metrics.status_distribution && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Lead Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(dashboardData.lead_metrics.status_distribution).map(([status, count]) => (
                  <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lead Funnel */}
        {leadFunnel && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Lead Conversion Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(leadFunnel.funnel_counts).map(([stage, count]) => {
                  const rate = leadFunnel.funnel_rates[stage as keyof typeof leadFunnel.funnel_rates] || 0;
                  return (
                    <div key={stage} className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3 w-32">
                        <div className={`w-3 h-3 rounded-full ${
                          stage === 'converted' ? 'bg-emerald-500' :
                          stage === 'active' ? 'bg-green-500' :
                          stage === 'at_risk' ? 'bg-yellow-500' :
                          stage === 'cold' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-700 capitalize">{stage.replace('_', ' ')}</span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">{count} leads</span>
                          <span className="text-sm text-gray-500">{rate}%</span>
                        </div>
                        <Progress value={rate} className="h-2" />
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
        )}

        {/* Risk Analysis */}
        {riskAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Analysis Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {riskAnalysis.high_risk_leads.length}
                  </div>
                  <div className="text-sm text-red-800">High Risk Leads</div>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {riskAnalysis.medium_risk_leads.length}
                  </div>
                  <div className="text-sm text-yellow-800">Medium Risk Leads</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {riskAnalysis.low_risk_leads.length}
                  </div>
                  <div className="text-sm text-green-800">Low Risk Leads</div>
                </div>
              </div>
              
              {riskAnalysis.high_risk_leads.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">High Risk Leads Requiring Attention</h4>
                  <div className="space-y-2">
                    {riskAnalysis.high_risk_leads.slice(0, 5).map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <div className="font-medium text-red-900">{lead.name}</div>
                          <div className="text-sm text-red-700">{lead.initial_inquiry}</div>
                        </div>
                        <Badge className="bg-red-100 text-red-800">
                          {lead.risk_level}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* AI Performance */}
        {aiPerformance && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="font-medium text-gray-900">Response Quality</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Total Conversations</span>
                        <span className="font-medium">{aiPerformance.total_conversations}</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Successful Handoffs</span>
                        <span className="font-medium">{aiPerformance.successful_handoffs}</span>
                      </div>
                      <Progress value={(aiPerformance.successful_handoffs / aiPerformance.total_conversations) * 100} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Total Offers Made</span>
                        <span className="font-medium">{aiPerformance.total_offers_made}</span>
                      </div>
                      <Progress value={(aiPerformance.total_offers_made / aiPerformance.total_conversations) * 100} className="h-2" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="font-medium text-gray-900">Sentiment Analysis</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Average Sentiment Improvement</span>
                        <span className="font-medium">{aiPerformance.average_sentiment_improvement.toFixed(2)}</span>
                      </div>
                      <Progress value={Math.max(0, (aiPerformance.average_sentiment_improvement + 1) * 50)} className="h-2" />
                    </div>
                    
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {aiPerformance.total_conversations}
                      </div>
                      <div className="text-sm text-blue-800">Total AI Interactions</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Health */}
        {dashboardData.system_health && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {dashboardData.system_health.status}
                  </div>
                  <div className="text-sm text-gray-600">Status</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {dashboardData.system_health.total_events}
                  </div>
                  <div className="text-sm text-blue-800">Total Events</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {dashboardData.system_health.ai_interactions}
                  </div>
                  <div className="text-sm text-green-800">AI Interactions</div>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {dashboardData.system_health.error_rate_percent}%
                  </div>
                  <div className="text-sm text-red-800">Error Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
} 