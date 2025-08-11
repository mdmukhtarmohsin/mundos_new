"""
Pydantic schemas for Lead entity
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict, Field

from app.db.models import LeadStatus, LeadRiskLevel
from app.schemas.message import MessageRead


class LeadBase(BaseModel):
    """Base lead schema with common fields"""
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    initial_inquiry: Optional[str] = None


class LeadCreate(LeadBase):
    """Schema for creating a new lead"""
    pass


class LeadUpdate(BaseModel):
    """Schema for updating a lead"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    initial_inquiry: Optional[str] = None
    status: Optional[LeadStatus] = None
    risk_level: Optional[LeadRiskLevel] = None
    sentiment_score: Optional[float] = None
    reason_for_cold: Optional[str] = None
    do_not_contact: Optional[bool] = None


class LeadRead(LeadBase):
    """Schema for reading lead data"""
    id: int
    status: LeadStatus
    risk_level: LeadRiskLevel
    sentiment_score: float
    reason_for_cold: Optional[str]
    do_not_contact: bool
    created_at: datetime
    last_contact_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)


class LeadReadWithMessages(LeadRead):
    """Extended lead schema that includes messages"""
    messages: List[MessageRead] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)


class LeadReadWithStats(LeadRead):
    """Lead schema with computed statistics"""
    message_count: int = 0
    last_message_content: Optional[str] = None
    days_since_last_contact: Optional[int] = None
    conversion_probability: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)


class LeadStatusUpdate(BaseModel):
    """Schema for updating lead status only"""
    status: LeadStatus
    reason: Optional[str] = None  # Optional reason for status change


class LeadSearchFilters(BaseModel):
    """Schema for lead search and filtering"""
    status: Optional[LeadStatus] = None
    risk_level: Optional[LeadRiskLevel] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    last_contact_after: Optional[datetime] = None
    last_contact_before: Optional[datetime] = None
    search_query: Optional[str] = None  # Search in name, email, initial_inquiry
    do_not_contact: Optional[bool] = None

# Ensure forward references are resolved for OpenAPI/schema generation
LeadReadWithMessages.model_rebuild()