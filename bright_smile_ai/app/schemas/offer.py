"""
Pydantic schemas for Offer entity
"""
from datetime import datetime
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict


class OfferBase(BaseModel):
    """Base offer schema with common fields"""
    offer_title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    valid_for_service: str = Field(default="General", max_length=100)


class OfferCreate(OfferBase):
    """Schema for creating a new offer"""
    discount_percentage: Optional[float] = Field(None, ge=0, le=100)
    discount_amount: Optional[Decimal] = Field(None, ge=0)
    expires_at: Optional[datetime] = None


class OfferUpdate(BaseModel):
    """Schema for updating an offer"""
    offer_title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    valid_for_service: Optional[str] = Field(None, max_length=100)
    discount_percentage: Optional[float] = Field(None, ge=0, le=100)
    discount_amount: Optional[Decimal] = Field(None, ge=0)
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None


class OfferRead(OfferBase):
    """Schema for reading offer data"""
    id: int
    discount_percentage: Optional[float]
    discount_amount: Optional[Decimal]
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)


class OfferToggle(BaseModel):
    """Schema for toggling offer active status"""
    is_active: bool


class OfferSearch(BaseModel):
    """Schema for searching offers"""
    service: Optional[str] = None
    active_only: bool = True
    include_expired: bool = False