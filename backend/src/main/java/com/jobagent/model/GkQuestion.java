package com.jobagent.model;

import java.util.List;

public class GkQuestion {
    private String id;
    private String topic; // POLITICS, MOVIES, CITIES, HISTORY, SCIENCE, SPORTS, GENERAL
    private String difficulty; // EASY, MEDIUM, HARD
    private String question;
    private List<String> options;
    private String correctAnswer;
    private String explanation;
    private String funFact;

    public GkQuestion() {}

    public GkQuestion(String id, String topic, String difficulty, String question,
                      List<String> options, String correctAnswer, String explanation, String funFact) {
        this.id = id;
        this.topic = topic;
        this.difficulty = difficulty;
        this.question = question;
        this.options = options;
        this.correctAnswer = correctAnswer;
        this.explanation = explanation;
        this.funFact = funFact;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public String getFunFact() { return funFact; }
    public void setFunFact(String funFact) { this.funFact = funFact; }
}
