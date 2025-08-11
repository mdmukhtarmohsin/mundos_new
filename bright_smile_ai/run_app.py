"""
Application runner script
"""
import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    print("🚀 Starting AI Patient Advocate System...")
    print(f"📍 Running on: http://{settings.api_host}:{settings.api_port}")
    print(f"📚 API Documentation: http://{settings.api_host}:{settings.api_port}/docs")
    print(f"🏥 Dashboard: http://{settings.api_host}:{settings.api_port}/api/v1/dashboard/overview")
    
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload,
        log_level=settings.log_level.lower()
    )