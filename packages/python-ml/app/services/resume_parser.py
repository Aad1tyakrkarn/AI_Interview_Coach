import base64
import io
import re
import tempfile
import os
from typing import Optional

import httpx
import spacy
from spacy.matcher import PhraseMatcher


# Expanded skills list (~200+) categorized
SKILLS_DB = {
    # Programming Languages
    "languages": [
        "python", "javascript", "typescript", "java", "c++", "c#", "c", "go", "golang",
        "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "perl",
        "haskell", "elixir", "clojure", "dart", "lua", "objective-c", "groovy",
        "visual basic", "assembly", "fortran", "cobol", "shell", "bash", "powershell",
    ],
    # Frontend
    "frontend": [
        "react", "react.js", "reactjs", "angular", "angularjs", "vue", "vue.js", "vuejs",
        "next.js", "nextjs", "nuxt.js", "nuxtjs", "svelte", "sveltekit", "gatsby",
        "html", "html5", "css", "css3", "sass", "scss", "less", "tailwind", "tailwindcss",
        "bootstrap", "material ui", "mui", "chakra ui", "ant design", "styled-components",
        "webpack", "vite", "rollup", "parcel", "babel", "eslint", "prettier",
        "jquery", "redux", "mobx", "zustand", "recoil", "pinia", "vuex",
        "storybook", "figma", "sketch", "adobe xd",
    ],
    # Backend
    "backend": [
        "node.js", "nodejs", "express", "express.js", "nestjs", "nest.js", "fastify",
        "django", "flask", "fastapi", "spring", "spring boot", "rails", "ruby on rails",
        "laravel", "symfony", "asp.net", ".net", ".net core", "gin", "echo", "fiber",
        "graphql", "rest", "restful", "rest api", "grpc", "soap", "websocket",
        "microservices", "serverless", "lambda",
        "socket.io", "jwt", "jwt authentication", "bcrypt", "sequelize", "sequelize orm",
        "rbac", "role-based access control", "postman",
    ],
    # Databases
    "databases": [
        "sql", "mysql", "postgresql", "postgres", "sqlite", "oracle", "sql server",
        "mongodb", "mongoose", "redis", "memcached", "cassandra", "couchdb", "couchbase",
        "dynamodb", "firestore", "firebase", "supabase", "elasticsearch", "opensearch",
        "neo4j", "influxdb", "timescaledb", "cockroachdb", "mariadb",
        "prisma", "sequelize", "typeorm", "sqlalchemy", "hibernate", "knex",
    ],
    # Cloud & DevOps
    "cloud_devops": [
        "aws", "amazon web services", "azure", "microsoft azure", "gcp", "google cloud",
        "docker", "kubernetes", "k8s", "terraform", "ansible", "puppet", "chef",
        "jenkins", "github actions", "gitlab ci", "circleci", "travis ci", "bitbucket pipelines",
        "ci/cd", "nginx", "apache", "caddy", "vercel", "netlify", "heroku",
        "cloudflare", "digitalocean", "linode", "vagrant",
        "linux", "ubuntu", "centos", "debian", "windows server",
        "prometheus", "grafana", "datadog", "new relic", "splunk", "elk stack",
        "cloudformation", "pulumi", "helm", "istio", "envoy",
    ],
    # AI/ML/Data
    "ai_ml_data": [
        "machine learning", "deep learning", "nlp", "natural language processing",
        "computer vision", "reinforcement learning", "generative ai", "llm",
        "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn", "xgboost", "lightgbm",
        "pandas", "numpy", "scipy", "matplotlib", "seaborn", "plotly",
        "jupyter", "anaconda", "conda", "hugging face", "transformers", "langchain",
        "opencv", "spacy", "nltk", "gensim", "spark", "pyspark", "hadoop",
        "tableau", "power bi", "looker", "dbt", "airflow", "kafka", "rabbitmq",
        "data engineering", "data science", "data analysis", "etl", "data pipeline",
    ],
    # Testing
    "testing": [
        "jest", "mocha", "chai", "jasmine", "cypress", "playwright", "selenium",
        "pytest", "unittest", "robot framework", "testng", "junit",
        "testing", "unit testing", "integration testing", "e2e testing", "tdd", "bdd",
        "postman", "insomnia", "swagger", "openapi",
    ],
    # Tools & Practices
    "tools": [
        "git", "github", "gitlab", "bitbucket", "svn",
        "jira", "confluence", "trello", "asana", "notion", "linear",
        "agile", "scrum", "kanban", "waterfall", "lean",
        "oauth", "saml", "sso", "ldap",
        "s3", "sqs", "sns", "ec2", "rds", "ecs", "eks", "fargate",
        "vs code", "visual studio code", "postman", "insomnia",
        "data structures", "algorithms", "oop", "dbms", "operating systems",
        "computer networks", "geojson",
    ],
    # Mobile
    "mobile": [
        "react native", "flutter", "ionic", "xamarin", "cordova",
        "android", "ios", "swift ui", "swiftui", "jetpack compose",
        "expo", "capacitor",
    ],
}

# Flatten all skills for matching
ALL_SKILLS = []
for category_skills in SKILLS_DB.values():
    ALL_SKILLS.extend(category_skills)

# Job title patterns for PhraseMatcher
JOB_TITLES = [
    "software engineer", "senior software engineer", "staff software engineer",
    "principal engineer", "software developer", "senior developer",
    "junior developer", "junior software engineer", "junior software developer",
    "junior engineer", "associate developer", "associate engineer",
    "associate software engineer", "associate software developer",
    "trainee engineer", "trainee developer",
    "frontend engineer", "frontend developer", "front-end developer", "front end developer",
    "backend engineer", "backend developer", "back-end developer", "back end developer",
    "full stack developer", "full-stack developer", "fullstack developer",
    "full stack engineer", "full-stack engineer", "fullstack engineer",
    "web developer", "web engineer", "application developer",
    "mobile developer", "android developer", "ios developer",
    "devops engineer", "site reliability engineer", "sre", "platform engineer",
    "cloud engineer", "cloud architect", "solutions architect",
    "data engineer", "data scientist", "data analyst", "business analyst",
    "machine learning engineer", "ml engineer", "ai engineer", "nlp engineer",
    "qa engineer", "test engineer", "quality assurance engineer", "sdet",
    "product manager", "project manager", "program manager", "scrum master",
    "technical lead", "tech lead", "engineering manager", "engineering director",
    "vp of engineering", "cto", "chief technology officer",
    "ui designer", "ux designer", "ui/ux designer", "product designer",
    "database administrator", "dba", "system administrator", "sysadmin",
    "security engineer", "cybersecurity analyst", "information security",
    "technical writer", "developer advocate", "developer relations",
    "intern", "software intern", "engineering intern", "research intern",
    "consultant", "technical consultant", "it consultant",
    "research engineer", "research scientist", "postdoctoral researcher",
    "lecturer", "professor", "teaching assistant",
]

# Degree keywords — only long/unambiguous ones for PhraseMatcher
# Short ones (ba, bs, ma, ms, be, me) are handled via regex with word boundaries
DEGREE_KEYWORDS_PHRASE = [
    "bachelor", "bachelors", "bachelor's",
    "master", "masters", "master's",
    "master of computer application", "master of computer applications",
    "bachelor of computer application", "bachelor of computer applications",
    "master of science", "master of arts", "master of technology",
    "bachelor of science", "bachelor of arts", "bachelor of technology", "bachelor of engineering",
    "doctor", "doctorate", "doctoral",
    "associate", "associates", "associate's",
    "diploma", "certificate", "certification",
    "senior secondary", "secondary",
]

# Regex pattern for short degree abbreviations (need word boundaries)
DEGREE_ABBREV_REGEX = re.compile(
    r"\b("
    r"Ph\.?D\.?|M\.?B\.?A\.?"
    r"|B\.S\.?|B\.A\.?|M\.S\.?|M\.A\.?"
    r"|B\.?Tech\.?|M\.?Tech\.?"
    r"|B\.?E\.?|M\.?E\.?"
    r"|B\.?Sc\.?|M\.?Sc\.?"
    r"|B\.?Com\.?|M\.?Com\.?"
    r"|B\.?C\.?A\.?|M\.?C\.?A\.?"
    r"|BCA|MCA|BBA|MBA"
    r")\b",
    re.IGNORECASE,
)

# Section header patterns
SECTION_HEADERS = {
    "experience": ["experience", "work experience", "employment", "work history",
                    "professional experience", "career history", "employment history"],
    "education": ["education", "academic background", "academic qualifications",
                  "educational background", "educational qualifications",
                  "qualifications", "academics"],
    "skills": ["skills", "technical skills", "core competencies", "technologies",
               "tools & technologies", "tools and technologies", "competencies",
               "expertise", "proficiencies"],
    "summary": ["summary", "objective", "about", "about me", "professional summary",
                "career objective", "career summary", "profile", "personal statement",
                "overview", "professional profile"],
    "projects": ["projects", "personal projects", "key projects", "academic projects",
                 "side projects", "notable projects", "relevant projects",
                 "major projects", "selected projects", "project experience",
                 "projects and publications", "projects & publications"],
    "certifications": ["certifications", "certificates", "licenses", "professional certifications"],
}


class ResumeParser:
    """Parses resume documents into structured data using spaCy NLP."""

    def __init__(self):
        self.nlp = spacy.load("en_core_web_trf")
        self._setup_matchers()

    def _setup_matchers(self):
        """Set up PhraseMatcher instances for skills, job titles, and degrees."""
        # Skills matcher
        self.skills_matcher = PhraseMatcher(self.nlp.vocab, attr="LOWER")
        skill_patterns = [self.nlp.make_doc(skill) for skill in ALL_SKILLS]
        self.skills_matcher.add("SKILL", skill_patterns)

        # Job title matcher
        self.title_matcher = PhraseMatcher(self.nlp.vocab, attr="LOWER")
        title_patterns = [self.nlp.make_doc(title) for title in JOB_TITLES]
        self.title_matcher.add("JOB_TITLE", title_patterns)

        # Degree matcher (only long unambiguous terms — short ones use regex)
        self.degree_matcher = PhraseMatcher(self.nlp.vocab, attr="LOWER")
        degree_patterns = [self.nlp.make_doc(deg) for deg in DEGREE_KEYWORDS_PHRASE]
        self.degree_matcher.add("DEGREE", degree_patterns)

    async def parse(self, file_url: str, file_type: str, file_content_base64: str | None = None) -> dict:
        """Parse a resume file and extract structured data."""
        if file_content_base64:
            content = base64.b64decode(file_content_base64)
        else:
            content = await self._download_file(file_url)

        # Extract text
        if file_type in ("pdf", "application/pdf"):
            text = self._extract_text_from_pdf(content)
        elif file_type in ("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"):
            text = self._extract_text_from_docx(content)
        else:
            text = content.decode("utf-8", errors="ignore")

        # Process with spaCy
        doc = self.nlp(text)
        sections = self._detect_sections(text)

        # Extract fields
        skills = self._extract_skills(doc)
        contact = self._extract_contact(text, doc)
        experience = self._extract_experience(text, doc, sections)
        education = self._extract_education(text, doc, sections)
        summary = self._extract_summary(text, doc, sections)

        return {
            "skills": skills,
            "experience": experience,
            "education": education,
            "contact": contact,
            "summary": summary,
            "raw_text": text[:5000],
        }

    async def _download_file(self, url: str) -> bytes:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.content

    def _extract_text_from_pdf(self, content: bytes) -> str:
        """Extract text using pdfplumber."""
        import pdfplumber
        pages_text = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                text = page.extract_text(
                    x_tolerance=2,
                    y_tolerance=2,
                )
                if text:
                    pages_text.append(text)
        return "\n".join(pages_text)

    def _extract_text_from_docx(self, content: bytes) -> str:
        try:
            import docx
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".docx")
            tmp.write(content)
            tmp.close()
            try:
                doc = docx.Document(tmp.name)
                return "\n".join(p.text for p in doc.paragraphs)
            finally:
                os.unlink(tmp.name)
        except ImportError:
            return "[python-docx not installed]"

    def _detect_sections(self, text: str) -> dict[str, str]:
        """Detect resume sections and return their text content."""
        lines = text.split("\n")
        section_order: list[tuple[int, str]] = []

        for i, line in enumerate(lines):
            clean = line.strip().lower().rstrip(":").strip()
            if not clean or len(clean) > 60:
                continue
            # Normalize whitespace
            clean = re.sub(r"\s+", " ", clean)
            for section_name, headers in SECTION_HEADERS.items():
                if clean in headers:
                    section_order.append((i, section_name))
                    break

        # Also check for "Technical Skills" as a skills section variant
        if not any(name == "skills" for _, name in section_order):
            for i, line in enumerate(lines):
                clean = line.strip().lower()
                if clean.startswith("technical skills") or clean.startswith("skills & tools"):
                    section_order.append((i, "skills"))
                    section_order.sort(key=lambda x: x[0])
                    break

        # Extract text for each section (from header to next header)
        result: dict[str, str] = {}
        for idx, (line_num, name) in enumerate(section_order):
            start = line_num + 1
            end = section_order[idx + 1][0] if idx + 1 < len(section_order) else len(lines)
            result[name] = "\n".join(lines[start:end]).strip()

        return result

    def _extract_skills(self, doc) -> list[str]:
        """Extract skills using PhraseMatcher with deduplication."""
        # Abbreviation → full form mapping for dedup
        DEDUP = {
            "nlp": "natural language processing",
            "ml": "machine learning",
            "dl": "deep learning",
            "ai": "artificial intelligence",
            "js": "javascript",
            "ts": "typescript",
            "k8s": "kubernetes",
        }

        matches = self.skills_matcher(doc)
        found = set()
        for match_id, start, end in matches:
            skill = doc[start:end].text.lower()
            normalized = skill.replace("reactjs", "react").replace("vuejs", "vue")
            found.add(normalized)

        # Deduplicate: if full form exists, remove abbreviation
        to_remove = set()
        for abbr, full in DEDUP.items():
            if abbr in found and full in found:
                to_remove.add(abbr)
        found -= to_remove

        return sorted(found)

    def _extract_contact(self, text: str, doc) -> dict:
        """Extract contact info using regex + spaCy NER."""
        # Regex for structured patterns (best approach for these)
        email_match = re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", text)
        phone_match = re.search(r"[\+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}", text)
        linkedin_match = re.search(r"linkedin\.com/in/[\w-]+", text, re.IGNORECASE)
        github_match = re.search(r"github\.com/[\w-]+", text, re.IGNORECASE)
        portfolio_match = re.search(r"(?:portfolio|website|site)\s*[:\-]?\s*(https?://\S+)", text, re.IGNORECASE)

        # spaCy NER for name (first PERSON entity, single line only)
        name = None
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                # Take only first line of the entity (avoid multi-line captures)
                candidate = ent.text.strip().split("\n")[0].strip()
                # Must look like a name (2+ words, no special chars)
                if candidate and len(candidate.split()) >= 2 and not re.search(r"[@\d]", candidate):
                    name = candidate
                    break

        # Fallback: first non-empty line if no PERSON entity found
        if not name:
            for line in text.split("\n"):
                line = line.strip()
                if line and len(line) < 50 and not re.search(r"[@\d]", line):
                    name = line
                    break

        # Location via spaCy GPE entity
        location = None
        for ent in doc.ents:
            if ent.label_ == "GPE":
                location = ent.text.strip()
                break

        return {
            "name": name,
            "email": email_match.group(0) if email_match else None,
            "phone": phone_match.group(0).strip() if phone_match else None,
            "linkedin": linkedin_match.group(0) if linkedin_match else None,
            "location": location,
        }

    def _extract_experience(self, text: str, doc, sections: dict) -> list[dict]:
        """Extract work experience AND projects.

        If both sections exist in the resume, parse both and combine. Work
        experience entries come first, then projects. Each project is tagged
        with kind=\"project\" so downstream consumers can distinguish them.
        """
        experience_text = sections.get("experience", "").strip()
        projects_text = sections.get("projects", "").strip()

        experiences: list[dict] = []

        # 1. Parse the "experience" section (Title → Company | Date → bullets)
        if experience_text:
            exp_items = self._parse_experience_lines(
                experience_text.split("\n"), experience_text
            )
            for item in exp_items:
                item.setdefault("kind", "experience")
            experiences.extend(exp_items)

        # 2. Parse the "projects" section (ProjectName → tech line → bullets)
        if projects_text:
            proj_lines = projects_text.split("\n")
            proj_items = self._parse_projects(proj_lines)
            # If the strict bullets-based parser missed everything, try the
            # simpler blank-line-grouped parser. As a last resort, try the
            # experience-style (title matcher) parser.
            if not proj_items:
                proj_items = self._parse_projects_simple(proj_lines)
            if not proj_items:
                proj_items = self._parse_experience_lines(proj_lines, projects_text)
            for item in proj_items:
                item.setdefault("kind", "project")
                if not item.get("title"):
                    item["title"] = "Project"
            experiences.extend(proj_items)

        # 3. Nothing extracted from labelled sections → scan the whole text
        if not experiences:
            full_items = self._parse_experience_lines(text.split("\n"), text)
            if full_items:
                for item in full_items:
                    item.setdefault("kind", "experience")
                experiences.extend(full_items)
            else:
                fb = self._fallback_experience(text)
                for item in fb:
                    item.setdefault("kind", "experience")
                experiences.extend(fb)

        return experiences[:20]

    def _parse_projects(self, lines: list[str]) -> list[dict]:
        """Parse project-style entries (ProjectName followed by tech stack and bullets)."""
        BULLET_CHARS = ("•", "-", "–", "—", "▪", "◦", "►", "\u2022", "\ufffd")
        TECH_PREFIXES = ("tech used:", "tech stack:", "technologies:", "built with:")

        def is_bullet(line: str) -> bool:
            s = line.strip()
            return s.startswith(BULLET_CHARS)

        def is_stray_bullet(line: str) -> bool:
            """Single bullet character with no text."""
            s = line.strip()
            return len(s) <= 2 and any(s.startswith(c) for c in BULLET_CHARS)

        def is_tech_line(line: str) -> bool:
            low = line.lower().strip()
            return any(low.startswith(p) for p in TECH_PREFIXES) or ("|" in line and len(line.split("|")) >= 3)

        def is_continuation(line: str) -> bool:
            """Wrapped text from previous bullet — starts lowercase or is a short fragment."""
            s = line.strip()
            if not s or len(s) < 3:
                return False
            # Starts with lowercase letter → continuation
            if s[0].islower():
                return True
            # Short fragment ending with period → continuation
            if len(s) < 50 and s.endswith(".") and not is_tech_line(s):
                return True
            return False

        # First pass: identify project header line indices
        # A project header is a non-bullet, non-tech, non-continuation line
        # that is followed (within next few lines) by bullets
        project_headers = []
        for i, line in enumerate(lines):
            s = line.strip()
            if not s or is_bullet(s) or is_stray_bullet(s) or is_tech_line(s) or is_continuation(s):
                continue
            # Check if bullets exist within next 4 lines
            has_bullets_nearby = False
            for k in range(i + 1, min(i + 5, len(lines))):
                if lines[k].strip() and is_bullet(lines[k].strip()) and not is_stray_bullet(lines[k].strip()):
                    has_bullets_nearby = True
                    break
            if has_bullets_nearby:
                project_headers.append(i)

        # Second pass: extract each project
        projects = []
        for idx, header_i in enumerate(project_headers):
            project_name = re.sub(r"\s*(View Code|Live Demo|GitHub|Demo|Link).*$", "", lines[header_i].strip(), flags=re.IGNORECASE).strip()

            # Find tech line and bullets between this header and next header
            next_header_i = project_headers[idx + 1] if idx + 1 < len(project_headers) else len(lines)
            tech_line = ""
            highlights = []

            for j in range(header_i + 1, next_header_i):
                s = lines[j].strip()
                if not s or is_stray_bullet(s):
                    continue
                if is_tech_line(s) and not tech_line:
                    tech_line = s
                elif is_bullet(s):
                    clean = s.lstrip("•-–—▪◦►\ufffd ").strip()
                    if clean:
                        highlights.append(clean)
                elif highlights and is_continuation(s):
                    highlights[-1] = highlights[-1] + " " + s
                # Non-bullet, non-continuation, non-tech → skip (stray text)

            if highlights:
                projects.append({
                    "company": project_name,
                    "title": "Project",
                    "start_date": None,
                    "end_date": None,
                    "description": tech_line[:300] if tech_line else None,
                    "highlights": highlights[:6],
                })

        return projects

    def _parse_projects_simple(self, lines: list[str]) -> list[dict]:
        """Last-resort project parser — split the section into blank-line groups.

        For each non-empty paragraph:
          • the first non-bullet line is the project name
          • remaining bullet lines become highlights
          • remaining non-bullet lines become the description

        Handles projects that have no tech-stack line and/or only a couple of
        bullets — a format the stricter _parse_projects misses.
        """
        BULLET_CHARS = ("•", "-", "–", "—", "▪", "◦", "►", "\u2022", "\ufffd")

        def is_bullet(s: str) -> bool:
            return s.startswith(BULLET_CHARS)

        # Group by blank lines
        groups: list[list[str]] = []
        current: list[str] = []
        for raw in lines:
            s = raw.strip()
            if not s:
                if current:
                    groups.append(current)
                    current = []
            else:
                current.append(s)
        if current:
            groups.append(current)

        projects: list[dict] = []
        for grp in groups:
            # Find first non-bullet line as project name
            name = None
            name_idx = -1
            for i, line in enumerate(grp):
                if not is_bullet(line) and len(line) <= 120:
                    name = re.sub(
                        r"\s*(View Code|Live Demo|GitHub|Demo|Link).*$",
                        "",
                        line,
                        flags=re.IGNORECASE,
                    ).strip()
                    name_idx = i
                    break
            if not name:
                continue

            highlights = []
            description_parts = []
            for line in grp[name_idx + 1:]:
                if is_bullet(line):
                    clean = line.lstrip("•-–—▪◦►\ufffd ").strip()
                    if clean:
                        highlights.append(clean)
                else:
                    description_parts.append(line)

            if not highlights and not description_parts:
                continue  # just a lone name — skip

            projects.append({
                "company": name,
                "title": "Project",
                "start_date": None,
                "end_date": None,
                "description": (" ".join(description_parts))[:300] or None,
                "highlights": highlights[:6],
            })

        return projects

    def _parse_experience_lines(self, lines: list[str], section_text: str) -> list[dict]:
        """Parse standard experience format (Title -> Company | Date -> bullets)."""
        section_doc = self.nlp(section_text)
        experiences = []

        # Find all line indices that contain a job title (via PhraseMatcher)
        title_line_indices = []
        for i, line in enumerate(lines):
            stripped = line.strip()
            if not stripped or len(stripped) > 120 or stripped.startswith(("•", "-")):
                continue
            line_doc = self.nlp(stripped)
            matches = self.title_matcher(line_doc)
            if matches:
                best = max(matches, key=lambda m: m[2] - m[1])
                title_text = line_doc[best[1]:best[2]].text
                title_line_indices.append((i, title_text, stripped))

        # Deduplicate adjacent titles
        filtered_titles = []
        skip = set()
        for idx, (line_i, title, full_line) in enumerate(title_line_indices):
            if line_i in skip:
                continue
            if idx + 1 < len(title_line_indices):
                next_line_i = title_line_indices[idx + 1][0]
                if abs(next_line_i - line_i) <= 1:
                    if len(title_line_indices[idx + 1][1]) > len(title):
                        skip.add(line_i)
                        continue
                    else:
                        skip.add(next_line_i)
            filtered_titles.append((line_i, title, full_line))

        for idx, (line_i, title, full_line) in enumerate(filtered_titles):
            company = ""
            date_str = None
            company_line_i = line_i + 1
            if company_line_i < len(lines):
                company_line = lines[company_line_i].strip()
                pipe_match = re.match(r"^(.+?)\s*\|\s*(.+)$", company_line)
                if pipe_match:
                    company = pipe_match.group(1).strip()
                    date_str = pipe_match.group(2).strip()
                elif company_line and not company_line.startswith(("-", "•", "–")):
                    company = company_line

            if not company:
                title_char_pos = sum(len(lines[j]) + 1 for j in range(line_i))
                for ent in section_doc.ents:
                    if ent.label_ == "ORG" and abs(ent.start_char - title_char_pos) < 200:
                        company = ent.text
                        break

            next_title_line = filtered_titles[idx + 1][0] if idx + 1 < len(filtered_titles) else len(lines)
            start_line = company_line_i + 1 if company else line_i + 1
            description_lines = []
            for j in range(start_line, min(next_title_line, len(lines))):
                stripped = lines[j].strip()
                if stripped:
                    description_lines.append(stripped)

            highlights = [l.lstrip("•-–—▪◦► ").strip() for l in description_lines
                         if l.startswith(("•", "-", "–", "—", "▪", "◦", "►"))]
            non_bullet = [l for l in description_lines if not l.startswith(("•", "-", "–", "—"))]
            description = " ".join(non_bullet[:2])

            experiences.append({
                "company": company,
                "title": title,
                "start_date": date_str,
                "end_date": None,
                "description": description[:300] if description else None,
                "highlights": highlights[:6],
            })

        return experiences

    def _fallback_experience(self, text: str) -> list[dict]:
        """Fallback regex-based experience extraction."""
        experiences = []
        title_pattern = re.compile(
            r"\b(engineer|developer|manager|analyst|designer|architect|scientist|lead|director|intern|consultant)\b",
            re.IGNORECASE,
        )
        all_lines = text.split("\n")
        for i, line in enumerate(all_lines):
            line = line.strip()
            if title_pattern.search(line) and len(line) < 100 and not line.startswith(("•", "-")):
                company = all_lines[i - 1].strip() if i > 0 else ""
                desc = all_lines[i + 1].strip() if i + 1 < len(all_lines) else ""
                experiences.append({
                    "company": company,
                    "title": line,
                    "description": desc,
                    "highlights": [],
                })
        return experiences

    def _extract_education(self, text: str, doc, sections: dict) -> list[dict]:
        """Extract education using section-based line parsing."""
        section_text = sections.get("education", "")
        if not section_text:
            return []

        education = []
        lines = section_text.split("\n")

        # GPA/CGPA/percentage pattern
        grade_pattern = re.compile(
            r"(?:gpa|cgpa)\s*[:\-—]?\s*(\d+\.?\d*)\s*(?:/\s*(\d+\.?\d*))?"
            r"|(\d+\.?\d*)\s*%"
            r"|(\d+\.?\d*)\s*(?:cgpa|gpa)",
            re.IGNORECASE,
        )

        # Year pattern
        year_pattern = re.compile(r"((?:19|20)\d{2})")

        # Parse education section line by line
        # Format patterns:
        #   1. "Institution Name | Type"  (e.g., "Tezpur University | Central University")
        #   2. "Degree Name — Grade"      (e.g., "Master of Computer Application — 7.76 CGPA")
        #   3. "School Name | Board"      (e.g., "Holy Kids International School | CBSE")
        #   4. "Level (12th/10th) — Grade" (e.g., "Senior Secondary (12th- Science, PCM)— 61.20%")

        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if not line:
                i += 1
                continue

            # Check if this line has a degree keyword (PhraseMatcher or regex)
            has_degree = False
            degree_text = ""
            field_of_study = None

            # Check PhraseMatcher
            line_doc = self.nlp(line)
            degree_matches = self.degree_matcher(line_doc)
            if degree_matches:
                best = max(degree_matches, key=lambda m: m[2] - m[1])
                degree_text = line_doc[best[1]:best[2]].text
                has_degree = True

            # Check regex for short abbreviations
            if not has_degree:
                abbrev_match = DEGREE_ABBREV_REGEX.search(line)
                if abbrev_match:
                    degree_text = abbrev_match.group(1)
                    has_degree = True

            if has_degree:
                # Extract full degree name (everything before — or | or grade)
                full_degree = re.split(r"\s*[—\-–|]\s*\d", line)[0].strip()
                if len(full_degree) > len(degree_text) and len(full_degree) < 80:
                    degree_text = full_degree

                # Extract field of study
                field_match = re.search(
                    r"(?:of|in)\s+([A-Za-z\s&]+?)(?:\s*[—\-–|]|\s*\d|\s*$)",
                    line, re.IGNORECASE,
                )
                if field_match:
                    field_of_study = field_match.group(1).strip()[:50]

                # Look for institution on previous line
                institution = ""
                if i > 0:
                    prev_line = lines[i - 1].strip()
                    if prev_line and not grade_pattern.search(prev_line):
                        # Remove type annotation like "| Central University", "| CBSE"
                        institution = re.split(r"\s*\|", prev_line)[0].strip()

                # Extract grade from same line
                gpa = None
                percentage = None
                grade_match = grade_pattern.search(line)
                if grade_match:
                    if grade_match.group(1):  # "CGPA: X.XX" or "X.XX/10"
                        gpa = float(grade_match.group(1))
                    elif grade_match.group(3):  # "XX.XX%"
                        percentage = float(grade_match.group(3))
                    elif grade_match.group(4):  # "X.XX CGPA"
                        gpa = float(grade_match.group(4))

                # Extract year from nearby lines (check next 2-3 lines)
                end_year = None
                for offset in range(1, 4):
                    if i + offset < len(lines):
                        yr_match = year_pattern.search(lines[i + offset])
                        if yr_match:
                            end_year = int(yr_match.group(1))
                            break
                # Also check previous lines
                if not end_year and i > 0:
                    for offset in range(0, 3):
                        check_i = i - offset
                        if check_i >= 0:
                            yr_match = year_pattern.search(lines[check_i])
                            if yr_match:
                                end_year = int(yr_match.group(1))
                                break

                education.append({
                    "degree": degree_text,
                    "field_of_study": field_of_study,
                    "institution": institution,
                    "end_year": end_year,
                    "gpa": gpa,
                    "percentage": percentage,
                })

            i += 1

        return education[:5]

    def _extract_summary(self, text: str, doc, sections: dict) -> str:
        """Extract summary using section detection + spaCy sentence segmentation."""
        # Check for dedicated summary section
        if "summary" in sections and sections["summary"]:
            summary_text = sections["summary"]
            summary_doc = self.nlp(summary_text)
            # Return first 3-5 sentences
            sentences = list(summary_doc.sents)
            return " ".join(sent.text.strip() for sent in sentences[:5])[:500]

        # Fallback: extract first 3-5 meaningful sentences from the document
        sentences = list(doc.sents)
        meaningful = []
        for sent in sentences:
            text_stripped = sent.text.strip()
            # Skip very short lines, headers, contact info
            if len(text_stripped) < 20:
                continue
            if re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", text_stripped):
                continue
            if re.search(r"linkedin\.com|github\.com", text_stripped, re.IGNORECASE):
                continue
            meaningful.append(text_stripped)
            if len(meaningful) >= 3:
                break

        return " ".join(meaningful)[:500] if meaningful else text[:300].strip()
