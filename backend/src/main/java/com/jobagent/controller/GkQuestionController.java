package com.jobagent.controller;

import com.jobagent.config.JwtUtil;
import com.jobagent.model.GkQuestion;
import com.jobagent.model.GkScore;
import com.jobagent.repository.GkScoreRepository;
import com.jobagent.service.GkQuestionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gk")
public class GkQuestionController {

    private static final Logger log = LoggerFactory.getLogger(GkQuestionController.class);
    private final GkQuestionService gkQuestionService;

    @Autowired(required = false)
    private GkScoreRepository gkScoreRepository;

    @Autowired(required = false)
    private JwtUtil jwtUtil;

    public GkQuestionController(GkQuestionService gkQuestionService) {
        this.gkQuestionService = gkQuestionService;
    }

    public GkQuestionController(GkQuestionService gkQuestionService, GkScoreRepository gkScoreRepository) {
        this.gkQuestionService = gkQuestionService;
        this.gkScoreRepository = gkScoreRepository;
    }

    @GetMapping("/topics")
    public ResponseEntity<?> getTopics() {
        try {
            return ResponseEntity.ok(gkQuestionService.getTopics());
        } catch (Throwable t) {
            log.error("Failed to retrieve GK topics: {}", t.getMessage(), t);
            return ResponseEntity.status(500).body(Map.of(
                    "error", t.getMessage() != null ? t.getMessage() : "Error retrieving topics",
                    "type", t.getClass().getSimpleName()
            ));
        }
    }

    public ResponseEntity<?> getNextQuestion(String topic, String difficulty) {
        return getNextQuestion(topic, difficulty, null);
    }

    @GetMapping("/next")
    public ResponseEntity<?> getNextQuestion(@RequestParam(required = false, defaultValue = "ALL") String topic,
                                            @RequestParam(required = false, defaultValue = "MEDIUM") String difficulty,
                                            @RequestParam(required = false) String exclude) {
        try {
            GkQuestion question = gkQuestionService.getNextQuestion(topic, difficulty, exclude);
            return ResponseEntity.ok(question);
        } catch (Throwable t) {
            log.error("Failed to retrieve next GK question: {}", t.getMessage(), t);
            return ResponseEntity.status(500).body(Map.of(
                    "error", t.getMessage() != null ? t.getMessage() : "Error retrieving question",
                    "type", t.getClass().getSimpleName()
            ));
        }
    }

    @PostMapping("/score")
    public ResponseEntity<?> saveScore(@RequestBody Map<String, Object> payload,
                                       @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (gkScoreRepository == null) {
            return ResponseEntity.ok(Map.of("message", "Score acknowledged (in-memory mode)"));
        }
        try {
            Long userId = null;
            String userEmail = null;
            String userName = null;

            if (authHeader != null && authHeader.startsWith("Bearer ") && jwtUtil != null) {
                String token = authHeader.substring(7).trim();
                if (jwtUtil.validateToken(token)) {
                    userId = jwtUtil.extractUserId(token);
                    userEmail = jwtUtil.extractEmail(token);
                    userName = jwtUtil.extractFullName(token);
                }
            }

            // Fallbacks from payload if not authenticated
            String payloadIdentifier = (String) payload.get("userIdentifier");
            String payloadName = (String) payload.get("userName");

            String effectiveIdentifier = (userEmail != null && !userEmail.isBlank())
                    ? userEmail
                    : (payloadIdentifier != null && !payloadIdentifier.isBlank())
                    ? payloadIdentifier
                    : "guest_player";

            String effectiveName = (userName != null && !userName.isBlank())
                    ? userName
                    : (payloadName != null && !payloadName.isBlank())
                    ? payloadName
                    : "Trivia Player";

            int newScore = payload.get("score") instanceof Number n ? n.intValue() : 0;
            int currentStreak = payload.get("streak") instanceof Number n ? n.intValue() : 0;
            int bestStreak = payload.get("bestStreak") instanceof Number n ? n.intValue() : currentStreak;
            int totalAnswered = payload.get("totalAnswered") instanceof Number n ? n.intValue() : 0;
            int totalCorrect = payload.get("totalCorrect") instanceof Number n ? n.intValue() : 0;
            String lastTopic = (String) payload.get("lastTopic");
            String lastDifficulty = (String) payload.get("lastDifficulty");

            GkScore scoreRecord = null;
            if (userId != null) {
                scoreRecord = gkScoreRepository.findByUserId(userId).orElse(null);
            }
            if (scoreRecord == null) {
                scoreRecord = gkScoreRepository.findByUserIdentifier(effectiveIdentifier).orElse(null);
            }

            if (scoreRecord == null) {
                scoreRecord = new GkScore();
                scoreRecord.setUserId(userId);
                scoreRecord.setUserIdentifier(effectiveIdentifier);
                scoreRecord.setUserName(effectiveName);
                scoreRecord.setScore(newScore);
                scoreRecord.setHighestScore(newScore);
                scoreRecord.setStreak(currentStreak);
                scoreRecord.setBestStreak(bestStreak);
                scoreRecord.setTotalAnswered(totalAnswered);
                scoreRecord.setTotalCorrect(totalCorrect);
            } else {
                if (userId != null && scoreRecord.getUserId() == null) {
                    scoreRecord.setUserId(userId);
                }
                if (effectiveName != null && !effectiveName.isBlank()) {
                    scoreRecord.setUserName(effectiveName);
                }
                scoreRecord.setScore(newScore);
                scoreRecord.setHighestScore(Math.max(scoreRecord.getHighestScore(), newScore));
                scoreRecord.setStreak(currentStreak);
                scoreRecord.setBestStreak(Math.max(scoreRecord.getBestStreak(), bestStreak));
                scoreRecord.setTotalAnswered(Math.max(scoreRecord.getTotalAnswered(), totalAnswered));
                scoreRecord.setTotalCorrect(Math.max(scoreRecord.getTotalCorrect(), totalCorrect));
            }

            if (lastTopic != null) scoreRecord.setLastTopic(lastTopic);
            if (lastDifficulty != null) scoreRecord.setLastDifficulty(lastDifficulty);

            GkScore saved = gkScoreRepository.save(scoreRecord);
            return ResponseEntity.ok(saved);
        } catch (Throwable t) {
            log.error("Failed to save GK score: {}", t.getMessage(), t);
            return ResponseEntity.status(500).body(Map.of("error", "Error saving score: " + t.getMessage()));
        }
    }

    @GetMapping("/score")
    public ResponseEntity<?> getScore(@RequestParam(required = false) String userIdentifier,
                                     @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (gkScoreRepository == null) {
            return ResponseEntity.ok(new GkScore("guest_player", "Trivia Player"));
        }
        try {
            Long userId = null;
            String userEmail = null;

            if (authHeader != null && authHeader.startsWith("Bearer ") && jwtUtil != null) {
                String token = authHeader.substring(7).trim();
                if (jwtUtil.validateToken(token)) {
                    userId = jwtUtil.extractUserId(token);
                    userEmail = jwtUtil.extractEmail(token);
                }
            }

            GkScore scoreRecord = null;
            if (userId != null) {
                scoreRecord = gkScoreRepository.findByUserId(userId).orElse(null);
            }
            if (scoreRecord == null && userEmail != null) {
                scoreRecord = gkScoreRepository.findByUserIdentifier(userEmail).orElse(null);
            }
            if (scoreRecord == null && userIdentifier != null && !userIdentifier.isBlank()) {
                scoreRecord = gkScoreRepository.findByUserIdentifier(userIdentifier.trim()).orElse(null);
            }

            if (scoreRecord == null) {
                GkScore fresh = new GkScore(
                        (userEmail != null ? userEmail : (userIdentifier != null ? userIdentifier : "guest_player")),
                        "Trivia Player"
                );
                return ResponseEntity.ok(fresh);
            }

            return ResponseEntity.ok(scoreRecord);
        } catch (Throwable t) {
            log.error("Failed to get GK score: {}", t.getMessage(), t);
            return ResponseEntity.status(500).body(Map.of("error", "Error getting score: " + t.getMessage()));
        }
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<?> getLeaderboard() {
        if (gkScoreRepository == null) {
            return ResponseEntity.ok(List.of());
        }
        try {
            return ResponseEntity.ok(gkScoreRepository.findTop10ByOrderByHighestScoreDesc());
        } catch (Throwable t) {
            log.error("Failed to get GK leaderboard: {}", t.getMessage(), t);
            return ResponseEntity.status(500).body(Map.of("error", "Error retrieving leaderboard: " + t.getMessage()));
        }
    }
}
