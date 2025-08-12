# Bright Smile AI - Comprehensive System Documentation

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Pydantic Schemas](#pydantic-schemas)
4. [API Endpoints](#api-endpoints)
5. [Services](#services)
6. [Data Models](#data-models)

---

## 🏥 System Overview

**Bright Smile AI** is an AI Patient Advocate system for dental practices, designed to:
- Automate patient communication and lead management
- Provide intelligent risk analysis and proactive outreach
- Generate financial explainers and payment plans
- Track patient engagement and conversion metrics

### 🔧 Technology Stack
- **Backend**: FastAPI + Python
- **Database**: PostgreSQL (Neon Cloud)
- **AI**: OpenAI GPT-4o-mini + LangChain
- **ORM**: SQLAlchemy + Alembic migrations
- **Frontend**: Next.js 15 + React 19 + TypeScript

---

## 🗄️ Database Schema

The Bright Smile AI system uses a PostgreSQL database with 8 core tables that work together to manage patient leads, track AI interactions, and monitor system performance.

### Core Tables

#### 1. **leads** - Patient Lead Management
This is the central table that stores all patient lead information and tracks their journey through the dental practice's conversion funnel.

```sql
CREATE TABLE leads (
    id INTEGER PRIMARY KEY,                              -- Unique identifier for each lead
    name VARCHAR(255) NOT NULL,                          -- Patient's full name
    email VARCHAR(255) NOT NULL UNIQUE,                  -- Email address (unique constraint)
    phone VARCHAR(50) UNIQUE,                            -- Phone number (optional, unique if provided)
    initial_inquiry TEXT,                                -- The first question/message from the patient
    status lead_status NOT NULL DEFAULT 'NEW',           -- Current stage in the conversion process
    risk_level lead_risk_level NOT NULL DEFAULT 'LOW',   -- AI-calculated risk of losing this lead
    sentiment_score FLOAT,                               -- AI-analyzed mood/sentiment (-1 to 1 scale)
    reason_for_cold TEXT,                                -- Manual note explaining why lead went cold
    do_not_contact BOOLEAN NOT NULL DEFAULT FALSE,       -- Compliance flag to stop all outreach
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),   -- When lead first entered system
    last_contact_at TIMESTAMP WITH TIME ZONE             -- Last interaction timestamp
);
```

**Business Logic:**
- **Status Workflow**: NEW → ACTIVE → [AT_RISK/COLD] → CONTACTED → CONVERTED/DO_NOT_CONTACT
- **Risk Assessment**: AI analyzes response patterns, timing, and sentiment to assign risk levels
- **Compliance**: `do_not_contact` flag ensures HIPAA and privacy compliance

**Enums:**
- `lead_status`: NEW, ACTIVE, AT_RISK, COLD, CONTACTED, HUMAN_HANDOFF, CONVERTED, DO_NOT_CONTACT
- `lead_risk_level`: LOW, MEDIUM, HIGH

**Indexes:**
- `ix_leads_email` (unique) - Fast lead lookup by email
- `ix_leads_phone` (unique) - Prevents duplicate phone numbers
- `ix_leads_status` - Efficient filtering by conversion stage
- `ix_leads_last_contact_at` - Quick identification of stale leads

#### 2. **messages** - Communication History
Stores all conversations between leads and the AI system, enabling context-aware responses and sentiment tracking.

```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,  -- Links to specific lead
    sender sender_type NOT NULL,                                       -- Who sent the message
    content TEXT NOT NULL,                                             -- The actual message content
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),                 -- Message timestamp
    intent_classification VARCHAR(100),                                -- AI-detected intent (e.g., "price_inquiry", "appointment_request")
    confidence_score FLOAT                                             -- AI confidence in the response (0-1)
);
```

**Business Logic:**
- **Conversation Threading**: All messages linked to lead_id maintain conversation context
- **Intent Recognition**: AI classifies message intent to trigger appropriate responses
- **Quality Metrics**: confidence_score helps identify when human intervention is needed

**Enums:**
- `sender_type`: LEAD (patient), AI (system), HUMAN (staff member)

#### 3. **ai_interactions** - AI Usage Tracking
Comprehensive monitoring of all AI model usage for cost tracking, performance analysis, and compliance reporting.

```sql
CREATE TABLE ai_interactions (
    id INTEGER PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,  -- Associated lead
    interaction_type VARCHAR(50) NOT NULL,                            -- Type of AI operation
    model_used VARCHAR(100),                                          -- Which AI model (e.g., "gpt-4o-mini")
    prompt_tokens INTEGER,                                            -- Input token count
    completion_tokens INTEGER,                                        -- Output token count  
    total_cost DECIMAL(8,4),                                         -- Actual cost in USD
    response_time_ms INTEGER,                                        -- Performance metric
    success BOOLEAN,                                                 -- Whether operation succeeded
    error_message TEXT,                                              -- Error details if failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Business Logic:**
- **Cost Control**: Track exact AI usage costs for budget management
- **Performance Monitoring**: response_time_ms helps optimize user experience
- **Error Analysis**: Track and resolve AI failures quickly
- **Interaction Types**: "instant_reply", "risk_analysis", "content_generation", "sentiment_analysis"

#### 4. **lead_scores** - AI Scoring System  
Sophisticated scoring system that evaluates lead quality and conversion probability using multiple AI-driven metrics.

```sql
CREATE TABLE lead_scores (
    id INTEGER PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    engagement_score FLOAT,        -- How actively they participate in conversations (0-100)
    intent_score FLOAT,           -- Likelihood of actual treatment interest (0-100)
    urgency_score FLOAT,          -- How quickly they need treatment (0-100)
    budget_score FLOAT,           -- Ability/willingness to pay (0-100)
    total_score FLOAT,            -- Weighted combination of all scores
    score_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Business Logic:**
- **Predictive Analytics**: Helps prioritize which leads to focus human attention on
- **Resource Allocation**: High-scoring leads get faster response times
- **Conversion Optimization**: Identifies patterns in successful lead conversions
- **Score Weighting**: total_score = (engagement × 0.3) + (intent × 0.4) + (urgency × 0.2) + (budget × 0.1)

#### 5. **financial_explainers** - Payment Information
Generates and tracks secure, personalized payment information pages that help patients understand treatment costs and options.

```sql
CREATE TABLE financial_explainers (
    id INTEGER PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    secure_url_token VARCHAR(255) NOT NULL UNIQUE,        -- UUID-based secure access token
    is_accessed BOOLEAN DEFAULT FALSE,                     -- Has the patient viewed this?
    access_count INTEGER DEFAULT 0,                        -- Number of times viewed
    first_accessed_at TIMESTAMP WITH TIME ZONE,           -- When first opened
    last_accessed_at TIMESTAMP WITH TIME ZONE,            -- Most recent view
    procedure_name TEXT NOT NULL,                          -- Treatment description
    total_cost DECIMAL(10,2) NOT NULL,                     -- Full treatment cost
    estimated_insurance DECIMAL(10,2),                     -- Insurance coverage estimate
    out_of_pocket_cost DECIMAL(10,2) NOT NULL,            -- Patient's responsibility
    payment_options JSONB,                                -- Payment plan details as JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Business Logic:**
- **Privacy by Design**: secure_url_token prevents unauthorized access to financial info
- **Engagement Tracking**: Monitor if patients actually review their payment options
- **Conversion Catalyst**: Clear cost breakdowns reduce price-related objections
- **Payment Plans**: JSON structure stores flexible payment terms (12, 24, 36 months, etc.)

**Example payment_options JSON:**
```json
{
  "payment_plans": [
    {"months": 12, "monthly_payment": 208.33, "total": 2500.00},
    {"months": 24, "monthly_payment": 104.17, "total": 2500.00}
  ],
  "insurance_accepted": ["Delta Dental", "Cigna", "Aetna"],
  "financing_options": ["CareCredit", "LendingClub Patient Solutions"]
}
```

### Supporting Tables

#### 6. **system_events** - System Activity Logs
Comprehensive audit log of all system activities, essential for monitoring, debugging, and compliance reporting.

```sql
CREATE TABLE system_events (
    id INTEGER PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,  -- Optional lead association
    event_type VARCHAR(100) NOT NULL,                        -- Categorized event type
    details TEXT,                                            -- Human-readable description
    severity VARCHAR(20),                                    -- info, warning, error, critical
    processed BOOLEAN DEFAULT FALSE,                         -- For automated follow-up actions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Event Types Include:**
- `lead_created`, `message_sent`, `risk_analysis_completed`
- `outreach_campaign_started`, `financial_explainer_generated`
- `ai_error`, `system_startup`, `compliance_violation`

#### 7. **offers** - Promotional Offers
Dynamic promotional content system that AI agents can reference when engaging with price-sensitive leads.

```sql
CREATE TABLE offers (
    id INTEGER PRIMARY KEY,
    offer_title VARCHAR(255) NOT NULL,           -- "New Patient Special: 50% Off Cleaning"
    description TEXT NOT NULL,                   -- Detailed offer terms
    valid_for_service VARCHAR(100),              -- Which treatments this applies to
    is_active BOOLEAN DEFAULT TRUE,              -- Can be disabled without deletion
    discount_percentage FLOAT,                   -- Percentage discount (0.15 = 15%)
    discount_amount DECIMAL(10,2),              -- Fixed dollar amount discount
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE          -- Automatic expiration
);
```

#### 8. **testimonials** - Patient Reviews
Curated patient testimonials that AI agents can dynamically include in responses to build trust and credibility.

```sql
CREATE TABLE testimonials (
    id INTEGER PRIMARY KEY,
    service_category VARCHAR(100) NOT NULL,      -- "dental_implants", "orthodontics", "cleaning"
    snippet_text TEXT NOT NULL,                  -- The actual testimonial quote
    patient_name VARCHAR(255),                   -- "Sarah K." (anonymized)
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),  -- 1-5 star rating
    is_verified BOOLEAN DEFAULT FALSE,           -- Verified authentic testimonial
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**AI Integration**: When leads ask about specific services, AI can include relevant testimonials in responses to build trust.

---

## 📝 Pydantic Schemas

### Lead Schemas

#### **LeadBase**
```python
class LeadBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    initial_inquiry: Optional[str] = None
```

#### **LeadCreate**
```python
class LeadCreate(LeadBase):
    pass  # Inherits all fields from LeadBase
```

#### **LeadUpdate**
```python
class LeadUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    initial_inquiry: Optional[str] = None
    status: Optional[LeadStatus] = None
    risk_level: Optional[LeadRiskLevel] = None
    sentiment_score: Optional[float] = None
    reason_for_cold: Optional[str] = None
    do_not_contact: Optional[bool] = None
```

#### **LeadRead**
```python
class LeadRead(LeadBase):
    id: int
    status: LeadStatus
    risk_level: LeadRiskLevel
    sentiment_score: float
    reason_for_cold: Optional[str]
    do_not_contact: bool
    created_at: datetime
    last_contact_at: Optional[datetime]
```

### Message Schemas

#### **MessageBase**
```python
class MessageBase(BaseModel):
    content: str
    sender: SenderType
```

#### **MessageCreate**
```python
class MessageCreate(MessageBase):
    lead_id: int
```

#### **MessageRead**
```python
class MessageRead(MessageBase):
    id: int
    lead_id: int
    created_at: datetime
    intent_classification: Optional[str]
    confidence_score: Optional[float]
```

### Financial Explainer Schemas

#### **FinancialExplainerCreate**
```python
class FinancialExplainerCreate(BaseModel):
    lead_id: int
    procedure_name: str
    total_cost: Decimal
    estimated_insurance: Optional[Decimal]
    out_of_pocket_cost: Decimal
    payment_options: Optional[Dict[str, Any]]
```

#### **FinancialExplainerRead**
```python
class FinancialExplainerRead(BaseModel):
    id: int
    lead_id: int
    secure_url_token: str
    is_accessed: bool
    access_count: int
    procedure_name: str
    total_cost: Decimal
    estimated_insurance: Optional[Decimal]
    out_of_pocket_cost: Decimal
    payment_options: Optional[Dict[str, Any]]
    created_at: datetime
```

---

## 🚀 API Endpoints

### Base URL: `http://localhost:8000/api/v1`

### Lead Management Endpoints

#### **POST /leads/**
Create a new lead
```python
Request Body: LeadCreate
Response: LeadRead (201 Created)
```

#### **GET /leads/**
Get leads with filtering and pagination
```python
Query Parameters:
- status: Optional[LeadStatus]
- risk_level: Optional[LeadRiskLevel]
- search: Optional[str]
- skip: int = 0
- limit: int = 100

Response: List[LeadRead]
```

#### **GET /leads/{lead_id}**
Get specific lead with messages
```python
Path Parameters:
- lead_id: int

Query Parameters:
- include_messages: bool = True

Response: LeadReadWithMessages
```

#### **PUT /leads/{lead_id}**
Update lead information
```python
Path Parameters:
- lead_id: int

Request Body: LeadUpdate
Response: LeadRead
```

#### **DELETE /leads/{lead_id}**
Soft delete a lead
```python
Path Parameters:
- lead_id: int

Response: {"message": "Lead deleted successfully"}
```

#### **PATCH /leads/{lead_id}/status**
Update lead status
```python
Path Parameters:
- lead_id: int

Request Body: LeadStatusUpdate
Response: LeadRead
```

### Message Endpoints

#### **POST /messages/**
Create a new message
```python
Request Body: MessageCreate
Response: MessageRead (201 Created)
```

#### **GET /messages/lead/{lead_id}**
Get messages for specific lead
```python
Path Parameters:
- lead_id: int

Query Parameters:
- skip: int = 0
- limit: int = 100

Response: List[MessageRead]
```

### AI Agent Endpoints

The AI Agent system provides intelligent automation for patient communication and lead management. These endpoints control various AI-powered workflows.

#### **POST /agents/trigger-outreach**
Manually trigger the proactive outreach campaign for cold leads
```python
Headers:
- X-API-Key: string (required) - Authentication: "bright-smile-agent-key"

Response: {
    "success": boolean,
    "campaign_type": "proactive_outreach",
    "results": {
        "leads_contacted": integer,      // Number of leads that received messages
        "leads_skipped": integer,        // Leads that didn't meet criteria
        "messages_sent": integer,        // Total messages generated
        "estimated_conversions": integer  // Predicted successful re-engagements
    },
    "message": string                    // Human-readable summary
}
```

**Business Logic:**
- Identifies leads with status "COLD" that haven't been contacted recently
- Uses AI to generate personalized re-engagement messages
- Implements escalating outreach strategy: gentle nudge → social proof → incentive offer
- Respects `do_not_contact` flags and cooldown periods

#### **POST /agents/analyze-risk**  
Trigger comprehensive risk analysis for all active leads
```python
Headers:
- X-API-Key: string (required)

Response: {
    "success": boolean,
    "analysis_type": "risk_assessment", 
    "results": {
        "total_leads_analyzed": integer,
        "newly_at_risk": integer,        // Leads flagged as AT_RISK
        "interventions_triggered": integer, // Automated outreach sent
        "risk_distribution": {
            "low": integer,
            "medium": integer, 
            "high": integer
        }
    },
    "message": string
}
```

**AI Analysis Factors:**
- **Response Time**: Delayed responses indicate disengagement
- **Sentiment Decline**: AI tracks mood changes in conversation
- **Engagement Patterns**: Reduced message frequency or length
- **Question Types**: Shift from treatment to price questions indicates price sensitivity

#### **GET /agents/status**
Get current status and health of all AI agents
```python
Response: {
    "system_health": {
        "total_events_today": integer,
        "error_rate": float,
        "avg_response_time_ms": float
    },
    "risk_analysis": {
        "total_active_leads": integer,
        "high_risk_count": integer,
        "risk_distribution": {...}
    },
    "recent_activity": [...],           // Last 5 agent activities
    "agents": {
        "instant_reply_agent": {
            "status": "active",         // Always available for real-time responses
            "description": "Responds to incoming lead messages in real-time"
        },
        "proactive_outreach_agent": {
            "status": "scheduled",      // Runs daily via APScheduler
            "description": "Re-engages cold leads based on qualification rules"
        },
        "risk_analyzer": {
            "status": "scheduled",      // Runs every 15 minutes
            "description": "Identifies at-risk leads and triggers interventions"
        }
    }
}
```

#### **POST /agents/test-instant-reply**
Test the instant reply AI agent with a sample message
```python
Request Body: {
    "lead_id": integer,
    "test_message": string,
    "context": optional[object]         // Additional conversation context
}

Response: {
    "reply": string,                    // Generated AI response
    "confidence": float,                // AI confidence score (0-1)
    "intent_classification": string,    // Detected intent
    "suggested_actions": [string],      // Recommended follow-up actions
    "processing_time_ms": integer,
    "tokens_used": {
        "prompt": integer,
        "completion": integer,
        "total_cost": float
    }
}
```

**Use Cases:**
- Quality assurance testing of AI responses
- Training staff on AI capabilities  
- Debugging conversation flows
- A/B testing response strategies

#### **GET /agents/campaign-history**
Get historical data on outreach campaigns and risk analysis runs
```python
Query Parameters:
- limit: integer = 20               // Maximum number of campaigns to return

Response: {
    "campaigns": [
        {
            "id": integer,
            "campaign_type": string,    // "outreach_campaign_cold_leads", "risk_analysis", etc.
            "details": string,          // Human-readable campaign summary
            "created_at": string,       // ISO datetime
            "success": boolean          // Whether campaign completed successfully
        }
    ],
    "total_found": integer
}
```

**Campaign Types Tracked:**
- `outreach_campaign_cold_leads`: Proactive re-engagement campaigns
- `outreach_campaign_gentle_nudge`: Soft follow-up messages
- `outreach_campaign_social_proof`: Testimonial-based outreach
- `outreach_campaign_incentive_offer`: Discount/promotion campaigns
- `risk_analysis`: Comprehensive lead risk assessment runs

#### **GET /agents/performance-metrics**
Get detailed AI performance analytics
```python
Query Parameters:
- hours: integer = 24               // Time period for metrics

Response: {
    "total_interactions": integer,
    "success_rate": float,          // Percentage of successful AI calls
    "avg_response_time": float,     // Average AI response time in ms
    "total_cost": decimal,          // Total AI usage cost in USD
    "model_usage": {
        "gpt-4o-mini": integer,     // Count by model type
        "gpt-4": integer
    },
    "daily_stats": [
        {
            "date": "2025-08-12",
            "interactions": integer,
            "cost": decimal,
            "avg_confidence": float
        }
    ],
    "interaction_types": {
        "instant_reply": integer,
        "risk_analysis": integer,
        "content_generation": integer
    }
}
```

### Financial Explainer Endpoints

#### **POST /financial-explainers/**
Create financial explainer
```python
Request Body: FinancialExplainerCreate
Response: FinancialExplainerRead (201 Created)
```

#### **GET /financial-explainers/{token}**
Access financial explainer by secure token
```python
Path Parameters:
- token: str

Response: FinancialExplainerRead
```

#### **GET /financial-explainers/lead/{lead_id}**
Get financial explainers for lead
```python
Path Parameters:
- lead_id: int

Response: List[FinancialExplainerRead]
```

### Dashboard Endpoints

#### **GET /dashboard/overview**
Get dashboard overview statistics
```python
Response: {
    "total_leads": int,
    "active_leads": int,
    "at_risk_leads": int,
    "converted_leads": int,
    "conversion_rate": float,
    "avg_response_time": float,
    "ai_interactions_today": int,
    "cost_today": Decimal
}
```

#### **GET /dashboard/lead-funnel**
Get lead funnel analytics
```python
Query Parameters:
- days: int = 30

Response: {
    "funnel_data": List[Dict],
    "conversion_rates": Dict[str, float],
    "daily_metrics": List[Dict]
}
```

#### **GET /dashboard/ai-performance**
Get AI performance metrics
```python
Query Parameters:
- days: int = 7

Response: {
    "total_interactions": int,
    "success_rate": float,
    "avg_response_time": float,
    "total_cost": Decimal,
    "model_usage": Dict[str, int],
    "daily_stats": List[Dict]
}
```

---

## 🔧 Services

### Core Services

#### **SystemLogger**
- Event logging and tracking
- Severity-based categorization
- Lead-specific activity logging

#### **AssetGenerator**
- Dynamic content generation
- Image and document creation
- Template management

#### **EngagementEngine**
- Engagement scoring algorithms
- Behavioral pattern analysis
- Conversion prediction

#### **RiskAnalyzer**
- Lead risk assessment
- Pattern recognition
- Automated interventions

### AI Agent Services

#### **InstantReplyAgent**
- Real-time message processing
- Context-aware responses
- Intent classification

#### **ProactiveOutreachAgent**
- Cold lead identification
- Automated re-engagement
- Personalized messaging

---

## 📊 Data Models

### Enumerations

```python
class LeadStatus(str, Enum):
    NEW = "NEW"
    ACTIVE = "ACTIVE" 
    AT_RISK = "AT_RISK"
    COLD = "COLD"
    CONTACTED = "CONTACTED"
    HUMAN_HANDOFF = "HUMAN_HANDOFF"
    CONVERTED = "CONVERTED"
    DO_NOT_CONTACT = "DO_NOT_CONTACT"

class LeadRiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class SenderType(str, Enum):
    LEAD = "LEAD"
    AI = "AI"
    HUMAN = "HUMAN"
```

### Configuration Settings

```python
class Settings(BaseSettings):
    # Database
    database_url: str
    
    # AI Configuration
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"
    openai_temperature: float = 0.7
    
    # Risk Analysis
    risk_analysis_interval_minutes: int = 15
    sentiment_threshold_at_risk: float = -0.3
    response_time_threshold_hours: int = 24
    
    # Cold Lead Outreach
    cold_lead_cooldown_days: int = 14
    gentle_nudge_days: int = 14
    social_proof_days: int = 30
    incentive_offer_days: int = 45
    
    # Financial Configuration
    default_procedure_cost: float = 2500.0
    default_insurance_coverage: float = 0.5
    payment_plan_options: str = "12,24,36"
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True
```

---

## 🔐 Security Features

### Authentication & Authorization
- Agent API key authentication
- Secure token-based access for financial explainers
- Rate limiting on API endpoints

### Data Protection
- PII encryption for sensitive patient data
- HIPAA-compliant logging practices
- Secure database connections with SSL

### Monitoring & Compliance
- Comprehensive audit logging
- System event tracking
- Automated compliance reporting

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- PostgreSQL database
- OpenAI API key

### Installation
1. Clone the repository
2. Set up virtual environment: `python -m venv venv`
3. Install dependencies: `pip install -r requirements.txt`
4. Configure environment variables in `.env`
5. Run migrations: `alembic upgrade head`
6. Start the application: `python run_app.py`

### API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

*Generated on: August 12, 2025*  
*Version: 1.0.0*  
*System: Bright Smile AI Patient Advocate*
