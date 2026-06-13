from datetime import datetime
from typing import Dict
import logging

from jinja2 import Environment, FileSystemLoader, select_autoescape

logger = logging.getLogger(__name__)

_weasyprint_available = False
try:
    from weasyprint import HTML
    _weasyprint_available = True
except ImportError as e:
    logger.warning(f"WeasyPrint not available: {e}. PDF generation will be disabled.")

# Initialize Jinja2 environment
env = Environment(
    loader=FileSystemLoader("templates"),
    autoescape=select_autoescape(["html", "xml"])
)


def create_pdf(company_data: Dict) -> bytes:
    """
    Generate a PDF report from company data using Jinja2 template and WeasyPrint.

    Args:
        company_data: Dictionary containing company verification data

    Returns:
        PDF as bytes

    Raises:
        PDFGenerationError: If PDF generation fails
    """
    if not _weasyprint_available:
        raise PDFGenerationError("PDF generation is not available. WeasyPrint is not installed.")

    try:
        # Load template
        template = env.get_template("student_report.html")
        
        # Prepare template data
        template_data = {
            "company_name": company_data.get("company_name", "Unknown Company"),
            "is_verified": company_data.get("is_verified", False),
            "description": company_data.get("description", ""),
            "industry": company_data.get("industry", ""),
            "student_trust_score": company_data.get("student_trust_score", {}),
            "opportunities": company_data.get("opportunities", []),
            "social_media": company_data.get("social_media", {}),
            "reviews": company_data.get("reviews", {}),
            "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        }
        
        # Render HTML
        html_content = template.render(**template_data)
        
        # Convert to PDF
        html = HTML(string=html_content)
        pdf_bytes = html.write_pdf()
        
        logger.info(f"PDF generated successfully for {template_data['company_name']}")
        return pdf_bytes
        
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        raise PDFGenerationError(f"Failed to generate PDF: {str(e)}") from e


def _format_history(history_text: str) -> str:
    """
    Format company history text for HTML rendering.
    Converts plain text paragraphs to HTML paragraphs.
    """
    if not history_text:
        return "<p>No history information available.</p>"
    
    # Split into paragraphs and wrap with <p> tags
    paragraphs = [p.strip() for p in history_text.split("\n\n") if p.strip()]
    
    if not paragraphs:
        paragraphs = [history_text]
    
    html_paragraphs = [f"<p>{p}</p>" for p in paragraphs]
    return "\n".join(html_paragraphs)


class PDFGenerationError(Exception):
    """Custom exception for PDF generation failures."""
    pass
