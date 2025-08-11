'use client';

import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Bot,
  Eye,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

export default function ReportsPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="mt-2 text-sm text-gray-600">
            Generate comprehensive reports and insights for business analysis
          </p>
        </div>

        {/* Report Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Lead Performance Report</h4>
                <p className="text-sm text-gray-600">
                  Comprehensive analysis of lead conversion and engagement metrics
                </p>
                <div className="flex gap-2">
                  <Button size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">AI Performance Report</h4>
                <p className="text-sm text-gray-600">
                  Detailed metrics on AI agent performance and response quality
                </p>
                <div className="flex gap-2">
                  <Button size="sm">
                    <Bot className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Revenue Analysis Report</h4>
                <p className="text-sm text-gray-600">
                  Financial performance and revenue attribution analysis
                </p>
                <div className="flex gap-2">
                  <Button size="sm">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  id: 1,
                  name: 'Lead Performance Report - June 2024',
                  type: 'Lead Analysis',
                  generated: '2024-06-20T10:00:00Z',
                  status: 'completed',
                  size: '2.4 MB',
                  downloads: 12,
                },
                {
                  id: 2,
                  name: 'AI Performance Metrics - Q2 2024',
                  type: 'AI Analysis',
                  generated: '2024-06-18T14:30:00Z',
                  status: 'completed',
                  size: '1.8 MB',
                  downloads: 8,
                },
                {
                  id: 3,
                  name: 'Revenue Analysis - May 2024',
                  type: 'Financial',
                  generated: '2024-06-15T09:15:00Z',
                  status: 'completed',
                  size: '3.1 MB',
                  downloads: 15,
                },
                {
                  id: 4,
                  name: 'Financial Explainer Impact Report',
                  type: 'Asset Analysis',
                  generated: '2024-06-12T16:45:00Z',
                  status: 'completed',
                  size: '1.2 MB',
                  downloads: 6,
                },
              ].map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{report.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {report.type}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(report.generated).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{report.size}</div>
                      <div className="text-xs text-gray-500">{report.downloads} downloads</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Report Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Standard Reports</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Daily Lead Summary</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Schedule
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Bot className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Weekly AI Performance</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Schedule
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Monthly Revenue Report</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Schedule
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Custom Reports</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Conversion Funnel Analysis</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Configure
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <PieChart className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Service Performance Comparison</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Configure
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Activity className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm font-medium">Risk Analysis Summary</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Configure
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Reports Generated</span>
                  <span className="font-medium">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">This Month</span>
                  <span className="font-medium">23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Downloads</span>
                  <span className="font-medium">1,247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Most Popular</span>
                  <span className="font-medium">Lead Performance</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scheduled Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium text-blue-900">Daily Lead Summary</div>
                    <div className="text-sm text-blue-700">Every day at 8:00 AM</div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-medium text-green-900">Weekly AI Performance</div>
                    <div className="text-sm text-green-700">Every Monday at 9:00 AM</div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                  <div>
                    <div className="font-medium text-purple-900">Monthly Revenue</div>
                    <div className="text-sm text-purple-700">1st of month at 10:00 AM</div>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">PDF Export</h4>
                <p className="text-sm text-gray-600 mb-3">High-quality printable reports</p>
                <Button size="sm" variant="outline">Configure</Button>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">Excel Export</h4>
                <p className="text-sm text-gray-600 mb-3">Data analysis and manipulation</p>
                <Button size="sm" variant="outline">Configure</Button>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">API Access</h4>
                <p className="text-sm text-gray-600 mb-3">Programmatic report generation</p>
                <Button size="sm" variant="outline">Configure</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 