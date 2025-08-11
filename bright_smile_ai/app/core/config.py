"""
Configuration settings for the AI Patient Advocate system
"""
import os
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database
    database_url: str = Field(..., env="DATABASE_URL")
    
    # OpenAI API
    openai_api_key: str = Field(..., env="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", env="OPENAI_MODEL")
    openai_temperature: float = Field(default=0.7, env="OPENAI_TEMPERATURE")
    
    # Security
    secret_key: str = Field(..., env="SECRET_KEY")
    
    # Risk Analysis Configuration
    risk_analysis_interval_minutes: int = Field(default=15, env="RISK_ANALYSIS_INTERVAL_MINUTES")
    sentiment_threshold_at_risk: float = Field(default=-0.3, env="SENTIMENT_THRESHOLD_AT_RISK")
    response_time_threshold_hours: int = Field(default=24, env="RESPONSE_TIME_THRESHOLD_HOURS")
    
    # Cold Lead Outreach Configuration
    cold_lead_cooldown_days: int = Field(default=14, env="COLD_LEAD_COOLDOWN_DAYS")
    gentle_nudge_days: int = Field(default=14, env="GENTLE_NUDGE_DAYS")
    social_proof_days: int = Field(default=30, env="SOCIAL_PROOF_DAYS")
    incentive_offer_days: int = Field(default=45, env="INCENTIVE_OFFER_DAYS")
    
    # Financial Explainer Configuration
    default_procedure_cost: float = Field(default=2500.0, env="DEFAULT_PROCEDURE_COST")
    default_insurance_coverage: float = Field(default=0.5, env="DEFAULT_INSURANCE_COVERAGE")
    payment_plan_options: str = Field(
        default="12,24,36", 
        env="PAYMENT_PLAN_OPTIONS",
        description="Comma-separated list of payment plan months"
    )
    
    # API Configuration
    api_host: str = Field(default="0.0.0.0", env="API_HOST")
    api_port: int = Field(default=8000, env="API_PORT")
    api_reload: bool = Field(default=True, env="API_RELOAD")
    
    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # External Service URLs (for future integrations)
    twilio_account_sid: Optional[str] = Field(default=None, env="TWILIO_ACCOUNT_SID")
    twilio_auth_token: Optional[str] = Field(default=None, env="TWILIO_AUTH_TOKEN")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()


def get_payment_plan_months() -> list[int]:
    """Parse payment plan options from settings"""
    return [int(x.strip()) for x in settings.payment_plan_options.split(",")]


def get_database_url() -> str:
    """Get database URL with any necessary modifications"""
    return settings.database_url


def is_development() -> bool:
    """Check if we're in development mode"""
    return settings.api_reload and settings.log_level == "DEBUG"