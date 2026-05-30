import re
import logging
from typing import Set, List

logger = logging.getLogger(__name__)

# Comprehensive skill database
SKILL_DATABASE = {
    'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust', 'php', 'ruby',
    'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql', 'html', 'css', 'xml', 'json', 'bash',
    'react', 'angular', 'vue', 'django', 'flask', 'fastapi', 'spring', 'spring boot',
    'express', 'node.js', 'nodejs', 'asp.net', 'laravel', 'rails', 'next.js', 'nuxt',
    'mongodb', 'mysql', 'postgresql', 'oracle', 'redis', 'elasticsearch',
    'cassandra', 'dynamodb', 'firebase', 'mariadb', 'neo4j',
    'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'jenkins', 'gitlab ci',
    'github actions', 'terraform', 'ansible', 'cloudformation', 'lambda',
    'machine learning', 'deep learning', 'nlp', 'llm', 'pandas', 'numpy',
    'scikit-learn', 'tensorflow', 'pytorch', 'tableau', 'power bi',
    'git', 'github', 'gitlab', 'jira', 'rest api', 'graphql', 'postman',
    'microservices', 'agile', 'scrum', 'ci/cd', 'devops', 'linux', 'windows',
    'api', 'oop', 'functional programming', 'design patterns',
    'testing', 'junit', 'pytest', 'rspec', 'mocha', 'jest', 'selenium',
    'html5', 'sass', 'less', 'bootstrap', 'tailwind', 'material ui',
    'nosql', 'sql', 'orm', 'mvc', 'rest', 'soap', 'swagger', 'openapi'
}

# Synonym mapping
SKILL_SYNONYMS = {
    'nodejs': 'node.js',
    'reactjs': 'react',
    'vuejs': 'vue',
    'golang': 'go',
    'cpp': 'c++',
    'csharp': 'c#',
    'nextjs': 'next.js',
    'nuxtjs': 'nuxt',
}


def extract_skills(text: str) -> List[str]:
    """Extract technical skills from text."""
    if not text or not isinstance(text, str):
        return []
    
    text_lower = text.lower()
    found_skills = set()
    
    # Direct matching with skill database
    for skill in SKILL_DATABASE:
        start_boundary = r'(?<!\w)' if re.match(r'^\w', skill) else ''
        end_boundary = r'(?!\w)' if re.search(r'\w$', skill) else ''
        pattern = start_boundary + re.escape(skill) + end_boundary
        if re.search(pattern, text_lower):
            canonical = SKILL_SYNONYMS.get(skill, skill)
            found_skills.add(canonical.lower())
    
    # Check synonyms
    for syn, canonical in SKILL_SYNONYMS.items():
        start_boundary = r'(?<!\w)' if re.match(r'^\w', syn) else ''
        end_boundary = r'(?!\w)' if re.search(r'\w$', syn) else ''
        pattern = start_boundary + re.escape(syn) + end_boundary
        if re.search(pattern, text_lower):
            found_skills.add(canonical.lower())
    
    # Remove duplicates and sort
    return sorted(list(found_skills))
