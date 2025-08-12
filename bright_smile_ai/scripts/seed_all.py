"""
Master seeding script that clears the database and recreates all data
"""
import sys
import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from faker import Faker

# Add the parent directory to the path so we can import our app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base import SessionLocal, engine, Base
from app.db.models import (
    Lead, Message, Offer, Testimonial, FinancialExplainer, 
    SystemEvent, AIInteraction, LeadScore, LeadStatus, LeadRiskLevel, SenderType
)
from app.core.utils import analyze_sentiment

fake = Faker()


def clear_database():
    """Clear all data from the database"""
    print("🗑️ Clearing all existing data from database...")
    
    # Drop all tables and recreate them
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    print("✅ Database cleared and tables recreated successfully!")


def create_sample_offers():
    """Create sample promotional offers"""
    
    db = SessionLocal()
    
    try:
        print("🎁 Creating sample offers...")
        
        offers_data = [
            {
                "offer_title": "New Patient Special: Comprehensive Exam & Cleaning",
                "description": "Complete dental exam, professional cleaning, and digital X-rays for new patients. Regular value $350, now just $149!",
                "valid_for_service": "General",
                "discount_amount": Decimal("201.00"),
                "is_active": True,
                "expires_at": datetime.now(timezone.utc) + timedelta(days=90)
            },
            {
                "offer_title": "Invisalign Summer Smile Special",
                "description": "Save $1,500 on Invisalign clear aligner treatment. Includes complimentary whitening treatment upon completion!",
                "valid_for_service": "Invisalign",
                "discount_amount": Decimal("1500.00"),
                "is_active": True,
                "expires_at": datetime.now(timezone.utc) + timedelta(days=120)
            },
            {
                "offer_title": "Professional Teeth Whitening Package",
                "description": "Take-home whitening kit plus one in-office whitening session. Brighten your smile by up to 8 shades!",
                "valid_for_service": "Whitening",
                "discount_percentage": 25.0,
                "is_active": True,
                "expires_at": datetime.now(timezone.utc) + timedelta(days=60)
            },
            {
                "offer_title": "Dental Implant Consultation Special",
                "description": "Complimentary consultation and 3D imaging for dental implant candidates. Includes treatment planning session.",
                "valid_for_service": "Implants",
                "discount_amount": Decimal("200.00"),
                "is_active": True,
                "expires_at": datetime.now(timezone.utc) + timedelta(days=180)
            },
            {
                "offer_title": "Family Dental Package",
                "description": "Cleanings and exams for the whole family (up to 4 family members). Includes fluoride treatment for kids under 16.",
                "valid_for_service": "General",
                "discount_percentage": 20.0,
                "is_active": True,
                "expires_at": datetime.now(timezone.utc) + timedelta(days=45)
            }
        ]
        
        created_offers = []
        
        for offer_data in offers_data:
            offer = Offer(**offer_data)
            db.add(offer)
            created_offers.append(offer)
        
        db.commit()
        
        print(f"✅ Created {len(created_offers)} sample offers successfully!")
        
        return created_offers
        
    except Exception as e:
        print(f"❌ Error creating sample offers: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def create_sample_testimonials():
    """Create sample patient testimonials"""
    
    db = SessionLocal()
    
    try:
        print("⭐ Creating sample testimonials...")
        
        testimonials_data = [
            # General testimonials
            {
                "service_category": "General",
                "snippet_text": "Dr. Smith and the entire team at Bright Smile Clinic are absolutely amazing! They made my dental anxiety completely disappear. The office is modern, clean, and the staff is so caring. I actually look forward to my appointments now!",
                "patient_name": "Sarah M.",
                "rating": 5,
                "is_verified": True
            },
            {
                "service_category": "General",
                "snippet_text": "I've been coming here for 3 years and have never had a bad experience. They're always on time, gentle, and explain everything clearly. My kids actually love coming to the dentist now!",
                "patient_name": "Michael R.",
                "rating": 5,
                "is_verified": True
            },
            {
                "service_category": "Invisalign",
                "snippet_text": "I got Invisalign at 34 and it was the best decision ever! The process was so much easier than I expected. My teeth are perfectly straight now and I feel so much more confident. The payment plan made it very affordable too.",
                "patient_name": "Emily T.",
                "rating": 5,
                "is_verified": True
            },
            {
                "service_category": "Implants",
                "snippet_text": "I lost a front tooth in an accident and was devastated. Dr. Johnson placed my implant and it looks and feels exactly like my natural teeth. You can't even tell which one is the implant!",
                "patient_name": "Robert C.",
                "rating": 5,
                "is_verified": True
            },
            {
                "service_category": "Whitening",
                "snippet_text": "The professional whitening here is amazing! My teeth were 6 shades whiter after just one session. Way better than the strips I tried at home, and no sensitivity at all.",
                "patient_name": "Jessica P.",
                "rating": 5,
                "is_verified": True
            }
        ]
        
        created_testimonials = []
        
        for testimonial_data in testimonials_data:
            testimonial = Testimonial(**testimonial_data)
            db.add(testimonial)
            created_testimonials.append(testimonial)
        
        db.commit()
        
        print(f"✅ Created {len(created_testimonials)} sample testimonials successfully!")
        
        return created_testimonials
        
    except Exception as e:
        print(f"❌ Error creating sample testimonials: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def create_sample_leads():
    """Create 5 sample leads with realistic data"""
    
    db = SessionLocal()
    
    try:
        print("🌱 Creating 5 sample leads...")
        
        # Lead scenarios with realistic inquiries and conversation patterns
        lead_scenarios = [
            # Active, engaged lead
            {
                "name": "Sarah Johnson",
                "email": "sarah.johnson@email.com",
                "phone": "555-0101",
                "initial_inquiry": "Hi, I'm interested in Invisalign treatment. Can you tell me more about the process and costs?",
                "status": LeadStatus.ACTIVE,
                "risk_level": LeadRiskLevel.LOW,
                "messages": [
                    ("lead", "Hi, I'm interested in Invisalign treatment. Can you tell me more about the process and costs?", 0),
                    ("ai", "Hello Sarah! I'd be happy to help you learn about Invisalign. It's a popular choice for straightening teeth discreetly. The treatment typically takes 12-18 months and uses clear aligners that are virtually invisible. Would you like me to create a personalized cost breakdown for you?", 10),
                    ("lead", "Yes, that would be great! I'm also wondering about payment plans.", 60),
                    ("ai", "Excellent! We offer flexible payment plans to make treatment affordable. Let me prepare a detailed financial explainer for you that will include payment options.", 5)
                ]
            },
            
            # Price-concerned lead (at risk)
            {
                "name": "Michael Chen",
                "email": "michael.chen@email.com", 
                "phone": "555-0102",
                "initial_inquiry": "How much does a dental implant cost? I lost a tooth recently.",
                "status": LeadStatus.AT_RISK,
                "risk_level": LeadRiskLevel.MEDIUM,
                "messages": [
                    ("lead", "How much does a dental implant cost? I lost a tooth recently.", 0),
                    ("ai", "I'm sorry to hear about your tooth loss, Michael. Dental implants are an excellent long-term solution. The cost varies based on your specific needs, but I can create a personalized estimate for you. Would that be helpful?", 15),
                    ("lead", "That's pretty expensive... I need to think about this.", 1440),  # 24 hours later
                    ("ai", "I completely understand that it's a significant investment. Many patients feel the same way initially. Would it help to discuss our payment plan options? We also work with most insurance providers.", 30)
                ]
            },
            
            # Cold lead (no recent engagement) - moderate cold 20 days
            {
                "name": "Jessica Martinez",
                "email": "jessica.martinez@email.com",
                "phone": "555-0103", 
                "initial_inquiry": "I'm looking for teeth whitening options. What do you offer?",
                "status": LeadStatus.COLD,
                "risk_level": LeadRiskLevel.HIGH,
                "days_cold": 20,
                "messages": [
                    ("lead", "I'm looking for teeth whitening options. What do you offer?", 0)
                ]
            },
            
            # Cold lead (no recent engagement) - long cold 50 days
            {
                "name": "Mark Davis",
                "email": "mark.davis@email.com",
                "phone": "555-0110",
                "initial_inquiry": "I want to compare Invisalign and braces. Which is better for adults?",
                "status": LeadStatus.COLD,
                "risk_level": LeadRiskLevel.MEDIUM,
                "days_cold": 50,
                "messages": [
                    ("lead", "I want to compare Invisalign and braces. Which is better for adults?", 0)
                ]
            },
            
            # Converted lead
            {
                "name": "David Wilson",
                "email": "david.wilson@email.com",
                "phone": "555-0104",
                "initial_inquiry": "I need a root canal. Can you help me?",
                "status": LeadStatus.CONVERTED,
                "risk_level": LeadRiskLevel.LOW,
                "messages": [
                    ("lead", "I need a root canal. Can you help me?", 0),
                    ("ai", "I'm sorry you're experiencing tooth pain, David. Yes, we can definitely help with root canal treatment. Our endodontist is very experienced and gentle. Would you like to schedule a consultation?", 5),
                    ("lead", "Yes, please. How soon can I get in?", 30),
                    ("ai", "Let me connect you with our scheduling coordinator to find the earliest available appointment. I'll also prepare some information about what to expect.", 10),
                    ("human", "Hi David, this is Maria from Bright Smile Clinic. I can get you in tomorrow at 2 PM for an emergency consultation. Does that work?", 45),
                    ("lead", "Perfect! Thank you so much. I'll see you tomorrow.", 5)
                ]
            }
        ]
        
        created_leads = []
        
        for scenario in lead_scenarios:
            # Create the lead
            lead = Lead(
                name=scenario["name"],
                email=scenario["email"],
                phone=scenario["phone"],
                initial_inquiry=scenario["initial_inquiry"],
                status=scenario["status"],
                risk_level=scenario["risk_level"]
            )
            
            db.add(lead)
            db.flush()  # Get the lead ID
            
            # Create messages if any
            if "messages" in scenario:
                # For cold leads, allow per-scenario days_cold override to ensure outreach triggers
                if scenario["status"] == LeadStatus.COLD:
                    days_back = scenario.get("days_cold", fake.random_int(16, 60))
                    base_time = datetime.now(timezone.utc) - timedelta(days=days_back, hours=fake.random_int(1, 6))
                else:
                    base_time = datetime.now(timezone.utc) - timedelta(days=fake.random_int(1, 30))
                
                for sender_type, content, minutes_offset in scenario["messages"]:
                    message_time = base_time + timedelta(minutes=minutes_offset)
                    
                    # Calculate sentiment for lead messages
                    sentiment = None
                    if sender_type == "lead":
                        sentiment = analyze_sentiment(content)
                    
                    message = Message(
                        lead_id=lead.id,
                        sender=SenderType.LEAD if sender_type == "lead" else 
                               SenderType.AI if sender_type == "ai" else SenderType.HUMAN,
                        content=content,
                        created_at=message_time
                    )
                    
                    db.add(message)
                
                # Update lead's last contact time and sentiment
                # For cold leads, last_contact_at should be the base_time (old)
                # For other leads, it can be more recent
                if scenario["status"] == LeadStatus.COLD:
                    # Cold leads: last_contact_at should be the base_time (old)
                    lead.last_contact_at = base_time
                else:
                    # Other leads: last_contact_at can be more recent
                    lead.last_contact_at = base_time + timedelta(minutes=max(msg[2] for msg in scenario["messages"]))
                
                # Calculate average sentiment for the lead
                lead_messages = [msg for msg in scenario["messages"] if msg[0] == "lead"]
                if lead_messages:
                    sentiments = [analyze_sentiment(msg[1]) for msg in lead_messages]
                    lead.sentiment_score = sum(sentiments) / len(sentiments)
            
            created_leads.append(lead)
        
        db.commit()
        
        print(f"✅ Created {len(created_leads)} sample leads successfully!")
        
        # Print summary
        status_counts = {}
        for lead in created_leads:
            status = lead.status.value
            status_counts[status] = status_counts.get(status, 0) + 1
        
        print("\n📊 Lead Status Distribution:")
        for status, count in status_counts.items():
            print(f"  {status.title()}: {count}")
        
        return created_leads
        
    except Exception as e:
        print(f"❌ Error creating sample leads: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def create_financial_explainers(leads):
    """Create financial explainers for leads"""
    
    db = SessionLocal()
    
    try:
        print("💰 Creating financial explainers...")
        
        created_explainers = []
        
        for lead in leads:
            if lead.status in [LeadStatus.ACTIVE, LeadStatus.CONVERTED]:
                # Create financial explainer for active/converted leads
                explainer = FinancialExplainer(
                    lead_id=lead.id,
                    secure_url_token=f"token_{lead.id}_{fake.uuid4()[:8]}",
                    is_accessed=fake.random.choice([True, False]),
                    access_count=fake.random_int(0, 5),
                    first_accessed_at=fake.date_time_between(start_date='-30d', end_date='now') if fake.random.choice([True, False]) else None,
                    last_accessed_at=fake.date_time_between(start_date='-7d', end_date='now') if fake.random.choice([True, False]) else None,
                    procedure_name=fake.random.choice([
                        "Invisalign Treatment", "Dental Implant", "Root Canal", 
                        "Teeth Whitening", "Dental Crown", "Comprehensive Exam"
                    ]),
                    total_cost=Decimal(str(fake.random.uniform(1500, 8000))),
                    estimated_insurance=Decimal(str(fake.random.uniform(500, 3000))) if fake.random.choice([True, False]) else None,
                    out_of_pocket_cost=Decimal(str(fake.random.uniform(800, 5000))),
                    payment_options={
                        "monthly_plan": {"months": 12, "monthly_payment": str(Decimal(str(fake.random.uniform(100, 400))))},
                        "quarterly_plan": {"months": 6, "quarterly_payment": str(Decimal(str(fake.random.uniform(300, 1200))))},
                        "insurance_coverage": fake.random.choice([True, False])
                    }
                )
                
                db.add(explainer)
                created_explainers.append(explainer)
        
        db.commit()
        
        print(f"✅ Created {len(created_explainers)} financial explainers successfully!")
        
        return created_explainers
        
    except Exception as e:
        print(f"❌ Error creating financial explainers: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def create_system_events(leads):
    """Create system events for leads"""
    
    db = SessionLocal()
    
    try:
        print("📊 Creating system events...")
        
        created_events = []
        
        event_types = [
            "lead_created", "message_sent", "ai_response_generated", 
            "financial_explainer_created", "lead_status_updated", 
            "risk_assessment_completed", "sentiment_analyzed"
        ]
        
        for lead in leads:
            # Create multiple events per lead
            for _ in range(fake.random_int(2, 5)):
                event = SystemEvent(
                    lead_id=lead.id,
                    event_type=fake.random.choice(event_types),
                    details=f"Event for lead {lead.name} - {fake.sentence()}",
                    severity=fake.random.choice(["info", "warning", "error"]),
                    processed=fake.random.choice([True, False]),
                    created_at=fake.date_time_between(start_date='-30d', end_date='now')
                )
                
                db.add(event)
                created_events.append(event)
        
        db.commit()
        
        print(f"✅ Created {len(created_events)} system events successfully!")
        
        return created_events
        
    except Exception as e:
        print(f"❌ Error creating system events: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def create_ai_interactions(leads):
    """Create AI interaction records for leads"""
    
    db = SessionLocal()
    
    try:
        print("🤖 Creating AI interaction records...")
        
        created_interactions = []
        
        interaction_types = ["instant_reply", "proactive_outreach", "sentiment_analysis", "risk_assessment"]
        models_used = ["gpt-4", "gpt-3.5-turbo", "claude-3", "gemini-pro"]
        
        for lead in leads:
            # Create multiple AI interactions per lead
            for _ in range(fake.random_int(1, 3)):
                interaction = AIInteraction(
                    lead_id=lead.id,
                    interaction_type=fake.random.choice(interaction_types),
                    model_used=fake.random.choice(models_used),
                    prompt_tokens=fake.random_int(100, 500),
                    completion_tokens=fake.random_int(50, 200),
                    total_cost=Decimal(str(fake.random.uniform(0.01, 0.50))),
                    response_time_ms=fake.random_int(500, 3000),
                    success=fake.random.choice([True, True, True, False]),  # Mostly successful
                    error_message=fake.sentence() if fake.random.choice([True, False]) else None,
                    created_at=fake.date_time_between(start_date='-30d', end_date='now')
                )
                
                db.add(interaction)
                created_interactions.append(interaction)
        
        db.commit()
        
        print(f"✅ Created {len(created_interactions)} AI interaction records successfully!")
        
        return created_interactions
        
    except Exception as e:
        print(f"❌ Error creating AI interactions: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def create_lead_scores(leads):
    """Create lead scoring records"""
    
    db = SessionLocal()
    
    try:
        print("📈 Creating lead scores...")
        
        created_scores = []
        
        for lead in leads:
            # Generate realistic scores based on lead status
            if lead.status == LeadStatus.CONVERTED:
                engagement_score = fake.random.uniform(0.8, 1.0)
                intent_score = fake.random.uniform(0.9, 1.0)
                urgency_score = fake.random.uniform(0.7, 1.0)
                budget_score = fake.random.uniform(0.6, 1.0)
            elif lead.status == LeadStatus.ACTIVE:
                engagement_score = fake.random.uniform(0.6, 0.9)
                intent_score = fake.random.uniform(0.7, 0.9)
                urgency_score = fake.random.uniform(0.5, 0.8)
                budget_score = fake.random.uniform(0.5, 0.8)
            elif lead.status == LeadStatus.AT_RISK:
                engagement_score = fake.random.uniform(0.3, 0.6)
                intent_score = fake.random.uniform(0.4, 0.7)
                urgency_score = fake.random.uniform(0.6, 0.9)
                budget_score = fake.random.uniform(0.2, 0.5)
            else:  # NEW, COLD, etc.
                engagement_score = fake.random.uniform(0.1, 0.5)
                intent_score = fake.random.uniform(0.2, 0.6)
                urgency_score = fake.random.uniform(0.3, 0.7)
                budget_score = fake.random.uniform(0.3, 0.7)
            
            total_score = (engagement_score + intent_score + urgency_score + budget_score) / 4
            
            score = LeadScore(
                lead_id=lead.id,
                engagement_score=engagement_score,
                intent_score=intent_score,
                urgency_score=urgency_score,
                budget_score=budget_score,
                total_score=total_score,
                score_updated_at=datetime.now(timezone.utc)
            )
            
            db.add(score)
            created_scores.append(score)
        
        db.commit()
        
        print(f"✅ Created {len(created_scores)} lead scores successfully!")
        
        return created_scores
        
    except Exception as e:
        print(f"❌ Error creating lead scores: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def main():
    """Run comprehensive database seeding"""
    
    print("🌱 Starting comprehensive database seeding...")
    print("=" * 60)
    
    try:
        # Step 1: Clear the database
        clear_database()
        
        # Step 2: Create offers and testimonials first (referenced by other entities)
        print("\n1️⃣ Creating offers and testimonials...")
        offers = create_sample_offers()
        testimonials = create_sample_testimonials()
        
        # Step 3: Create leads with messages
        print("\n2️⃣ Creating sample leads and conversations...")
        leads = create_sample_leads()
        
        # Step 4: Create financial explainers
        print("\n3️⃣ Creating financial explainers...")
        financial_explainers = create_financial_explainers(leads)
        
        # Step 5: Create system events
        print("\n4️⃣ Creating system events...")
        system_events = create_system_events(leads)
        
        # Step 6: Create AI interactions
        print("\n5️⃣ Creating AI interaction records...")
        ai_interactions = create_ai_interactions(leads)
        
        # Step 7: Create lead scores
        print("\n6️⃣ Creating lead scores...")
        lead_scores = create_lead_scores(leads)
        
        # Summary
        print("\n" + "=" * 60)
        print("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print(f"✅ {len(offers)} offers created")
        print(f"✅ {len(testimonials)} testimonials created") 
        print(f"✅ {len(leads)} leads created")
        print(f"✅ {len(financial_explainers)} financial explainers created")
        print(f"✅ {len(system_events)} system events created")
        print(f"✅ {len(ai_interactions)} AI interactions created")
        print(f"✅ {len(lead_scores)} lead scores created")
        
        print("\n📋 Next Steps:")
        print("1. Start the application: python -m app.main")
        print("2. Visit the API docs: http://localhost:8000/docs")
        print("3. Check the dashboard: http://localhost:8000/api/v1/dashboard/overview")
        print("4. Test AI responses: POST to /api/v1/messages/from-lead")
        
        print("\n🧪 Test Scenarios Available:")
        print("- Active engaged leads (Sarah Johnson)")
        print("- At-risk leads (Michael Chen)")
        print("- Cold leads (Jessica Martinez)")
        print("- Converted leads (David Wilson)")
        print("- New leads (Emily Thompson)")
        
        print("\n🔧 AI Features Ready for Testing:")
        print("- Sentiment analysis on lead messages")
        print("- Risk assessment and scoring")
        print("- Financial explainer generation")
        print("- Proactive outreach triggers")
        print("- Conversation history tracking")
        
    except Exception as e:
        print(f"\n❌ SEEDING FAILED: {e}")
        print("Check your database connection and try again.")
        sys.exit(1)


if __name__ == "__main__":
    main() 