// API Service for Bright Smile AI
// HARDCODED API KEY: 'bright-smile-agent-key' (for development purposes)
import {
  Lead,
  Message,
  DashboardOverview,
  LeadFunnel,
  RiskAnalysis,
  AIPerformance,
  RecentActivity,
  CampaignHistory,
  PerformanceMetrics,
  ConversationStats,
  OutreachResponse,
  RiskAnalysisResponse,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const AGENT_API_KEY = 'bright-smile-agent-key'; // Hardcoded for development

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('Making API request to:', url);
    console.log('API_BASE_URL:', API_BASE_URL);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    console.log('API response status:', response.status);
    console.log('API response ok:', response.ok);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Lead Management
  async getLeads(): Promise<Lead[]> {
    return this.request<Lead[]>('/leads/');
  }

  async getLead(id: number): Promise<Lead> {
    return this.request<Lead>(`/leads/${id}`);
  }

  async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'last_contact_at'>): Promise<Lead> {
    return this.request<Lead>('/leads/', {
      method: 'POST',
      body: JSON.stringify(lead),
    });
  }

  async updateLead(id: number, updates: Partial<Lead>): Promise<Lead> {
    return this.request<Lead>(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updateLeadStatus(id: number, status: Lead['status']): Promise<Lead> {
    return this.request<Lead>(`/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteLead(id: number): Promise<void> {
    return this.request<void>(`/leads/${id}`, {
      method: 'DELETE',
    });
  }

  async getLeadConversation(id: number): Promise<Message[]> {
    return this.request<Message[]>(`/leads/${id}/conversation`);
  }

  async simulateMessage(leadId: number, message: string): Promise<Message> {
    return this.request<Message>(`/leads/${leadId}/simulate-message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Message Management
  async createMessage(message: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
    return this.request<Message>('/messages/', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async createMessageFromLead(message: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
    return this.request<Message>('/messages/from-lead', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async getMessage(id: number): Promise<Message> {
    return this.request<Message>(`/messages/${id}`);
  }

  async deleteMessage(id: number): Promise<void> {
    return this.request<void>(`/messages/${id}`, {
      method: 'DELETE',
    });
  }

  async getLeadConversationMessages(leadId: number): Promise<Message[]> {
    return this.request<Message[]>(`/messages/lead/${leadId}/conversation`);
  }

  async getLeadConversationStats(leadId: number): Promise<ConversationStats> {
    return this.request<ConversationStats>(`/messages/lead/${leadId}/stats`);
  }

  // AI Agents
  async triggerOutreach(): Promise<OutreachResponse> {
    return this.request<OutreachResponse>('/agents/trigger-outreach', {
      method: 'POST',
      headers: {
        'X-API-Key': AGENT_API_KEY
      }
    });
  }

  async analyzeRisk(): Promise<RiskAnalysisResponse> {
    return this.request<RiskAnalysisResponse>('/agents/analyze-risk', {
      method: 'POST',
      headers: {
        'X-API-Key': AGENT_API_KEY
      }
    });
  }

  async scanLeadsForOpportunities(): Promise<{
    success: boolean;
    scan_type: string;
    results: {
      total_scanned: number;
      opportunities_identified: number;
      proactive_messages_sent: number;
      leads_escalated: number;
    };
    message: string;
  }> {
    return this.request('/agents/scan-leads', {
      method: 'POST',
      headers: {
        'X-API-Key': AGENT_API_KEY
      }
    });
  }

  async runComprehensiveAnalysis(): Promise<{
    success: boolean;
    analysis_type: string;
    results: {
      ai_lead_scanning: {
        total_scanned: number;
        opportunities_identified: number;
        proactive_messages_sent: number;
        leads_escalated: number;
      };
      risk_analysis: {
        total_analyzed: number;
        newly_at_risk: number;
        interventions_triggered: number;
        aggressive_offers_sent: number;
        moved_to_cold: number;
      };
      total_opportunities: number;
      total_interventions: number;
      leads_escalated: number;
    };
    message: string;
  }> {
    return this.request('/agents/run-comprehensive-analysis', {
      method: 'POST',
      headers: {
        'X-API-Key': AGENT_API_KEY
      }
    });
  }

  async getAgentStatus(): Promise<{
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
  }> {
    return this.request('/agents/status');
  }

  async testInstantReply(leadId: number, message: string): Promise<Message> {
    return this.request<Message>('/agents/test-instant-reply', {
      method: 'POST',
      headers: {
        'X-API-Key': AGENT_API_KEY
      },
      body: JSON.stringify({ lead_id: leadId, message }),
    });
  }

  async getCampaignHistory(): Promise<CampaignHistory[]> {
    const response = await this.request<{ campaigns: CampaignHistory[]; total_found: number }>('/agents/campaign-history');
    return response.campaigns || [];
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return this.request<PerformanceMetrics>('/agents/performance-metrics');
  }

  // Dashboard
  async getDashboardOverview(): Promise<DashboardOverview> {
    return this.request<DashboardOverview>('/dashboard/overview');
  }

  async getLeadFunnel(): Promise<LeadFunnel> {
    return this.request<LeadFunnel>('/dashboard/lead-funnel');
  }

  async getRiskAnalysis(): Promise<RiskAnalysis> {
    return this.request<RiskAnalysis>('/dashboard/risk-analysis');
  }

  async getAIPerformance(): Promise<AIPerformance> {
    return this.request<AIPerformance>('/dashboard/ai-performance');
  }

  async getRecentActivity(): Promise<RecentActivity> {
    return this.request<RecentActivity>('/dashboard/recent-activity');
  }

  async exportData(): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/dashboard/export-data`);
    if (!response.ok) {
      throw new Error('Export failed');
    }
    return response.blob();
  }


}

export const apiService = new ApiService(); 