"""
Utility functions for the AI Patient Advocate system
"""
import uuid
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Initialize sentiment analyzer
sentiment_analyzer = SentimentIntensityAnalyzer()


def generate_secure_token(length: int = 32) -> str:
    """Generate a secure random token for URLs"""
    return str(uuid.uuid4()).replace('-', '')[:length]


def generate_secure_url_token() -> str:
    """Generate a secure token for financial explainer URLs"""
    # Combine UUID with timestamp hash for extra security
    base_token = str(uuid.uuid4()).replace('-', '')
    timestamp = str(datetime.utcnow().timestamp())
    combined = base_token + timestamp
    
    # Create hash and take first 40 characters
    hash_obj = hashlib.sha256(combined.encode())
    return hash_obj.hexdigest()[:40]


def analyze_sentiment(text: str) -> float:
    """
    Analyze sentiment of text and return compound score.
    Returns a value between -1.0 (very negative) and 1.0 (very positive)
    """
    scores = sentiment_analyzer.polarity_scores(text)
    return scores['compound']


def calculate_days_between(start_date: datetime, end_date: Optional[datetime] = None) -> int:
    """Calculate days between two dates"""
    if end_date is None:
        end_date = datetime.utcnow()
    
    delta = end_date - start_date
    return delta.days


def format_conversation_history(messages: List[Dict[str, Any]], limit: int = 10) -> str:
    """
    Format conversation history for LLM prompts.
    
    Args:
        messages: List of message dictionaries with 'sender', 'content', 'created_at'
        limit: Maximum number of messages to include (most recent first)
    
    Returns:
        Formatted conversation string
    """
    if not messages:
        return "No previous conversation."
    
    # Sort by created_at and take the most recent messages
    sorted_messages = sorted(messages, key=lambda x: x['created_at'], reverse=True)[:limit]
    sorted_messages.reverse()  # Reverse back to chronological order
    
    formatted_messages = []
    for msg in sorted_messages:
        sender_label = {
            'lead': 'Patient',
            'ai': 'AI Assistant',
            'human': 'Staff Member'
        }.get(msg['sender'], 'Unknown')
        
        timestamp = msg['created_at'].strftime("%Y-%m-%d %H:%M")
        formatted_messages.append(f"[{timestamp}] {sender_label}: {msg['content']}")
    
    return "\n".join(formatted_messages)


def extract_service_keywords(text: str) -> List[str]:
    """
    Extract dental service keywords from text.
    Used for matching leads with relevant offers and testimonials.
    """
    # Common dental service keywords
    service_keywords = {
        'invisalign': ['invisalign', 'aligners', 'clear braces', 'invisible braces'],
        'implants': ['implant', 'implants', 'tooth replacement', 'missing tooth'],
        'whitening': ['whitening', 'whiten', 'bleaching', 'yellow teeth', 'stained'],
        'crown': ['crown', 'crowns', 'cap', 'caps'],
        'veneer': ['veneer', 'veneers', 'porcelain'],
        'cleaning': ['cleaning', 'hygiene', 'checkup', 'check-up'],
        'extraction': ['extraction', 'remove', 'pull', 'wisdom tooth'],
        'root_canal': ['root canal', 'endodontic', 'infected tooth'],
        'braces': ['braces', 'orthodontic', 'straighten', 'crooked teeth'],
        'gum_treatment': ['gum', 'gums', 'periodontal', 'gingivitis']
    }
    
    text_lower = text.lower()
    found_services = []
    
    for service, keywords in service_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            found_services.append(service)
    
    return found_services


def calculate_payment_plans(total_cost: float, plan_months: List[int]) -> Dict[str, float]:
    """
    Calculate monthly payment amounts for different plan durations.
    
    Args:
        total_cost: Total cost of the procedure
        plan_months: List of payment plan durations in months
    
    Returns:
        Dictionary mapping plan duration to monthly payment amount
    """
    payment_plans = {}
    
    for months in plan_months:
        if months > 0:
            monthly_payment = total_cost / months
            payment_plans[f"{months} months"] = round(monthly_payment, 2)
    
    return payment_plans


def determine_lead_risk_level(sentiment_score: float, response_gap_hours: int, 
                            message_count: int) -> str:
    """
    Determine risk level based on conversation patterns.
    
    Args:
        sentiment_score: Current sentiment score (-1 to 1)
        response_gap_hours: Hours since last response
        message_count: Total number of messages in conversation
    
    Returns:
        Risk level: 'low', 'medium', or 'high'
    """
    risk_factors = 0
    
    # Sentiment-based risk
    if sentiment_score < -0.3:
        risk_factors += 2
    elif sentiment_score < 0:
        risk_factors += 1
    
    # Response time-based risk
    if response_gap_hours > 72:  # 3 days
        risk_factors += 2
    elif response_gap_hours > 24:  # 1 day
        risk_factors += 1
    
    # Engagement-based risk
    if message_count < 3:
        risk_factors += 1
    
    if risk_factors >= 3:
        return 'high'
    elif risk_factors >= 2:
        return 'medium'
    else:
        return 'low'


def format_currency(amount: float) -> str:
    """Format currency amount for display"""
    return f"${amount:,.2f}"


def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe file creation"""
    import re
    # Remove special characters except periods, hyphens, and underscores
    sanitized = re.sub(r'[^\w\-_.]', '', filename)
    return sanitized[:100]  # Limit length


def validate_email(email: str) -> bool:
    """Basic email validation"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """Basic phone number validation"""
    import re
    # Remove all non-digit characters
    cleaned = re.sub(r'\D', '', phone)
    # Check if it's a reasonable length (7-15 digits)
    return 7 <= len(cleaned) <= 15


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """Truncate text to specified length with suffix"""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def get_business_hours_info() -> Dict[str, Any]:
    """Get business hours information (could be moved to database later)"""
    return {
        "hours": {
            "monday": "8:00 AM - 5:00 PM",
            "tuesday": "8:00 AM - 5:00 PM",
            "wednesday": "8:00 AM - 5:00 PM",
            "thursday": "8:00 AM - 5:00 PM",
            "friday": "8:00 AM - 4:00 PM",
            "saturday": "9:00 AM - 2:00 PM",
            "sunday": "Closed"
        },
        "timezone": "EST",
        "phone": "(555) 123-SMILE",
        "emergency_line": "(555) 123-URGENT"
    }


def is_business_hours() -> bool:
    """Check if current time is within business hours"""
    now = datetime.now()
    current_hour = now.hour
    weekday = now.weekday()  # 0 = Monday, 6 = Sunday
    
    if weekday == 6:  # Sunday
        return False
    elif weekday == 5:  # Saturday
        return 9 <= current_hour < 14  # 9 AM - 2 PM
    elif weekday == 4:  # Friday
        return 8 <= current_hour < 16  # 8 AM - 4 PM
    else:  # Monday - Thursday
        return 8 <= current_hour < 17  # 8 AM - 5 PM