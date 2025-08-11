"""
Pydantic schemas for SystemEvent entity
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class SystemEventBase(BaseModel):
    """Base system event schema with common fields"""
    event_type: str = Field(..., min_length=1, max_length=100)
    details: Optional[str] = None
    severity: str = Field(default="info", pattern="^(info|warning|error)$")


class SystemEventCreate(SystemEventBase):
    """Schema for creating a new system event"""
    lead_id: Optional[int] = None


class SystemEventUpdate(BaseModel):
    """Schema for updating a system event"""
    details: Optional[str] = None
    severity: Optional[str] = Field(None, pattern="^(info|warning|error)$")
    processed: Optional[bool] = None


class SystemEventRead(SystemEventBase):
    """Schema for reading system event data"""
    id: int
    lead_id: Optional[int]
    processed: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SystemEventSearch(BaseModel):
    """Schema for searching system events"""
    event_type: Optional[str] = None
    severity: Optional[str] = Field(None, pattern="^(info|warning|error)$")
    lead_id: Optional[int] = None
    processed: Optional[bool] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    limit: int = Field(default=50, ge=1, le=1000)