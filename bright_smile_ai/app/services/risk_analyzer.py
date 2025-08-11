"""
RiskAnalyzer Service - Analyzes lead risk patterns and triggers interventions
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.db.models import Lead, Message, LeadStatus, LeadRiskLevel, SenderType
from app.core.config import settings
from app.core.utils import (
    analyze_sentiment, 
    determine_lead_risk_level,
    format_conversation_history
)
from app.services.system_logger import SystemLogger


class RiskAnalyzer:
    """
    Service responsible for analyzing lead behavior patterns,
    identifying at-risk leads, and triggering predictive interventions.
    """
    
    def __init__(self, db: Session, engagement_engine=None):
        self.db = db
        self.engagement_engine = engagement_engine  # Injected to avoid circular import
        self.logger = SystemLogger(db)
    
    async def analyze_all_active_leads(self) -> Dict[str, int]:
        """
        Analyze all active leads for risk patterns and trigger interventions.
        This is typically called by a background scheduler.
        
        Returns:
            Dictionary with analysis statistics
        """
        # Get all leads that are currently active or at-risk
        active_leads = self.db.query(Lead).filter(
            Lead.status.in_([LeadStatus.ACTIVE, LeadStatus.AT_RISK]),
            Lead.do_not_contact == False
        ).all()
        
        stats = {
            "total_analyzed": len(active_leads),
            "newly_at_risk": 0,
            "interventions_triggered": 0,
            "moved_to_cold": 0
        }
        
        for lead in active_leads:
            try:
                risk_assessment = await self.assess_lead_risk(lead)
                
                # Update lead risk level if changed
                if risk_assessment["risk_level"] != lead.risk_level.value:
                    old_risk = lead.risk_level.value
                    new_risk = LeadRiskLevel(risk_assessment["risk_level"])
                    
                    lead.risk_level = new_risk
                    lead.sentiment_score = risk_assessment["sentiment_score"]
                    
                    # Log the risk level change
                    await self.logger.log_event(
                        event_type="risk_level_change",
                        details=f"Risk level changed from {old_risk} to {new_risk.value}",
                        lead_id=lead.id,
                        severity="warning" if new_risk == LeadRiskLevel.HIGH else "info"
                    )
                    
                    if new_risk == LeadRiskLevel.HIGH:
                        stats["newly_at_risk"] += 1
                        
                        # Update status to at-risk if not already
                        if lead.status != LeadStatus.AT_RISK:
                            lead.status = LeadStatus.AT_RISK
                        
                        # Trigger intervention if engagement engine is available
                        if self.engagement_engine:
                            intervention_sent = await self._trigger_predictive_intervention(
                                lead, risk_assessment
                            )
                            if intervention_sent:
                                stats["interventions_triggered"] += 1
                
                # Check if lead should be moved to cold status
                if await self._should_move_to_cold(lead, risk_assessment):
                    lead.status = LeadStatus.COLD
                    lead.reason_for_cold = "Automated: No response after risk intervention"
                    stats["moved_to_cold"] += 1
                    
                    await self.logger.log_lead_status_change(
                        lead, "at_risk", "cold", "Automated: No response after intervention"
                    )
            
            except Exception as e:
                await self.logger.log_error(
                    error_type="risk_analysis",
                    error_message=str(e),
                    lead_id=lead.id,
                    additional_context="Error during lead risk analysis"
                )
        
        # Commit all changes
        self.db.commit()
        
        # Log campaign completion
        await self.logger.log_outreach_campaign(
            campaign_type="risk_analysis",
            leads_processed=stats["total_analyzed"],
            leads_contacted=stats["interventions_triggered"],
            leads_skipped=stats["total_analyzed"] - stats["interventions_triggered"]
        )
        
        return stats
    
    async def assess_lead_risk(self, lead: Lead) -> Dict[str, Any]:
        """
        Assess the risk level of a single lead based on conversation patterns.
        
        Args:
            lead: The lead to assess
            
        Returns:
            Dictionary containing risk assessment details
        """
        # Get recent messages for analysis
        recent_messages = self.db.query(Message).filter(
            Message.lead_id == lead.id
        ).order_by(Message.created_at.desc()).limit(10).all()
        
        if not recent_messages:
            return {
                "risk_level": "low",
                "sentiment_score": 0.0,
                "risk_factors": ["No conversation history"],
                "last_response_hours": None
            }
        
        # Calculate sentiment trend
        sentiment_scores = []
        conversation_text = ""
        
        for msg in recent_messages:
            if msg.content:
                sentiment = analyze_sentiment(msg.content)
                sentiment_scores.append(sentiment)
                conversation_text += f"{msg.content} "
        
        # Overall sentiment score (weighted toward recent messages)
        if sentiment_scores:
            # Weight recent messages more heavily
            weights = [i + 1 for i in range(len(sentiment_scores))]
            weighted_sentiment = sum(s * w for s, w in zip(sentiment_scores, weights)) / sum(weights)
        else:
            weighted_sentiment = 0.0
        
        # Calculate time since last response
        last_message = recent_messages[0]
        hours_since_last_contact = (datetime.utcnow() - last_message.created_at).total_seconds() / 3600
        
        # Count messages by sender
        message_counts = self.db.query(
            Message.sender, func.count(Message.id)
        ).filter(Message.lead_id == lead.id).group_by(Message.sender).all()
        
        total_messages = sum(count for _, count in message_counts)
        
        # Determine risk level
        risk_level = determine_lead_risk_level(
            sentiment_score=weighted_sentiment,
            response_gap_hours=int(hours_since_last_contact),
            message_count=total_messages
        )
        
        # Identify specific risk factors
        risk_factors = self._identify_risk_factors(
            lead, recent_messages, weighted_sentiment, hours_since_last_contact
        )
        
        return {
            "risk_level": risk_level,
            "sentiment_score": weighted_sentiment,
            "sentiment_trend": sentiment_scores[:5],  # Last 5 messages
            "last_response_hours": hours_since_last_contact,
            "total_messages": total_messages,
            "risk_factors": risk_factors
        }
    
    def _identify_risk_factors(
        self, 
        lead: Lead, 
        recent_messages: List[Message], 
        sentiment_score: float,
        hours_since_last_contact: float
    ) -> List[str]:
        """
        Identify specific risk factors for a lead.
        
        Returns:
            List of identified risk factors
        """
        factors = []
        
        # Sentiment-based factors
        if sentiment_score < -0.5:
            factors.append("Very negative sentiment")
        elif sentiment_score < -0.2:
            factors.append("Negative sentiment trend")
        
        # Response time factors
        if hours_since_last_contact > 72:
            factors.append("No response for 3+ days")
        elif hours_since_last_contact > 48:
            factors.append("No response for 2+ days")
        elif hours_since_last_contact > 24:
            factors.append("No response for 24+ hours")
        
        # Conversation pattern factors
        if len(recent_messages) < 3:
            factors.append("Limited conversation engagement")
        
        # Check for price-related concerns
        price_keywords = ["expensive", "cost", "price", "afford", "budget", "money", "insurance"]
        last_few_messages = " ".join([msg.content.lower() for msg in recent_messages[:3]])
        
        if any(keyword in last_few_messages for keyword in price_keywords):
            if sentiment_score < 0:
                factors.append("Price concerns with negative sentiment")
            else:
                factors.append("Recent price discussion")
        
        # Check for anxiety indicators
        anxiety_keywords = ["nervous", "scared", "worried", "anxious", "pain", "hurt"]
        if any(keyword in last_few_messages for keyword in anxiety_keywords):
            factors.append("Potential dental anxiety")
        
        # Check for competitor mentions
        competitor_keywords = ["other dentist", "another practice", "comparing", "quote"]
        if any(keyword in last_few_messages for keyword in competitor_keywords):
            factors.append("Considering other options")
        
        # Check if last message was from human staff (might indicate escalation)
        if recent_messages and recent_messages[0].sender == SenderType.HUMAN:
            if hours_since_last_contact > 24:
                factors.append("No response after human interaction")
        
        return factors
    
    async def _trigger_predictive_intervention(
        self, 
        lead: Lead, 
        risk_assessment: Dict[str, Any]
    ) -> bool:
        """
        Trigger a predictive intervention for an at-risk lead.
        
        Args:
            lead: The at-risk lead
            risk_assessment: Risk assessment details
            
        Returns:
            True if intervention was sent successfully
        """
        try:
            # Format risk factors for the intervention prompt
            risk_factors_text = "; ".join(risk_assessment.get("risk_factors", []))
            
            # Get recent conversation for context
            recent_messages = self.db.query(Message).filter(
                Message.lead_id == lead.id
            ).order_by(Message.created_at.desc()).limit(5).all()
            
            messages_data = []
            for msg in recent_messages:
                messages_data.append({
                    "sender": msg.sender.value,
                    "content": msg.content,
                    "created_at": msg.created_at
                })
            
            recent_conversation = format_conversation_history(messages_data)
            
            # Use the engagement engine to send intervention
            if self.engagement_engine:
                success = await self.engagement_engine.send_predictive_intervention(
                    lead=lead,
                    risk_factors=risk_factors_text,
                    recent_conversation=recent_conversation,
                    sentiment_trend=risk_assessment.get("sentiment_trend", [])
                )
                
                if success:
                    await self.logger.log_event(
                        event_type="predictive_intervention_sent",
                        details=f"Intervention sent for risk factors: {risk_factors_text}",
                        lead_id=lead.id,
                        severity="info"
                    )
                
                return success
            
        except Exception as e:
            await self.logger.log_error(
                error_type="predictive_intervention",
                error_message=str(e),
                lead_id=lead.id,
                additional_context="Error sending predictive intervention"
            )
        
        return False
    
    async def _should_move_to_cold(
        self, 
        lead: Lead, 
        risk_assessment: Dict[str, Any]
    ) -> bool:
        """
        Determine if a lead should be moved to cold status.
        
        Args:
            lead: The lead to evaluate
            risk_assessment: Risk assessment details
            
        Returns:
            True if lead should be moved to cold
        """
        # Only consider leads that are currently at-risk
        if lead.status != LeadStatus.AT_RISK:
            return False
        
        # Check if enough time has passed since becoming at-risk
        hours_at_risk = (datetime.utcnow() - lead.last_contact_at).total_seconds() / 3600 \
                       if lead.last_contact_at else float('inf')
        
        # Move to cold if:
        # - At high risk for more than 7 days, OR
        # - No response for more than 14 days regardless of risk level
        if (lead.risk_level == LeadRiskLevel.HIGH and hours_at_risk > 168) or \
           hours_at_risk > 336:  # 14 days
            return True
        
        return False
    
    def get_risk_summary(self) -> Dict[str, Any]:
        """
        Get a summary of current lead risk distribution.
        
        Returns:
            Dictionary containing risk summary statistics
        """
        # Count leads by risk level
        risk_counts = self.db.query(
            Lead.risk_level, func.count(Lead.id)
        ).filter(
            Lead.status.in_([LeadStatus.ACTIVE, LeadStatus.AT_RISK])
        ).group_by(Lead.risk_level).all()
        
        risk_summary = {level.value: 0 for level in LeadRiskLevel}
        for risk_level, count in risk_counts:
            risk_summary[risk_level.value] = count
        
        # Get recent at-risk leads
        recent_at_risk = self.db.query(Lead).filter(
            Lead.status == LeadStatus.AT_RISK,
            Lead.risk_level == LeadRiskLevel.HIGH
        ).order_by(Lead.last_contact_at.desc()).limit(10).all()
        
        return {
            "risk_distribution": risk_summary,
            "total_active": sum(risk_summary.values()),
            "high_risk_count": risk_summary.get("high", 0),
            "recent_high_risk_leads": [
                {
                    "id": lead.id,
                    "name": lead.name,
                    "email": lead.email,
                    "last_contact": lead.last_contact_at.isoformat() if lead.last_contact_at else None,
                    "sentiment_score": lead.sentiment_score
                }
                for lead in recent_at_risk
            ]
        }