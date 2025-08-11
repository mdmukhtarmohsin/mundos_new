"""
SystemLogger Service - Handles system event logging and monitoring
"""
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session

from app.db.models import SystemEvent, Lead


class SystemLogger:
    """
    Service responsible for logging system events, errors, and monitoring activities.
    Provides centralized logging for audit trails and system monitoring.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    async def log_event(
        self,
        event_type: str,
        details: Optional[str] = None,
        lead_id: Optional[int] = None,
        severity: str = "info"
    ) -> SystemEvent:
        """
        Log a system event.
        
        Args:
            event_type: Type of event (e.g., 'lead_created', 'ai_response', 'error')
            details: Additional details about the event
            lead_id: Associated lead ID if applicable
            severity: Event severity ('info', 'warning', 'error')
        
        Returns:
            Created SystemEvent instance
        """
        event = SystemEvent(
            event_type=event_type,
            details=details,
            lead_id=lead_id,
            severity=severity
        )
        
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        
        return event
    
    async def log_lead_status_change(
        self,
        lead: Lead,
        old_status: str,
        new_status: str,
        reason: Optional[str] = None
    ) -> SystemEvent:
        """
        Log a lead status change event.
        
        Args:
            lead: The lead whose status changed
            old_status: Previous status
            new_status: New status
            reason: Reason for the status change
        
        Returns:
            Created SystemEvent instance
        """
        details = f"Lead status changed from '{old_status}' to '{new_status}'"
        if reason:
            details += f". Reason: {reason}"
        
        return await self.log_event(
            event_type="lead_status_change",
            details=details,
            lead_id=lead.id,
            severity="info"
        )
    
    async def log_ai_interaction(
        self,
        lead_id: int,
        interaction_type: str,
        success: bool = True,
        error_message: Optional[str] = None,
        response_time_ms: Optional[int] = None
    ) -> SystemEvent:
        """
        Log an AI interaction event.
        
        Args:
            lead_id: ID of the lead involved
            interaction_type: Type of AI interaction
            success: Whether the interaction was successful
            error_message: Error message if unsuccessful
            response_time_ms: Response time in milliseconds
        
        Returns:
            Created SystemEvent instance
        """
        details = f"AI {interaction_type} - {'Success' if success else 'Failed'}"
        if response_time_ms:
            details += f" (Response time: {response_time_ms}ms)"
        if error_message:
            details += f" Error: {error_message}"
        
        severity = "info" if success else "error"
        
        return await self.log_event(
            event_type=f"ai_{interaction_type}",
            details=details,
            lead_id=lead_id,
            severity=severity
        )
    
    async def log_outreach_campaign(
        self,
        campaign_type: str,
        leads_processed: int,
        leads_contacted: int,
        leads_skipped: int
    ) -> SystemEvent:
        """
        Log an outreach campaign completion.
        
        Args:
            campaign_type: Type of outreach campaign
            leads_processed: Total leads processed
            leads_contacted: Number of leads contacted
            leads_skipped: Number of leads skipped
        
        Returns:
            Created SystemEvent instance
        """
        details = (
            f"Outreach campaign completed - "
            f"Processed: {leads_processed}, "
            f"Contacted: {leads_contacted}, "
            f"Skipped: {leads_skipped}"
        )
        
        return await self.log_event(
            event_type=f"outreach_campaign_{campaign_type}",
            details=details,
            severity="info"
        )
    
    async def log_error(
        self,
        error_type: str,
        error_message: str,
        lead_id: Optional[int] = None,
        additional_context: Optional[str] = None
    ) -> SystemEvent:
        """
        Log an error event.
        
        Args:
            error_type: Type of error
            error_message: Error message
            lead_id: Associated lead ID if applicable
            additional_context: Additional error context
        
        Returns:
            Created SystemEvent instance
        """
        details = f"Error: {error_message}"
        if additional_context:
            details += f" Context: {additional_context}"
        
        return await self.log_event(
            event_type=f"error_{error_type}",
            details=details,
            lead_id=lead_id,
            severity="error"
        )
    
    def get_recent_events(
        self,
        limit: int = 100,
        event_type: Optional[str] = None,
        lead_id: Optional[int] = None,
        severity: Optional[str] = None
    ) -> List[SystemEvent]:
        """
        Get recent system events with optional filtering.
        
        Args:
            limit: Maximum number of events to return
            event_type: Filter by event type
            lead_id: Filter by lead ID
            severity: Filter by severity
        
        Returns:
            List of SystemEvent instances
        """
        query = self.db.query(SystemEvent)
        
        if event_type:
            query = query.filter(SystemEvent.event_type == event_type)
        if lead_id:
            query = query.filter(SystemEvent.lead_id == lead_id)
        if severity:
            query = query.filter(SystemEvent.severity == severity)
        
        return query.order_by(SystemEvent.created_at.desc()).limit(limit).all()
    
    def get_error_events(self, hours: int = 24) -> List[SystemEvent]:
        """
        Get error events from the last N hours.
        
        Args:
            hours: Number of hours to look back
        
        Returns:
            List of error SystemEvent instances
        """
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        return self.db.query(SystemEvent).filter(
            SystemEvent.severity == "error",
            SystemEvent.created_at >= cutoff_time
        ).order_by(SystemEvent.created_at.desc()).all()
    
    def mark_event_processed(self, event_id: int) -> Optional[SystemEvent]:
        """
        Mark a system event as processed.
        
        Args:
            event_id: ID of the event to mark as processed
        
        Returns:
            Updated SystemEvent instance or None if not found
        """
        event = self.db.query(SystemEvent).filter(SystemEvent.id == event_id).first()
        if event:
            event.processed = True
            self.db.commit()
            self.db.refresh(event)
        
        return event
    
    def get_system_health_summary(self) -> dict:
        """
        Get a summary of system health based on recent events.
        
        Returns:
            Dictionary containing system health metrics
        """
        from datetime import timedelta
        
        # Look at the last 24 hours
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        
        # Count events by severity
        total_events = self.db.query(SystemEvent).filter(
            SystemEvent.created_at >= cutoff_time
        ).count()
        
        error_events = self.db.query(SystemEvent).filter(
            SystemEvent.created_at >= cutoff_time,
            SystemEvent.severity == "error"
        ).count()
        
        warning_events = self.db.query(SystemEvent).filter(
            SystemEvent.created_at >= cutoff_time,
            SystemEvent.severity == "warning"
        ).count()
        
        # Count AI interactions
        ai_events = self.db.query(SystemEvent).filter(
            SystemEvent.created_at >= cutoff_time,
            SystemEvent.event_type.like("ai_%")
        ).count()
        
        # Calculate error rate
        error_rate = (error_events / total_events * 100) if total_events > 0 else 0
        
        return {
            "period_hours": 24,
            "total_events": total_events,
            "error_events": error_events,
            "warning_events": warning_events,
            "ai_interactions": ai_events,
            "error_rate_percent": round(error_rate, 2),
            "status": "healthy" if error_rate < 5 else "degraded" if error_rate < 15 else "unhealthy"
        }