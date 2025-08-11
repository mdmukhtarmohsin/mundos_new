"""
Agents API endpoints - Controls for AI agents and campaigns
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.core.config import settings
from app.services.engagement_engine import EngagementEngine
from app.services.risk_analyzer import RiskAnalyzer
from app.services.system_logger import SystemLogger

router = APIRouter()


def verify_api_key(x_api_key: str = Header(...)) -> bool:
    """Verify API key for agent endpoints (security for manual triggers)"""
    # In production, this would be a proper API key validation
    # For now, we'll use a simple check against settings
    # HARDCODED API KEY: "bright-smile-agent-key" (can be overridden with AGENT_API_KEY env var)
    expected_key = getattr(settings, 'agent_api_key', 'bright-smile-agent-key')
    if x_api_key != expected_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return True


@router.post("/trigger-outreach")
async def trigger_proactive_outreach(
    db: Session = Depends(get_db),
    _: bool = Depends(verify_api_key)
):
    """
    Manually trigger the proactive outreach campaign.
    This endpoint implements the Proactive Outreach Agent workflow.
    
    Protected endpoint requiring API key authentication.
    """
    
    try:
        # Initialize engagement engine
        engine = EngagementEngine(db)
        
        # Run the proactive outreach campaign
        results = await engine.run_proactive_outreach_campaign()
        
        return {
            "success": True,
            "campaign_type": "proactive_outreach",
            "results": results,
            "message": f"Campaign completed: {results['leads_contacted']} leads contacted, {results['leads_skipped']} skipped"
        }
    
    except Exception as e:
        logger = SystemLogger(db)
        await logger.log_error(
            error_type="manual_outreach_campaign",
            error_message=str(e),
            additional_context="Manual trigger of proactive outreach campaign failed"
        )
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to run outreach campaign: {str(e)}"
        )


@router.post("/analyze-risk")
async def trigger_risk_analysis(
    db: Session = Depends(get_db),
    _: bool = Depends(verify_api_key)
):
    """
    Manually trigger the risk analysis for all active leads.
    This runs the predictive intervention system.
    
    Protected endpoint requiring API key authentication.
    """
    
    try:
        # Initialize risk analyzer with engagement engine
        engine = EngagementEngine(db)
        risk_analyzer = RiskAnalyzer(db, engagement_engine=engine)
        
        # Run risk analysis
        results = await risk_analyzer.analyze_all_active_leads()
        
        return {
            "success": True,
            "analysis_type": "risk_assessment",
            "results": results,
            "message": f"Risk analysis completed: {results['newly_at_risk']} leads flagged at risk, {results['interventions_triggered']} interventions sent"
        }
    
    except Exception as e:
        logger = SystemLogger(db)
        await logger.log_error(
            error_type="manual_risk_analysis",
            error_message=str(e),
            additional_context="Manual trigger of risk analysis failed"
        )
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to run risk analysis: {str(e)}"
        )


@router.get("/status")
def get_agent_status(
    db: Session = Depends(get_db)
):
    """
    Get the current status of all AI agents and recent activity.
    Public endpoint for monitoring.
    """
    
    try:
        logger = SystemLogger(db)
        risk_analyzer = RiskAnalyzer(db)
        
        # Get system health summary
        health_summary = logger.get_system_health_summary()
        
        # Get risk summary
        risk_summary = risk_analyzer.get_risk_summary()
        
        # Get recent agent activity
        recent_events = logger.get_recent_events(
            limit=10,
            event_type=None  # Get all types
        )
        
        recent_activity = []
        for event in recent_events:
            if event.event_type.startswith(('ai_', 'outreach_', 'risk_')):
                recent_activity.append({
                    "event_type": event.event_type,
                    "details": event.details,
                    "created_at": event.created_at.isoformat(),
                    "severity": event.severity
                })
        
        return {
            "system_health": health_summary,
            "risk_analysis": {
                "total_active_leads": risk_summary["total_active"],
                "high_risk_count": risk_summary["high_risk_count"],
                "risk_distribution": risk_summary["risk_distribution"]
            },
            "recent_activity": recent_activity[:5],  # Last 5 agent activities
            "agents": {
                "instant_reply_agent": {
                    "status": "active",
                    "description": "Responds to incoming lead messages in real-time"
                },
                "proactive_outreach_agent": {
                    "status": "scheduled",
                    "description": "Re-engages cold leads based on qualification rules"
                },
                "risk_analyzer": {
                    "status": "scheduled",
                    "description": "Identifies at-risk leads and triggers interventions"
                }
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get agent status: {str(e)}"
        )


@router.post("/test-instant-reply")
async def test_instant_reply_agent(
    lead_id: int,
    test_message: str,
    db: Session = Depends(get_db)
):
    """
    Test the Instant Reply Agent with a specific lead and message.
    Useful for debugging and demonstrations.
    """
    
    try:
        # Verify lead exists
        from app.db.models import Lead
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Initialize engagement engine
        engine = EngagementEngine(db)
        
        # Test the instant reply workflow
        result = await engine.invoke_new_message(lead_id, test_message)
        
        return {
            "success": result.get("success", False),
            "test_input": {
                "lead_id": lead_id,
                "lead_name": lead.name,
                "message": test_message
            },
            "agent_response": {
                "response": result.get("response", ""),
                "classified_intent": result.get("intent", ""),
                "handoff_required": result.get("handoff_required", False)
            },
            "error": result.get("error") if not result.get("success") else None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger = SystemLogger(db)
        await logger.log_error(
            error_type="test_instant_reply",
            error_message=str(e),
            lead_id=lead_id,
            additional_context=f"Test message: {test_message[:100]}..."
        )
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to test instant reply agent: {str(e)}"
        )


@router.get("/campaign-history")
def get_campaign_history(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get history of outreach campaigns and risk analysis runs.
    Useful for monitoring and analytics.
    """
    
    try:
        logger = SystemLogger(db)
        
        # Get campaign events
        campaign_events = logger.get_recent_events(
            limit=limit,
            event_type=None  # Will filter below
        )
        
        campaigns = []
        for event in campaign_events:
            if event.event_type.startswith('outreach_campaign_') or event.event_type == 'risk_analysis':
                campaigns.append({
                    "id": event.id,
                    "campaign_type": event.event_type,
                    "details": event.details,
                    "created_at": event.created_at.isoformat(),
                    "success": event.severity != "error"
                })
        
        return {
            "campaigns": campaigns,
            "total_found": len(campaigns)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get campaign history: {str(e)}"
        )


@router.get("/performance-metrics")
def get_performance_metrics(
    hours: int = 24,
    db: Session = Depends(get_db)
):
    """
    Get AI agent performance metrics for the specified time period.
    """
    
    try:
        from datetime import datetime, timedelta
        from app.db.models import AIInteraction
        from sqlalchemy import func
        
        # Calculate cutoff time
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        # Get AI interaction metrics
        interactions = db.query(AIInteraction).filter(
            AIInteraction.created_at >= cutoff_time
        ).all()
        
        if not interactions:
            return {
                "period_hours": hours,
                "total_interactions": 0,
                "success_rate": 0,
                "avg_response_time_ms": None,
                "interactions_by_type": {},
                "total_cost": 0
            }
        
        # Calculate metrics
        total_interactions = len(interactions)
        successful_interactions = sum(1 for i in interactions if i.success)
        success_rate = (successful_interactions / total_interactions) * 100
        
        response_times = [i.response_time_ms for i in interactions if i.response_time_ms]
        avg_response_time = sum(response_times) / len(response_times) if response_times else None
        
        interactions_by_type = {}
        total_cost = 0
        
        for interaction in interactions:
            # Count by type
            interaction_type = interaction.interaction_type
            interactions_by_type[interaction_type] = interactions_by_type.get(interaction_type, 0) + 1
            
            # Sum costs
            if interaction.total_cost:
                total_cost += float(interaction.total_cost)
        
        return {
            "period_hours": hours,
            "total_interactions": total_interactions,
            "success_rate": round(success_rate, 2),
            "avg_response_time_ms": round(avg_response_time, 2) if avg_response_time else None,
            "interactions_by_type": interactions_by_type,
            "total_cost": round(total_cost, 4)
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get performance metrics: {str(e)}"
        )