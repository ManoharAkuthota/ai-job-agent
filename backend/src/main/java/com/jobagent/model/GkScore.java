package com.jobagent.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "gk_scores")
public class GkScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId; // Nullable for guest/anonymous players

    @Column(nullable = false)
    private String userIdentifier; // Email or persistent UUID client identifier

    private String userName; // Display name e.g. "Manohar" or "Trivia Champ"

    private int score = 0; // Current session or accumulated score

    private int highestScore = 0; // All-time highest score

    private int streak = 0; // Current winning streak

    private int bestStreak = 0; // All-time best streak

    private int totalAnswered = 0; // Total questions attempted

    private int totalCorrect = 0; // Total questions answered correctly

    private String lastTopic;

    private String lastDifficulty;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public GkScore() {}

    public GkScore(String userIdentifier, String userName) {
        this.userIdentifier = userIdentifier;
        this.userName = userName;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserIdentifier() { return userIdentifier; }
    public void setUserIdentifier(String userIdentifier) { this.userIdentifier = userIdentifier; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public int getHighestScore() { return highestScore; }
    public void setHighestScore(int highestScore) { this.highestScore = highestScore; }

    public int getStreak() { return streak; }
    public void setStreak(int streak) { this.streak = streak; }

    public int getBestStreak() { return bestStreak; }
    public void setBestStreak(int bestStreak) { this.bestStreak = bestStreak; }

    public int getTotalAnswered() { return totalAnswered; }
    public void setTotalAnswered(int totalAnswered) { this.totalAnswered = totalAnswered; }

    public int getTotalCorrect() { return totalCorrect; }
    public void setTotalCorrect(int totalCorrect) { this.totalCorrect = totalCorrect; }

    public String getLastTopic() { return lastTopic; }
    public void setLastTopic(String lastTopic) { this.lastTopic = lastTopic; }

    public String getLastDifficulty() { return lastDifficulty; }
    public void setLastDifficulty(String lastDifficulty) { this.lastDifficulty = lastDifficulty; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
