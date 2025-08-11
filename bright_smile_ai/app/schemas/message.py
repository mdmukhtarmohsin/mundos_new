"""
Pydantic schemas for Message entity
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

from app.db.models import SenderType


class MessageBase(BaseModel):
    """Base message schema with common fields"""
    content: str = Field(..., min_length=1)
    sender: SenderType


class MessageCreate(MessageBase):
    """Schema for creating a new message"""
    lead_id: int
    intent_classification: Optional[str] = Field(None, max_length=100)
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)


class MessageUpdate(BaseModel):
    """Schema for updating a message"""
    content: Optional[str] = Field(None, min_length=1)
    intent_classification: Optional[str] = Field(None, max_length=100)
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)


class MessageRead(MessageBase):
    """Schema for reading message data"""
    id: int
    lead_id: int
    intent_classification: Optional[str]
    confidence_score: Optional[float]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class MessageCreateFromLead(BaseModel):
    """Schema for creating a message directly from a lead (simpler API)"""
    content: str = Field(..., min_length=1)
    sender_type: Optional[SenderType] = SenderType.LEAD  # Default to lead


class ConversationHistory(BaseModel):
    """Schema for conversation history"""
    lead_id: int
    messages: list[MessageRead]
    total_messages: int
    conversation_started: datetime
    last_message_at: datetime


class MessageStats(BaseModel):
    """Schema for message statistics"""
    total_messages: int
    messages_by_sender: dict[str, int]  # {"lead": 5, "ai": 3, "human": 1}
    avg_response_time_minutes: Optional[float]
    sentiment_trend: Optional[list[float]]  # List of sentiment scores over time