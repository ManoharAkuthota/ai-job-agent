package com.jobagent.controller;

import com.jobagent.model.GkQuestion;
import com.jobagent.service.GkQuestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gk")
@CrossOrigin(origins = "*")
public class GkQuestionController {

    private final GkQuestionService gkQuestionService;

    public GkQuestionController(GkQuestionService gkQuestionService) {
        this.gkQuestionService = gkQuestionService;
    }

    @GetMapping("/topics")
    public ResponseEntity<List<Map<String, String>>> getTopics() {
        return ResponseEntity.ok(gkQuestionService.getTopics());
    }

    @GetMapping("/next")
    public ResponseEntity<?> getNextQuestion(@RequestParam(required = false, defaultValue = "ALL") String topic,
                                            @RequestParam(required = false, defaultValue = "MEDIUM") String difficulty) {
        try {
            GkQuestion question = gkQuestionService.getNextQuestion(topic, difficulty);
            return ResponseEntity.ok(question);
        } catch (Throwable t) {
            t.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", t.getMessage() != null ? t.getMessage() : "Error retrieving question"));
        }
    }
}
