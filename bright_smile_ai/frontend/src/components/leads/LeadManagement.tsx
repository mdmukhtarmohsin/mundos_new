'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Plus, 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  UserX,
  DollarSign
} from 'lucide-react';
import { apiService } from '@/lib/api';
import { Lead, Message } from '@/types';
import { toast } from 'sonner';
import { formatDate, formatCurrency } from '@/lib/utils';

interface LeadManagementProps {
  onLeadSelect?: (lead: Lead) => void;
}

export function LeadManagement({ onLeadSelect }: LeadManagementProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [showLeadDetails, setShowLeadDetails] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await apiService.getLeads();
      setLeads(data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      toast.error('Failed to load leads');
      // Use mock data for demo
      setLeads([
        {
          id: 1,
          name: 'John Smith',
          email: 'john.smith@email.com',
          phone: '(555) 123-4567',
          initial_inquiry: 'I need Invisalign treatment',
          status: 'active',
          risk_level: 'low',
          sentiment_score: 0.8,
          do_not_contact: false,
          created_at: '2024-01-15T10:00:00Z',
          last_contact_at: '2024-01-20T14:30:00Z',
        },
        {
          id: 2,
          name: 'Sarah Johnson',
          email: 'sarah.j@email.com',
          phone: '(555) 987-6543',
          initial_inquiry: 'Dental implant consultation',
          status: 'at_risk',
          risk_level: 'medium',
          sentiment_score: 0.3,
          do_not_contact: false,
          created_at: '2024-01-10T09:00:00Z',
          last_contact_at: '2024-01-18T11:00:00Z',
        },
        {
          id: 3,
          name: 'Mike Davis',
          email: 'mike.davis@email.com',
          phone: '(555) 456-7890',
          initial_inquiry: 'General cleaning and checkup',
          status: 'cold',
          risk_level: 'high',
          sentiment_score: -0.2,
          do_not_contact: false,
          created_at: '2024-01-05T08:00:00Z',
          last_contact_at: '2024-01-12T16:00:00Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.initial_inquiry.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    setFilteredLeads(filtered);
  };

  const getStatusBadge = (status: Lead['status']) => {
    const statusConfig = {
      new: { label: 'New', variant: 'default', className: 'bg-blue-100 text-blue-800' },
      active: { label: 'Active', variant: 'default', className: 'bg-green-100 text-green-800' },
      at_risk: { label: 'At Risk', variant: 'default', className: 'bg-yellow-100 text-yellow-800' },
      cold: { label: 'Cold', variant: 'default', className: 'bg-gray-100 text-gray-800' },
      human_handoff: { label: 'Human Handoff', variant: 'default', className: 'bg-purple-100 text-purple-800' },
      converted: { label: 'Converted', variant: 'default', className: 'bg-emerald-100 text-emerald-800' },
      do_not_contact: { label: 'Do Not Contact', variant: 'default', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status];
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getRiskBadge = (riskLevel: Lead['risk_level']) => {
    const riskConfig = {
      low: { label: 'Low', className: 'bg-green-100 text-green-800' },
      medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'High', className: 'bg-red-100 text-red-800' },
    };

    const config = riskConfig[riskLevel];
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleLeadSelect = async (lead: Lead) => {
    setSelectedLead(lead);
    try {
      const messages = await apiService.getLeadConversation(lead.id);
      setConversation(messages);
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      setConversation([]);
    }
    setShowLeadDetails(true);
  };

  const updateLeadStatus = async (leadId: number, newStatus: Lead['status']) => {
    try {
      await apiService.updateLeadStatus(leadId, newStatus);
      toast.success('Lead status updated successfully');
      fetchLeads(); // Refresh the list
    } catch (error) {
      console.error('Failed to update lead status:', error);
      toast.error('Failed to update lead status');
    }
  };

  const simulateMessage = async (leadId: number, message: string) => {
    try {
      await apiService.simulateMessage(leadId, message);
      toast.success('Message sent successfully');
      // Refresh conversation
      if (selectedLead) {
        const messages = await apiService.getLeadConversation(selectedLead.id);
        setConversation(messages);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
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
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter Leads
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, phone, or inquiry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
                <SelectItem value="human_handoff">Human Handoff</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="do_not_contact">Do Not Contact</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Initial Inquiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Last Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-gray-50 cursor-pointer">
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{lead.name}</div>
                        <div className="text-sm text-gray-500">ID: {lead.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={lead.initial_inquiry}>
                        {lead.initial_inquiry}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>{getRiskBadge(lead.risk_level)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(lead.created_at)}</div>
                        {lead.last_contact_at && (
                          <div className="text-gray-500">
                            Last: {formatDate(lead.last_contact_at)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLeadSelect(lead)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Select
                          value={lead.status}
                          onValueChange={(value: Lead['status']) => updateLeadStatus(lead.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="at_risk">At Risk</SelectItem>
                            <SelectItem value="cold">Cold</SelectItem>
                            <SelectItem value="human_handoff">Human Handoff</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="do_not_contact">Do Not Contact</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Lead Details Dialog */}
      <Dialog open={showLeadDetails} onOpenChange={setShowLeadDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lead Details - {selectedLead?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedLead && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="conversation">Conversation</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{selectedLead.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{selectedLead.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{selectedLead.phone}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Lead Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Status:</span>
                        {getStatusBadge(selectedLead.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Risk Level:</span>
                        {getRiskBadge(selectedLead.risk_level)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Sentiment:</span>
                        <span className={`font-medium ${
                          selectedLead.sentiment_score > 0.5 ? 'text-green-600' :
                          selectedLead.sentiment_score < -0.5 ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {selectedLead.sentiment_score.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Initial Inquiry</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{selectedLead.initial_inquiry}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="conversation" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message to simulate..."
                      className="flex-1"
                      id="simulate-message"
                    />
                    <Button
                      onClick={() => {
                        const input = document.getElementById('simulate-message') as HTMLInputElement;
                        if (input.value.trim()) {
                          simulateMessage(selectedLead.id, input.value.trim());
                          input.value = '';
                        }
                      }}
                    >
                      Send
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {conversation.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender === 'lead' ? 'justify-start' : 'justify-end'
                        }`}
                      >
                        <div
                          className={`max-w-xs rounded-lg px-3 py-2 ${
                            message.sender === 'lead'
                              ? 'bg-gray-100 text-gray-900'
                              : message.sender === 'ai'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-green-100 text-green-900'
                          }`}
                        >
                          <div className="text-xs text-gray-500 mb-1">
                            {message.sender === 'lead' ? 'Patient' : 
                             message.sender === 'ai' ? 'AI Assistant' : 'Staff Member'}
                          </div>
                          <div>{message.content}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(message.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Engagement Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Messages:</span>
                        <span className="font-medium">{conversation.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lead Messages:</span>
                        <span className="font-medium">
                          {conversation.filter(m => m.sender === 'lead').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>AI Responses:</span>
                        <span className="font-medium">
                          {conversation.filter(m => m.sender === 'ai').length}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Risk Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Current Risk:</span>
                        {getRiskBadge(selectedLead.risk_level)}
                      </div>
                      <div className="flex justify-between">
                        <span>Sentiment Trend:</span>
                        <span className={`font-medium ${
                          selectedLead.sentiment_score > 0.5 ? 'text-green-600' :
                          selectedLead.sentiment_score < -0.5 ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {selectedLead.sentiment_score > 0.5 ? 'Positive' :
                           selectedLead.sentiment_score < -0.5 ? 'Negative' : 'Neutral'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Follow-up
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Phone className="h-4 w-4 mr-2" />
                        Schedule Call
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Book Appointment
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">AI Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full" variant="outline">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Generate Financial Explainer
                      </Button>
                      <Button className="w-full" variant="outline">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Trigger Outreach Campaign
                      </Button>
                      <Button className="w-full" variant="outline">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Analyze Risk
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 