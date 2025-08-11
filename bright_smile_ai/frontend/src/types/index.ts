export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  initial_inquiry: string;
  status: 'new' | 'active' | 'at_risk' | 'cold' | 'contacted' | 'human_handoff' | 'converted' | 'do_not_contact';
  risk_level: 'low' | 'medium' | 'high';
  sentiment_score: number;
  reason_for_cold?: string;
  do_not_contact: boolean;
  created_at: string;
  last_contact_at?: string;
}

export interface Message {
  id: number;
  lead_id: number;
  sender: 'lead' | 'ai' | 'human';
  content: string;
  created_at: string;
}

export interface Offer {
  id: number;
  offer_title: string;
  description: string;
  valid_for_service: string;
  is_active: boolean;
}

export interface Testimonial {
  id: number;
  service_category: string;
  snippet_text: string;
}

export interface FinancialExplainer {
  id: number;
  lead_id: number;
  secure_url_token: string;
  is_accessed: boolean;
  procedure_name: string;
  total_cost: number;
  estimated_insurance: number;
  payment_options: Record<string, number>;
  created_at: string;
}

export interface SystemEvent {
  id: number;
  lead_id?: number;
  event_type: string;
  details: string;
  created_at: string;
}

export interface DashboardOverview {
  period_days: number;
  lead_metrics: {
    total_leads: number;
    new_leads_period: number;
    active_leads: number;
    converted_leads: number;
    conversion_rate: number;
    status_distribution: Record<string, number>;
  };
  engagement_metrics: {
    total_messages_period: number;
    ai_responses_period: number;
    response_rate: number;
  };
  asset_metrics: {
    financial_explainers_created: number;
    financial_explainers_accessed: number;
    access_rate: number;
  };
  system_health: {
    period_hours: number;
    total_events: number;
    error_events: number;
    warning_events: number;
    ai_interactions: number;
    error_rate_percent: number;
    status: string;
  };
}

export interface LeadFunnel {
  period_days: number;
  total_leads_in_period: number;
  funnel_counts: {
    new: number;
    active: number;
    at_risk: number;
    cold: number;
    contacted: number;
    human_handoff: number;
    converted: number;
    do_not_contact: number;
  };
  funnel_rates: {
    new: number;
    active: number;
    at_risk: number;
    cold: number;
    human_handoff: number;
    converted: number;
    do_not_contact: number;
  };
  key_metrics: {
    engagement_rate: number;
    conversion_rate: number;
    drop_off_rate: number;
  };
}

export interface RiskAnalysis {
  high_risk_leads: Lead[];
  medium_risk_leads: Lead[];
  low_risk_leads: Lead[];
  total_analyzed: number;
}

export interface AIPerformance {
  total_conversations: number;
  successful_handoffs: number;
  financial_explainer_offers: number;
  average_sentiment_improvement: number;
}

export interface RecentActivity {
  events: SystemEvent[];
  messages: Message[];
  leads: Lead[];
}

export interface CampaignHistory {
  id: number;
  campaign_type: string;
  leads_contacted: number;
  responses_received: number;
  conversions: number;
  created_at: string;
}

export interface PerformanceMetrics {
  outreach_conversion_rate: number;
  ai_response_accuracy: number;
  lead_engagement_rate: number;
  time_to_conversion: number;
}

export interface ConversationStats {
  total_messages: number;
  lead_messages: number;
  ai_messages: number;
  human_messages: number;
  average_response_time: number;
  sentiment_trend: number[];
}

export interface OutreachResponse {
  success: boolean;
  campaign_type: string;
  results: {
    leads_processed: number;
    leads_contacted: number;
    leads_skipped: number;
  };
  message: string;
}

export interface RiskAnalysisResponse {
  success: boolean;
  analysis_type: string;
  results: {
    total_analyzed: number;
    newly_at_risk: number;
    interventions_triggered: number;
    moved_to_cold: number;
  };
  message: string;
} 