"""
Pydantic schemas for Testimonial entity
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class TestimonialBase(BaseModel):
    """Base testimonial schema with common fields"""
    service_category: str = Field(..., min_length=1, max_length=100)
    snippet_text: str = Field(..., min_length=1)


class TestimonialCreate(TestimonialBase):
    """Schema for creating a new testimonial"""
    patient_name: Optional[str] = Field(None, max_length=255)
    rating: Optional[int] = Field(None, ge=1, le=5)
    is_verified: bool = True


class TestimonialUpdate(BaseModel):
    """Schema for updating a testimonial"""
    service_category: Optional[str] = Field(None, min_length=1, max_length=100)
    snippet_text: Optional[str] = Field(None, min_length=1)
    patient_name: Optional[str] = Field(None, max_length=255)
    rating: Optional[int] = Field(None, ge=1, le=5)
    is_verified: Optional[bool] = None


class TestimonialRead(TestimonialBase):
    """Schema for reading testimonial data"""
    id: int
    patient_name: Optional[str]
    rating: Optional[int]
    is_verified: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class TestimonialSearch(BaseModel):
    """Schema for searching testimonials"""
    service_category: Optional[str] = None
    min_rating: Optional[int] = Field(None, ge=1, le=5)
    verified_only: bool = True
    limit: int = Field(default=10, ge=1, le=100)