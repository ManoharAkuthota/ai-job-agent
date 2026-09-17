package com.jobagent.service;

import com.jobagent.controller.GkQuestionController;
import com.jobagent.model.AgentSettings;
import com.jobagent.model.GkQuestion;
import com.jobagent.repository.AgentSettingsRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class GkQuestionServiceTest {

    @Test
    @SuppressWarnings("unchecked")
    void testGkQuestionServiceAndController() {
        AgentSettingsRepository settingsRepo = mock(AgentSettingsRepository.class);
        AiAgentService aiAgentService = mock(AiAgentService.class);

        AgentSettings settings = new AgentSettings();
        settings.setAiProvider("RULE_BASED");
        when(settingsRepo.findById(1L)).thenReturn(Optional.of(settings));

        GkQuestionService service = new GkQuestionService(aiAgentService, settingsRepo);
        GkQuestionController controller = new GkQuestionController(service);

        // Test topics
        ResponseEntity<?> topicsRes = controller.getTopics();
        assertNotNull(topicsRes);
        assertEquals(200, topicsRes.getStatusCode().value());
        List<Map<String, String>> topics = (List<Map<String, String>>) topicsRes.getBody();
        assertNotNull(topics);
        assertTrue(topics.size() >= 8);
        System.out.println("Topics verified: " + topics.size());

        // Test next question for each topic including CURRENT_AFFAIRS
        String[] testTopics = {"ALL", "CURRENT_AFFAIRS", "POLITICS", "MOVIES", "CITIES", "HISTORY", "SCIENCE", "SPORTS"};
        for (String topic : testTopics) {
            ResponseEntity<?> questionRes = controller.getNextQuestion(topic, "MEDIUM");
            assertNotNull(questionRes);
            assertEquals(200, questionRes.getStatusCode().value());
            GkQuestion q = (GkQuestion) questionRes.getBody();
            assertNotNull(q, "Question for topic " + topic + " should not be null");
            assertNotNull(q.getQuestion(), "Question text should not be null");
            assertEquals(4, q.getOptions().size(), "Question should have 4 options");
            assertTrue(q.getOptions().contains(q.getCorrectAnswer()), "Options must contain the correct answer");
            assertNotNull(q.getExplanation(), "Explanation must not be null");
            System.out.println("Topic " + topic + " passed: " + q.getQuestion());
        }

        // Test repetition exclusion: fetching POLITICS questions with exclusion should never return excluded id
        GkQuestion q1 = (GkQuestion) controller.getNextQuestion("POLITICS", "MEDIUM", null).getBody();
        assertNotNull(q1);
        for (int i = 0; i < 5; i++) {
            GkQuestion qNext = (GkQuestion) controller.getNextQuestion("POLITICS", "MEDIUM", q1.getId()).getBody();
            assertNotNull(qNext);
            assertNotEquals(q1.getId(), qNext.getId(), "Question ID " + q1.getId() + " was excluded and must not be repeated");
        }

        // Test Score Persistence (ONLY score is stored in DB, never questions)
        com.jobagent.repository.GkScoreRepository scoreRepo = mock(com.jobagent.repository.GkScoreRepository.class);
        GkQuestionController scoreController = new GkQuestionController(service, scoreRepo);
        com.jobagent.model.GkScore mockScore = new com.jobagent.model.GkScore("test_user@example.com", "Manohar");
        mockScore.setScore(150);
        mockScore.setHighestScore(150);
        mockScore.setBestStreak(4);

        when(scoreRepo.findByUserIdentifier("test_user@example.com")).thenReturn(Optional.of(mockScore));
        when(scoreRepo.save(any(com.jobagent.model.GkScore.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<?> scoreGetRes = scoreController.getScore("test_user@example.com", null);
        assertNotNull(scoreGetRes);
        assertEquals(200, scoreGetRes.getStatusCode().value());
        com.jobagent.model.GkScore retrieved = (com.jobagent.model.GkScore) scoreGetRes.getBody();
        assertNotNull(retrieved);
        assertEquals(150, retrieved.getScore());
        assertEquals("Manohar", retrieved.getUserName());

        ResponseEntity<?> scoreSaveRes = scoreController.saveScore(Map.of(
                "userIdentifier", "test_user@example.com",
                "userName", "Manohar",
                "score", 200,
                "streak", 5,
                "bestStreak", 5,
                "totalAnswered", 10,
                "totalCorrect", 9
        ), null);
        assertNotNull(scoreSaveRes);
        assertEquals(200, scoreSaveRes.getStatusCode().value());
        com.jobagent.model.GkScore saved = (com.jobagent.model.GkScore) scoreSaveRes.getBody();
        assertNotNull(saved);
        assertEquals(200, saved.getScore());
        assertEquals(5, saved.getBestStreak());
        System.out.println("Score persistence verified: score=" + saved.getScore() + ", streak=" + saved.getBestStreak());
    }
}