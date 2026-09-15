package com.jobagent.config;

import com.jobagent.model.AgentSettings;
import com.jobagent.model.UserProfile;
import com.jobagent.repository.AgentSettingsRepository;
import com.jobagent.repository.UserProfileRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer implements CommandLineRunner {

    private final UserProfileRepository profileRepository;
    private final AgentSettingsRepository settingsRepository;

    public DataInitializer(UserProfileRepository profileRepository,
                           AgentSettingsRepository settingsRepository) {
        this.profileRepository = profileRepository;
        this.settingsRepository = settingsRepository;
    }

    @Override
    public void run(String... args) {
        UserProfile profile = profileRepository.findAll().stream().findFirst().orElse(new UserProfile());
        profile.setFullName("AKUTHOTA MANOHAR");
        profile.setEmail("manoharsriakuthota@gmail.com");
        profile.setPhone("8096870549");
        profile.setLocation("Ahmedabad, India");
        profile.setLinkedinUrl("https://linkedin.com/in/manoharsriakuthota");
        profile.setGithubUrl("https://github.com/ManoharAkuthota");
        profile.setTargetDomain("Java Full Stack Developer");
        profile.setSummary("Computer Science (AI) graduate and Java developer with hands-on experience building backend microservices for a production CPaaS (Communications Platform as a Service) using Spring Boot, Spring Security, JWT, and Apache Kafka. Combines strong full-stack fundamentals (Java, JavaScript, React, Angular) with practical experience across content strategy and web development. Proven ability to design secure, scalable systems and deliver responsive, user-friendly applications.");
        profile.setSkills("Java, Spring Boot, Spring Security, JWT, Microservices, Apache Kafka, React, Angular, Node.js, Express, MySQL, MongoDB, GitHub, REST APIs, Postman, JavaScript, Python, HTML, CSS, DSA");
        profile.setExperience("Junior Java Developer | Keyanna Technologies, Ahmedabad (Jan 2026 - Present)\n" +
                "- Built and maintained backend microservices for the company's CPaaS (Communications Platform as a Service) product using Spring Boot and a microservices architecture.\n" +
                "- Implemented secure authentication and authorization flows with Spring Security and JWT-based token management.\n" +
                "- Integrated Apache Kafka for real-time, event-driven messaging between services, improving reliability of communication workflows.\n" +
                "- Worked across relational databases to support core CPaaS features, collaborating with the engineering team on API design and deployment.\n\n" +
                "Content Writer | Parul University, Vadodara (Apr 2025 - Dec 2025)\n" +
                "- Created, edited, and oversaw academic and technical content for the CDOE department, ensuring accuracy and alignment with institutional policy.\n\n" +
                "Web Developer Intern | Talent Lad, Vijayawada (Feb 2025 - May 2025)\n" +
                "- Designed and developed responsive, mobile-friendly web pages using HTML, CSS, and JavaScript.\n" +
                "- Assisted in building and maintaining interactive websites, collaborating with the team to meet project requirements.");
        profile.setEducation("Bachelor of Technology - Computer Science (Artificial Intelligence) | Parul University, Vadodara (2022 - 2026) -- CGPA: 8.26/10\n" +
                "Class XII | Sri Vidwan Junior College, Warangal, Telangana (2020 - 2022) -- Score: 96.4%\n" +
                "Class X | Vidyodaya High School, Nekkonda, Warangal, Telangana (2019 - 2020) -- GPA: 10/10");
        profile.setProjects("Banking Management System | Personal Project (Jan 2026)\n" +
                "- Built a full-stack banking application with a Spring Boot (Java) backend, MySQL database, and Angular frontend.\n" +
                "- Implemented core banking features including account management, fund transfers, and transaction history with secure, validated REST APIs.\n" +
                "- Designed the relational schema in MySQL to maintain data integrity across accounts and transactions.\n\n" +
                "Online Voting System | Personal Project (Sep 2025)\n" +
                "- Designed and developed a secure, efficient digital voting platform with user authentication, vote casting, and result management.\n" +
                "- Used HTML, CSS, JavaScript, and backend integration to ensure data accuracy and system reliability.");
        profileRepository.save(profile);

        if (settingsRepository.count() == 0) {
            AgentSettings settings = new AgentSettings();
            settings.setId(1L);
            settings.setTargetDomain("Java Full Stack Developer");
            settings.setTargetKeywords("Java, Spring Boot, React, Microservices, MySQL, REST API");
            settings.setPreferredLocation("Remote, India, Hybrid");
            settings.setMinMatchScore(60);
            settings.setAutoApplyEnabled(false);
            settingsRepository.save(settings);
        }
    }
}