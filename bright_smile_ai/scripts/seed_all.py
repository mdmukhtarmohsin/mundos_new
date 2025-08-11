"""
Master seeding script that runs all database seeders
"""
import sys
import os

# Add the parent directory to the path so we can import our app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from seed_leads import create_sample_leads
from seed_kb_and_testimonials import create_sample_offers, create_sample_testimonials

def main():
    """Run all seeding scripts in the correct order"""
    
    print("🌱 Starting comprehensive database seeding...")
    print("=" * 60)
    
    try:
        # Create offers and testimonials first (referenced by other entities)
        print("\n1️⃣ Creating offers and testimonials...")
        offers = create_sample_offers()
        testimonials = create_sample_testimonials()
        
        # Create leads with messages
        print("\n2️⃣ Creating sample leads and conversations...")
        leads = create_sample_leads()
        
        # Summary
        print("\n" + "=" * 60)
        print("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print(f"✅ {len(offers)} offers created")
        print(f"✅ {len(testimonials)} testimonials created") 
        print(f"✅ {len(leads)} leads created")
        
        print("\n📋 Next Steps:")
        print("1. Start the application: python -m app.main")
        print("2. Visit the API docs: http://localhost:8000/docs")
        print("3. Check the dashboard: http://localhost:8000/api/v1/dashboard/overview")
        print("4. Test AI responses: POST to /api/v1/messages/from-lead")
        
        print("\n🧪 Test Scenarios Available:")
        print("- Active engaged leads (Sarah Johnson)")
        print("- At-risk leads (Michael Chen, Robert Kim)")
        print("- Cold leads (Jessica Martinez)")
        print("- Converted leads (David Wilson)")
        print("- New leads (Emily Thompson)")
        
    except Exception as e:
        print(f"\n❌ SEEDING FAILED: {e}")
        print("Check your database connection and try again.")
        sys.exit(1)


if __name__ == "__main__":
    main()