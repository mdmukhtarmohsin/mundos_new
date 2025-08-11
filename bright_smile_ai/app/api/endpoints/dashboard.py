"""
Dashboard API endpoints - Analytics and monitoring data
"""
from datetime import datetime, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.db.base import get_db
from app.db.models import (
    Lead, Message, FinancialExplainer, SystemEvent, 
    LeadStatus, SenderType, AIInteraction
)
from app.services.system_logger import SystemLogger
from app.services.risk_analyzer import RiskAnalyzer

router = APIRouter()


@router.get("/overview")
def get_dashboard_overview(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """
    Get high-level dashboard overview metrics.
    Provides key performance indicators for the specified time period.
    """
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Lead metrics
    total_leads = db.query(Lead).count()
    new_leads_period = db.query(Lead).filter(
        Lead.created_at >= start_date
    ).count()
    
    # Lead status distribution
    status_counts = db.query(
        Lead.status, func.count(Lead.id)
    ).group_by(Lead.status).all()
    
    status_distribution = {status.value: count for status, count in status_counts}
    
    # Conversion metrics
    converted_leads = status_distribution.get('converted', 0)
    active_leads = status_distribution.get('active', 0) + status_distribution.get('at_risk', 0)
    conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0
    
    # Message metrics
    total_messages = db.query(Message).filter(
        Message.created_at >= start_date
    ).count()
    
    ai_messages = db.query(Message).filter(
        and_(
            Message.created_at >= start_date,
            Message.sender == SenderType.AI
        )
    ).count()
    
    # Financial explainer metrics
    explainers_created = db.query(FinancialExplainer).filter(
        FinancialExplainer.created_at >= start_date
    ).count()
    
    explainers_accessed = db.query(FinancialExplainer).filter(
        and_(
            FinancialExplainer.created_at >= start_date,
            FinancialExplainer.is_accessed == True
        )
    ).count()
    
    explainer_access_rate = (explainers_accessed / explainers_created * 100) if explainers_created > 0 else 0
    
    # System health
    logger = SystemLogger(db)
    system_health = logger.get_system_health_summary()
    
    return {
        "period_days": days,
        "lead_metrics": {
            "total_leads": total_leads,
            "new_leads_period": new_leads_period,
            "active_leads": active_leads,
            "converted_leads": converted_leads,
            "conversion_rate": round(conversion_rate, 2),
            "status_distribution": status_distribution
        },
        "engagement_metrics": {
            "total_messages_period": total_messages,
            "ai_responses_period": ai_messages,
            "response_rate": round((ai_messages / total_messages * 100), 2) if total_messages > 0 else 0
        },
        "asset_metrics": {
            "financial_explainers_created": explainers_created,
            "financial_explainers_accessed": explainers_accessed,
            "access_rate": round(explainer_access_rate, 2)
        },
        "system_health": system_health
    }


@router.get("/lead-funnel")
def get_lead_funnel(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """
    Get lead funnel data showing progression through statuses.
    """
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get leads created in the period
    leads_in_period = db.query(Lead).filter(
        Lead.created_at >= start_date
    ).all()
    
    # Track funnel progression
    funnel_data = {
        "new": 0,
        "active": 0,
        "at_risk": 0,
        "cold": 0,
        "human_handoff": 0,
        "converted": 0,
        "do_not_contact": 0
    }
    
    for lead in leads_in_period:
        if lead.status.value in funnel_data:
            funnel_data[lead.status.value] += 1
    
    # Calculate conversion rates
    total_period_leads = len(leads_in_period)
    funnel_rates = {}
    
    if total_period_leads > 0:
        for status, count in funnel_data.items():
            funnel_rates[status] = round((count / total_period_leads) * 100, 2)
    
    return {
        "period_days": days,
        "total_leads_in_period": total_period_leads,
        "funnel_counts": funnel_data,
        "funnel_rates": funnel_rates,
        "key_metrics": {
            "engagement_rate": funnel_rates.get("active", 0) + funnel_rates.get("at_risk", 0),
            "conversion_rate": funnel_rates.get("converted", 0),
            "drop_off_rate": funnel_rates.get("cold", 0) + funnel_rates.get("do_not_contact", 0)
        }
    }


@router.get("/risk-analysis")
def get_risk_analysis_dashboard(
    db: Session = Depends(get_db)
):
    """
    Get current risk analysis dashboard data.
    Shows at-risk leads and intervention effectiveness.
    """
    
    try:
        risk_analyzer = RiskAnalyzer(db)
        risk_summary = risk_analyzer.get_risk_summary()
        
        # Get recent interventions
        recent_interventions = db.query(SystemEvent).filter(
            SystemEvent.event_type == "predictive_intervention_sent"
        ).order_by(SystemEvent.created_at.desc()).limit(10).all()
        
        intervention_data = []
        for event in recent_interventions:
            lead = db.query(Lead).filter(Lead.id == event.lead_id).first()
            if lead:
                intervention_data.append({
                    "lead_id": lead.id,
                    "lead_name": lead.name,
                    "sent_at": event.created_at.isoformat(),
                    "details": event.details,
                    "current_status": lead.status.value,
                    "current_risk": lead.risk_level.value
                })
        
        # Calculate intervention success rate (leads that didn't go cold after intervention)
        intervention_leads = [i["lead_id"] for i in intervention_data]
        successful_interventions = 0
        
        for lead_id in intervention_leads:
            lead = db.query(Lead).filter(Lead.id == lead_id).first()
            if lead and lead.status not in [LeadStatus.COLD, LeadStatus.DO_NOT_CONTACT]:
                successful_interventions += 1
        
        intervention_success_rate = (successful_interventions / len(intervention_leads) * 100) if intervention_leads else 0
        
        return {
            "risk_distribution": risk_summary["risk_distribution"],
            "total_active_leads": risk_summary["total_active"],
            "high_risk_leads": risk_summary["recent_high_risk_leads"],
            "recent_interventions": intervention_data,
            "intervention_metrics": {
                "total_interventions_sent": len(intervention_data),
                "success_rate": round(intervention_success_rate, 2),
                "leads_saved": successful_interventions
            }
        }
    
    except Exception as e:
        return {
            "error": str(e),
            "message": "Failed to load risk analysis data"
        }


@router.get("/ai-performance")
def get_ai_performance_metrics(
    hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db)
):
    """
    Get AI performance metrics including response times, success rates, and costs.
    """
    
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=hours)
    
    # Get AI interactions in the period
    interactions = db.query(AIInteraction).filter(
        AIInteraction.created_at >= start_time
    ).all()
    
    if not interactions:
        return {
            "period_hours": hours,
            "no_data": True,
            "message": "No AI interactions found in the specified period"
        }
    
    # Calculate performance metrics
    total_interactions = len(interactions)
    successful_interactions = sum(1 for i in interactions if i.success)
    success_rate = (successful_interactions / total_interactions) * 100
    
    # Response time analysis
    response_times = [i.response_time_ms for i in interactions if i.response_time_ms]
    avg_response_time = sum(response_times) / len(response_times) if response_times else None
    
    # Cost analysis
    total_cost = sum(float(i.total_cost) for i in interactions if i.total_cost)
    avg_cost_per_interaction = total_cost / total_interactions if total_interactions > 0 else 0
    
    # Token usage
    total_prompt_tokens = sum(i.prompt_tokens for i in interactions if i.prompt_tokens)
    total_completion_tokens = sum(i.completion_tokens for i in interactions if i.completion_tokens)
    
    # Interaction types breakdown
    type_breakdown = {}
    for interaction in interactions:
        interaction_type = interaction.interaction_type
        type_breakdown[interaction_type] = type_breakdown.get(interaction_type, 0) + 1
    
    return {
        "period_hours": hours,
        "performance_metrics": {
            "total_interactions": total_interactions,
            "success_rate": round(success_rate, 2),
            "avg_response_time_ms": round(avg_response_time, 2) if avg_response_time else None,
            "interactions_by_type": type_breakdown
        },
        "cost_metrics": {
            "total_cost": round(total_cost, 4),
            "avg_cost_per_interaction": round(avg_cost_per_interaction, 4),
            "total_prompt_tokens": total_prompt_tokens,
            "total_completion_tokens": total_completion_tokens
        }
    }


@router.get("/recent-activity")
def get_recent_activity(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get recent system activity for the activity feed.
    """
    
    logger = SystemLogger(db)
    recent_events = logger.get_recent_events(limit=limit)
    
    activity_feed = []
    for event in recent_events:
        # Get lead information if available
        lead_info = None
        if event.lead_id:
            lead = db.query(Lead).filter(Lead.id == event.lead_id).first()
            if lead:
                lead_info = {
                    "id": lead.id,
                    "name": lead.name,
                    "email": lead.email
                }
        
        activity_feed.append({
            "id": event.id,
            "event_type": event.event_type,
            "details": event.details,
            "severity": event.severity,
            "created_at": event.created_at.isoformat(),
            "lead": lead_info,
            "processed": event.processed
        })
    
    return {
        "recent_activity": activity_feed,
        "total_events": len(activity_feed)
    }


@router.get("/export-data")
def export_dashboard_data(
    days: int = Query(30, ge=1, le=365),
    include_messages: bool = Query(False),
    db: Session = Depends(get_db)
):
    """
    Export comprehensive dashboard data for external analysis.
    """
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get leads data
    leads = db.query(Lead).filter(Lead.created_at >= start_date).all()
    leads_data = []
    
    for lead in leads:
        lead_data = {
            "id": lead.id,
            "name": lead.name,
            "email": lead.email,
            "status": lead.status.value,
            "risk_level": lead.risk_level.value,
            "sentiment_score": lead.sentiment_score,
            "created_at": lead.created_at.isoformat(),
            "last_contact_at": lead.last_contact_at.isoformat() if lead.last_contact_at else None
        }
        
        if include_messages:
            messages = db.query(Message).filter(Message.lead_id == lead.id).all()
            lead_data["messages"] = [
                {
                    "id": msg.id,
                    "sender": msg.sender.value,
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat()
                }
                for msg in messages
            ]
        
        leads_data.append(lead_data)
    
    # Get financial explainers data
    explainers = db.query(FinancialExplainer).filter(
        FinancialExplainer.created_at >= start_date
    ).all()
    
    explainers_data = [
        {
            "id": exp.id,
            "lead_id": exp.lead_id,
            "procedure_name": exp.procedure_name,
            "total_cost": float(exp.total_cost),
            "is_accessed": exp.is_accessed,
            "access_count": exp.access_count,
            "created_at": exp.created_at.isoformat()
        }
        for exp in explainers
    ]
    
    return {
        "export_date": datetime.utcnow().isoformat(),
        "period_days": days,
        "data": {
            "leads": leads_data,
            "financial_explainers": explainers_data,
            "summary": {
                "total_leads": len(leads_data),
                "total_explainers": len(explainers_data)
            }
        }
    }