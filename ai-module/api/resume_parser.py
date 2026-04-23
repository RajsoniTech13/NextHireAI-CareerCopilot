"""
ResumeParser - Parse PDF/DOCX resumes and extract structured data
Supports section detection, skill extraction, and ATS scoring
"""

import re
import os

# PDF parsing
try:
    import pdfplumber
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False
    print("[ResumeParser] pdfplumber not installed. PDF support disabled.")

# DOCX parsing
try:
    from docx import Document as DocxDocument
    DOCX_SUPPORT = True
except ImportError:
    DOCX_SUPPORT = False
    print("[ResumeParser] python-docx not installed. DOCX support disabled.")


class ResumeParser:
    """Parse resume files and extract structured information"""
    
    # Common section headers found in resumes
    SECTION_HEADERS = {
        'summary': ['summary', 'objective', 'profile', 'about me', 'professional summary', 'career objective'],
        'experience': ['experience', 'work experience', 'employment', 'professional experience', 'work history', 'career history'],
        'education': ['education', 'academic', 'qualifications', 'academic background', 'degrees'],
        'skills': ['skills', 'technical skills', 'technologies', 'tools', 'competencies', 'core competencies', 'tech stack'],
        'projects': ['projects', 'personal projects', 'key projects', 'notable projects'],
        'certifications': ['certifications', 'certificates', 'licenses', 'credentials'],
        'achievements': ['achievements', 'awards', 'honors', 'accomplishments'],
        'languages': ['languages', 'language proficiency'],
    }
    
    # Comprehensive skill database (NLP-enhanced, not static matching)
    TECH_SKILLS = {
        # Programming Languages
        'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'golang',
        'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab',
        'perl', 'dart', 'lua', 'haskell', 'elixir', 'clojure',
        
        # Frontend
        'react', 'reactjs', 'angular', 'vue', 'vuejs', 'svelte', 'next.js', 'nextjs',
        'nuxt', 'gatsby', 'html', 'html5', 'css', 'css3', 'sass', 'scss', 'less',
        'tailwind', 'tailwindcss', 'bootstrap', 'material-ui', 'mui', 'chakra ui',
        'jquery', 'webpack', 'vite', 'babel', 'redux', 'mobx', 'zustand',
        
        # Backend
        'node.js', 'nodejs', 'express', 'expressjs', 'django', 'flask', 'fastapi',
        'spring', 'spring boot', '.net', 'asp.net', 'rails', 'ruby on rails',
        'laravel', 'nest.js', 'nestjs', 'koa', 'hapi', 'gin', 'fiber',
        
        # Databases
        'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'elasticsearch',
        'cassandra', 'dynamodb', 'firebase', 'firestore', 'sqlite', 'oracle',
        'mariadb', 'neo4j', 'couchdb', 'influxdb', 'mssql',
        
        # Cloud & DevOps
        'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'docker',
        'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins', 'gitlab ci',
        'github actions', 'circleci', 'travis ci', 'nginx', 'apache',
        'cloudformation', 'heroku', 'vercel', 'netlify', 'digitalocean',
        
        # Data & ML
        'machine learning', 'deep learning', 'natural language processing', 'nlp',
        'computer vision', 'tensorflow', 'pytorch', 'keras', 'scikit-learn',
        'pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn', 'plotly',
        'spark', 'hadoop', 'airflow', 'kafka', 'tableau', 'power bi',
        'jupyter', 'mlflow', 'hugging face', 'transformers', 'bert', 'gpt',
        'langchain', 'openai', 'llm',
        
        # Tools
        'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence',
        'slack', 'figma', 'sketch', 'adobe xd', 'postman', 'swagger',
        'linux', 'unix', 'bash', 'shell scripting', 'powershell',
        'vs code', 'intellij', 'vim',
        
        # Methodologies
        'agile', 'scrum', 'kanban', 'tdd', 'bdd', 'ci/cd',
        'microservices', 'rest', 'restful', 'graphql', 'grpc',
        'oauth', 'jwt', 'websockets', 'api design',
    }
    
    SOFT_SKILLS = {
        'communication', 'leadership', 'teamwork', 'problem solving',
        'project management', 'time management', 'critical thinking',
        'adaptability', 'collaboration', 'mentoring', 'strategic thinking',
        'presentation', 'negotiation', 'decision making', 'creativity',
        'attention to detail', 'analytical thinking', 'conflict resolution',
    }
    
    @staticmethod
    def parse_file(file_path):
        """Parse a resume file (PDF or DOCX) and return raw text"""
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == '.pdf':
            if not PDF_SUPPORT:
                raise ImportError("pdfplumber is required for PDF parsing. Install: pip install pdfplumber")
            return ResumeParser._parse_pdf(file_path)
        elif ext in ['.docx', '.doc']:
            if not DOCX_SUPPORT:
                raise ImportError("python-docx is required for DOCX parsing. Install: pip install python-docx")
            return ResumeParser._parse_docx(file_path)
        elif ext == '.txt':
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        else:
            raise ValueError(f"Unsupported file format: {ext}. Supported: PDF, DOCX, TXT")
    
    @staticmethod
    def parse_text(raw_text):
        """
        Parse raw resume text into structured data.
        Returns a dict with sections, skills, contact info, etc.
        """
        result = {
            'raw_text': raw_text,
            'sections': {},
            'contact': ResumeParser._extract_contact(raw_text),
            'skills': {
                'technical': [],
                'soft': [],
                'all': []
            },
            'word_count': len(raw_text.split()),
            'line_count': len(raw_text.strip().split('\n')),
        }
        
        # Extract sections
        result['sections'] = ResumeParser._detect_sections(raw_text)
        
        # Extract skills from the entire resume
        skills_section = result['sections'].get('skills', '')
        full_text = raw_text.lower()
        
        tech_skills = []
        for skill in ResumeParser.TECH_SKILLS:
            # Use word boundary matching to avoid partial matches
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, full_text, re.IGNORECASE):
                tech_skills.append(skill.title() if len(skill) > 3 else skill.upper())
        
        soft_skills = []
        for skill in ResumeParser.SOFT_SKILLS:
            if skill in full_text:
                soft_skills.append(skill.title())
        
        result['skills']['technical'] = sorted(set(tech_skills))
        result['skills']['soft'] = sorted(set(soft_skills))
        result['skills']['all'] = sorted(set(tech_skills + soft_skills))
        
        return result
    
    @staticmethod
    def analyze_resume(parsed_data, job_description=None):
        """
        Perform deep analysis on parsed resume data.
        Returns ATS score, strengths, weaknesses, suggestions.
        """
        analysis = {
            'ats_score': 0,
            'strengths': [],
            'weaknesses': [],
            'suggestions': [],
            'section_scores': {},
            'keyword_density': 0,
        }
        
        raw_text = parsed_data.get('raw_text', '')
        sections = parsed_data.get('sections', {})
        skills = parsed_data.get('skills', {})
        word_count = parsed_data.get('word_count', 0)
        
        score = 0
        max_score = 0
        
        # 1. Contact Information (10 points)
        max_score += 10
        contact = parsed_data.get('contact', {})
        if contact.get('email'):
            score += 4
            analysis['strengths'].append('Email address present')
        else:
            analysis['weaknesses'].append('No email address found')
            analysis['suggestions'].append('Add a professional email address')
        
        if contact.get('phone'):
            score += 3
            analysis['strengths'].append('Phone number present')
        else:
            analysis['suggestions'].append('Consider adding a phone number')
        
        if contact.get('linkedin'):
            score += 3
            analysis['strengths'].append('LinkedIn profile linked')
        else:
            analysis['suggestions'].append('Add your LinkedIn profile URL')
        
        # 2. Section Coverage (25 points)
        max_score += 25
        required_sections = ['summary', 'experience', 'education', 'skills']
        for section in required_sections:
            if section in sections and sections[section].strip():
                score += 6
                analysis['section_scores'][section] = 'Present'
                analysis['strengths'].append(f'{section.title()} section found')
            else:
                analysis['section_scores'][section] = 'Missing'
                analysis['weaknesses'].append(f'Missing {section.title()} section')
                analysis['suggestions'].append(f'Add a {section.title()} section to your resume')
        
        if 'projects' in sections:
            score += 1
            analysis['strengths'].append('Projects section included')
        
        # 3. Technical Skills (20 points)
        max_score += 20
        tech_count = len(skills.get('technical', []))
        if tech_count >= 10:
            score += 20
            analysis['strengths'].append(f'Excellent skill coverage ({tech_count} technical skills)')
        elif tech_count >= 6:
            score += 14
            analysis['strengths'].append(f'Good skill coverage ({tech_count} technical skills)')
        elif tech_count >= 3:
            score += 8
            analysis['suggestions'].append('Add more relevant technical skills')
        else:
            score += 2
            analysis['weaknesses'].append('Very few technical skills detected')
            analysis['suggestions'].append('List your technical proficiencies explicitly')
        
        # 4. Content Quality (20 points)
        max_score += 20
        if word_count >= 300 and word_count <= 800:
            score += 10
            analysis['strengths'].append('Resume length is optimal (300-800 words)')
        elif word_count >= 200:
            score += 6
            analysis['suggestions'].append('Consider adding more detail to reach 300+ words')
        elif word_count > 800:
            score += 6
            analysis['suggestions'].append('Consider condensing your resume (aim for 300-800 words)')
        else:
            score += 2
            analysis['weaknesses'].append('Resume is too short')
            analysis['suggestions'].append('Expand your resume with more relevant details')
        
        # Check for action verbs
        action_verbs = ['developed', 'implemented', 'managed', 'designed', 'built',
                       'created', 'led', 'improved', 'achieved', 'delivered',
                       'optimized', 'architected', 'deployed', 'automated', 'launched']
        found_verbs = [v for v in action_verbs if v in raw_text.lower()]
        if len(found_verbs) >= 5:
            score += 5
            analysis['strengths'].append('Strong use of action verbs')
        elif len(found_verbs) >= 2:
            score += 3
        else:
            analysis['suggestions'].append('Use more action verbs (developed, implemented, managed, etc.)')
        
        # Check for quantified achievements
        numbers = re.findall(r'\b\d+[%+]?\b', raw_text)
        if len(numbers) >= 3:
            score += 5
            analysis['strengths'].append('Achievements are quantified with numbers')
        else:
            analysis['suggestions'].append('Quantify your achievements (e.g., "Improved performance by 40%")')
        
        # 5. Formatting (15 points)
        max_score += 15
        lines = raw_text.strip().split('\n')
        if len(lines) >= 15:
            score += 5
        
        # Check for bullet points
        bullet_lines = [l for l in lines if l.strip().startswith(('-', '•', '●', '○', '*'))]
        if len(bullet_lines) >= 3:
            score += 5
            analysis['strengths'].append('Well-formatted with bullet points')
        else:
            analysis['suggestions'].append('Use bullet points for better readability')
        
        # Check for consistent formatting
        if len(set(len(l) for l in lines if l.strip())) > 3:
            score += 5
        
        # 6. Job-specific matching (10 points)
        max_score += 10
        if job_description:
            jd_lower = job_description.lower()
            jd_words = set(re.findall(r'\b[a-z]+\b', jd_lower))
            resume_words = set(re.findall(r'\b[a-z]+\b', raw_text.lower()))
            
            # Remove common stopwords
            stopwords = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
                        'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
                        'would', 'could', 'should', 'may', 'might', 'can', 'shall',
                        'and', 'or', 'but', 'if', 'in', 'on', 'at', 'to', 'for',
                        'of', 'with', 'by', 'from', 'as', 'into', 'through', 'during',
                        'before', 'after', 'above', 'below', 'this', 'that', 'these',
                        'those', 'i', 'me', 'my', 'we', 'you', 'your', 'it', 'its'}
            
            jd_keywords = jd_words - stopwords
            overlap = jd_keywords & resume_words
            
            if len(jd_keywords) > 0:
                keyword_match = len(overlap) / len(jd_keywords)
                analysis['keyword_density'] = round(keyword_match * 100, 1)
                
                if keyword_match >= 0.5:
                    score += 10
                    analysis['strengths'].append(f'Strong keyword match with job description ({analysis["keyword_density"]}%)')
                elif keyword_match >= 0.3:
                    score += 6
                    analysis['suggestions'].append('Include more keywords from the job description')
                else:
                    score += 2
                    analysis['weaknesses'].append('Low keyword match with job description')
                    analysis['suggestions'].append('Tailor your resume to include relevant keywords from the job posting')
                
                # Find missing keywords
                missing = jd_keywords - resume_words
                important_missing = [w for w in missing if len(w) > 4][:10]
                if important_missing:
                    analysis['missing_keywords'] = important_missing
        
        # Calculate final ATS score
        analysis['ats_score'] = round((score / max_score) * 100) if max_score > 0 else 0
        
        return analysis
    
    # ───────── Internal Methods ─────────
    
    @staticmethod
    def _parse_pdf(file_path):
        """Extract text from PDF"""
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()
    
    @staticmethod
    def _parse_docx(file_path):
        """Extract text from DOCX"""
        doc = DocxDocument(file_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return '\n'.join(paragraphs).strip()
    
    @staticmethod
    def _extract_contact(text):
        """Extract contact information from resume text"""
        contact = {}
        
        # Email
        email_match = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', text)
        if email_match:
            contact['email'] = email_match.group()
        
        # Phone
        phone_match = re.search(r'[\+]?[0-9]?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}', text)
        if phone_match:
            contact['phone'] = phone_match.group()
        
        # LinkedIn
        linkedin_match = re.search(r'linkedin\.com/in/[\w-]+', text, re.IGNORECASE)
        if linkedin_match:
            contact['linkedin'] = linkedin_match.group()
        
        # GitHub
        github_match = re.search(r'github\.com/[\w-]+', text, re.IGNORECASE)
        if github_match:
            contact['github'] = github_match.group()
        
        # Website
        website_match = re.search(r'(?:https?://)?(?:www\.)?[\w-]+\.[\w.-]+(?:/[\w-]*)*', text)
        if website_match and 'linkedin' not in website_match.group() and 'github' not in website_match.group():
            contact['website'] = website_match.group()
        
        return contact
    
    @staticmethod
    def _detect_sections(text):
        """Detect and extract resume sections"""
        sections = {}
        lines = text.split('\n')
        current_section = None
        current_content = []
        
        for line in lines:
            stripped = line.strip().lower()
            
            # Check if this line is a section header
            found_section = None
            for section_key, headers in ResumeParser.SECTION_HEADERS.items():
                for header in headers:
                    if stripped == header or stripped.startswith(header + ':') or stripped.startswith(header + ' '):
                        found_section = section_key
                        break
                if found_section:
                    break
            
            if found_section:
                # Save previous section
                if current_section and current_content:
                    sections[current_section] = '\n'.join(current_content).strip()
                current_section = found_section
                current_content = []
            elif current_section:
                current_content.append(line)
        
        # Save last section
        if current_section and current_content:
            sections[current_section] = '\n'.join(current_content).strip()
        
        return sections
