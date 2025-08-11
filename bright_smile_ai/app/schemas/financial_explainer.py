"""
Pydantic schemas for FinancialExplainer entity
"""
from datetime import datetime
from typing import Optional, Dict, Any
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict


class FinancialExplainerBase(BaseModel):
    """Base financial explainer schema with common fields"""
    procedure_name: str = Field(..., min_length=1)
    total_cost: Decimal = Field(..., ge=0)
    estimated_insurance: Optional[Decimal] = Field(None, ge=0)
    out_of_pocket_cost: Decimal = Field(..., ge=0)
    payment_options: Optional[Dict[str, Any]] = None


class FinancialExplainerCreate(FinancialExplainerBase):
    """Schema for creating a new financial explainer"""
    lead_id: int


class FinancialExplainerUpdate(BaseModel):
    """Schema for updating a financial explainer"""
    procedure_name: Optional[str] = Field(None, min_length=1)
    total_cost: Optional[Decimal] = Field(None, ge=0)
    estimated_insurance: Optional[Decimal] = Field(None, ge=0)
    out_of_pocket_cost: Optional[Decimal] = Field(None, ge=0)
    payment_options: Optional[Dict[str, Any]] = None


class FinancialExplainerRead(FinancialExplainerBase):
    """Schema for reading financial explainer data"""
    id: int
    lead_id: int
    secure_url_token: str
    is_accessed: bool
    access_count: int
    first_accessed_at: Optional[datetime]
    last_accessed_at: Optional[datetime]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class FinancialExplainerPublic(BaseModel):
    """Public schema for financial explainer (accessed via secure URL)"""
    procedure_name: str
    total_cost: Decimal
    estimated_insurance: Optional[Decimal]
    out_of_pocket_cost: Decimal
    payment_options: Optional[Dict[str, Any]]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class FinancialExplainerStats(BaseModel):
    """Schema for financial explainer statistics"""
    total_created: int
    total_accessed: int
    access_rate: float
    most_common_procedures: list[dict]
    avg_cost_range: dict[str, Decimal]