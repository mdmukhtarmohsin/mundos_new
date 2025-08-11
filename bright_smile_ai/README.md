# 🦷 AI Patient Advocate - Bright Smile Clinic

A sophisticated AI-driven patient engagement system that transforms lead management from reactive follow-up into proactive, personalized concierge service.

## 🌟 Features

### 🤖 Two Distinct AI Agent Workflows

1. **Instant Reply Agent** - Real-time AI responses using LangGraph workflow
   - Intent classification and routing
   - Personalized financial explainer generation
   - Human handoff management
   - Contextual conversation handling

2. **Proactive Outreach Agent** - Automated cold lead re-engagement
   - Qualification gauntlet with configurable rules
   - Strategic outreach based on lead timeline
   - Social proof and incentive deployment

### 📊 Advanced Analytics & Risk Management
- **Predictive Risk Analysis** - Identifies at-risk leads before they go cold
- **Sentiment Tracking** - Monitors conversation mood and engagement
- **Comprehensive Dashboard** - Real-time KPIs and lead funnel visualization
- **Performance Metrics** - AI response times, success rates, and cost tracking

### 💰 Financial Asset Generation
- **Dynamic Financial Explainers** - Personalized cost breakdowns with secure URLs
- **Payment Plan Calculations** - Flexible financing options
- **Insurance Integration** - Automated coverage estimates

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Layer     │◄──►│ Services Layer  │◄──►│  PostgreSQL DB  │
│   (FastAPI)     │    │(Business Logic) │    │(Single Source)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       │
         │                       │  Orchestrates...
         │                       ▼
┌────────────────────────────────────────────────────────────────┐
│                    AI CORE (LangGraph)                         │
│                                                                │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │ Proactive Outreach  │    │    Instant Reply Agent         │ │
│  │ Agent (Marketer)    │    │    (Patient Concierge)         │ │
│  └─────────────────────┘    └─────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- PostgreSQL database
- OpenAI API key

### Installation

1. **Clone and Setup Environment**
```bash
cd bright_smile_ai
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. **Configure Environment Variables**
Update `.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost/database"
OPENAI_API_KEY="your_openai_api_key"
SECRET_KEY="your_secure_secret_key"
```

3. **Initialize Database**
```bash
# Run migrations
alembic upgrade head

# Seed with sample data
python scripts/seed_all.py
```

4. **Start Application**
```bash
python run_app.py
```

### 🎯 Access Points
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health  
- **Dashboard Overview**: http://localhost:8000/api/v1/dashboard/overview

## 🧪 Testing the System

### Test Instant Reply Agent
```bash
curl -X POST "http://localhost:8000/api/v1/messages/from-lead?lead_id=1" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hi, I am interested in Invisalign. What does it cost?"}'
```

### Trigger Proactive Outreach
```bash
curl -X POST "http://localhost:8000/api/v1/agents/trigger-outreach" \
  -H "X-API-Key: bright-smile-agent-key"
```

### Run Risk Analysis
```bash
curl -X POST "http://localhost:8000/api/v1/agents/analyze-risk" \
  -H "X-API-Key: bright-smile-agent-key"
```

## 📡 Key API Endpoints

### Lead Management
- `POST /api/v1/leads/` - Create new lead
- `GET /api/v1/leads/` - List leads with filtering
- `GET /api/v1/leads/{lead_id}` - Get lead details
- `PUT /api/v1/leads/{lead_id}` - Update lead
- `POST /api/v1/leads/{lead_id}/simulate-message` - Demo message simulation

### Message & AI Interaction  
- `POST /api/v1/messages/` - Create message (triggers AI response)
- `POST /api/v1/messages/from-lead` - Simplified lead message with immediate response
- `GET /api/v1/messages/lead/{lead_id}/conversation` - Get conversation history

### AI Agent Control
- `POST /api/v1/agents/trigger-outreach` - Manual outreach campaign
- `POST /api/v1/agents/analyze-risk` - Manual risk analysis
- `GET /api/v1/agents/status` - Agent system status
- `POST /api/v1/agents/test-instant-reply` - Test AI responses

### Analytics Dashboard
- `GET /api/v1/dashboard/overview` - High-level KPIs
- `GET /api/v1/dashboard/lead-funnel` - Conversion funnel data
- `GET /api/v1/dashboard/risk-analysis` - Risk assessment dashboard
- `GET /api/v1/dashboard/ai-performance` - AI performance metrics

### Financial Explainers
- `GET /api/v1/financial-explainer/{token}` - Public access to personalized breakdown
- `GET /api/v1/financial-explainer/{token}/html` - Beautiful HTML version
- `GET /api/v1/financial-explainer/admin/stats` - Usage statistics

## 🔧 Configuration

### Core Settings (`.env`)
```env
# Database
DATABASE_URL="postgresql://user:pass@localhost/dbname"

# AI Configuration  
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
OPENAI_TEMPERATURE=0.7

# Risk Analysis
RISK_ANALYSIS_INTERVAL_MINUTES=15
SENTIMENT_THRESHOLD_AT_RISK=-0.3

# Outreach Timing
COLD_LEAD_COOLDOWN_DAYS=14
GENTLE_NUDGE_DAYS=14
SOCIAL_PROOF_DAYS=30  
INCENTIVE_OFFER_DAYS=45

# Financial Explainers
DEFAULT_PROCEDURE_COST=2500.0
DEFAULT_INSURANCE_COVERAGE=0.5
PAYMENT_PLAN_OPTIONS="12,24,36"
```

## 🎭 Sample Test Scenarios

The seeded database includes diverse lead scenarios:

### 🟢 Active Engaged Lead - Sarah Johnson
- **Status**: Active
- **Scenario**: Inquiring about Invisalign, responsive to AI
- **Test**: Send follow-up questions about costs or timeline

### 🟡 Price-Concerned Lead - Michael Chen  
- **Status**: At Risk
- **Scenario**: Dental implant inquiry, concerned about cost
- **Test**: Offer financial explainer or payment plans

### 🔴 Cold Lead - Jessica Martinez
- **Status**: Cold  
- **Scenario**: Teeth whitening inquiry, no recent engagement
- **Test**: Trigger proactive outreach campaign

### ✅ Converted Lead - David Wilson
- **Status**: Converted
- **Scenario**: Completed root canal booking process
- **Test**: Study successful conversion patterns

### 😰 Anxious Patient - Robert Kim
- **Status**: At Risk (High)
- **Scenario**: Dental anxiety, fear of pain
- **Test**: Trigger risk intervention, offer comfort measures

## 📊 Key Performance Indicators

### Lead Conversion Metrics
- **Conversion Rate**: % of leads that convert to patients
- **Lead Drop-off Rate**: % of leads that go cold
- **At-Risk Save Rate**: % of at-risk leads recovered through intervention

### AI Performance Metrics  
- **Response Time**: Average AI response time (target: <2 seconds)
- **Success Rate**: % of successful AI interactions
- **Intent Classification Accuracy**: % of correctly classified intents

### Asset Engagement Metrics
- **Financial Explainer Access Rate**: % of offered explainers viewed
- **Average Cost Per Lead**: Total AI costs / leads processed
- **Time to First Response**: Lead inquiry to first AI response

## 🔒 Security Features

- **Secure Financial URLs**: Unguessable tokens for sensitive asset access
- **API Key Protection**: Agent control endpoints require authentication
- **Data Privacy**: No PII in logs, GDPR-ready architecture
- **Input Sanitization**: All user inputs properly validated and sanitized

## 🛠️ Development

### Database Migrations
```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations  
alembic upgrade head

# Downgrade (if needed)
alembic downgrade -1
```

### Adding New AI Prompts
1. Edit `app/core/prompts.py`
2. Add prompt templates and formatting functions  
3. Update `EngagementEngine` to use new prompts
4. Test with various lead scenarios

### Extending Lead Risk Factors
1. Update `app/services/risk_analyzer.py`
2. Add new risk identification logic in `_identify_risk_factors()`
3. Update risk scoring in `determine_lead_risk_level()`
4. Test with sample leads

## 📈 Monitoring & Observability  

### System Health Endpoints
- `GET /health` - Basic health check
- `GET /api/v1/agents/status` - Detailed agent status
- `GET /api/v1/dashboard/recent-activity` - System activity feed

### Background Jobs
- **Risk Analysis**: Runs every 15 minutes (configurable)
- **Daily Outreach Check**: Identifies outreach opportunities  
- **System Event Logging**: Comprehensive audit trail

### Performance Monitoring
- AI interaction response times
- Database query performance
- Lead conversion funnel metrics
- Cost per interaction tracking

## 🆘 Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify PostgreSQL is running
- Check DATABASE_URL format and credentials
- Ensure database exists and migrations are applied

**OpenAI API Errors**  
- Verify OPENAI_API_KEY is valid and has credits
- Check internet connectivity
- Review API rate limits

**Background Jobs Not Running**
- Check application logs for scheduler errors
- Verify database connectivity from background tasks
- Ensure no blocking operations in job functions

**AI Responses Not Generated**
- Check OpenAI API key and model availability
- Review conversation history for context
- Verify lead exists and is in correct status

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📜 License

This project is proprietary software developed for Bright Smile Clinic.

## 📞 Support

For technical support or questions:
- Check the `/health` endpoint for system status
- Review logs in the application console
- Consult the API documentation at `/docs`
- Monitor the dashboard for system insights

---

Built with ❤️ for dental practices ready to revolutionize patient engagement.