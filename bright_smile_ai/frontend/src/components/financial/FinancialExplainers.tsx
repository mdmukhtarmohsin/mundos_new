'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  FileText, 
  Eye, 
  Download, 
  Trash2, 
  Plus,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { apiService } from '@/lib/api';
import { FinancialExplainer, Lead } from '@/types';
import { toast } from 'sonner';
import { formatDate, formatCurrency } from '@/lib/utils';

export function FinancialExplainers() {
  const [financialExplainers, setFinancialExplainers] = useState<FinancialExplainer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExplainer, setSelectedExplainer] = useState<FinancialExplainer | null>(null);
  const [showExplainerDetails, setShowExplainerDetails] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [stats, setStats] = useState({
    total_generated: 0,
    accessed_count: 0,
    conversion_rate: 0,
  });

  // Form state for generating new explainer
  const [formData, setFormData] = useState({
    lead_id: '',
    procedure_name: '',
    total_cost: '',
    estimated_insurance: '',
    payment_plans: {
      '12 months': '',
      '24 months': '',
      '36 months': '',
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [explainers, leadsData, statsData] = await Promise.all([
        apiService.getFinancialExplainerAdmin(0), // This would need to be adjusted for the actual API
        apiService.getLeads(),
        apiService.getFinancialExplainerStats(),
      ]);
      
      // For demo purposes, create mock data
      setFinancialExplainers([
        {
          id: 1,
          lead_id: 1,
          secure_url_token: 'abc123def456',
          is_accessed: true,
          procedure_name: 'Invisalign Treatment',
          total_cost: 3500,
          estimated_insurance: 1400,
          payment_options: { '12 months': 175, '24 months': 87.5 },
          created_at: '2024-01-20T10:00:00Z',
        },
        {
          id: 2,
          lead_id: 2,
          secure_url_token: 'xyz789uvw012',
          is_accessed: false,
          procedure_name: 'Dental Implant',
          total_cost: 4500,
          estimated_insurance: 1800,
          payment_options: { '12 months': 225, '24 months': 112.5 },
          created_at: '2024-01-19T14:30:00Z',
        },
        {
          id: 3,
          lead_id: 3,
          secure_url_token: 'mno345pqr678',
          is_accessed: true,
          procedure_name: 'Root Canal',
          total_cost: 1200,
          estimated_insurance: 600,
          payment_options: { '12 months': 50, '24 months': 25 },
          created_at: '2024-01-18T09:15:00Z',
        },
      ]);
      
      setLeads(leadsData);
      setStats({
        total_generated: 3,
        accessed_count: 2,
        conversion_rate: 66.7,
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load financial explainers');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateExplainer = async () => {
    try {
      // This would call the actual API to generate a financial explainer
      toast.success('Financial explainer generated successfully!');
      setShowGenerateForm(false);
      setFormData({
        lead_id: '',
        procedure_name: '',
        total_cost: '',
        estimated_insurance: '',
        payment_plans: {
          '12 months': '',
          '24 months': '',
          '36 months': '',
        },
      });
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Failed to generate explainer:', error);
      toast.error('Failed to generate financial explainer');
    }
  };

  const handleDeleteExplainer = async (id: number) => {
    try {
      await apiService.deleteFinancialExplainer(id);
      toast.success('Financial explainer deleted successfully');
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete explainer:', error);
      toast.error('Failed to delete financial explainer');
    }
  };

  const getLeadName = (leadId: number) => {
    const lead = leads.find(l => l.id === leadId);
    return lead ? lead.name : `Lead ${leadId}`;
  };

  const getAccessBadge = (isAccessed: boolean) => {
    return (
      <Badge className={isAccessed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
        {isAccessed ? 'Viewed' : 'Not Viewed'}
      </Badge>
    );
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
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Generated</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total_generated}</div>
            <p className="text-xs text-gray-500 mt-1">
              Financial explainers created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Access Rate</CardTitle>
            <Eye className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.accessed_count}</div>
            <p className="text-xs text-gray-500 mt-1">
              Times accessed by leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.conversion_rate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              Leads who viewed explainers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Explainer Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={() => setShowGenerateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Generate New Explainer
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Financial Explainers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Financial Explainers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Procedure</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead>Access Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financialExplainers.map((explainer) => (
                  <TableRow key={explainer.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {getLeadName(explainer.lead_id)}
                      </div>
                      <div className="text-sm text-gray-500">ID: {explainer.lead_id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {explainer.procedure_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {formatCurrency(explainer.total_cost)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-900">
                        {formatCurrency(explainer.estimated_insurance)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getAccessBadge(explainer.is_accessed)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {formatDate(explainer.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedExplainer(explainer);
                            setShowExplainerDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Generate secure link for viewing
                            const url = `${window.location.origin}/financial-explainer/${explainer.secure_url_token}`;
                            window.open(url, '_blank');
                          }}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Link
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteExplainer(explainer.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Generate Form Dialog */}
      <Dialog open={showGenerateForm} onOpenChange={setShowGenerateForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Financial Explainer</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Lead
              </label>
              <select
                value={formData.lead_id}
                onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a lead...</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} - {lead.initial_inquiry}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Procedure Name
              </label>
              <Input
                value={formData.procedure_name}
                onChange={(e) => setFormData({ ...formData, procedure_name: e.target.value })}
                placeholder="e.g., Invisalign Treatment, Dental Implant"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Cost
                </label>
                <Input
                  type="number"
                  value={formData.total_cost}
                  onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Insurance
                </label>
                <Input
                  type="number"
                  value={formData.estimated_insurance}
                  onChange={(e) => setFormData({ ...formData, estimated_insurance: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Plans
              </label>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(formData.payment_plans).map(([period, amount]) => (
                  <div key={period}>
                    <label className="block text-xs text-gray-600 mb-1">{period}</label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setFormData({
                        ...formData,
                        payment_plans: {
                          ...formData.payment_plans,
                          [period]: e.target.value,
                        },
                      })}
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleGenerateExplainer} className="flex-1">
                Generate Explainer
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowGenerateForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Explainer Details Dialog */}
      <Dialog open={showExplainerDetails} onOpenChange={setShowExplainerDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Financial Explainer Details</DialogTitle>
          </DialogHeader>
          
          {selectedExplainer && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Lead Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Lead Name:</span>
                          <span className="font-medium">{getLeadName(selectedExplainer.lead_id)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Lead ID:</span>
                          <span className="font-medium">{selectedExplainer.lead_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Created:</span>
                          <span className="font-medium">{formatDate(selectedExplainer.created_at)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Access Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          {getAccessBadge(selectedExplainer.is_accessed)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Token:</span>
                          <span className="font-mono text-xs">{selectedExplainer.secure_url_token}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="breakdown" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cost Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(selectedExplainer.total_cost)}
                          </div>
                          <div className="text-sm text-blue-800">Total Cost</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(selectedExplainer.estimated_insurance)}
                          </div>
                          <div className="text-sm text-green-800">Insurance Coverage</div>
                        </div>
                      </div>
                      
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {formatCurrency(selectedExplainer.total_cost - selectedExplainer.estimated_insurance)}
                        </div>
                        <div className="text-sm text-purple-800">Out of Pocket</div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Payment Plan Options</h4>
                        <div className="grid grid-cols-3 gap-4">
                          {Object.entries(selectedExplainer.payment_options).map(([period, amount]) => (
                            <div key={period} className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="text-lg font-semibold text-gray-900">
                                {formatCurrency(amount)}
                              </div>
                              <div className="text-sm text-gray-600">per month</div>
                              <div className="text-xs text-gray-500">{period}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Document Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white border rounded-lg p-6 max-w-2xl mx-auto">
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bright Smile Clinic</h2>
                        <h3 className="text-xl font-semibold text-gray-700">Financial Treatment Plan</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="border-b pb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Treatment Details</h4>
                          <p className="text-gray-700">{selectedExplainer.procedure_name}</p>
                        </div>
                        
                        <div className="border-b pb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Cost Breakdown</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Total Treatment Cost:</span>
                              <span className="font-medium">{formatCurrency(selectedExplainer.total_cost)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Estimated Insurance Coverage:</span>
                              <span className="font-medium">{formatCurrency(selectedExplainer.estimated_insurance)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="font-medium">Your Out-of-Pocket Cost:</span>
                              <span className="font-bold text-lg">
                                {formatCurrency(selectedExplainer.total_cost - selectedExplainer.estimated_insurance)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Flexible Payment Options</h4>
                          <div className="grid grid-cols-3 gap-4">
                            {Object.entries(selectedExplainer.payment_options).map(([period, amount]) => (
                              <div key={period} className="text-center p-3 bg-blue-50 rounded-lg">
                                <div className="text-lg font-bold text-blue-600">
                                  {formatCurrency(amount)}
                                </div>
                                <div className="text-sm text-gray-600">per month</div>
                                <div className="text-xs text-gray-500">{period}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 