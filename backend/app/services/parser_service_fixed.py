import re
import logging
from typing import List, Dict, Any
from app.models.resume_model import EducationItem, ExperienceItem, ProjectItem
from app.ai.skill_extractor import extract_skills

logger = logging.getLogger(__name__)


def extract_links(text: str) -> List[str]:
    """Extract GitHub, LinkedIn, and general web links from text."""
    links = []
    url_pattern = re.compile(
        r'https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)'
    )
    for match in url_pattern.finditer(text):
        url = match.group(0)
        if "github.com" in url or "linkedin.com" in url or "portfolio" in url:
            links.append(url)
    
    implicit_patterns = [
        r'\bgithub\.com/[a-zA-Z0-9_-]+',
        r'\blinkedin\.com/in/[a-zA-Z0-9_-]+'
    ]
    for pattern in implicit_patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            match_str = match.group(0)
            if not match_str.startswith("http"):
                match_str = "https://" + match_str
            if match_str not in links:
                links.append(match_str)
                
    return list(set(links))


def extract_candidate_name(text: str) -> str:
    """Attempt to extract the candidate's name from the first few lines of the resume."""
    lines = [line.strip() for line in text.split('\n') if line.strip()][:5]
    for line in lines:
        if '@' in line or any(k in line.lower() for k in ['resume', 'curriculum', 'cv', 'page', 'phone', 'email', 'address', 'http']):
            continue
        
        match = re.match(r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}$', line)
        if match:
            return line
    
    return "Unknown"


def parse_resume_structured(text: str) -> Dict[str, Any]:
    """
    Parse resume text and extract all relevant information.
    
    Returns:
        Dict containing: candidate_name, skills, education, experience, projects, 
                        technologies, certifications, github_links
    """
    try:
        # Extract main fields
        candidate_name = extract_candidate_name(text)
        skills = extract_skills(text)
        education = extract_education(text)
        experience = extract_experience(text)
        projects = extract_projects(text)
        technologies = extract_technologies(text)
        certifications = extract_certifications(text)
        github_links = extract_links(text)
        
        return {
            "candidate_name": candidate_name,
            "skills": skills,
            "education": education,
            "experience": experience,
            "projects": projects,
            "technologies": technologies,
            "certifications": certifications,
            "github_links": github_links
        }
    except Exception as e:
        logger.error(f"Error parsing resume: {str(e)}")
        return {
            "candidate_name": "Unknown",
            "skills": [],
            "education": [],
            "experience": [],
            "projects": [],
            "technologies": [],
            "certifications": [],
            "github_links": []
        }


def extract_education(text: str) -> List[EducationItem]:
    """Extract education information from resume text."""
    education = []
    
    education_keywords = r'(education|academic|degree|bachelor|master|phd|certification|course)'
    sections = re.split(education_keywords, text, flags=re.IGNORECASE)
    if len(sections) > 1:
        education_text = sections[-1][:1000]
    else:
        education_text = text
    
    degree_patterns = [
        r'(?P<school>[A-Z][a-z\s]+(?:University|Institute|College|Academy|School))[\s,]*(?P<degree>B\.?S\.?|M\.?S\.?|Ph\.?D\.?|B\.?A\.?|M\.?A\.?|M\.?B\.?A\.?)[\s,]*(?:in|of)?\s*(?P<field>[A-Z][a-z\s]+)?[\s,]*(?P<year>20\d{2})?',
        r'(?P<school>[A-Z][a-z\s]+)[\s,]*-\s*(?P<degree>[A-Z][^,\n]+?)[\s,]*\((?P<year>20\d{2})\)',
    ]
    
    for pattern in degree_patterns:
        matches = re.finditer(pattern, education_text)
        for match in matches:
            try:
                school = match.group('school').strip() if 'school' in match.groupdict() else ''
                degree = match.group('degree').strip() if 'degree' in match.groupdict() else ''
                field = match.group('field').strip() if 'field' in match.groupdict() else ''
                year = match.group('year').strip() if 'year' in match.groupdict() else ''
                
                if school or degree:
                    education.append(EducationItem(
                        school=school,
                        degree=degree,
                        field_of_study=field,
                        year=year
                    ))
            except Exception as e:
                logger.debug(f"Error parsing education match: {e}")
                continue
    
    return education


def extract_experience(text: str) -> List[ExperienceItem]:
    """Extract work experience from resume text."""
    experience = []
    
    exp_keywords = r'(experience|employment|professional|career|work)'
    sections = re.split(exp_keywords, text, flags=re.IGNORECASE)
    if len(sections) > 1:
        exp_text = sections[-1][:2000]
    else:
        exp_text = text
    
    job_patterns = [
        r'(?P<company>[A-Z][a-zA-Z\s&,\.]+?)[\s,]*[-–]\s*(?P<role>[^,\n]+?)[\s,]*\|?\s*(?P<duration>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+20\d{2}[\s\-]*(?:Present|20\d{2})?)?',
        r'(?P<role>[A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Analyst|Designer|Director|Lead|Specialist))\s+(?:at|@|,)\s+(?P<company>[A-Z][a-zA-Z\s&,\.]+?)[\s,]*(?P<duration>\d+\s+(?:years|months))?',
    ]
    
    for pattern in job_patterns:
        matches = re.finditer(pattern, exp_text)
        for match in matches:
            try:
                company = match.group('company').strip() if 'company' in match.groupdict() else ''
                role = match.group('role').strip() if 'role' in match.groupdict() else ''
                duration = match.group('duration').strip() if 'duration' in match.groupdict() else ''
                
                if company or role:
                    description = ""
                    job_line = match.group(0)
                    idx = exp_text.find(job_line)
                    if idx != -1:
                        rest = exp_text[idx + len(job_line):idx + len(job_line) + 200]
                        sentences = re.split(r'[.\n]', rest)
                        description = sentences[0].strip() if sentences else ""
                    
                    experience.append(ExperienceItem(
                        company=company,
                        role=role,
                        duration=duration,
                        description=description
                    ))
            except Exception as e:
                logger.debug(f"Error parsing experience match: {e}")
                continue
    
    return experience


def extract_projects(text: str) -> List[ProjectItem]:
    """Extract projects from resume text."""
    projects = []
    
    project_keywords = r'(projects?|portfolio|work|portfolio projects|side projects)'
    sections = re.split(project_keywords, text, flags=re.IGNORECASE)
    if len(sections) > 1:
        proj_text = sections[-1][:1500]
    else:
        proj_text = text
    
    project_patterns = [
        r'(?P<title>[A-Z][a-zA-Z0-9\s\-]+?)[\s]*(?:\||:|-|–)[\s]*(?P<tech>[^\n]*(?:Python|Java|JavaScript|React|Node|Django|Flask|Angular)[^\n]*)',
        r'■\s+(?P<title>[^,\n]+?)[\s]*(?:–|-|,)\s*(?P<tech>[^\n]*)',
    ]
    
    for pattern in project_patterns:
        matches = re.finditer(pattern, proj_text)
        for match in matches:
            try:
                title = match.group('title').strip() if 'title' in match.groupdict() else ''
                tech_str = match.group('tech').strip() if 'tech' in match.groupdict() else ''
                
                technologies = extract_skills(tech_str) if tech_str else []
                
                if title:
                    projects.append(ProjectItem(
                        title=title,
                        description=tech_str[:100] if tech_str else "",
                        technologies=technologies
                    ))
            except Exception as e:
                logger.debug(f"Error parsing project match: {e}")
                continue
    
    return projects


def extract_technologies(text: str) -> List[str]:
    """Extract all technologies mentioned in resume."""
    return extract_skills(text)


def extract_certifications(text: str) -> List[str]:
    """Extract certifications from resume text."""
    certifications = []
    
    cert_keywords = r'(certification|certifications|license|licenses|credential|aws|azure|gcp)'
    sections = re.split(cert_keywords, text, flags=re.IGNORECASE)
    if len(sections) > 1:
        cert_text = sections[-1][:800]
    else:
        cert_text = text
    
    cert_patterns = [
        r'(?:AWS|Azure|GCP|Google|Microsoft|Certified)\s+[A-Z][a-zA-Z0-9\s\-&,\.]+(?:Certificate|Certification|Certified)',
        r'(?:AWS|CertifiedKubernetes|CKAD|CKA)\s+(?:Certified|Solutions Architect|Developer|SysOps|DevOps)[\w\s]*',
        r'[A-Z][a-zA-Z\s]+\s+(?:Certification|Certificate|License)\s+(?:from|by)\s+[A-Z][a-zA-Z\s]*',
    ]
    
    for pattern in cert_patterns:
        matches = re.finditer(pattern, cert_text, re.IGNORECASE)
        for match in matches:
            cert = match.group(0).strip()
            if cert and cert not in certifications:
                certifications.append(cert)
    
    return certifications[:10]
