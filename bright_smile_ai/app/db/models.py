"""
SQLAlchemy models for the AI Patient Advocate system
Based on the comprehensive schema defined in the PRD Section 6
"""
import enum
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, TIMESTAMP, 
    ForeignKey, UniqueConstraint, Numeric
)
from sqlalchemy.dialects.postgresql import ENUM, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


# Enums
class LeadStatus(enum.Enum):
    NEW = "new"
    ACTIVE = "active"
    AT_RISK = "at_risk"
    COLD = "cold"
    CONTACTED = "contacted"  # Added for proactive outreach
    HUMAN_HANDOFF = "human_handoff"
    CONVERTED = "converted"
    DO_NOT_CONTACT = "do_not_contact"


class LeadRiskLevel(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class SenderType(enum.Enum):
    LEAD = "lead"
    AI = "ai"
    HUMAN = "human"


# Create PostgreSQL ENUM types
lead_status_enum = ENUM(LeadStatus, name="lead_status", create_type=False)
lead_risk_level_enum = ENUM(LeadRiskLevel, name="lead_risk_level", create_type=False)
sender_type_enum = ENUM(SenderType, name="sender_type", create_type=False)


class Lead(Base):
    """
    Core lead entity - represents potential patients in the system
    """
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(50), unique=True, nullable=True, index=True)
    
    # Core business fields
    initial_inquiry = Column(Text, nullable=True, comment="The very first thing the lead asked")
    status = Column(lead_status_enum, nullable=False, default=LeadStatus.NEW, index=True)
    risk_level = Column(lead_risk_level_enum, nullable=False, default=LeadRiskLevel.LOW)
    sentiment_score = Column(Float, default=0.0, comment="Rolling conversation mood score")
    reason_for_cold = Column(Text, nullable=True, comment="Manual tag for why lead was lost")
    
    # Privacy and contact preferences  
    do_not_contact = Column(Boolean, nullable=False, default=False, index=True)
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    last_contact_at = Column(TIMESTAMP(timezone=True), nullable=True, index=True)
    
    # Relationships
    messages = relationship("Message", back_populates="lead", cascade="all, delete-orphan")
    financial_explainers = relationship("FinancialExplainer", back_populates="lead", cascade="all, delete-orphan")
    system_events = relationship("SystemEvent", back_populates="lead", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Lead(id={self.id}, name='{self.name}', email='{self.email}', status='{self.status.value}')>"


class Message(Base):
    """
    Individual messages in conversations between leads, AI, and human staff
    """
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(sender_type_enum, nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Additional metadata for AI messages
    intent_classification = Column(String(100), nullable=True, comment="Classified intent for AI messages")
    confidence_score = Column(Float, nullable=True, comment="AI confidence in response")
    
    # Relationships
    lead = relationship("Lead", back_populates="messages")
    
    def __repr__(self):
        return f"<Message(id={self.id}, lead_id={self.lead_id}, sender='{self.sender.value}')>"


class Offer(Base):
    """
    Marketing offers that can be targeted to leads
    """
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    offer_title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    valid_for_service = Column(String(100), default="General", index=True)
    
    # Offer management
    is_active = Column(Boolean, default=True, index=True)
    discount_percentage = Column(Float, nullable=True)
    discount_amount = Column(Numeric(10, 2), nullable=True)
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(TIMESTAMP(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<Offer(id={self.id}, title='{self.offer_title}', service='{self.valid_for_service}')>"


class Testimonial(Base):
    """
    Patient testimonials used for social proof
    """
    __tablename__ = "testimonials"

    id = Column(Integer, primary_key=True, index=True)
    service_category = Column(String(100), nullable=False, index=True)
    snippet_text = Column(Text, nullable=False)
    
    # Testimonial metadata
    patient_name = Column(String(255), nullable=True)
    rating = Column(Integer, nullable=True, comment="1-5 star rating")
    is_verified = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<Testimonial(id={self.id}, service='{self.service_category}', rating={self.rating})>"


class FinancialExplainer(Base):
    """
    Personalized financial breakdown assets generated for leads
    """
    __tablename__ = "financial_explainers"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    secure_url_token = Column(String(255), unique=True, nullable=False, index=True)
    
    # Asset tracking
    is_accessed = Column(Boolean, default=False, index=True)
    access_count = Column(Integer, default=0)
    first_accessed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    last_accessed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    
    # Financial details
    procedure_name = Column(Text, nullable=False)
    total_cost = Column(Numeric(10, 2), nullable=False)
    estimated_insurance = Column(Numeric(10, 2), nullable=True)
    out_of_pocket_cost = Column(Numeric(10, 2), nullable=False)
    payment_options = Column(JSONB, nullable=True, comment="Payment plan options as JSON")
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    lead = relationship("Lead", back_populates="financial_explainers")
    
    def __repr__(self):
        return f"<FinancialExplainer(id={self.id}, lead_id={self.lead_id}, procedure='{self.procedure_name}')>"


class SystemEvent(Base):
    """
    System-wide events and audit trail
    """
    __tablename__ = "system_events"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    details = Column(Text, nullable=True)
    
    # Event metadata
    severity = Column(String(20), default="info", index=True)  # info, warning, error
    processed = Column(Boolean, default=False, index=True)
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    lead = relationship("Lead", back_populates="system_events")
    
    def __repr__(self):
        return f"<SystemEvent(id={self.id}, type='{self.event_type}', lead_id={self.lead_id})>"


# Additional utility tables for enhanced functionality

class AIInteraction(Base):
    """
    Detailed tracking of AI interactions for analytics and improvement
    """
    __tablename__ = "ai_interactions"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    interaction_type = Column(String(50), nullable=False, index=True)  # 'instant_reply', 'proactive_outreach'
    
    # AI model information
    model_used = Column(String(100), nullable=True)
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    total_cost = Column(Numeric(8, 4), nullable=True)
    
    # Performance metrics
    response_time_ms = Column(Integer, nullable=True)
    success = Column(Boolean, default=True, index=True)
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<AIInteraction(id={self.id}, type='{self.interaction_type}', success={self.success})>"


class LeadScore(Base):
    """
    Lead scoring and analytics tracking
    """
    __tablename__ = "lead_scores"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Scoring components
    engagement_score = Column(Float, default=0.0, comment="Based on response frequency and sentiment")
    intent_score = Column(Float, default=0.0, comment="Likelihood to convert based on conversations")
    urgency_score = Column(Float, default=0.0, comment="How quickly they need treatment")
    budget_score = Column(Float, default=0.0, comment="Ability to afford treatment")
    
    # Composite score
    total_score = Column(Float, default=0.0, index=True)
    score_updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<LeadScore(id={self.id}, lead_id={self.lead_id}, total_score={self.total_score})>"