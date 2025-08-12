'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Loader2
} from 'lucide-react';
import { apiService } from '@/lib/api';
import { Lead, Message } from '@/types';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

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
  const [conversationLoading, setConversationLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

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
      const validatedData = data.map(lead => {
        if (!lead.status) {
          return { ...lead, status: 'new' as Lead['status'] };
        }
        if (!lead.risk_level) {
          return { ...lead, risk_level: 'medium' as Lead['risk_level'] };
        }
        return lead;
      });
      setLeads(validatedData);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      toast.error('Failed to load leads');
      setLeads([]);
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
      new: { label: 'New', className: 'bg-blue-100 text-blue-800' },
      active: { label: 'Active', className: 'bg-green-100 text-green-800' },
      at_risk: { label: 'At Risk', className: 'bg-yellow-100 text-yellow-800' },
      cold: { label: 'Cold', className: 'bg-gray-100 text-gray-800' },
      contacted: { label: 'Contacted', className: 'bg-indigo-100 text-indigo-800' },
      human_handoff: { label: 'Human Handoff', className: 'bg-purple-100 text-purple-800' },
      converted: { label: 'Converted', className: 'bg-emerald-100 text-emerald-800' },
      do_not_contact: { label: 'Do Not Contact', className: 'bg-red-100 text-red-800' },
    };

    if (!status || !statusConfig[status]) {
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

    if (!riskLevel || !riskConfig[riskLevel]) {
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
    setShowLeadDetails(true);
    await fetchConversation(lead.id);
  };

  const fetchConversation = async (leadId: number) => {
    try {
      setConversationLoading(true);
      const messages = await apiService.getLeadConversation(leadId);
      // Reverse the messages to show newest first
      setConversation(messages.reverse());
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      setConversation([]);
      toast.error('Failed to load conversation');
    } finally {
      setConversationLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: number, newStatus: Lead['status']) => {
    try {
      await apiService.updateLeadStatus(leadId, newStatus);
      toast.success('Lead status updated successfully');
      fetchLeads();
    } catch (error) {
      console.error('Failed to update lead status:', error);
      toast.error('Failed to update lead status');
    }
  };

  const simulateMessage = async (leadId: number, message: string) => {
    if (!message.trim()) return;
    
    try {
      setSendingMessage(true);
      await apiService.simulateMessage(leadId, message);
      toast.success('Message sent successfully');
      // Refresh conversation
      if (selectedLead) {
        const messages = await apiService.getLeadConversation(selectedLead.id);
        setConversation(messages.reverse());
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading leads...</p>
        </div>
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
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {leads.length === 0 ? 'No leads found' : 'No leads match your search criteria'}
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {/* Lead Details Dialog */}
      <Dialog open={showLeadDetails} onOpenChange={setShowLeadDetails}>
        <DialogContent className="w-[95vw] h-fit max-w-none max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl">Lead Details - {selectedLead?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedLead && (
            <Tabs defaultValue="conversation" className="w-full h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="conversation">Conversation</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="flex-1 overflow-y-auto max-h-[400px] space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-blue-600" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <UserCheck className="h-5 w-5 text-gray-500" />
                        <div>
                          <div className="font-semibold text-gray-900">{selectedLead.name}</div>
                          <div className="text-sm text-gray-500">Lead ID: {selectedLead.id}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="h-5 w-5 text-gray-500" />
                        <span className="text-gray-900">{selectedLead.email}</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="h-5 w-5 text-gray-500" />
                        <span className="text-gray-900">{selectedLead.phone}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Lead Status & Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Status:</span>
                        {getStatusBadge(selectedLead.status)}
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Risk Level:</span>
                        {getRiskBadge(selectedLead.risk_level)}
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Sentiment Score:</span>
                        <span className={`font-semibold ${
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
                    <CardTitle className="text-xl">Initial Inquiry</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-gray-800 leading-relaxed">{selectedLead.initial_inquiry}</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div>
                          <div className="font-medium">Lead Created</div>
                          <div className="text-sm text-gray-500">{formatDate(selectedLead.created_at)}</div>
                        </div>
                      </div>
                      {selectedLead.last_contact_at && (
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <div>
                            <div className="font-medium">Last Contact</div>
                            <div className="text-sm text-gray-500">{formatDate(selectedLead.last_contact_at)}</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

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
                </div>
              </TabsContent>

              <TabsContent value="conversation" className="flex-1 flex flex-col">
                <div className="flex gap-3 mb-4">
                  <Input
                    placeholder="Type a message to simulate..."
                    className="flex-1"
                    id="simulate-message"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        if (input.value.trim()) {
                          simulateMessage(selectedLead.id, input.value.trim());
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      const input = document.getElementById('simulate-message') as HTMLInputElement;
                      if (input.value.trim()) {
                        simulateMessage(selectedLead.id, input.value.trim());
                        input.value = '';
                      }
                    }}
                    disabled={sendingMessage}
                  >
                    {sendingMessage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send'
                    )}
                  </Button>
                </div>

                {conversationLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <p className="text-gray-600">Loading conversation...</p>
                    </div>
                  </div>
                ) : conversation.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation by sending a message</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto border rounded-lg p-4 bg-gray-50" style={{ maxHeight: '400px' }}>
                    <div className="space-y-4 w-full">
                      {conversation.map((message) => (
                        <div
                          key={message.id}
                          className={`flex w-full ${
                            message.sender === 'lead' ? 'justify-start' : 'justify-end'
                          }`}
                        >
                          <div
                            className={`max-w-md rounded-lg px-4 py-3 shadow-sm ${
                              message.sender === 'lead'
                                ? 'bg-white border border-gray-200 text-gray-900'
                                : message.sender === 'ai'
                                ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-blue-900'
                                : 'bg-gradient-to-r from-green-50 to-green-100 border border-green-200 text-green-900'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                message.sender === 'lead'
                                  ? 'bg-gray-500 text-white'
                                  : message.sender === 'ai'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-green-500 text-white'
                              }`}>
                                {message.sender === 'lead' ? 'P' : 
                                 message.sender === 'ai' ? 'AI' : 'S'}
                              </div>
                              <div className="text-xs font-medium text-gray-600">
                                {message.sender === 'lead' ? 'Patient' : 
                                 message.sender === 'ai' ? 'AI Assistant' : 'Staff Member'}
                              </div>
                              <div className="text-xs text-gray-400 ml-auto">
                                {formatDate(message.created_at)}
                              </div>
                            </div>
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </div>
                            {message.intent_classification && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <span className="text-xs text-gray-500">
                                  Intent: {message.intent_classification.replace(/_/g, ' ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="flex-1 overflow-y-auto max-h-[400px] space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Engagement Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{conversation.length}</div>
                          <div className="text-sm text-gray-600">Total Messages</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {conversation.filter(m => m.sender === 'lead').length}
                          </div>
                          <div className="text-sm text-gray-600">Lead Messages</div>
                        </div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {conversation.filter(m => m.sender === 'ai').length}
                        </div>
                        <div className="text-sm text-gray-600">AI Responses</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        Risk Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600">Current Risk:</span>
                          {getRiskBadge(selectedLead.risk_level)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Sentiment Trend:</span>
                          <span className={`font-semibold ${
                            selectedLead.sentiment_score > 0.5 ? 'text-green-600' :
                            selectedLead.sentiment_score < -0.5 ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {selectedLead.sentiment_score > 0.5 ? 'Positive' :
                             selectedLead.sentiment_score < -0.5 ? 'Negative' : 'Neutral'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-2">Sentiment Score</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              selectedLead.sentiment_score > 0.5 ? 'bg-green-500' :
                              selectedLead.sentiment_score < -0.5 ? 'bg-red-500' : 'bg-yellow-500'
                            }`}
                            style={{ 
                              width: `${Math.abs(selectedLead.sentiment_score) * 100}%`,
                              marginLeft: selectedLead.sentiment_score < 0 ? 'auto' : '0'
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 text-center">
                          {selectedLead.sentiment_score.toFixed(2)}
                        </div>
                      </div>
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