"""
Leads API endpoints
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.models import Lead, Message, LeadStatus, LeadRiskLevel, SenderType
from app.schemas.lead import (
    LeadCreate, LeadUpdate, LeadRead, LeadReadWithMessages, 
    LeadStatusUpdate, LeadSearchFilters
)
from app.schemas.message import MessageRead
from app.services.system_logger import SystemLogger

router = APIRouter()


@router.post("/", response_model=LeadRead)
async def create_lead(
    lead_data: LeadCreate,
    db: Session = Depends(get_db)
):
    """Create a new lead"""
    
    # Check if lead already exists
    existing_lead = db.query(Lead).filter(
        (Lead.email == lead_data.email) | 
        (Lead.phone == lead_data.phone if lead_data.phone else False)
    ).first()
    
    if existing_lead:
        raise HTTPException(
            status_code=400, 
            detail="Lead with this email or phone already exists"
        )
    
    # Create new lead
    lead = Lead(
        name=lead_data.name,
        email=lead_data.email,
        phone=lead_data.phone,
        initial_inquiry=lead_data.initial_inquiry
    )
    
    db.add(lead)
    db.commit()
    db.refresh(lead)
    
    # Log the creation
    logger = SystemLogger(db)
    await logger.log_event(
        event_type="lead_created",
        details=f"New lead created: {lead.name} ({lead.email})",
        lead_id=lead.id
    )
    
    return lead


@router.get("/", response_model=List[LeadRead])
def get_leads(
    status: Optional[LeadStatus] = Query(None),
    risk_level: Optional[LeadRiskLevel] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get leads with optional filtering"""
    
    query = db.query(Lead)
    
    # Apply filters
    if status:
        query = query.filter(Lead.status == status)
    if risk_level:
        query = query.filter(Lead.risk_level == risk_level)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Lead.name.ilike(search_term)) |
            (Lead.email.ilike(search_term)) |
            (Lead.initial_inquiry.ilike(search_term))
        )
    
    # Apply pagination
    leads = query.offset(skip).limit(limit).all()
    
    return leads


@router.get("/{lead_id}", response_model=LeadReadWithMessages)
def get_lead(
    lead_id: int,
    include_messages: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Get a specific lead with optional message history"""
    
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Convert to response format
    lead_data = LeadReadWithMessages.model_validate(lead)
    
    if include_messages:
        messages = db.query(Message).filter(
            Message.lead_id == lead_id
        ).order_by(Message.created_at.asc()).all()
        
        lead_data.messages = [MessageRead.model_validate(msg) for msg in messages]
    
    return lead_data


@router.put("/{lead_id}", response_model=LeadRead)
async def update_lead(
    lead_id: int,
    lead_update: LeadUpdate,
    db: Session = Depends(get_db)
):
    """Update a lead"""
    
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Store old values for logging
    old_status = lead.status.value if lead.status else None
    
    # Update fields
    update_data = lead_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lead, field, value)
    
    db.commit()
    db.refresh(lead)
    
    # Log status changes
    if lead_update.status and old_status != lead_update.status.value:
        logger = SystemLogger(db)
        await logger.log_lead_status_change(
            lead, old_status, lead_update.status.value
        )
    
    return lead


@router.patch("/{lead_id}/status", response_model=LeadRead)
async def update_lead_status(
    lead_id: int,
    status_update: LeadStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update only the lead status"""
    
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    old_status = lead.status.value
    lead.status = status_update.status
    
    if status_update.reason and status_update.status == LeadStatus.COLD:
        lead.reason_for_cold = status_update.reason
    
    db.commit()
    db.refresh(lead)
    
    # Log the status change
    logger = SystemLogger(db)
    await logger.log_lead_status_change(
        lead, old_status, status_update.status.value, status_update.reason
    )
    
    return lead


@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db)
):
    """Delete a lead (soft delete by setting do_not_contact)"""
    
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Soft delete by setting do_not_contact flag
    lead.do_not_contact = True
    lead.status = LeadStatus.DO_NOT_CONTACT
    
    db.commit()
    
    # Log the deletion
    logger = SystemLogger(db)
    await logger.log_event(
        event_type="lead_deleted",
        details=f"Lead soft-deleted: {lead.name} ({lead.email})",
        lead_id=lead.id,
        severity="warning"
    )
    
    return {"message": "Lead marked as do not contact"}


@router.get("/{lead_id}/conversation", response_model=List[MessageRead])
def get_lead_conversation(
    lead_id: int,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Get conversation history for a lead"""
    
    # Verify lead exists
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    messages = db.query(Message).filter(
        Message.lead_id == lead_id
    ).order_by(Message.created_at.desc()).limit(limit).all()
    
    return [MessageRead.model_validate(msg) for msg in messages]


@router.post("/{lead_id}/simulate-message")
async def simulate_lead_message(
    lead_id: int,
    message_content: str,
    sender_type: SenderType = SenderType.LEAD,
    db: Session = Depends(get_db)
):
    """
    Simulate a message from a lead (for demonstration purposes).
    This allows testing the AI responses without external integrations.
    """
    
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Create the message
    message = Message(
        lead_id=lead_id,
        sender=sender_type,
        content=message_content
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    # If this is from the lead, trigger AI response (if not from human)
    ai_response = None
    if sender_type == SenderType.LEAD:
        try:
            from app.services.engagement_engine import EngagementEngine
            engine = EngagementEngine(db)
            
            result = await engine.invoke_new_message(lead_id, message_content)
            
            if result.get("success"):
                ai_response = {
                    "response": result["response"],
                    "intent": result["intent"],
                    "handoff_required": result["handoff_required"]
                }
        except Exception as e:
            # Log error but don't fail the endpoint
            logger = SystemLogger(db)
            await logger.log_error(
                error_type="simulate_message",
                error_message=str(e),
                lead_id=lead_id
            )
    
    return {
        "message_sent": MessageRead.model_validate(message),
        "ai_response": ai_response
    }