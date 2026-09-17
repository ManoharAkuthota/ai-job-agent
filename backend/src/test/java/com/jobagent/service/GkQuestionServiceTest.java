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
        assertTrue(topics.size() >= 7);
        System.out.println("Topics verified: " + topics.size());

        // Test next question for each topic
        String[] testTopics = {"ALL", "POLITICS", "MOVIES", "CITIES", "HISTORY", "SCIENCE", "SPORTS"};
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
    }
}