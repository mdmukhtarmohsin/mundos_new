"""
Main FastAPI application for the AI Patient Advocate system
"""
from contextlib import asynccontextmanager
from datetime import datetime
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.core.config import settings
from app.api.main import api_router
from app.db.base import get_db
from app.services.engagement_engine import EngagementEngine
from app.services.risk_analyzer import RiskAnalyzer
from app.services.asset_generator import AssetGenerator
from app.services.system_logger import SystemLogger

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# Global service instances (initialized in lifespan)
scheduler: AsyncIOScheduler = None
engagement_engine: EngagementEngine = None
risk_analyzer: RiskAnalyzer = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events for background services.
    """
    # Startup
    logger.info("🚀 Starting AI Patient Advocate system...")
    
    try:
        # Initialize scheduler
        global scheduler, engagement_engine, risk_analyzer
        scheduler = AsyncIOScheduler()
        
        # Initialize services (we'll get a DB session for background tasks)
        db = next(get_db())
        engagement_engine = EngagementEngine(db)
        risk_analyzer = RiskAnalyzer(db, engagement_engine=engagement_engine)
        
        # Schedule the risk analysis job
        scheduler.add_job(
            func=run_risk_analysis,
            trigger=IntervalTrigger(minutes=settings.risk_analysis_interval_minutes),
            id="risk_analysis_job",
            name="Analyze lead risk patterns and trigger interventions",
            replace_existing=True,
            max_instances=1
        )
        
        # Schedule AI-powered lead scanning job
        scheduler.add_job(
            func=run_ai_lead_scanning,
            trigger=IntervalTrigger(hours=2),  # Run every 2 hours
            id="ai_lead_scanning_job",
            name="AI-powered lead scanning for opportunities",
            replace_existing=True,
            max_instances=1
        )
        
        # Schedule a daily outreach campaign (optional - can also be manually triggered)
        scheduler.add_job(
            func=run_daily_outreach_check,
            trigger=IntervalTrigger(hours=24),
            id="daily_outreach_check",
            name="Daily check for proactive outreach opportunities",
            replace_existing=True,
            max_instances=1
        )
        
        # Start the scheduler
        scheduler.start()
        logger.info("✅ Background scheduler started successfully")
        
        # Log system startup
        system_logger = SystemLogger(db)
        await system_logger.log_event(
            event_type="system_startup",
            details=f"AI Patient Advocate system started at {datetime.utcnow().isoformat()}",
            severity="info"
        )
        
        db.close()
        
    except Exception as e:
        logger.error(f"❌ Failed to start background services: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down AI Patient Advocate system...")
    
    try:
        if scheduler:
            scheduler.shutdown(wait=True)
            logger.info("✅ Background scheduler stopped successfully")
        
        # Log system shutdown
        db = next(get_db())
        system_logger = SystemLogger(db)
        await system_logger.log_event(
            event_type="system_shutdown",
            details=f"AI Patient Advocate system stopped at {datetime.utcnow().isoformat()}",
            severity="info"
        )
        db.close()
        
    except Exception as e:
        logger.error(f"❌ Error during shutdown: {e}")


# Create FastAPI application
app = FastAPI(
    title="AI Patient Advocate",
    description="""
    Advanced AI-driven patient engagement system for Bright Smile Clinic.
    
    ## Features
    
    * **Instant Reply Agent**: Real-time AI responses to patient inquiries
    * **Proactive Outreach Agent**: Automated re-engagement of cold leads  
    * **Risk Analysis**: Predictive intervention for at-risk patients
    * **Financial Explainers**: Personalized cost breakdowns and payment plans
    * **Comprehensive Analytics**: Real-time dashboard and reporting
    
    ## AI Agents
    
    The system includes two distinct AI agent workflows:
    
    1. **Instant Reply Agent**: Responds to incoming messages in real-time using LangGraph workflow
    2. **Proactive Outreach Agent**: Runs qualification gauntlet and executes outreach strategies
    
    ## Authentication
    
    Some endpoints require API key authentication for security.
    Contact your system administrator for access credentials.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(api_router, prefix="/api/v1")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with system information"""
    return {
        "message": "🦷 Welcome to the AI Patient Advocate System",
        "system": "Bright Smile Clinic AI",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "health_check": "/health"
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    Returns system health status and key metrics.
    """
    try:
        # Test database connection
        from sqlalchemy import text
        db = next(get_db())
        db.execute(text("SELECT 1"))
        
        # Get basic system status
        system_logger = SystemLogger(db)
        health_summary = system_logger.get_system_health_summary()
        
        db.close()
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "database": "connected",
            "scheduler": "running" if scheduler and scheduler.running else "stopped",
            "system_health": health_summary
        }
    
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e)
            }
        )


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "The requested resource was not found",
            "path": str(request.url.path)
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    logger.error(f"Internal server error: {exc}")
    
    # Log the error to the system
    try:
        db = next(get_db())
        system_logger = SystemLogger(db)
        await system_logger.log_error(
            error_type="internal_server_error",
            error_message=str(exc),
            additional_context=f"Request: {request.method} {request.url.path}"
        )
        db.close()
    except:
        pass  # Don't let logging errors break the error handler
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later.",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


# Background job functions
async def run_risk_analysis():
    """
    Background job to run risk analysis on all active leads.
    This identifies at-risk leads and triggers predictive interventions.
    """
    try:
        logger.info("🔍 Starting scheduled risk analysis...")
        
        db = next(get_db())
        engine = EngagementEngine(db)
        analyzer = RiskAnalyzer(db, engagement_engine=engine)
        
        results = await analyzer.analyze_all_active_leads()
        
        logger.info(
            f"✅ Risk analysis completed: {results['total_analyzed']} leads analyzed, "
            f"{results['newly_at_risk']} flagged at risk, "
            f"{results['interventions_triggered']} interventions sent"
        )
        
        db.close()
        
    except Exception as e:
        logger.error(f"❌ Risk analysis job failed: {e}")
        
        try:
            db = next(get_db())
            system_logger = SystemLogger(db)
            await system_logger.log_error(
                error_type="scheduled_risk_analysis",
                error_message=str(e),
                additional_context="Scheduled background risk analysis failed"
            )
            db.close()
        except:
            pass


async def run_ai_lead_scanning():
    """
    Background job to run AI-powered lead scanning.
    This identifies opportunities for proactive engagement.
    """
    try:
        logger.info("🔍 Starting AI-powered lead scanning...")
        
        db = next(get_db())
        engine = EngagementEngine(db)
        risk_analyzer = RiskAnalyzer(db, engagement_engine=engine)
        
        # Run AI-powered lead scanning
        results = await risk_analyzer.scan_all_leads_for_opportunities()
        
        logger.info(
            f"✅ AI-powered lead scanning completed: {results['opportunities_identified']} opportunities found, "
            f"{results['proactive_messages_sent']} messages sent, {results['leads_escalated']} escalated"
        )
        
        # Log the scan
        system_logger = SystemLogger(db)
        await system_logger.log_event(
            event_type="ai_lead_scanning",
            details=f"AI-powered lead scanning completed. {results['opportunities_identified']} opportunities found.",
            severity="info"
        )
        
        db.close()
        
    except Exception as e:
        logger.error(f"❌ AI-powered lead scanning failed: {e}")
        
        try:
            db = next(get_db())
            system_logger = SystemLogger(db)
            await system_logger.log_error(
                error_type="ai_lead_scanning",
                error_message=str(e),
                additional_context="Scheduled AI lead scanning failed"
            )
            db.close()
        except:
            pass


async def run_daily_outreach_check():
    """
    Background job to check for proactive outreach opportunities.
    This is a lighter check that can optionally trigger outreach campaigns.
    """
    try:
        logger.info("📧 Running daily outreach check...")
        
        db = next(get_db())
        
        # Count cold leads that qualify for outreach
        from app.db.models import Lead, LeadStatus
        cold_leads = db.query(Lead).filter(
            Lead.status == LeadStatus.COLD,
            Lead.do_not_contact == False
        ).count()
        
        logger.info(f"📊 Found {cold_leads} cold leads potentially eligible for outreach")
        
        # Log the check
        system_logger = SystemLogger(db)
        await system_logger.log_event(
            event_type="daily_outreach_check",
            details=f"Daily outreach check completed. Found {cold_leads} cold leads.",
            severity="info"
        )
        
        db.close()
        
    except Exception as e:
        logger.error(f"❌ Daily outreach check failed: {e}")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload,
        log_level=settings.log_level.lower()
    )