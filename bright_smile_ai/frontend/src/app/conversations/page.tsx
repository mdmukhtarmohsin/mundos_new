'use client';

import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  MessageSquare, 
  Bot, 
  User, 
  Clock,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export default function ConversationsPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor and manage all patient conversations and AI interactions
          </p>
        </div>
        
        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Search by patient name, message content, or conversation ID..."
                className="flex-1"
              />
              <Button>Search</Button>
            </div>
          </CardContent>
        </Card>

        {/* Conversation Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">156</div>
              <p className="text-xs text-gray-500 mt-1">
                Active message threads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">AI Responses</CardTitle>
              <Bot className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">1,247</div>
              <p className="text-xs text-gray-500 mt-1">
                AI-generated messages
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">45s</div>
              <p className="text-xs text-gray-500 mt-1">
                Average response time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Engagement Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">78.9%</div>
              <p className="text-xs text-gray-500 mt-1">
                Patient engagement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Conversations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  id: 1,
                  patient: 'John Smith',
                  lastMessage: 'Thank you for the financial breakdown. When can I schedule a consultation?',
                  sender: 'patient',
                  timestamp: '2 minutes ago',
                  status: 'active',
                  messageCount: 8,
                },
                {
                  id: 2,
                  patient: 'Sarah Johnson',
                  lastMessage: 'I have a question about the Invisalign treatment process...',
                  sender: 'ai',
                  timestamp: '15 minutes ago',
                  status: 'active',
                  messageCount: 12,
                },
                {
                  id: 3,
                  patient: 'Mike Davis',
                  lastMessage: 'The AI provided excellent information about dental implants.',
                  sender: 'patient',
                  timestamp: '1 hour ago',
                  status: 'human_handoff',
                  messageCount: 15,
                },
                {
                  id: 4,
                  patient: 'Emily Wilson',
                  lastMessage: 'AI generated financial explainer for root canal treatment.',
                  sender: 'ai',
                  timestamp: '2 hours ago',
                  status: 'converted',
                  messageCount: 6,
                },
              ].map((conversation) => (
                <div key={conversation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{conversation.patient}</h4>
                        <Badge 
                          className={
                            conversation.status === 'active' ? 'bg-green-100 text-green-800' :
                            conversation.status === 'human_handoff' ? 'bg-purple-100 text-purple-800' :
                            'bg-emerald-100 text-emerald-800'
                          }
                        >
                          {conversation.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 max-w-md truncate">
                        {conversation.lastMessage}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          {conversation.sender === 'ai' ? (
                            <Bot className="h-3 w-3 mr-1" />
                          ) : (
                            <User className="h-3 w-3 mr-1" />
                          )}
                          {conversation.sender === 'ai' ? 'AI' : 'Patient'}
                        </span>
                        <span>{conversation.timestamp}</span>
                        <span>{conversation.messageCount} messages</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Performance Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Conversation Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Response Quality</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Accuracy Rate</span>
                    <span className="font-medium">94.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Patient Satisfaction</span>
                    <span className="font-medium">87.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Human Handoff Rate</span>
                    <span className="font-medium">12.4%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Engagement Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Response Rate</span>
                    <span className="font-medium">78.9%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Financial Explainer Views</span>
                    <span className="font-medium">67.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Appointment Requests</span>
                    <span className="font-medium">23.1%</span>
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