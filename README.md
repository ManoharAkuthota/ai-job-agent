# AI Job Agent Application (React + Java Spring Boot + MySQL)

An autonomous AI agent application that automatically discovers domain-specific jobs every day, scores and matches candidate profiles, tailors ATS-compliant resumes, and tracks/automates job applications—built **100% free of cost**.

---

## Tech Stack

* **Frontend**: React 18 / Vite + Lucide Icons + Axios
* **Backend**: Java 21 / Spring Boot 3.3 (Spring Data JPA, Hibernate, REST Controllers)
* **Database**: MySQL 8 (`MySQL80` service)
* **AI Engine**: Google Gemini Free API (or built-in NLP keyword optimization fallback)
* **PDF Builder**: OpenPDF (clean, text-scannable, ATS single-column resumes)
* **Scheduler**: Spring `@Scheduled` (Daily at 09:00 AM IST)

---

## Project Structure

```
job portal application/
├── run-backend.bat         # 1-Click launcher for Spring Boot
├── run-frontend.bat        # 1-Click launcher for React
├── backend/                # Java Spring Boot 3 Backend
│   ├── src/main/java/com/jobagent/
│   │   ├── config/         # CORS configuration (allowing React on port 5173)
│   │   ├── controller/     # Job, Profile, Resume, Application, Agent REST endpoints
│   │   ├── model/          # JPA Entities (Job, UserProfile, TailoredResume, Application, AgentLog, Settings)
│   │   ├── repository/     # Spring Data JPA Repositories
│   │   ├── service/        # AI Agent, Job Discovery, Resume Generator, Daily Scheduler
│   │   └── JobAgentApplication.java
│   ├── src/main/resources/
│   │   └── application.properties # MySQL datasource & agent settings
│   ├── pom.xml
│   └── mvnw.cmd            # Self-contained Maven Wrapper
└── frontend/               # React + Vite Frontend
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.jsx       # Overview, agent KPIs, 1-click trigger, live logs
    │   │   ├── JobFeed.jsx         # Live jobs, match scores, filters, tailor & apply buttons
    │   │   ├── ProfileEditor.jsx   # Master candidate resume & skills
    │   │   ├── TailoredResumes.jsx # Customized resumes & ATS PDF downloads
    │   │   ├── Applications.jsx    # Application tracking pipeline
    │   │   └── AgentSettings.jsx   # Target domain, keywords, minimum match score slider
    │   ├── services/api.js         # API integration with backend
    │   ├── App.jsx                 # Sidebar layout & navigation
    │   └── index.css               # Clean modern design system
    ├── package.json
    └── vite.config.js
```

---

## Getting Started

### 1. Database Configuration (MySQL)

Open `backend/src/main/resources/application.properties` and verify your MySQL password:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/job_portal_agent?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=your_mysql_password
```

*(If your MySQL `root` user has password `root`, it will connect immediately without changes.)*

### 2. Start the Backend

Double click `run-backend.bat` or run:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```
*Backend runs on `http://localhost:8080` and auto-creates all database tables.*

### 3. Start the Frontend

Double click `run-frontend.bat` or run:

```powershell
cd frontend
npm run dev
```
*Frontend opens at `http://localhost:5173`.*

---

## How It Works Free of Cost

1. **Job Discovery**: Calls public, free job board APIs (Arbeitnow, Remotive) and checks keywords against your target domain.
2. **AI Resume Tailoring**:
   - Uses the **Google Gemini Free API** (up to 15 requests/min free via Google AI Studio).
   - If no API key is set, it uses the built-in smart **rule-based NLP tailoring engine** at \$0 cost.
3. **Daily Autonomous Scheduler**:
   - Spring Boot runs `@Scheduled(cron = "0 0 9 * * ?")` every morning at 09:00 AM to fetch new jobs and tailor resumes automatically.
   - You can also click **"Run AI Agent Now"** anytime from the React Dashboard.
