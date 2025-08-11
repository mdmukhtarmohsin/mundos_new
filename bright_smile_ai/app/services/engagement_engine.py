"""
EngagementEngine Service - Core AI orchestration using LangGraph
Handles both Instant Reply Agent and Proactive Outreach Agent workflows
"""
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, TypedDict
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END

from app.db.models import (
    Lead, Message, Offer, Testimonial, SenderType, 
    LeadStatus, LeadRiskLevel, AIInteraction
)
from app.core.config import settings
from app.core.prompts import (
    get_intent_classification_prompt,
    get_financial_offer_prompt,
    get_general_qa_prompt,
    get_cold_lead_prompt,
    get_predictive_intervention_prompt,
    get_human_handoff_prompt
)
from app.core.utils import analyze_sentiment, format_conversation_history
from app.services.asset_generator import AssetGenerator
from app.services.system_logger import SystemLogger


# State definition for LangGraph
class ConversationState(TypedDict):
    lead_id: int
    conversation_history: List[BaseMessage]
    incoming_message: str
    classified_intent: str
    generated_response: str
    is_handoff: bool
    additional_context: Dict[str, Any]


class EngagementEngine:
    """
    Core service that orchestrates AI-driven lead engagement.
    Implements both the Instant Reply Agent and Proactive Outreach Agent workflows.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.asset_generator = AssetGenerator(db)
        self.logger = SystemLogger(db)
        
        # Initialize OpenAI client
        self.llm = ChatOpenAI(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            temperature=settings.openai_temperature
        )
        
        # Initialize LangGraph workflow
        self.graph = self._build_langgraph_workflow()
    
    def _build_langgraph_workflow(self) -> StateGraph:
        """Build the LangGraph workflow for the Instant Reply Agent"""
        
        # Create workflow builder
        workflow = StateGraph(ConversationState)
        
        # Add nodes
        workflow.add_node("get_lead_and_history", self._get_lead_and_history)
        workflow.add_node("classify_intent", self._classify_intent)
        workflow.add_node("handle_price_inquiry", self._handle_price_inquiry)
        workflow.add_node("handle_booking_or_handoff", self._handle_booking_or_handoff)
        workflow.add_node("handle_general_question", self._handle_general_question)
        workflow.add_node("save_response", self._save_response)
        
        # Set entry point
        workflow.set_entry_point("get_lead_and_history")
        
        # Add edges
        workflow.add_edge("get_lead_and_history", "classify_intent")
        workflow.add_conditional_edges(
            "classify_intent",
            self._route_by_intent,
            {
                "price_inquiry": "handle_price_inquiry",
                "booking_request": "handle_booking_or_handoff",
                "human_handoff": "handle_booking_or_handoff",
                "general_question": "handle_general_question"
            }
        )
        workflow.add_edge("handle_price_inquiry", "save_response")
        workflow.add_edge("handle_booking_or_handoff", "save_response")
        workflow.add_edge("handle_general_question", "save_response")
        workflow.add_edge("save_response", END)
        
        # Compile the graph
        return workflow.compile()
    
    # ========================================================================
    # LangGraph Node Implementations
    # ========================================================================
    
    async def _get_lead_and_history(self, state: ConversationState) -> ConversationState:
        """Load lead data and conversation history"""
        lead = self.db.query(Lead).filter(Lead.id == state["lead_id"]).first()
        if not lead:
            raise ValueError(f"Lead {state['lead_id']} not found")
        
        # Get conversation history
        messages = self.db.query(Message).filter(
            Message.lead_id == lead.id
        ).order_by(Message.created_at.asc()).all()
        
        # Convert to LangChain messages
        conversation_history = []
        for msg in messages:
            if msg.sender == SenderType.LEAD:
                conversation_history.append(HumanMessage(content=msg.content))
            elif msg.sender in [SenderType.AI, SenderType.HUMAN]:
                conversation_history.append(AIMessage(content=msg.content))
        
        # Add current message
        conversation_history.append(HumanMessage(content=state["incoming_message"]))
        
        state["conversation_history"] = conversation_history
        state["additional_context"] = {
            "lead_name": lead.name,
            "lead_email": lead.email,
            "lead_status": lead.status.value,
            "initial_inquiry": lead.initial_inquiry
        }
        
        return state
    
    async def _classify_intent(self, state: ConversationState) -> ConversationState:
        """Classify the intent of the incoming message"""
        
        # Format conversation history for prompt
        messages_data = []
        for msg in state["conversation_history"][:-1]:  # Exclude current message
            sender = "lead" if isinstance(msg, HumanMessage) else "ai"
            messages_data.append({
                "sender": sender,
                "content": msg.content,
                "created_at": datetime.utcnow()  # Simplified for prompt
            })
        
        conversation_text = format_conversation_history(messages_data, limit=5)
        
        # Get intent classification prompt
        prompt = get_intent_classification_prompt(
            latest_message=state["incoming_message"],
            conversation_history=conversation_text
        )
        
        # Call LLM for intent classification
        response = await self.llm.ainvoke([SystemMessage(content=prompt)])
        intent = response.content.strip().lower()
        
        # Validate intent
        valid_intents = ["price_inquiry", "booking_request", "human_handoff", "general_question"]
        if intent not in valid_intents:
            intent = "general_question"  # Default fallback
        
        state["classified_intent"] = intent
        
        return state
    
    def _route_by_intent(self, state: ConversationState) -> str:
        """Route to appropriate handler based on classified intent"""
        return state["classified_intent"]
    
    async def _handle_price_inquiry(self, state: ConversationState) -> ConversationState:
        """Handle price-related inquiries by offering financial explainer"""
        
        # Determine service interest from conversation
        conversation_text = " ".join([msg.content for msg in state["conversation_history"]])
        
        # Get relevant offers
        relevant_offers = self.db.query(Offer).filter(
            Offer.is_active == True
        ).limit(3).all()
        
        offers_text = "\n".join([
            f"- {offer.offer_title}: {offer.description}"
            for offer in relevant_offers
        ]) if relevant_offers else "No current offers available."
        
        # Generate response using LLM
        prompt = get_financial_offer_prompt(
            lead_name=state["additional_context"]["lead_name"],
            service_interest=state["additional_context"].get("initial_inquiry", "dental treatment"),
            conversation_history=conversation_text,
            relevant_offers=offers_text
        )
        
        response = await self.llm.ainvoke([SystemMessage(content=prompt)])
        
        # Create financial explainer
        lead = self.db.query(Lead).filter(Lead.id == state["lead_id"]).first()
        explainer = await self.asset_generator.create_intelligent_financial_explainer(
            lead=lead,
            conversation_context=conversation_text
        )
        
        # Add explainer link to response
        explainer_url = self.asset_generator.format_financial_explainer_url(
            explainer, "https://brightsmile-ai.com"  # Replace with actual domain
        )
        
        full_response = f"{response.content}\n\nI've created a personalized financial breakdown for you: {explainer_url}"
        state["generated_response"] = full_response
        
        return state
    
    async def _handle_booking_or_handoff(self, state: ConversationState) -> ConversationState:
        """Handle booking requests or human handoff requests"""
        
        # Format conversation for context
        conversation_text = " ".join([msg.content for msg in state["conversation_history"]])
        
        prompt = get_human_handoff_prompt(
            lead_name=state["additional_context"]["lead_name"],
            latest_message=state["incoming_message"],
            conversation_history=conversation_text
        )
        
        response = await self.llm.ainvoke([SystemMessage(content=prompt)])
        
        state["generated_response"] = response.content
        state["is_handoff"] = True
        
        return state
    
    async def _handle_general_question(self, state: ConversationState) -> ConversationState:
        """Handle general questions with relevant testimonials"""
        
        # Get relevant testimonials
        conversation_text = " ".join([msg.content for msg in state["conversation_history"]])
        from app.core.utils import extract_service_keywords
        
        service_keywords = extract_service_keywords(conversation_text)
        testimonials = []
        
        for keyword in service_keywords[:2]:  # Get testimonials for top 2 services
            testimonial = self.db.query(Testimonial).filter(
                Testimonial.service_category.ilike(f"%{keyword}%")
            ).first()
            if testimonial:
                testimonials.append(testimonial)
        
        # If no specific testimonials found, get general ones
        if not testimonials:
            testimonials = self.db.query(Testimonial).filter(
                Testimonial.service_category == "General"
            ).limit(2).all()
        
        testimonials_text = "\n".join([
            f"Patient testimonial: \"{testimonial.snippet_text}\""
            for testimonial in testimonials
        ]) if testimonials else ""
        
        prompt = get_general_qa_prompt(
            latest_message=state["incoming_message"],
            conversation_history=conversation_text,
            relevant_testimonials=testimonials_text
        )
        
        response = await self.llm.ainvoke([SystemMessage(content=prompt)])
        state["generated_response"] = response.content
        
        return state
    
    async def _save_response(self, state: ConversationState) -> ConversationState:
        """Save the generated response and update lead status"""
        
        # Create message record
        message = Message(
            lead_id=state["lead_id"],
            sender=SenderType.AI,
            content=state["generated_response"],
            intent_classification=state["classified_intent"]
        )
        
        self.db.add(message)
        
        # Update lead status and timestamps
        lead = self.db.query(Lead).filter(Lead.id == state["lead_id"]).first()
        if lead:
            lead.last_contact_at = datetime.utcnow()
            
            if state.get("is_handoff"):
                lead.status = LeadStatus.HUMAN_HANDOFF
            elif lead.status == LeadStatus.NEW:
                lead.status = LeadStatus.ACTIVE
        
        self.db.commit()
        
        # Log the interaction
        await self.logger.log_ai_interaction(
            lead_id=state["lead_id"],
            interaction_type="instant_reply",
            success=True
        )
        
        return state
    
    # ========================================================================
    # Public Methods - Instant Reply Agent
    # ========================================================================
    
    async def invoke_new_message(self, lead_id: int, message: str) -> Dict[str, Any]:
        """
        Process a new message from a lead using the Instant Reply Agent.
        
        Args:
            lead_id: ID of the lead sending the message
            message: Content of the message
            
        Returns:
            Dictionary containing response and metadata
        """
        try:
            # Initialize state
            initial_state: ConversationState = {
                "lead_id": lead_id,
                "conversation_history": [],
                "incoming_message": message,
                "classified_intent": "",
                "generated_response": "",
                "is_handoff": False,
                "additional_context": {}
            }
            
            # Run the workflow
            final_state = await self.graph.ainvoke(initial_state)
            
            return {
                "success": True,
                "response": final_state["generated_response"],
                "intent": final_state["classified_intent"],
                "handoff_required": final_state["is_handoff"]
            }
        
        except Exception as e:
            await self.logger.log_error(
                error_type="instant_reply",
                error_message=str(e),
                lead_id=lead_id,
                additional_context=f"Message: {message[:100]}..."
            )
            
            return {
                "success": False,
                "error": str(e)
            }
    
    # ========================================================================
    # Public Methods - Proactive Outreach Agent
    # ========================================================================
    
    async def run_proactive_outreach_campaign(self) -> Dict[str, int]:
        """
        Run the proactive outreach campaign for cold leads.
        This implements the qualification gauntlet and strategy selection.
        """
        # Get all cold leads
        cold_leads = self.db.query(Lead).filter(
            Lead.status == LeadStatus.COLD,
            Lead.do_not_contact == False
        ).all()
        
        stats = {
            "leads_processed": len(cold_leads),
            "leads_contacted": 0,
            "leads_skipped": 0
        }
        
        for lead in cold_leads:
            try:
                # Run qualification gauntlet
                if await self._qualify_lead_for_outreach(lead):
                    success = await self._run_outreach_play(lead)
                    if success:
                        stats["leads_contacted"] += 1
                        # Update lead status
                        lead.status = LeadStatus.CONTACTED
                    else:
                        stats["leads_skipped"] += 1
                else:
                    stats["leads_skipped"] += 1
            
            except Exception as e:
                await self.logger.log_error(
                    error_type="proactive_outreach",
                    error_message=str(e),
                    lead_id=lead.id
                )
                stats["leads_skipped"] += 1
        
        self.db.commit()
        
        # Log campaign results
        await self.logger.log_outreach_campaign(
            campaign_type="proactive_outreach",
            leads_processed=stats["leads_processed"],
            leads_contacted=stats["leads_contacted"],
            leads_skipped=stats["leads_skipped"]
        )
        
        return stats
    
    async def _qualify_lead_for_outreach(self, lead: Lead) -> bool:
        """
        Run the qualification gauntlet for a cold lead.
        
        Returns:
            True if lead qualifies for outreach
        """
        # Check do_not_contact flag
        if lead.do_not_contact:
            return False
        
        # Check if last message was from human staff
        last_message = self.db.query(Message).filter(
            Message.lead_id == lead.id
        ).order_by(Message.created_at.desc()).first()
        
        if last_message and last_message.sender == SenderType.HUMAN:
            return False
        
        # Check cooldown period
        if lead.last_contact_at:
            days_since_contact = (datetime.utcnow() - lead.last_contact_at).days
            if days_since_contact < settings.cold_lead_cooldown_days:
                return False
        
        return True
    
    async def _run_outreach_play(self, lead: Lead) -> bool:
        """
        Select and execute an outreach strategy for a qualified cold lead.
        
        Args:
            lead: The qualified cold lead
            
        Returns:
            True if outreach was sent successfully
        """
        # Calculate days since lead went cold
        days_cold = (datetime.utcnow() - lead.last_contact_at).days \
                   if lead.last_contact_at else 999
        
        # Select strategy based on time elapsed
        if days_cold <= settings.gentle_nudge_days + 16:  # 14-30 days
            strategy = "gentle_nudge"
            context = {
                "original_inquiry": lead.initial_inquiry or "dental services",
                "days_cold": days_cold,
                "original_contact_date": lead.created_at.strftime("%B %d")
            }
        
        elif days_cold <= settings.social_proof_days + 15:  # 30-45 days
            strategy = "social_proof"
            
            # Get relevant testimonial
            service_keywords = extract_service_keywords(lead.initial_inquiry or "")
            testimonial = None
            
            if service_keywords:
                testimonial = self.db.query(Testimonial).filter(
                    Testimonial.service_category.ilike(f"%{service_keywords[0]}%")
                ).first()
            
            if not testimonial:
                testimonial = self.db.query(Testimonial).filter(
                    Testimonial.service_category == "General"
                ).first()
            
            context = {
                "service_interest": lead.initial_inquiry or "dental care",
                "days_cold": days_cold,
                "testimonial": testimonial.snippet_text if testimonial else "Great experience with our practice!",
                "original_inquiry": lead.initial_inquiry or "dental services"
            }
        
        else:  # 45+ days
            strategy = "incentive_offer"
            
            # Get relevant offer
            offer = self.db.query(Offer).filter(
                Offer.is_active == True
            ).first()
            
            context = {
                "service_interest": lead.initial_inquiry or "dental care",
                "days_cold": days_cold,
                "offer_details": f"{offer.offer_title}: {offer.description}" if offer else "Special consultation discount",
                "original_inquiry": lead.initial_inquiry or "dental services"
            }
        
        # Generate message using appropriate prompt
        prompt = get_cold_lead_prompt(strategy, lead.name, **context)
        response = await self.llm.ainvoke([SystemMessage(content=prompt)])
        
        # Save the outreach message
        message = Message(
            lead_id=lead.id,
            sender=SenderType.AI,
            content=response.content
        )
        
        self.db.add(message)
        lead.last_contact_at = datetime.utcnow()
        
        await self.logger.log_event(
            event_type=f"proactive_outreach_{strategy}",
            details=f"Sent {strategy} message after {days_cold} days",
            lead_id=lead.id
        )
        
        return True
    
    # ========================================================================
    # Public Methods - Predictive Intervention
    # ========================================================================
    
    async def send_predictive_intervention(
        self, 
        lead: Lead, 
        risk_factors: str,
        recent_conversation: str,
        sentiment_trend: List[float]
    ) -> bool:
        """
        Send a predictive intervention message to an at-risk lead.
        
        Args:
            lead: The at-risk lead
            risk_factors: Identified risk factors
            recent_conversation: Recent conversation context
            sentiment_trend: Recent sentiment scores
            
        Returns:
            True if intervention was sent successfully
        """
        try:
            prompt = get_predictive_intervention_prompt(
                lead_name=lead.name,
                risk_factors=risk_factors,
                recent_messages=recent_conversation,
                sentiment_trend=str(sentiment_trend)
            )
            
            response = await self.llm.ainvoke([SystemMessage(content=prompt)])
            
            # Save intervention message
            message = Message(
                lead_id=lead.id,
                sender=SenderType.AI,
                content=response.content
            )
            
            self.db.add(message)
            lead.last_contact_at = datetime.utcnow()
            self.db.commit()
            
            return True
        
        except Exception as e:
            await self.logger.log_error(
                error_type="predictive_intervention",
                error_message=str(e),
                lead_id=lead.id
            )
            return False