'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
  
  // Add Lead Dialog State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    initial_inquiry: ''
  });
  const [addingLead, setAddingLead] = useState(false);

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
      console.log('API response data:', data);
      // Validate that each lead has required fields
      const validatedData = data.map(lead => {
        if (!lead.status) {
          console.warn(`Lead ${lead.id} missing status field:`, lead);
          return { ...lead, status: 'new' as Lead['status'] };
        }
        if (!lead.risk_level) {
          console.warn(`Lead ${lead.id} missing risk_level field:`, lead);
          return { ...lead, risk_level: 'medium' as Lead['risk_level'] };
        }
        return lead;
      });
      setLeads(validatedData);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      toast.error('Failed to load leads');
      // Set empty array instead of mock data
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const addLead = async () => {
    if (!newLeadForm.name || !newLeadForm.email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      setAddingLead(true);
      const leadData = {
        name: newLeadForm.name,
        email: newLeadForm.email,
        phone: newLeadForm.phone,
        initial_inquiry: newLeadForm.initial_inquiry,
        status: 'new' as const,
        risk_level: 'low' as const,
        sentiment_score: 0,
        do_not_contact: false
      };
      const newLead = await apiService.createLead(leadData);
      setLeads(prev => [...prev, newLead]);
      setNewLeadForm({ name: '', email: '', phone: '', initial_inquiry: '' });
      setShowAddDialog(false);
      toast.success('Lead added successfully!');
    } catch (error) {
      console.error('Failed to add lead:', error);
      toast.error('Failed to add lead');
    } finally {
      setAddingLead(false);
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
      contacted: { label: 'Contacted', variant: 'default', className: 'bg-indigo-100 text-indigo-800' },
      human_handoff: { label: 'Human Handoff', variant: 'default', className: 'bg-purple-100 text-purple-800' },
      converted: { label: 'Converted', variant: 'default', className: 'bg-emerald-100 text-emerald-800' },
      do_not_contact: { label: 'Do Not Contact', variant: 'default', className: 'bg-red-100 text-red-800' },
    };

    // Add defensive programming to handle undefined or invalid status
    if (!status || !statusConfig[status]) {
      console.warn(`Invalid or undefined status: ${status}`);
      return (
        <Badge className="bg-gray-100 text-gray-800">
          Unknown
        </Badge>
      );
    }

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

    // Add defensive programming to handle undefined or invalid risk level
    if (!riskLevel || !riskConfig[riskLevel]) {
      console.warn(`Invalid or undefined risk level: ${riskLevel}`);
      return (
        <Badge className="bg-gray-100 text-gray-800">
          Unknown
        </Badge>
      );
    }

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
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="human_handoff">Human Handoff</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="do_not_contact">Do Not Contact</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              className="w-full sm:w-auto"
              onClick={() => setShowAddDialog(true)}
            >
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
                            <SelectItem value="contacted">Contacted</SelectItem>
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

      {/* Add Lead Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Add a new patient lead to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={newLeadForm.name}
                onChange={(e) => setNewLeadForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={newLeadForm.email}
                onChange={(e) => setNewLeadForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                value={newLeadForm.phone}
                onChange={(e) => setNewLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Initial Inquiry</label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md resize-none"
                rows={3}
                value={newLeadForm.initial_inquiry}
                onChange={(e) => setNewLeadForm(prev => ({ ...prev, initial_inquiry: e.target.value }))}
                placeholder="Enter initial inquiry or notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={addingLead}
            >
              Cancel
            </Button>
            <Button
              onClick={addLead}
              disabled={addingLead}
            >
              {addingLead ? 'Adding...' : 'Add Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 