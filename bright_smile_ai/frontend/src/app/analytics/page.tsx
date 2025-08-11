'use client';

import { Layout } from '@/components/layout/Layout';
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
  Activity,
  Bot,
  Eye,
  Calendar
} from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-sm text-gray-600">
            Comprehensive insights into AI performance, lead conversion, and business metrics
          </p>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">$45,250</div>
              <div className="flex items-center space-x-2 mt-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">+23.5%</span>
                <span className="text-xs text-gray-500">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">18.7%</div>
              <div className="flex items-center space-x-2 mt-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">+5.2%</span>
                <span className="text-xs text-gray-500">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">AI Response Time</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">45s</div>
              <div className="flex items-center space-x-2 mt-2">
                <TrendingDown className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">-12.3%</span>
                <span className="text-xs text-gray-500">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Lead Engagement</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">78.9%</div>
              <div className="flex items-center space-x-2 mt-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">+8.7%</span>
                <span className="text-xs text-gray-500">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Performance Metrics */}
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
                      <span>Accuracy Rate</span>
                      <span className="font-medium">94.2%</span>
                    </div>
                    <Progress value={94.2} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Patient Satisfaction</span>
                      <span className="font-medium">87.5%</span>
                    </div>
                    <Progress value={87.5} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Intent Recognition</span>
                      <span className="font-medium">91.8%</span>
                    </div>
                    <Progress value={91.8} className="h-2" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="font-medium text-gray-900">Efficiency Metrics</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Response Time</span>
                      <span className="font-medium">45 seconds</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Uptime</span>
                      <span className="font-medium">99.8%</span>
                    </div>
                    <Progress value={99.8} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Error Rate</span>
                      <span className="font-medium">0.2%</span>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Lead Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { stage: 'New Leads', count: 156, conversion: 100, color: 'bg-blue-500' },
                { stage: 'Initial Contact', count: 142, conversion: 91, color: 'bg-green-500' },
                { stage: 'Engaged', count: 98, conversion: 63, color: 'bg-yellow-500' },
                { stage: 'Qualified', count: 67, conversion: 43, color: 'bg-orange-500' },
                { stage: 'Proposal', count: 45, conversion: 29, color: 'bg-red-500' },
                { stage: 'Converted', count: 29, conversion: 18.7, color: 'bg-emerald-500' },
              ].map((funnelStage, index) => (
                <div key={funnelStage.stage} className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3 w-32">
                    <div className={`w-3 h-3 rounded-full ${funnelStage.color}`}></div>
                    <span className="text-sm font-medium text-gray-700">{funnelStage.stage}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">{funnelStage.count} leads</span>
                      <span className="text-sm text-gray-500">{funnelStage.conversion}%</span>
                    </div>
                    <Progress value={funnelStage.conversion} className="h-2" />
                  </div>
                  
                  <div className="w-20 text-right">
                    <Badge variant="outline" className="text-xs">
                      {funnelStage.count}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue by Service</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { service: 'Invisalign', revenue: 18500, percentage: 40.9, color: 'bg-blue-500' },
                  { service: 'Dental Implants', revenue: 12400, percentage: 27.4, color: 'bg-green-500' },
                  { service: 'General Dentistry', revenue: 8900, percentage: 19.7, color: 'bg-yellow-500' },
                  { service: 'Cosmetic Procedures', revenue: 5450, percentage: 12.0, color: 'bg-purple-500' },
                ].map((service) => (
                  <div key={service.service} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${service.color}`}></div>
                      <span className="text-sm font-medium text-gray-900">{service.service}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{formatCurrency(service.revenue)}</div>
                      <div className="text-xs text-gray-500">{service.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { month: 'Jan', revenue: 12500, leads: 45, trend: 'up' },
                  { month: 'Feb', revenue: 15800, leads: 52, trend: 'up' },
                  { month: 'Mar', revenue: 14200, leads: 48, trend: 'down' },
                  { month: 'Apr', revenue: 18900, leads: 61, trend: 'up' },
                  { month: 'May', revenue: 22100, leads: 67, trend: 'up' },
                  { month: 'Jun', revenue: 45250, leads: 156, trend: 'up' },
                ].map((month) => (
                  <div key={month.month} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{month.month}</span>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{formatCurrency(month.revenue)}</div>
                      <div className="text-xs text-gray-500">{month.leads} leads</div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      month.trend === 'up' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Agent Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Agent Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Proactive Outreach Agent</h4>
                <div className="text-2xl font-bold text-blue-600 mb-1">23.5%</div>
                <div className="text-sm text-blue-700">Conversion Rate</div>
                <div className="text-xs text-blue-600 mt-1">45 leads contacted</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Instant Reply Agent</h4>
                <div className="text-2xl font-bold text-green-600 mb-1">94.2%</div>
                <div className="text-sm text-green-700">Response Accuracy</div>
                <div className="text-xs text-green-600 mt-1">1,247 messages</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Risk Analyzer</h4>
                <div className="text-2xl font-bold text-purple-600 mb-1">78.9%</div>
                <div className="text-sm text-purple-700">Intervention Success</div>
                <div className="text-xs text-purple-600 mt-1">23 leads analyzed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Explainer Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Financial Explainer Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Generation Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Generated</span>
                    <span className="font-medium">67</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Access Rate</span>
                    <span className="font-medium">67.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Conversion Impact</span>
                    <span className="font-medium">+34.2%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Popular Procedures</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Invisalign</span>
                    <span className="font-medium">23 explainers</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Dental Implants</span>
                    <span className="font-medium">18 explainers</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Root Canal</span>
                    <span className="font-medium">15 explainers</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
} 