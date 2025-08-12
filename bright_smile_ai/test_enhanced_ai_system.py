#!/usr/bin/env python3
"""
Test script for the enhanced AI-powered lead management system.
This demonstrates the new functionality for AI lead scanning and aggressive retention offers.
"""

import asyncio
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.services.engagement_engine import EngagementEngine
from app.services.risk_analyzer import RiskAnalyzer
from app.services.system_logger import SystemLogger
from app.db.models import Lead, Message, LeadStatus, LeadRiskLevel, SenderType


async def test_ai_lead_scanning():
    """Test the AI-powered lead scanning functionality"""
    print("🔍 Testing AI-powered lead scanning...")
    
    db = next(get_db())
    try:
        # Initialize services
        engine = EngagementEngine(db)
        risk_analyzer = RiskAnalyzer(db, engagement_engine=engine)
        
        # Run AI lead scanning
        results = await risk_analyzer.scan_all_leads_for_opportunities()
        
        print(f"✅ AI Lead Scanning Results:")
        print(f"   - Total leads scanned: {results['total_scanned']}")
        print(f"   - Opportunities identified: {results['opportunities_identified']}")
        print(f"   - Proactive messages sent: {results['proactive_messages_sent']}")
        print(f"   - Leads escalated: {results['leads_escalated']}")
        
        return results
        
    except Exception as e:
        print(f"❌ AI lead scanning failed: {e}")
        return None
    finally:
        db.close()


async def test_enhanced_risk_analysis():
    """Test the enhanced risk analysis with aggressive retention offers"""
    print("\n⚠️  Testing Enhanced Risk Analysis...")
    
    db = next(get_db())
    try:
        # Initialize services
        engine = EngagementEngine(db)
        risk_analyzer = RiskAnalyzer(db, engagement_engine=engine)
        
        # Run enhanced risk analysis
        results = await risk_analyzer.analyze_all_active_leads()
        
        print(f"✅ Enhanced Risk Analysis Results:")
        print(f"   - Total leads analyzed: {results['total_analyzed']}")
        print(f"   - Newly at risk: {results['newly_at_risk']}")
        print(f"   - Interventions triggered: {results['interventions_triggered']}")
        print(f"   - Aggressive offers sent: {results['aggressive_offers_sent']}")
        print(f"   - Moved to cold: {results['moved_to_cold']}")
        
        return results
        
    except Exception as e:
        print(f"❌ Enhanced risk analysis failed: {e}")
        return None
    finally:
        db.close()


async def test_ai_outreach_strategies():
    """Test the AI-powered outreach strategy selection"""
    print("\n📧 Testing AI-powered Outreach Strategies...")
    
    db = next(get_db())
    try:
        # Initialize engagement engine
        engine = EngagementEngine(db)
        
        # Run AI-powered outreach campaign
        results = await engine.run_proactive_outreach_campaign()
        
        print(f"✅ AI Outreach Campaign Results:")
        print(f"   - Leads processed: {results['leads_processed']}")
        print(f"   - Leads contacted: {results['leads_contacted']}")
        print(f"   - Leads skipped: {results['leads_skipped']}")
        print(f"   - AI strategies executed: {results['ai_strategies_selected']}")
        
        return results
        
    except Exception as e:
        print(f"❌ AI outreach campaign failed: {e}")
        return None
    finally:
        db.close()


async def test_comprehensive_analysis():
    """Test the comprehensive AI analysis combining all systems"""
    print("\n🚀 Testing Comprehensive AI Analysis...")
    
    db = next(get_db())
    try:
        # Initialize services
        engine = EngagementEngine(db)
        risk_analyzer = RiskAnalyzer(db, engagement_engine=engine)
        
        # Run comprehensive analysis
        scan_results = await risk_analyzer.scan_all_leads_for_opportunities()
        risk_results = await risk_analyzer.analyze_all_active_leads()
        
        # Combine results
        comprehensive_results = {
            "ai_lead_scanning": scan_results,
            "risk_analysis": risk_results,
            "total_opportunities": scan_results["opportunities_identified"] + risk_results["aggressive_offers_sent"],
            "total_interventions": scan_results["proactive_messages_sent"] + risk_results["interventions_triggered"],
            "leads_escalated": scan_results["leads_escalated"]
        }
        
        print(f"✅ Comprehensive AI Analysis Results:")
        print(f"   - Total opportunities identified: {comprehensive_results['total_opportunities']}")
        print(f"   - Total interventions executed: {comprehensive_results['total_interventions']}")
        print(f"   - Leads escalated to human: {comprehensive_results['leads_escalated']}")
        print(f"   - AI lead scanning opportunities: {scan_results['opportunities_identified']}")
        print(f"   - Risk analysis aggressive offers: {risk_results['aggressive_offers_sent']}")
        
        return comprehensive_results
        
    except Exception as e:
        print(f"❌ Comprehensive analysis failed: {e}")
        return None
    finally:
        db.close()


async def test_instant_reply_agent():
    """Test the instant reply agent with a sample message"""
    print("\n💬 Testing Instant Reply Agent...")
    
    db = next(get_db())
    try:
        # Get a sample lead
        lead = db.query(Lead).filter(Lead.status == LeadStatus.ACTIVE).first()
        
        if not lead:
            print("⚠️  No active leads found for testing")
            return None
        
        # Initialize engagement engine
        engine = EngagementEngine(db)
        
        # Test instant reply
        test_message = "Hi, I'm interested in getting a consultation. What are your prices like?"
        result = await engine.invoke_new_message(lead.id, test_message)
        
        if result["success"]:
            print(f"✅ Instant Reply Agent Test Results:")
            print(f"   - Lead: {lead.name}")
            print(f"   - Test message: {test_message}")
            print(f"   - Intent classified: {result['intent']}")
            print(f"   - Handoff required: {result['handoff_required']}")
            print(f"   - Response: {result['response'][:100]}...")
        else:
            print(f"❌ Instant reply failed: {result.get('error')}")
        
        return result
        
    except Exception as e:
        print(f"❌ Instant reply test failed: {e}")
        return None
    finally:
        db.close()


async def main():
    """Run all tests for the enhanced AI system"""
    print("🧪 Testing Enhanced AI-Powered Lead Management System")
    print("=" * 60)
    
    # Test all components
    tests = [
        ("AI Lead Scanning", test_ai_lead_scanning),
        ("Enhanced Risk Analysis", test_enhanced_risk_analysis),
        ("AI Outreach Strategies", test_ai_outreach_strategies),
        ("Comprehensive Analysis", test_comprehensive_analysis),
        ("Instant Reply Agent", test_instant_reply_agent)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results[test_name] = result
        except Exception as e:
            print(f"❌ {test_name} test failed with exception: {e}")
            results[test_name] = {"error": str(e)}
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    
    for test_name, result in results.items():
        if result and "error" not in result:
            print(f"✅ {test_name}: PASSED")
        else:
            print(f"❌ {test_name}: FAILED")
    
    print("\n🎯 Enhanced AI System Features Demonstrated:")
    print("   • AI-powered lead scanning for opportunities")
    print("   • Intelligent risk assessment with aggressive retention offers")
    print("   • AI-driven outreach strategy selection")
    print("   • Comprehensive lead analysis and intervention")
    print("   • Real-time instant reply with intent classification")
    
    return results


if __name__ == "__main__":
    # Run the tests
    asyncio.run(main()) 