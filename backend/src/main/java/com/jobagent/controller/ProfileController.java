package com.jobagent.controller;

import com.jobagent.model.UserProfile;
import com.jobagent.repository.UserProfileRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserProfileRepository profileRepository;
    private final com.jobagent.service.ResumeParserService resumeParserService;

    public ProfileController(UserProfileRepository profileRepository,
                             com.jobagent.service.ResumeParserService resumeParserService) {
        this.profileRepository = profileRepository;
        this.resumeParserService = resumeParserService;
    }

    @GetMapping
    public ResponseEntity<UserProfile> getProfile() {
        return profileRepository.findAll().stream().findFirst()
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    UserProfile p = new UserProfile();
                    p.setFullName("AKUTHOTA MANOHAR");
                    p.setEmail("manoharsriakuthota@gmail.com");
                    p.setPhone("8096870549");
                    p.setLocation("Ahmedabad, India");
                    p.setLinkedinUrl("https://linkedin.com/in/manoharsriakuthota");
                    p.setGithubUrl("https://github.com/ManoharAkuthota");
                    p.setTargetDomain("Java Full Stack Developer");
                    p.setSummary("Computer Science (AI) graduate and Java developer with hands-on experience building backend microservices for a production CPaaS (Communications Platform as a Service) using Spring Boot, Spring Security, JWT, and Apache Kafka. Combines strong full-stack fundamentals (Java, JavaScript, React, Angular) with practical experience across content strategy and web development. Proven ability to design secure, scalable systems and deliver responsive, user-friendly applications.");
                    p.setSkills("Java, Spring Boot, Spring Security, JWT, Microservices, Apache Kafka, React, Angular, Node.js, Express, MySQL, MongoDB, GitHub, REST APIs, Postman, JavaScript, Python, HTML, CSS, DSA");
                    p.setExperience("Junior Java Developer | Keyanna Technologies, Ahmedabad (Jan 2026 - Present)\n- Built and maintained backend microservices for the company's CPaaS (Communications Platform as a Service) product using Spring Boot and a microservices architecture.\n- Implemented secure authentication and authorization flows with Spring Security and JWT-based token management.\n- Integrated Apache Kafka for real-time, event-driven messaging between services, improving reliability of communication workflows.\n- Worked across relational databases to support core CPaaS features, collaborating with the engineering team on API design and deployment.\n\nContent Writer | Parul University, Vadodara (Apr 2025 - Dec 2025)\n- Created, edited, and oversaw academic and technical content for the CDOE department, ensuring accuracy and alignment with institutional policy.\n\nWeb Developer Intern | Talent Lad, Vijayawada (Feb 2025 - May 2025)\n- Designed and developed responsive, mobile-friendly web pages using HTML, CSS, and JavaScript.\n- Assisted in building and maintaining interactive websites, collaborating with the team to meet project requirements.");
                    p.setEducation("Bachelor of Technology - Computer Science (Artificial Intelligence) | Parul University, Vadodara (2022 - 2026) -- CGPA: 8.26/10\nClass XII | Sri Vidwan Junior College, Warangal, Telangana (2020 - 2022) -- Score: 96.4%\nClass X | Vidyodaya High School, Nekkonda, Warangal, Telangana (2019 - 2020) -- GPA: 10/10");
                    p.setProjects("Banking Management System | Personal Project (Jan 2026)\n- Built a full-stack banking application with a Spring Boot (Java) backend, MySQL database, and Angular frontend.\n- Implemented core banking features including account management, fund transfers, and transaction history with secure, validated REST APIs.\n- Designed the relational schema in MySQL to maintain data integrity across accounts and transactions.\n\nOnline Voting System | Personal Project (Sep 2025)\n- Designed and developed a secure, efficient digital voting platform with user authentication, vote casting, and result management.\n- Used HTML, CSS, JavaScript, and backend integration to ensure data accuracy and system reliability.");
                    return ResponseEntity.ok(profileRepository.save(p));
                });
    }

    @PostMapping
    public ResponseEntity<UserProfile> saveProfile(@RequestBody UserProfile profile) {
        UserProfile existing = profileRepository.findAll().stream().findFirst().orElse(null);
        if (existing != null) {
            profile.setId(existing.getId());
        }
        UserProfile saved = profileRepository.save(profile);
        return ResponseEntity.ok(saved);
    }

    @PostMapping(value = "/upload-resume", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadResume(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            com.jobagent.service.ResumeParserService.ResumeParseResult result = resumeParserService.parseAndMatch(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage() != null ? e.getMessage() : "Error parsing resume"));
        }
    }
}
