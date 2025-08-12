"""
RiskAnalyzer Service - Analyzes lead risk patterns and triggers interventions
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI

from app.db.models import Lead, Message, LeadStatus, LeadRiskLevel, SenderType, Offer
from app.core.config import settings
from app.core.utils import (
    analyze_sentiment, 
    determine_lead_risk_level,
    format_conversation_history,
    extract_service_keywords
)
from app.services.system_logger import SystemLogger


class RiskAnalyzer:
    """
    Service responsible for analyzing lead behavior patterns,
    identifying at-risk leads, and triggering predictive interventions.
    Now enhanced with AI-powered lead scanning and aggressive offer generation.
    """
    
    def __init__(self, db: Session, engagement_engine=None):
        self.db = db
        self.engagement_engine = engagement_engine  # Injected to avoid circular import
        self.logger = SystemLogger(db)
        
        # Initialize OpenAI client for AI-powered analysis
        self.llm = ChatOpenAI(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            temperature=0.3  # Lower temperature for more consistent analysis
        )
    
    def _get_timezone_aware_now(self):
        """Get timezone-aware current datetime"""
        return datetime.utcnow().replace(tzinfo=None)
    
    def _safe_datetime_diff(self, dt1, dt2):
        """Safely calculate difference between two datetime objects"""
        if dt1 is None or dt2 is None:
            return 0
        
        # Ensure both are timezone-naive for comparison
        if dt1.tzinfo is not None:
            dt1 = dt1.replace(tzinfo=None)
        if dt2.tzinfo is not None:
            dt2 = dt2.replace(tzinfo=None)
        
        return (dt1 - dt2).total_seconds()
    
    async def scan_all_leads_for_opportunities(self) -> Dict[str, int]:
        """
        AI-powered lead scanning to identify opportunities for proactive engagement.
        This goes beyond just risk analysis to find leads that could benefit from outreach.
        
        Returns:
            Dictionary with scanning statistics
        """
        # Get all leads that could benefit from proactive engagement
        scan_candidates = self.db.query(Lead).filter(
            Lead.status.in_([LeadStatus.NEW, LeadStatus.ACTIVE, LeadStatus.AT_RISK]),
            Lead.do_not_contact == False
        ).all()
        
        stats = {
            "total_scanned": len(scan_candidates),
            "opportunities_identified": 0,
            "proactive_messages_sent": 0,
            "leads_escalated": 0
        }
        
        for lead in scan_candidates:
            try:
                # AI-powered opportunity analysis
                opportunity_assessment = await self._ai_analyze_lead_opportunity(lead)
                
                if opportunity_assessment["should_engage"]:
                    stats["opportunities_identified"] += 1
                    
                    # Determine engagement strategy
                    if opportunity_assessment["strategy"] == "proactive_outreach":
                        success = await self._send_proactive_engagement(lead, opportunity_assessment)
                        if success:
                            stats["proactive_messages_sent"] += 1
                    
                    elif opportunity_assessment["strategy"] == "escalate_to_human":
                        lead.status = LeadStatus.HUMAN_HANDOFF
                        lead.reason_for_cold = "AI identified high-value opportunity requiring human attention"
                        stats["leads_escalated"] += 1
                        
                        await self.logger.log_event(
                            event_type="ai_escalation",
                            details=f"AI escalated lead due to: {opportunity_assessment['reasoning']}",
                            lead_id=lead.id,
                            severity="info"
                        )
                
            except Exception as e:
                await self.logger.log_error(
                    error_type="opportunity_scanning",
                    error_message=str(e),
                    lead_id=lead.id,
                    additional_context="Error during AI opportunity analysis"
                )
        
        # Commit all changes
        self.db.commit()
        
        # Log scanning completion
        await self.logger.log_event(
            event_type="ai_lead_scanning",
            details=f"AI lead scanning completed: {stats['opportunities_identified']} opportunities found",
            severity="info"
        )
        
        return stats
    
    async def _ai_analyze_lead_opportunity(self, lead: Lead) -> Dict[str, Any]:
        """
        Use AI to analyze if a lead presents an opportunity for proactive engagement.
        
        Args:
            lead: The lead to analyze
            
        Returns:
            Dictionary containing opportunity assessment
        """
        # Get recent conversation context
        recent_messages = self.db.query(Message).filter(
            Message.lead_id == lead.id
        ).order_by(Message.created_at.desc()).limit(8).all()
        
        # Get lead's service interests
        service_keywords = extract_service_keywords(lead.initial_inquiry or "")
        
        # Get available offers for this lead
        relevant_offers = []
        if service_keywords:
            for keyword in service_keywords:
                offers = self.db.query(Offer).filter(
                    Offer.valid_for_service.ilike(f"%{keyword}%"),
                    Offer.is_active == True
                ).all()
                relevant_offers.extend(offers)
        
        # If no specific offers, get general ones
        if not relevant_offers:
            relevant_offers = self.db.query(Offer).filter(
                Offer.is_active == True
            ).limit(3).all()
        
        offers_text = "\n".join([
            f"- {offer.offer_title}: {offer.description}"
            for offer in relevant_offers
        ]) if relevant_offers else "No current offers available."
        
        # Format conversation for AI analysis
        conversation_text = ""
        if recent_messages:
            messages_data = []
            for msg in recent_messages:
                messages_data.append({
                    "sender": msg.sender.value,
                    "content": msg.content,
                    "created_at": msg.created_at
                })
            conversation_text = format_conversation_history(messages_data, limit=5)
        
        # AI prompt for opportunity analysis
        analysis_prompt = f"""
You are an AI lead analysis expert for a dental practice. Analyze this lead to determine if there's an opportunity for proactive engagement.

LEAD INFORMATION:
- Name: {lead.name}
- Status: {lead.status.value}
- Risk Level: {lead.risk_level.value}
- Initial Inquiry: {lead.initial_inquiry or "Not specified"}
- Days Since Creation: {(self._get_timezone_aware_now() - lead.created_at.replace(tzinfo=None)).days if lead.created_at else 0}
- Sentiment Score: {lead.sentiment_score or 0.0}

RECENT CONVERSATION:
{conversation_text if conversation_text else "No recent conversation"}

AVAILABLE OFFERS:
{offers_text}

ANALYSIS TASK:
Determine if this lead presents an opportunity for proactive engagement. Consider:
1. Are they showing buying signals?
2. Could they benefit from a specific offer?
3. Are they at risk of going cold?
4. Would proactive outreach add value?

RESPONSE FORMAT (JSON):
{{
    "should_engage": true/false,
    "strategy": "proactive_outreach" or "escalate_to_human" or "none",
    "reasoning": "Detailed explanation of why this lead should be engaged",
    "recommended_offer": "Specific offer to present, if applicable",
    "urgency_level": "low", "medium", or "high",
    "next_best_action": "Specific action to take"
}}

Respond with ONLY valid JSON.
"""
        
        try:
            # Get AI analysis
            response = await self.llm.ainvoke([SystemMessage(content=analysis_prompt)])
            
            # Parse AI response
            import json
            analysis = json.loads(response.content.strip())
            
            return analysis
            
        except Exception as e:
            # Fallback to rule-based analysis if AI fails
            return self._fallback_opportunity_analysis(lead, recent_messages, relevant_offers)
    
    def _fallback_opportunity_analysis(self, lead: Lead, recent_messages: List[Message], 
                                     relevant_offers: List[Offer]) -> Dict[str, Any]:
        """Fallback rule-based analysis if AI analysis fails"""
        
        # Simple rule-based logic
        days_since_creation = (self._get_timezone_aware_now() - lead.created_at.replace(tzinfo=None)).days if lead.created_at else 0
        has_offers = len(relevant_offers) > 0
        
        # More aggressive conditions for engagement
        if lead.status == LeadStatus.NEW and days_since_creation > 1:  # Reduced from 2 days
            return {
                "should_engage": True,
                "strategy": "proactive_outreach",
                "reasoning": "New lead hasn't been engaged yet",
                "recommended_offer": relevant_offers[0].offer_title if has_offers else "Welcome consultation",
                "urgency_level": "medium",
                "next_best_action": "Send welcome message with relevant offer"
            }
        
        elif lead.status == LeadStatus.AT_RISK and lead.risk_level == LeadRiskLevel.HIGH:
            return {
                "should_engage": True,
                "strategy": "proactive_outreach",
                "reasoning": "High-risk lead needs immediate attention",
                "recommended_offer": "Special consultation discount" if has_offers else "Urgent follow-up",
                "urgency_level": "high",
                "next_best_action": "Send aggressive retention offer"
            }
        
        elif lead.status == LeadStatus.AT_RISK and lead.risk_level == LeadRiskLevel.MEDIUM:
            return {
                "should_engage": True,
                "strategy": "proactive_outreach",
                "reasoning": "Medium-risk lead needs attention",
                "recommended_offer": "Follow-up consultation" if has_offers else "Check-in message",
                "urgency_level": "medium",
                "next_best_action": "Send supportive follow-up message"
            }
        
        elif lead.status == LeadStatus.ACTIVE and days_since_creation > 3:
            return {
                "should_engage": True,
                "strategy": "proactive_outreach",
                "reasoning": "Active lead may need follow-up",
                "recommended_offer": "Progress check-in" if has_offers else "General follow-up",
                "urgency_level": "low",
                "next_best_action": "Send friendly check-in message"
            }
        
        return {
            "should_engage": False,
            "strategy": "none",
            "reasoning": "No immediate opportunity identified",
            "recommended_offer": None,
            "urgency_level": "low",
            "next_best_action": "Continue monitoring"
        }
    
    async def _send_proactive_engagement(self, lead: Lead, assessment: Dict[str, Any]) -> bool:
        """
        Send proactive engagement message based on AI assessment.
        
        Args:
            lead: The lead to engage
            assessment: AI opportunity assessment
            
        Returns:
            True if message was sent successfully
        """
        try:
            # Generate personalized message using AI
            message_prompt = f"""
You are a dental practice AI assistant. Create a proactive engagement message for this lead.

LEAD CONTEXT:
- Name: {lead.name}
- Initial Interest: {lead.initial_inquiry or "dental services"}
- Opportunity: {assessment['reasoning']}
- Recommended Offer: {assessment.get('recommended_offer', 'None')}
- Urgency: {assessment['urgency_level']}

MESSAGE REQUIREMENTS:
- Be warm and helpful, not pushy
- Reference their specific interest
- Include the recommended offer if applicable
- Make it easy for them to respond
- Keep it under 150 words

Create a natural, engaging message that feels like a helpful follow-up from a caring dental practice.
"""
            
            response = await self.llm.ainvoke([SystemMessage(content=message_prompt)])
            
            # Save the proactive message
            message = Message(
                lead_id=lead.id,
                sender=SenderType.AI,
                content=response.content,
                intent_classification="proactive_engagement"
            )
            
            self.db.add(message)
            lead.last_contact_at = self._get_timezone_aware_now()
            
            # Log the proactive engagement
            await self.logger.log_event(
                event_type="ai_proactive_engagement",
                details=f"AI sent proactive message: {assessment['reasoning']}",
                lead_id=lead.id,
                severity="info"
            )
            
            return True
            
        except Exception as e:
            await self.logger.log_error(
                error_type="proactive_engagement",
                error_message=str(e),
                lead_id=lead.id,
                additional_context="Error sending proactive engagement message"
            )
            return False

    async def analyze_all_active_leads(self) -> Dict[str, int]:
        """
        Analyze all active leads for risk patterns and trigger interventions.
        Enhanced to include AI-powered opportunity scanning.
        
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
            "moved_to_cold": 0,
            "aggressive_offers_sent": 0
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
                
                # Send aggressive offer for high-risk leads (both newly at risk and existing high-risk)
                if lead.risk_level == LeadRiskLevel.HIGH:
                    # Only count as newly at risk if the status just changed
                    if risk_assessment["risk_level"] != lead.risk_level.value:
                        stats["newly_at_risk"] += 1
                    
                    # Update status to at-risk if not already
                    if lead.status != LeadStatus.AT_RISK:
                        lead.status = LeadStatus.AT_RISK
                    
                    # Send aggressive offer for high-risk leads
                    aggressive_offer_sent = await self._send_aggressive_retention_offer(lead, risk_assessment)
                    if aggressive_offer_sent:
                        stats["aggressive_offers_sent"] += 1
                    
                    # Trigger intervention if engagement engine is available
                    if self.engagement_engine:
                        intervention_sent = await self._trigger_predictive_intervention(
                            lead, risk_assessment
                        )
                        if intervention_sent:
                            stats["interventions_triggered"] += 1
                
                # Also trigger for leads that are at-risk with medium risk level
                elif lead.status == LeadStatus.AT_RISK and lead.risk_level == LeadRiskLevel.MEDIUM:
                    # Send intervention for medium-risk at-risk leads
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
            leads_contacted=stats["interventions_triggered"] + stats["aggressive_offers_sent"],
            leads_skipped=stats["total_analyzed"] - stats["interventions_triggered"] - stats["aggressive_offers_sent"]
        )
        
        return stats

    async def _send_aggressive_retention_offer(self, lead: Lead, risk_assessment: Dict[str, Any]) -> bool:
        """
        Send an aggressive retention offer to a high-risk lead.
        This is the key enhancement for preventing lead loss.
        
        Args:
            lead: The high-risk lead
            risk_assessment: Risk assessment details
            
        Returns:
            True if aggressive offer was sent successfully
        """
        try:
            # Get the most compelling offers for this lead
            service_keywords = extract_service_keywords(lead.initial_inquiry or "")
            relevant_offers = []
            
            if service_keywords:
                for keyword in service_keywords:
                    offers = self.db.query(Offer).filter(
                        Offer.valid_for_service.ilike(f"%{keyword}%"),
                        Offer.is_active == True
                    ).all()
                    relevant_offers.extend(offers)
            
            # If no specific offers, get the most compelling general offers
            if not relevant_offers:
                relevant_offers = self.db.query(Offer).filter(
                    Offer.is_active == True
                ).limit(3).all()
            
            # Generate aggressive retention message using AI
            retention_prompt = f"""
You are a dental practice AI assistant. Create an AGGRESSIVE retention message for a high-risk lead who is about to be lost.

LEAD CONTEXT:
- Name: {lead.name}
- Risk Factors: {', '.join(risk_assessment.get('risk_factors', []))}
- Sentiment Trend: {risk_assessment.get('sentiment_trend', [])}
- Days Since Last Contact: {risk_assessment.get('last_response_hours', 0) / 24:.1f}

AVAILABLE OFFERS:
{chr(10).join([f"- {offer.offer_title}: {offer.description}" for offer in relevant_offers]) if relevant_offers else "No specific offers available"}

MESSAGE REQUIREMENTS:
- Be URGENT but not desperate
- Address their specific risk factors
- Present the most compelling offer prominently
- Create a sense of urgency and value
- Make it impossible to ignore
- Keep it under 200 words
- Use emotional language that connects with dental anxiety

This lead is about to be lost - you need to save them with an irresistible offer!
"""
            
            response = await self.llm.ainvoke([SystemMessage(content=retention_prompt)])
            
            # Save the aggressive retention message
            message = Message(
                lead_id=lead.id,
                sender=SenderType.AI,
                content=response.content,
                intent_classification="aggressive_retention"
            )
            
            self.db.add(message)
            lead.last_contact_at = self._get_timezone_aware_now()
            
            # Log the aggressive retention attempt
            await self.logger.log_event(
                event_type="aggressive_retention_offer",
                details=f"Sent aggressive retention offer for risk factors: {', '.join(risk_assessment.get('risk_factors', []))}",
                lead_id=lead.id,
                severity="warning"
            )
            
            return True
            
        except Exception as e:
            await self.logger.log_error(
                error_type="aggressive_retention",
                error_message=str(e),
                lead_id=lead.id,
                additional_context="Error sending aggressive retention offer"
            )
            return False
    
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
        hours_since_last_contact = self._safe_datetime_diff(
            self._get_timezone_aware_now(), 
            last_message.created_at
        ) / 3600
        
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
        hours_at_risk = self._safe_datetime_diff(
            self._get_timezone_aware_now(), 
            lead.last_contact_at
        ) / 3600 if lead.last_contact_at else float('inf')
        
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