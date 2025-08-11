"""
Financial Explainers API endpoints - Public access to personalized financial assets
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.models import FinancialExplainer, Lead
from app.schemas.financial_explainer import (
    FinancialExplainerRead, FinancialExplainerPublic, FinancialExplainerStats
)
from app.services.asset_generator import AssetGenerator
from app.services.system_logger import SystemLogger

router = APIRouter()


@router.get("/{token}", response_model=FinancialExplainerPublic)
async def access_financial_explainer(
    token: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Access a financial explainer via its secure token.
    This is the public endpoint that leads use to view their personalized breakdowns.
    """
    
    # Get the financial explainer by token
    asset_generator = AssetGenerator(db)
    explainer = asset_generator.get_financial_explainer_by_token(token)
    
    if not explainer:
        raise HTTPException(
            status_code=404, 
            detail="Financial explainer not found or expired"
        )
    
    # Mark as accessed and update tracking
    explainer = await asset_generator.mark_explainer_accessed(explainer)
    
    # Return public view (without sensitive information)
    return FinancialExplainerPublic.model_validate(explainer)


@router.get("/{token}/html", response_class=HTMLResponse)
async def get_financial_explainer_html(
    token: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get a formatted HTML version of the financial explainer.
    This provides a user-friendly web view of the financial breakdown.
    """
    
    # Get the financial explainer
    asset_generator = AssetGenerator(db)
    explainer = asset_generator.get_financial_explainer_by_token(token)
    
    if not explainer:
        return HTMLResponse(
            content="""
            <html>
                <head><title>Bright Smile Clinic - Not Found</title></head>
                <body>
                    <h1>Financial Explainer Not Found</h1>
                    <p>The requested financial breakdown could not be found or has expired.</p>
                </body>
            </html>
            """,
            status_code=404
        )
    
    # Mark as accessed
    await asset_generator.mark_explainer_accessed(explainer)
    
    # Get lead information
    lead = db.query(Lead).filter(Lead.id == explainer.lead_id).first()
    lead_name = lead.name if lead else "Valued Patient"
    
    # Format payment options
    payment_options_html = ""
    if explainer.payment_options:
        payment_options_html = "<ul>"
        for duration, amount in explainer.payment_options.items():
            payment_options_html += f"<li><strong>{duration}:</strong> ${amount:.2f}/month</li>"
        payment_options_html += "</ul>"
    
    # Generate HTML content
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bright Smile Clinic - Your Financial Breakdown</title>
        <style>
            body {{ 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }}
            .container {{ 
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                overflow: hidden;
            }}
            .header {{ 
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }}
            .header h1 {{ 
                margin: 0;
                font-size: 2.2em;
                font-weight: 300;
            }}
            .header p {{ 
                margin: 10px 0 0;
                opacity: 0.9;
                font-size: 1.1em;
            }}
            .content {{ 
                padding: 40px;
            }}
            .procedure-title {{ 
                color: #2c3e50;
                font-size: 1.8em;
                margin-bottom: 30px;
                text-align: center;
                padding-bottom: 10px;
                border-bottom: 3px solid #4facfe;
            }}
            .cost-breakdown {{ 
                background: #f8f9fa;
                border-radius: 10px;
                padding: 25px;
                margin: 30px 0;
            }}
            .cost-item {{ 
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 0;
                border-bottom: 1px solid #dee2e6;
                font-size: 1.1em;
            }}
            .cost-item:last-child {{ 
                border-bottom: none;
                font-weight: bold;
                font-size: 1.2em;
                color: #4facfe;
            }}
            .cost-label {{ 
                color: #495057;
            }}
            .cost-value {{ 
                font-weight: 600;
                color: #2c3e50;
            }}
            .payment-plans {{ 
                background: #e8f5e8;
                border-radius: 10px;
                padding: 25px;
                margin: 30px 0;
            }}
            .payment-plans h3 {{ 
                color: #28a745;
                margin-bottom: 20px;
                font-size: 1.3em;
            }}
            .payment-plans ul {{ 
                list-style: none;
                padding: 0;
            }}
            .payment-plans li {{ 
                padding: 10px 0;
                border-bottom: 1px solid #c3e6cb;
                font-size: 1.1em;
            }}
            .payment-plans li:last-child {{ 
                border-bottom: none;
            }}
            .footer {{ 
                background: #2c3e50;
                color: white;
                padding: 20px 40px;
                text-align: center;
            }}
            .cta-button {{ 
                display: inline-block;
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 50px;
                margin: 20px 0;
                font-weight: 600;
                transition: transform 0.2s;
            }}
            .cta-button:hover {{ 
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
            }}
            .note {{ 
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🦷 Bright Smile Clinic</h1>
                <p>Personalized Financial Breakdown for {lead_name}</p>
            </div>
            
            <div class="content">
                <h2 class="procedure-title">{explainer.procedure_name}</h2>
                
                <div class="cost-breakdown">
                    <div class="cost-item">
                        <span class="cost-label">Total Treatment Cost:</span>
                        <span class="cost-value">${explainer.total_cost:,.2f}</span>
                    </div>
                    {f'''<div class="cost-item">
                        <span class="cost-label">Estimated Insurance Coverage:</span>
                        <span class="cost-value">${explainer.estimated_insurance:,.2f}</span>
                    </div>''' if explainer.estimated_insurance else ''}
                    <div class="cost-item">
                        <span class="cost-label">Your Estimated Out-of-Pocket Cost:</span>
                        <span class="cost-value">${explainer.out_of_pocket_cost:,.2f}</span>
                    </div>
                </div>
                
                {f'''<div class="payment-plans">
                    <h3>💳 Flexible Payment Plan Options</h3>
                    <p>We offer interest-free payment plans to make your treatment more affordable:</p>
                    {payment_options_html}
                </div>''' if explainer.payment_options else ''}
                
                <div class="note">
                    <strong>Please Note:</strong> This breakdown is an estimate based on typical treatment costs and insurance coverage. 
                    Your actual costs may vary based on your specific treatment needs and insurance benefits. 
                    We'll provide a detailed, accurate quote during your consultation.
                </div>
                
                <div style="text-align: center;">
                    <a href="tel:+15551234567" class="cta-button">📞 Call to Schedule Your Consultation</a>
                    <br>
                    <a href="mailto:hello@brightsmileclinic.com" class="cta-button">✉️ Ask Questions via Email</a>
                </div>
            </div>
            
            <div class="footer">
                <p>Generated on {explainer.created_at.strftime("%B %d, %Y at %I:%M %p")}</p>
                <p>© 2024 Bright Smile Clinic. Your smile is our priority.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)


@router.get("/admin/stats", response_model=FinancialExplainerStats)
def get_financial_explainer_stats(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get statistics about financial explainer usage (admin endpoint).
    """
    
    from datetime import datetime, timedelta
    from sqlalchemy import func
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Total metrics
    total_created = db.query(FinancialExplainer).filter(
        FinancialExplainer.created_at >= start_date
    ).count()
    
    total_accessed = db.query(FinancialExplainer).filter(
        FinancialExplainer.created_at >= start_date,
        FinancialExplainer.is_accessed == True
    ).count()
    
    access_rate = (total_accessed / total_created * 100) if total_created > 0 else 0
    
    # Most common procedures
    procedure_stats = db.query(
        FinancialExplainer.procedure_name,
        func.count(FinancialExplainer.id).label('count')
    ).filter(
        FinancialExplainer.created_at >= start_date
    ).group_by(
        FinancialExplainer.procedure_name
    ).order_by(
        func.count(FinancialExplainer.id).desc()
    ).limit(10).all()
    
    most_common_procedures = [
        {"procedure": proc, "count": count}
        for proc, count in procedure_stats
    ]
    
    # Cost analysis
    cost_stats = db.query(
        func.min(FinancialExplainer.total_cost).label('min_cost'),
        func.max(FinancialExplainer.total_cost).label('max_cost'),
        func.avg(FinancialExplainer.total_cost).label('avg_cost')
    ).filter(
        FinancialExplainer.created_at >= start_date
    ).first()
    
    avg_cost_range = {
        "min": float(cost_stats.min_cost) if cost_stats.min_cost else 0,
        "max": float(cost_stats.max_cost) if cost_stats.max_cost else 0,
        "average": float(cost_stats.avg_cost) if cost_stats.avg_cost else 0
    }
    
    return FinancialExplainerStats(
        total_created=total_created,
        total_accessed=total_accessed,
        access_rate=round(access_rate, 2),
        most_common_procedures=most_common_procedures,
        avg_cost_range=avg_cost_range
    )


@router.get("/admin/{explainer_id}", response_model=FinancialExplainerRead)
def get_financial_explainer_admin(
    explainer_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed financial explainer information (admin endpoint).
    """
    
    explainer = db.query(FinancialExplainer).filter(
        FinancialExplainer.id == explainer_id
    ).first()
    
    if not explainer:
        raise HTTPException(status_code=404, detail="Financial explainer not found")
    
    return explainer


@router.delete("/admin/{explainer_id}")
async def delete_financial_explainer(
    explainer_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a financial explainer (admin endpoint).
    """
    
    explainer = db.query(FinancialExplainer).filter(
        FinancialExplainer.id == explainer_id
    ).first()
    
    if not explainer:
        raise HTTPException(status_code=404, detail="Financial explainer not found")
    
    lead_id = explainer.lead_id
    
    db.delete(explainer)
    db.commit()
    
    # Log the deletion
    logger = SystemLogger(db)
    await logger.log_event(
        event_type="financial_explainer_deleted",
        details=f"Financial explainer {explainer_id} deleted",
        lead_id=lead_id,
        severity="warning"
    )
    
    return {"message": "Financial explainer deleted successfully"}