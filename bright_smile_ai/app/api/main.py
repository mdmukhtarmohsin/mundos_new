"""
Main API router combining all endpoints
"""
from fastapi import APIRouter

from app.api.endpoints import leads, messages, agents, dashboard, financial_explainers

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(leads.router, prefix="/leads", tags=["leads"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"]) 
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(
    financial_explainers.router, 
    prefix="/financial-explainer", 
    tags=["financial_explainers"]
)