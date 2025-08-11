"""
Messages API endpoints - Core interaction point for AI responses
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.models import Message, Lead, SenderType
from app.schemas.message import (
    MessageCreate, MessageRead, MessageCreateFromLead, 
    ConversationHistory, MessageStats
)
from app.services.engagement_engine import EngagementEngine
from app.services.system_logger import SystemLogger

router = APIRouter()


@router.post("/", response_model=MessageRead)
async def create_message(
    message_data: MessageCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Create a new message and optionally trigger AI response.
    This is the main endpoint for incoming lead messages.
    """
    
    # Verify lead exists
    lead = db.query(Lead).filter(Lead.id == message_data.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Create the message
    message = Message(
        lead_id=message_data.lead_id,
        sender=message_data.sender,
        content=message_data.content,
        intent_classification=message_data.intent_classification,
        confidence_score=message_data.confidence_score
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    # If message is from lead, trigger AI response in background
    if message_data.sender == SenderType.LEAD:
        background_tasks.add_task(
            trigger_ai_response,
            message_data.lead_id,
            message_data.content,
            db
        )
    
    return message


@router.post("/from-lead", response_model=dict)
async def create_message_from_lead(
    lead_id: int,
    message_data: MessageCreateFromLead,
    db: Session = Depends(get_db)
):
    """
    Simplified endpoint for creating messages from leads with immediate AI response.
    This provides a synchronous interface for demo purposes.
    """
    
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Create the lead message
    message = Message(
        lead_id=lead_id,
        sender=message_data.sender_type,
        content=message_data.content
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    # Get immediate AI response
    ai_response_data = None
    if message_data.sender_type == SenderType.LEAD:
        try:
            engine = EngagementEngine(db)
            result = await engine.invoke_new_message(lead_id, message_data.content)
            
            if result.get("success"):
                ai_response_data = {
                    "response": result["response"],
                    "intent": result["intent"],
                    "handoff_required": result["handoff_required"]
                }
        except Exception as e:
            logger = SystemLogger(db)
            await logger.log_error(
                error_type="message_response",
                error_message=str(e),
                lead_id=lead_id
            )
            
            ai_response_data = {
                "error": "Failed to generate AI response",
                "details": str(e)
            }
    
    return {
        "lead_message": MessageRead.model_validate(message),
        "ai_response": ai_response_data
    }


@router.get("/{message_id}", response_model=MessageRead)
def get_message(
    message_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific message by ID"""
    
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return message


@router.get("/lead/{lead_id}/conversation", response_model=ConversationHistory)
def get_conversation_history(
    lead_id: int,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get conversation history for a specific lead"""
    
    # Verify lead exists
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Get messages
    messages = db.query(Message).filter(
        Message.lead_id == lead_id
    ).order_by(Message.created_at.asc()).limit(limit).all()
    
    if not messages:
        raise HTTPException(status_code=404, detail="No conversation found")
    
    message_reads = [MessageRead.model_validate(msg) for msg in messages]
    
    return ConversationHistory(
        lead_id=lead_id,
        messages=message_reads,
        total_messages=len(message_reads),
        conversation_started=messages[0].created_at,
        last_message_at=messages[-1].created_at
    )


@router.get("/lead/{lead_id}/stats", response_model=MessageStats)
def get_message_stats(
    lead_id: int,
    db: Session = Depends(get_db)
):
    """Get message statistics for a lead"""
    
    # Verify lead exists
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Get all messages for the lead
    messages = db.query(Message).filter(
        Message.lead_id == lead_id
    ).order_by(Message.created_at.asc()).all()
    
    if not messages:
        return MessageStats(
            total_messages=0,
            messages_by_sender={},
            avg_response_time_minutes=None,
            sentiment_trend=[]
        )
    
    # Count messages by sender
    sender_counts = {}
    for message in messages:
        sender = message.sender.value
        sender_counts[sender] = sender_counts.get(sender, 0) + 1
    
    # Calculate average response time (simplified)
    response_times = []
    for i in range(1, len(messages)):
        if (messages[i-1].sender == SenderType.LEAD and 
            messages[i].sender in [SenderType.AI, SenderType.HUMAN]):
            
            time_diff = messages[i].created_at - messages[i-1].created_at
            response_times.append(time_diff.total_seconds() / 60)  # Convert to minutes
    
    avg_response_time = sum(response_times) / len(response_times) if response_times else None
    
    # Get sentiment trend (if available from previous analysis)
    from app.core.utils import analyze_sentiment
    sentiment_trend = []
    for message in messages[-10:]:  # Last 10 messages
        if message.sender == SenderType.LEAD:
            sentiment = analyze_sentiment(message.content)
            sentiment_trend.append(sentiment)
    
    return MessageStats(
        total_messages=len(messages),
        messages_by_sender=sender_counts,
        avg_response_time_minutes=avg_response_time,
        sentiment_trend=sentiment_trend
    )


@router.delete("/{message_id}")
async def delete_message(
    message_id: int,
    db: Session = Depends(get_db)
):
    """Delete a message (for admin use)"""
    
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    lead_id = message.lead_id
    
    db.delete(message)
    db.commit()
    
    # Log the deletion
    logger = SystemLogger(db)
    await logger.log_event(
        event_type="message_deleted",
        details=f"Message {message_id} deleted",
        lead_id=lead_id,
        severity="warning"
    )
    
    return {"message": "Message deleted successfully"}


# Background task function
async def trigger_ai_response(lead_id: int, message_content: str, db: Session):
    """
    Background task to trigger AI response for incoming lead messages.
    This keeps the API response fast while processing AI responses asynchronously.
    """
    try:
        engine = EngagementEngine(db)
        result = await engine.invoke_new_message(lead_id, message_content)
        
        if not result.get("success"):
            logger = SystemLogger(db)
            await logger.log_error(
                error_type="background_ai_response",
                error_message=result.get("error", "Unknown error"),
                lead_id=lead_id
            )
    
    except Exception as e:
        logger = SystemLogger(db)
        await logger.log_error(
            error_type="background_ai_response",
            error_message=str(e),
            lead_id=lead_id,
            additional_context="Background AI response task failed"
        )