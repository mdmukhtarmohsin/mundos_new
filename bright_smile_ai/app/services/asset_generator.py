"""
AssetGenerator Service - Creates financial explainers and other lead assets
"""
import os
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.db.models import Lead, FinancialExplainer
from app.core.config import settings, get_payment_plan_months
from app.core.utils import (
    generate_secure_url_token, 
    extract_service_keywords,
    calculate_payment_plans,
    format_currency
)


class AssetGenerator:
    """
    Service responsible for generating personalized assets for leads,
    primarily financial explainers but extensible for other assets.
    """
    
    def __init__(self, db: Session):
        self.db = db
        
    async def create_financial_explainer(
        self, 
        lead: Lead, 
        procedure_name: str,
        estimated_cost: Optional[float] = None,
        insurance_coverage_percent: Optional[float] = None
    ) -> FinancialExplainer:
        """
        Create a personalized financial explainer for a lead.
        
        Args:
            lead: The lead requesting the financial breakdown
            procedure_name: Name of the dental procedure
            estimated_cost: Estimated cost (uses default if not provided)
            insurance_coverage_percent: Insurance coverage as decimal (0.5 = 50%)
        
        Returns:
            Created FinancialExplainer instance
        """
        # Use provided cost or default
        total_cost = Decimal(str(estimated_cost or settings.default_procedure_cost))
        
        # Calculate insurance contribution
        coverage_percent = insurance_coverage_percent or settings.default_insurance_coverage
        estimated_insurance = total_cost * Decimal(str(coverage_percent))
        out_of_pocket = total_cost - estimated_insurance
        
        # Generate payment plan options
        plan_months = get_payment_plan_months()
        payment_options = calculate_payment_plans(float(out_of_pocket), plan_months)
        
        # Create secure token for the explainer URL
        secure_token = generate_secure_url_token()
        
        # Create the financial explainer record
        explainer = FinancialExplainer(
            lead_id=lead.id,
            secure_url_token=secure_token,
            procedure_name=procedure_name,
            total_cost=total_cost,
            estimated_insurance=estimated_insurance,
            out_of_pocket_cost=out_of_pocket,
            payment_options=payment_options
        )
        
        self.db.add(explainer)
        self.db.commit()
        self.db.refresh(explainer)
        
        # Log the creation event
        from app.services.system_logger import SystemLogger
        logger = SystemLogger(self.db)
        await logger.log_event(
            event_type="financial_explainer_created",
            lead_id=lead.id,
            details=f"Created financial explainer for {procedure_name} - ${total_cost}"
        )
        
        return explainer
    
    def get_financial_explainer_by_token(self, token: str) -> Optional[FinancialExplainer]:
        """
        Retrieve a financial explainer by its secure token.
        
        Args:
            token: The secure URL token
            
        Returns:
            FinancialExplainer if found, None otherwise
        """
        return self.db.query(FinancialExplainer).filter(
            FinancialExplainer.secure_url_token == token
        ).first()
    
    async def mark_explainer_accessed(self, explainer: FinancialExplainer) -> FinancialExplainer:
        """
        Mark a financial explainer as accessed and update access tracking.
        
        Args:
            explainer: The FinancialExplainer instance
            
        Returns:
            Updated FinancialExplainer
        """
        now = datetime.utcnow()
        
        # Update access tracking
        if not explainer.is_accessed:
            explainer.is_accessed = True
            explainer.first_accessed_at = now
        
        explainer.access_count += 1
        explainer.last_accessed_at = now
        
        self.db.commit()
        self.db.refresh(explainer)
        
        # Log the access event
        from app.services.system_logger import SystemLogger
        logger = SystemLogger(self.db)
        await logger.log_event(
            event_type="financial_explainer_accessed",
            lead_id=explainer.lead_id,
            details=f"Financial explainer accessed (access count: {explainer.access_count})"
        )
        
        return explainer
    
    def estimate_procedure_cost(self, procedure_name: str, service_keywords: list[str]) -> float:
        """
        Estimate procedure cost based on procedure name and service keywords.
        This is a simplified version - in production, this would likely query
        a more sophisticated pricing database.
        
        Args:
            procedure_name: Name of the procedure
            service_keywords: List of relevant service keywords
            
        Returns:
            Estimated cost as float
        """
        # Base pricing estimates (these would typically come from a database)
        cost_estimates = {
            'invisalign': 4500.0,
            'implants': 3500.0,
            'crown': 1200.0,
            'veneer': 1000.0,
            'whitening': 450.0,
            'cleaning': 150.0,
            'extraction': 200.0,
            'root_canal': 800.0,
            'braces': 5000.0,
            'gum_treatment': 600.0
        }
        
        # Find matching cost estimate
        for keyword in service_keywords:
            if keyword in cost_estimates:
                return cost_estimates[keyword]
        
        # Check procedure name directly
        procedure_lower = procedure_name.lower()
        for service, cost in cost_estimates.items():
            if service.replace('_', ' ') in procedure_lower:
                return cost
        
        # Default cost if no match found
        return settings.default_procedure_cost
    
    async def create_intelligent_financial_explainer(
        self, 
        lead: Lead,
        conversation_context: str
    ) -> FinancialExplainer:
        """
        Create a financial explainer by intelligently analyzing the conversation
        to determine the most relevant procedure and cost estimate.
        
        Args:
            lead: The lead requesting the financial breakdown
            conversation_context: Recent conversation history for context
            
        Returns:
            Created FinancialExplainer instance
        """
        # Extract service keywords from conversation context
        service_keywords = extract_service_keywords(conversation_context)
        
        # Determine the most likely procedure
        if service_keywords:
            # Use the first (most relevant) service keyword
            primary_service = service_keywords[0]
            procedure_name = primary_service.replace('_', ' ').title()
            
            # Get estimated cost for this service
            estimated_cost = self.estimate_procedure_cost(procedure_name, service_keywords)
        else:
            # Default procedure if we can't determine specifics
            procedure_name = "Dental Treatment"
            estimated_cost = settings.default_procedure_cost
        
        # Adjust insurance coverage based on procedure type
        insurance_coverage = self._estimate_insurance_coverage(service_keywords)
        
        return await self.create_financial_explainer(
            lead=lead,
            procedure_name=procedure_name,
            estimated_cost=estimated_cost,
            insurance_coverage_percent=insurance_coverage
        )
    
    def _estimate_insurance_coverage(self, service_keywords: list[str]) -> float:
        """
        Estimate insurance coverage percentage based on service type.
        
        Args:
            service_keywords: List of service keywords
            
        Returns:
            Estimated insurance coverage as decimal (0.0 to 1.0)
        """
        # Insurance coverage estimates by procedure type
        coverage_estimates = {
            'cleaning': 1.0,  # Usually 100% covered
            'extraction': 0.8,  # Usually well covered
            'crown': 0.5,  # Partial coverage
            'root_canal': 0.6,  # Good coverage
            'implants': 0.0,  # Often not covered
            'invisalign': 0.0,  # Usually not covered
            'whitening': 0.0,  # Cosmetic, not covered
            'veneer': 0.0,  # Cosmetic, not covered
            'braces': 0.3,  # Limited coverage
            'gum_treatment': 0.7  # Usually covered
        }
        
        # Find the highest coverage estimate from keywords
        max_coverage = 0.0
        for keyword in service_keywords:
            if keyword in coverage_estimates:
                max_coverage = max(max_coverage, coverage_estimates[keyword])
        
        return max_coverage or settings.default_insurance_coverage
    
    def format_financial_explainer_url(self, explainer: FinancialExplainer, base_url: str) -> str:
        """
        Format the public URL for a financial explainer.
        
        Args:
            explainer: The FinancialExplainer instance
            base_url: Base URL of the application
            
        Returns:
            Full URL to access the financial explainer
        """
        return f"{base_url.rstrip('/')}/financial-explainer/{explainer.secure_url_token}"
    
    def get_explainer_summary(self, explainer: FinancialExplainer) -> Dict[str, Any]:
        """
        Get a summary of a financial explainer suitable for messaging.
        
        Args:
            explainer: The FinancialExplainer instance
            
        Returns:
            Dictionary containing formatted summary information
        """
        return {
            "procedure": explainer.procedure_name,
            "total_cost": format_currency(float(explainer.total_cost)),
            "insurance_estimate": format_currency(float(explainer.estimated_insurance)) if explainer.estimated_insurance else "N/A",
            "out_of_pocket": format_currency(float(explainer.out_of_pocket_cost)),
            "payment_options": explainer.payment_options,
            "created_date": explainer.created_at.strftime("%B %d, %Y")
        }