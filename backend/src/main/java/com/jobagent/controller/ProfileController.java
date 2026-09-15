package com.jobagent.controller;

import com.jobagent.model.UserProfile;
import com.jobagent.repository.UserProfileRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserProfileRepository profileRepository;

    public ProfileController(UserProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @GetMapping
    public ResponseEntity<UserProfile> getProfile() {
        return profileRepository.findAll().stream().findFirst()
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    UserProfile p = new UserProfile();
                    p.setFullName("Akuthota Candidate");
                    p.setEmail("candidate@example.com");
                    p.setPhone("+91 9876543210");
                    p.setLocation("India");
                    p.setTargetDomain("Java Full Stack");
                    p.setSummary("Software Engineer specialized in Java, Spring Boot, React, and MySQL. Experienced in microservices, REST APIs, and responsive front-end interfaces.");
                    p.setSkills("Java, Spring Boot, React, JavaScript, MySQL, JPA, REST APIs, Docker, Git");
                    p.setExperience("• Engineered full-stack web applications with Spring Boot and React.\n• Designed and normalized MySQL relational databases.\n• Integrated third-party APIs and automated build pipelines.");
                    p.setEducation("Bachelor of Technology in Computer Science");
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
}
