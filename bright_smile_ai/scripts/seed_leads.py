"""
Seed script for creating sample leads and messages
"""
import sys
import os
from datetime import datetime, timedelta, timezone
from faker import Faker

# Add the parent directory to the path so we can import our app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base import SessionLocal
from app.db.models import Lead, Message, LeadStatus, LeadRiskLevel, SenderType
from app.core.utils import analyze_sentiment

fake = Faker()


def create_sample_leads():
    """Create diverse sample leads with realistic data"""
    
    db = SessionLocal()
    
    try:
        print("🌱 Creating sample leads...")
        
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
            
            # Cold lead (no recent engagement)
            {
                "name": "Jessica Martinez",
                "email": "jessica.martinez@email.com",
                "phone": "555-0103", 
                "initial_inquiry": "I'm looking for teeth whitening options. What do you offer?",
                "status": LeadStatus.COLD,
                "risk_level": LeadRiskLevel.HIGH,
                "messages": [
                    ("lead", "I'm looking for teeth whitening options. What do you offer?", 0),
                    ("ai", "Hi Jessica! We offer professional teeth whitening that can brighten your smile by 3-8 shades in just one visit. We also have take-home options for gradual whitening. Would you like to know more about either option?", 20),
                    ("lead", "Sounds interesting, let me check my schedule.", 2880),  # 48 hours later
                    ("ai", "No problem at all! Take your time. When you're ready, I'm here to answer any questions about our whitening treatments or help schedule a consultation.", 60)
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
            },
            
            # New lead (just arrived)
            {
                "name": "Emily Thompson", 
                "email": "emily.thompson@email.com",
                "phone": "555-0105",
                "initial_inquiry": "Do you take new patients? I need a cleaning and checkup.",
                "status": LeadStatus.NEW,
                "risk_level": LeadRiskLevel.LOW,
                "messages": [
                    ("lead", "Do you take new patients? I need a cleaning and checkup.", 5)
                ]
            },
            
            # Anxious patient (high risk)
            {
                "name": "Robert Kim",
                "email": "robert.kim@email.com",
                "phone": "555-0106",
                "initial_inquiry": "I'm really nervous about dental work but I think I need some fillings.",
                "status": LeadStatus.AT_RISK,
                "risk_level": LeadRiskLevel.HIGH,
                "messages": [
                    ("lead", "I'm really nervous about dental work but I think I need some fillings.", 0),
                    ("ai", "Thank you for reaching out, Robert. I completely understand dental anxiety - you're not alone in feeling this way. We specialize in gentle, comfortable care and offer several options to help anxious patients feel at ease. Would you like to know more about our comfort options?", 15),
                    ("lead", "I guess... but I'm really scared of the pain. I've had bad experiences before.", 120),
                    ("ai", "I'm so sorry you've had difficult experiences. That fear is completely valid. We use the latest pain management techniques, and many anxious patients are surprised at how comfortable they feel. We can also discuss sedation options if that would help. Would you like to speak with one of our patient coordinators about your concerns?", 30),
                    ("lead", "Maybe... I don't know. This is really hard for me.", 720)  # 12 hours later
                ]
            },
            
            # Price shopper (comparing options)
            {
                "name": "Lisa Rodriguez",
                "email": "lisa.rodriguez@email.com", 
                "phone": "555-0107",
                "initial_inquiry": "I'm getting quotes for crowns. What's your pricing?",
                "status": LeadStatus.ACTIVE,
                "risk_level": LeadRiskLevel.MEDIUM,
                "messages": [
                    ("lead", "I'm getting quotes for crowns. What's your pricing?", 0),
                    ("ai", "Hi Lisa! Crown pricing depends on the type of crown and your specific needs. We offer porcelain, ceramic, and gold options. I'd be happy to create a personalized cost breakdown for you. What type of crown restoration are you considering?", 25),
                    ("lead", "I need two crowns on my back teeth. I'm comparing prices at different offices.", 90),
                    ("ai", "That makes perfect sense - it's smart to compare options for such an important investment. Beyond pricing, I'd love to tell you about our advanced crown technology and lifetime warranty. May I create a detailed comparison sheet showing our value proposition?", 45)
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
                lead.last_contact_at = base_time + timedelta(minutes=max(msg[2] for msg in scenario["messages"]))
                
                # Calculate average sentiment for the lead
                lead_messages = [msg for msg in scenario["messages"] if msg[0] == "lead"]
                if lead_messages:
                    sentiments = [analyze_sentiment(msg[1]) for msg in lead_messages]
                    lead.sentiment_score = sum(sentiments) / len(sentiments)
            
            created_leads.append(lead)
        
        # Add some additional random leads for volume
        print("🌱 Creating additional random leads...")
        
        for _ in range(20):
            lead = Lead(
                name=fake.name(),
                email=fake.email(),
                phone=fake.phone_number()[:15],  # Limit length
                initial_inquiry=fake.random_element([
                    "I'm interested in dental cleaning",
                    "Do you do emergency appointments?",
                    "I need information about braces",
                    "What are your office hours?",
                    "I'm looking for a new dentist",
                    "Can you help with tooth pain?",
                    "I want to whiten my teeth",
                    "Do you accept my insurance?",
                    "I need a filling replaced",
                    "Tell me about your services"
                ]),
                status=fake.random_element([
                    LeadStatus.NEW, LeadStatus.ACTIVE, LeadStatus.COLD, 
                    LeadStatus.CONVERTED
                ]),
                risk_level=fake.random_element([
                    LeadRiskLevel.LOW, LeadRiskLevel.MEDIUM, LeadRiskLevel.HIGH
                ]),
                sentiment_score=fake.random.uniform(-0.8, 0.8),
                created_at=fake.date_time_between(start_date='-60d', end_date='now'),
                last_contact_at=fake.date_time_between(start_date='-30d', end_date='now') if fake.random.choice([True, False]) else None
            )
            
            db.add(lead)
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


if __name__ == "__main__":
    create_sample_leads()