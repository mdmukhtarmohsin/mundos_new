"""
Pydantic schemas for AIInteraction entity
"""
from datetime import datetime
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict


class AIInteractionBase(BaseModel):
    """Base AI interaction schema with common fields"""
    interaction_type: str = Field(..., pattern="^(instant_reply|proactive_outreach)$")
    model_used: Optional[str] = Field(None, max_length=100)


class AIInteractionCreate(AIInteractionBase):
    """Schema for creating a new AI interaction"""
    lead_id: int
    prompt_tokens: Optional[int] = Field(None, ge=0)
    completion_tokens: Optional[int] = Field(None, ge=0)
    total_cost: Optional[Decimal] = Field(None, ge=0)
    response_time_ms: Optional[int] = Field(None, ge=0)
    success: bool = True
    error_message: Optional[str] = None


class AIInteractionUpdate(BaseModel):
    """Schema for updating an AI interaction"""
    success: Optional[bool] = None
    error_message: Optional[str] = None
    response_time_ms: Optional[int] = Field(None, ge=0)


class AIInteractionRead(AIInteractionBase):
    """Schema for reading AI interaction data"""
    id: int
    lead_id: int
    prompt_tokens: Optional[int]
    completion_tokens: Optional[int]
    total_cost: Optional[Decimal]
    response_time_ms: Optional[int]
    success: bool
    error_message: Optional[str]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AIInteractionStats(BaseModel):
    """Schema for AI interaction statistics"""
    total_interactions: int
    success_rate: float
    avg_response_time_ms: Optional[float]
    total_cost: Decimal
    interactions_by_type: dict[str, int]
    tokens_used: dict[str, int]  # {"prompt": 1000, "completion": 500}
    cost_by_model: dict[str, Decimal]