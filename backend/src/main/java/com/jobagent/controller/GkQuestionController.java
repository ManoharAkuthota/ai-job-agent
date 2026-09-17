package com.jobagent.controller;

import com.jobagent.model.GkQuestion;
import com.jobagent.service.GkQuestionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gk")
@CrossOrigin(origins = "*")
public class GkQuestionController {

    private static final Logger log = LoggerFactory.getLogger(GkQuestionController.class);
    private final GkQuestionService gkQuestionService;

    public GkQuestionController(GkQuestionService gkQuestionService) {
        this.gkQuestionService = gkQuestionService;
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

    @GetMapping("/next")
    public ResponseEntity<?> getNextQuestion(@RequestParam(required = false, defaultValue = "ALL") String topic,
                                            @RequestParam(required = false, defaultValue = "MEDIUM") String difficulty) {
        try {
            GkQuestion question = gkQuestionService.getNextQuestion(topic, difficulty);
            return ResponseEntity.ok(question);
        } catch (Throwable t) {
            log.error("Failed to retrieve next GK question: {}", t.getMessage(), t);
            return ResponseEntity.status(500).body(Map.of(
                    "error", t.getMessage() != null ? t.getMessage() : "Error retrieving question",
                    "type", t.getClass().getSimpleName()
            ));
        }
    }
}
