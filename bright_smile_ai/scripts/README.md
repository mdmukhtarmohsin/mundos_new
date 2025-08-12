# Database Seeding Scripts

This directory contains scripts to populate the database with sample data for development and testing purposes.

## Scripts Overview

### `seed_all.py` - Master Seeding Script
**Main script that clears the database and recreates all data**

**Features:**
- Clears all existing data from the database
- Recreates all tables
- Creates comprehensive sample data for all entities
- Perfect for fresh development environments

**What it creates:**
- 5 sample leads with realistic conversation scenarios
- 5 promotional offers
- 5 patient testimonials
- Financial explainers for active/converted leads
- System events for audit trails
- AI interaction records
- Lead scoring data

**Usage:**
```bash
# Activate virtual environment first
source venv/bin/activate

# Run the master seeding script
python scripts/seed_all.py
```

### `seed_leads.py` - Lead-Specific Seeding
**Creates sample leads and messages without clearing the database**

**Features:**
- Creates 27 leads (5 detailed + 22 random)
- Includes realistic conversation patterns
- Various lead statuses and risk levels
- Sentiment analysis integration

**Usage:**
```bash
python scripts/seed_leads.py
```

### `seed_kb_and_testimonials.py` - Content Seeding
**Creates offers and testimonials without clearing the database**

**Features:**
- 8 promotional offers
- 20+ patient testimonials across service categories
- Realistic pricing and descriptions

**Usage:**
```bash
python scripts/seed_kb_and_testimonials.py
```

## Database Schema

The seeding scripts create data for the following entities:

- **Leads**: Potential patients with contact info and status
- **Messages**: Conversation history between leads, AI, and staff
- **Offers**: Promotional deals and specials
- **Testimonials**: Patient reviews and social proof
- **Financial Explainers**: Cost breakdowns and payment plans
- **System Events**: Audit trail and system monitoring
- **AI Interactions**: AI response tracking and analytics
- **Lead Scores**: Engagement and conversion scoring

## Test Scenarios

The master seeding script creates 5 realistic lead scenarios:

1. **Sarah Johnson** - Active, engaged lead interested in Invisalign
2. **Michael Chen** - At-risk lead concerned about implant costs
3. **Jessica Martinez** - Cold lead interested in teeth whitening
4. **David Wilson** - Converted lead who scheduled a root canal
5. **Emily Thompson** - New lead looking for cleaning and checkup

## AI Features Ready for Testing

- Sentiment analysis on lead messages
- Risk assessment and scoring algorithms
- Financial explainer generation
- Proactive outreach triggers
- Conversation history tracking
- Lead scoring and prioritization

## Prerequisites

- Virtual environment activated
- Database connection configured
- Required packages installed (see requirements.txt)
- Database tables created (run migrations first)

## Troubleshooting

**Common Issues:**
- Database connection errors: Check DATABASE_URL in environment
- Import errors: Ensure virtual environment is activated
- Permission errors: Check database user permissions

**Reset Database:**
```bash
# The seed_all.py script automatically clears and recreates the database
python scripts/seed_all.py
```

## Next Steps After Seeding

1. Start the application: `python -m app.main`
2. Visit API docs: `http://localhost:8000/docs`
3. Check dashboard: `http://localhost:8000/api/v1/dashboard/overview`
4. Test AI responses: POST to `/api/v1/messages/from-lead`

## Development Notes

- All timestamps use timezone-aware UTC datetime objects
- Faker library generates realistic but fake data
- Sentiment analysis uses VADER sentiment analyzer
- Financial data uses Decimal for precision
- All foreign key relationships are properly maintained 