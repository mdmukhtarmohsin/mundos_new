"""
Seed script for creating offers and testimonials
"""
import sys
import os
from datetime import datetime, timedelta
from decimal import Decimal

# Add the parent directory to the path so we can import our app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base import SessionLocal
from app.db.models import Offer, Testimonial


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
                "expires_at": datetime.utcnow() + timedelta(days=90)
            },
            {
                "offer_title": "Invisalign Summer Smile Special",
                "description": "Save $1,500 on Invisalign clear aligner treatment. Includes complimentary whitening treatment upon completion!",
                "valid_for_service": "Invisalign",
                "discount_amount": Decimal("1500.00"),
                "is_active": True,
                "expires_at": datetime.utcnow() + timedelta(days=120)
            },
            {
                "offer_title": "Professional Teeth Whitening Package",
                "description": "Take-home whitening kit plus one in-office whitening session. Brighten your smile by up to 8 shades!",
                "valid_for_service": "Whitening",
                "discount_percentage": 25.0,
                "is_active": True,
                "expires_at": datetime.utcnow() + timedelta(days=60)
            },
            {
                "offer_title": "Dental Implant Consultation Special",
                "description": "Complimentary consultation and 3D imaging for dental implant candidates. Includes treatment planning session.",
                "valid_for_service": "Implants",
                "discount_amount": Decimal("200.00"),
                "is_active": True,
                "expires_at": datetime.utcnow() + timedelta(days=180)
            },
            {
                "offer_title": "Family Dental Package",
                "description": "Cleanings and exams for the whole family (up to 4 family members). Includes fluoride treatment for kids under 16.",
                "valid_for_service": "General",
                "discount_percentage": 20.0,
                "is_active": True,
                "expires_at": datetime.utcnow() + timedelta(days=45)
            },
            {
                "offer_title": "Emergency Dental Care - Same Day Appointments",
                "description": "Urgent dental care with same-day appointments available. No additional emergency fees for appointments booked within 24 hours.",
                "valid_for_service": "Emergency",
                "is_active": True,
                "expires_at": datetime.utcnow() + timedelta(days=365)
            },
            {
                "offer_title": "Senior Citizen Discount",
                "description": "Special 15% discount on all dental services for patients 65 and older. Because your smile deserves the best care at every age.",
                "valid_for_service": "General",
                "discount_percentage": 15.0,
                "is_active": True,
                "expires_at": datetime.utcnow() + timedelta(days=365)
            },
            {
                "offer_title": "Student Discount Program",
                "description": "10% off all dental services for college students with valid student ID. Flexible payment plans available.",
                "valid_for_service": "General",
                "discount_percentage": 10.0,
                "is_active": True,
                "expires_at": datetime.utcnow() + timedelta(days=365)
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
                "service_category": "General", 
                "snippet_text": "Best dental office I've ever been to. The technology is impressive, the staff is professional, and they work with my insurance beautifully. Highly recommend!",
                "patient_name": "Jennifer K.",
                "rating": 5,
                "is_verified": True
            },
            
            # Invisalign testimonials
            {
                "service_category": "Invisalign",
                "snippet_text": "I got Invisalign at 34 and it was the best decision ever! The process was so much easier than I expected. My teeth are perfectly straight now and I feel so much more confident. The payment plan made it very affordable too.",
                "patient_name": "Emily T.",
                "rating": 5,
                "is_verified": True
            },
            {
                "service_category": "Invisalign",
                "snippet_text": "As a professional, I was worried about having braces. Invisalign was perfect - nobody could tell I was straightening my teeth. The treatment took exactly as long as they predicted, 14 months.",
                "patient_name": "David L.",
                "rating": 5,
                "is_verified": True
            },
            {
                "service_category": "Invisalign",
                "snippet_text": "My teenage daughter got Invisalign and the results are incredible. She was so responsible with the aligners and now has a beautiful smile. Worth every penny!",
                "patient_name": "Maria G.",
                "rating": 5,
                "is_verified": True
            },
            
            # Dental implant testimonials  
            {
                "service_category": "Implants",
                "snippet_text": "I lost a front tooth in an accident and was devastated. Dr. Johnson placed my implant and it looks and feels exactly like my natural teeth. You can't even tell which one is the implant!",
                "patient_name": "Robert C.",
                "rating": 5,
                "is_verified": True
            },
            {
                "service_category": "Implants",
                "snippet_text": "After years of dealing with an uncomfortable partial denture, I got two implants. Life-changing! I can eat anything again and my confidence is back. The process was much easier than I feared.",
                "patient_name": "Linda W.",
                "rating": 5,
                "is_verified": True
            },
            
            # Whitening testimonials
            {
                "service_category": "Whitening",
                "snippet_text": "The professional whitening here is amazing! My teeth were 6 shades whiter after just one session. Way better than the strips I tried at home, and no sensitivity at all.",
                "patient_name": "Jessica P.",
                "rating": 5,
                "is_verified": True
            },
            {
                "service_category": "Whitening",
                "snippet_text": "I got my teeth whitened for my wedding and they look incredible in all the photos. The take-home kit they gave me helps maintain the results perfectly.",
                "patient_name": "Amanda S.",
                "rating": 5,
                "is_verified": True
            },
            
            # Crown testimonials
            {
                "service_category": "Crown",
                "snippet_text": "My crown was made and placed in the same day! The technology they use is incredible. It matches my other teeth perfectly and feels completely natural.",
                "patient_name": "James H.",
                "rating": 5,
                "is_verified": True
            },
            {
                "service_category": "Crown",
                "snippet_text": "I needed three crowns and was dreading it, but the process was so smooth. They're beautiful, comfortable, and come with a lifetime warranty. Excellent work!",
                "patient_name": "Patricia D.",
                "rating": 5,
                "is_verified": True
            },
            
            # Root canal testimonials
            {
                "service_category": "Root_Canal",
                "snippet_text": "I was terrified about getting a root canal, but Dr. Martinez made it completely painless. I was back to work the next day feeling great. Thank you for saving my tooth!",
                "patient_name": "Kevin M.",
                "rating": 5,
                "is_verified": True
            },
            {
                "service_category": "Root_Canal", 
                "snippet_text": "Root canal was nothing like I expected. No pain during or after, and my tooth feels perfect now. The endodontist here is truly skilled.",
                "patient_name": "Carol B.",
                "rating": 5,
                "is_verified": True
            },
            
            # Veneer testimonials
            {
                "service_category": "Veneer",
                "snippet_text": "My porcelain veneers gave me the Hollywood smile I always wanted! They look so natural that people ask if I had orthodontics. Best investment I've ever made.",
                "patient_name": "Nicole F.",
                "rating": 5,
                "is_verified": True
            },
            
            # Braces testimonials  
            {
                "service_category": "Braces",
                "snippet_text": "My son had braces for 2 years and his teeth are perfect now. The orthodontist was great with him and the payment plan made it very manageable for our family.",
                "patient_name": "Michelle A.",
                "rating": 5,
                "is_verified": True
            },
            
            # Gum treatment testimonials
            {
                "service_category": "Gum_Treatment",
                "snippet_text": "The periodontal treatment saved my gums and probably prevented me from losing teeth. The deep cleaning was more comfortable than I expected, and my gums are healthy now.",
                "patient_name": "Thomas K.",
                "rating": 4,
                "is_verified": True
            },
            
            # Emergency care testimonials
            {
                "service_category": "Emergency",
                "snippet_text": "Chipped my tooth on a weekend and they got me in immediately. Fixed it perfectly and I didn't have to wait until Monday in pain. So grateful for their emergency service!",
                "patient_name": "Rachel V.",
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
        
        # Print summary by service category
        category_counts = {}
        for testimonial in created_testimonials:
            category = testimonial.service_category
            category_counts[category] = category_counts.get(category, 0) + 1
        
        print("\n📊 Testimonials by Service Category:")
        for category, count in category_counts.items():
            print(f"  {category}: {count}")
        
        return created_testimonials
        
    except Exception as e:
        print(f"❌ Error creating sample testimonials: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    offers = create_sample_offers()
    testimonials = create_sample_testimonials()
    
    print(f"\n🎉 Successfully created {len(offers)} offers and {len(testimonials)} testimonials!")