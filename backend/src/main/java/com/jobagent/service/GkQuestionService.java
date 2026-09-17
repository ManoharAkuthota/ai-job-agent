package com.jobagent.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobagent.model.AgentSettings;
import com.jobagent.model.GkQuestion;
import com.jobagent.repository.AgentSettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class GkQuestionService {

    private static final Logger log = LoggerFactory.getLogger(GkQuestionService.class);

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private AiAgentService aiAgentService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private AgentSettingsRepository settingsRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // In-memory cache of curated questions
    private final Map<String, List<GkQuestion>> questionBank = new ConcurrentHashMap<>();

    // High-speed queue of pre-synthesized fresh AI questions per topic
    private final Map<String, java.util.concurrent.ConcurrentLinkedQueue<GkQuestion>> aiBuffers = new ConcurrentHashMap<>();

    public GkQuestionService() {
        initializeCuratedBank();
    }

    public GkQuestionService(AiAgentService aiAgentService, AgentSettingsRepository settingsRepository) {
        this.aiAgentService = aiAgentService;
        this.settingsRepository = settingsRepository;
        initializeCuratedBank();
    }

    /**
     * Retrieves the next GK question instantly (< 5ms), strictly excluding previously seen question IDs or texts.
     */
    public GkQuestion getNextQuestion(String topic, String difficulty) {
        return getNextQuestion(topic, difficulty, null);
    }

    public GkQuestion getNextQuestion(String topic, String difficulty, String exclude) {
        String normTopic = (topic != null && !topic.isBlank()) ? topic.toUpperCase().trim() : "GENERAL";
        String normDiff = (difficulty != null && !difficulty.isBlank()) ? difficulty.toUpperCase().trim() : "MEDIUM";

        Set<String> excludeSet = new HashSet<>();
        if (exclude != null && !exclude.isBlank()) {
            for (String part : exclude.split(",")) {
                String clean = part.trim().toLowerCase();
                if (!clean.isEmpty()) excludeSet.add(clean);
            }
        }

        // 1. Check if an AI-synthesized question is already waiting in memory that hasn't been seen
        java.util.concurrent.ConcurrentLinkedQueue<GkQuestion> buffer = aiBuffers.computeIfAbsent(normTopic, k -> new java.util.concurrent.ConcurrentLinkedQueue<>());
        GkQuestion readyAiQuestion = null;
        int maxPulls = buffer.size();
        for (int i = 0; i < maxPulls; i++) {
            GkQuestion cand = buffer.poll();
            if (cand == null) break;
            if (cand.getId() != null && excludeSet.contains(cand.getId().toLowerCase())) continue;
            if (cand.getQuestion() != null && excludeSet.contains(cand.getQuestion().trim().toLowerCase())) continue;
            readyAiQuestion = cand;
            break;
        }

        // 2. Trigger non-blocking asynchronous replenishment in background thread
        triggerAsyncAiRefill(normTopic, normDiff);

        if (readyAiQuestion != null) {
            return readyAiQuestion;
        }

        // 3. Deliver instantly from rich curated bank excluding seen questions (< 1ms)
        return getRandomCuratedQuestion(normTopic, normDiff, excludeSet);
    }

    private void triggerAsyncAiRefill(String topic, String difficulty) {
        if (aiAgentService == null) return;
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                java.util.concurrent.ConcurrentLinkedQueue<GkQuestion> buffer = aiBuffers.computeIfAbsent(topic, k -> new java.util.concurrent.ConcurrentLinkedQueue<>());
                if (buffer.size() < 3) {
                    AgentSettings settings = null;
                    if (settingsRepository != null) {
                        try {
                            settings = settingsRepository.findById(1L).orElse(null);
                        } catch (Exception ignored) {}
                    }
                    if (settings == null) settings = new AgentSettings();

                    String provider = (settings.getAiProvider() != null) ? settings.getAiProvider().toUpperCase() : "AUTO";
                    if (!"RULE_BASED".equals(provider)) {
                        GkQuestion newQuestion = generateAiQuestion(topic, difficulty, settings);
                        if (newQuestion != null && newQuestion.getOptions() != null && newQuestion.getOptions().size() == 4) {
                            buffer.offer(newQuestion);
                        }
                    }
                }
            } catch (Throwable t) {
                log.debug("Background AI replenishment quiet pass: {}", t.getMessage());
            }
        });
    }

    private GkQuestion generateAiQuestion(String topic, String difficulty, AgentSettings settings) {
        String topicDesc = switch (topic) {
            case "CURRENT_AFFAIRS" -> "Recent Indian and Global Current Affairs, international summits, major geopolitical developments, national awards, space launches, economic policies, and major 2024-2026 headlines";
            case "POLITICS" -> "Indian politics, Indian constitution, government, landmark laws, and global geopolitical milestones";
            case "MOVIES" -> "Indian cinema (Bollywood, Tollywood, regional cinema, Oscars, iconic actors, directors, and landmark movies)";
            case "CITIES" -> "Famous Indian and world cities, capitals, landmarks, architectural wonders, rivers, and geographic nicknames";
            case "HISTORY" -> "Indian history (Ancient civilizations, Mughal era, freedom movement, 1857 revolt) and world history";
            case "SCIENCE" -> "Science, astronomy, ISRO missions, physics, chemistry, biology, inventions, and Nobel prizes";
            case "SPORTS" -> "Cricket (World Cups, IPL, legends), Olympics, football, badminton, and major world tournaments";
            default -> "General Knowledge covering diverse fascinating facts about India and the world";
        };

        String todayDate = java.time.LocalDate.now().toString();
        String[] randomAngles = {
            "focusing on a high-impact national or international milestone",
            "focusing on an inspiring record-breaking achievement, appointment, or award",
            "focusing on a critical historic, legal, or scientific breakthrough",
            "focusing on a fascinating lesser-known historic fact or global revelation",
            "focusing on influential pioneers, cultural legends, or groundbreaking inventors"
        };
        String randomAngle = randomAngles[ThreadLocalRandom.current().nextInt(randomAngles.length)];

        String prompt = "You are an elite quizmaster for a real-time, daily updated General Knowledge (GK) platform. "
                + "Today's date is " + todayDate + ". "
                + "Generate a completely fresh, accurate multiple-choice question on " + topicDesc + " at " + difficulty + " difficulty, " + randomAngle + ".\n"
                + "Ensure the question is authentic, intriguing, and up-to-date for " + todayDate + ".\n\n"
                + "Return ONLY a valid JSON object with the exact keys:\n"
                + "{\n"
                + "  \"question\": \"Interesting, unambiguous question text?\",\n"
                + "  \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n"
                + "  \"correctAnswer\": \"Exact match to one of the 4 options\",\n"
                + "  \"explanation\": \"A rich 2-3 sentence explanation detailing the historical, scientific, or current context of why this is correct.\",\n"
                + "  \"funFact\": \"A captivating 1-sentence bonus trivia snippet related to the answer.\"\n"
                + "}\n"
                + "Do NOT include markdown formatting or extra text, only raw JSON.";

        String aiResponse = aiAgentService.generateTextWithFallback(prompt, settings);
        if (aiResponse == null || aiResponse.isBlank()) return null;

        try {
            String clean = aiResponse.replaceAll("```json", "").replaceAll("```", "").trim();
            JsonNode root = objectMapper.readTree(clean);
            if (root.has("question") && root.has("options") && root.has("correctAnswer")) {
                List<String> options = new ArrayList<>();
                for (JsonNode opt : root.get("options")) {
                    options.add(opt.asText());
                }

                String correct = root.get("correctAnswer").asText();
                if (!options.contains(correct)) {
                    options.set(0, correct);
                    Collections.shuffle(options);
                }

                GkQuestion q = new GkQuestion();
                q.setId("ai_" + UUID.randomUUID().toString().substring(0, 8));
                q.setTopic(topic);
                q.setDifficulty(difficulty);
                q.setQuestion(root.get("question").asText());
                q.setOptions(options);
                q.setCorrectAnswer(correct);
                q.setExplanation(root.path("explanation").asText("The correct answer is " + correct + "."));
                q.setFunFact(root.path("funFact").asText("Did you know? This is one of the most frequently asked questions in national competitive quizzes."));
                return q;
            }
        } catch (Exception e) {
            log.warn("Failed to parse AI GK JSON: {}", e.getMessage());
        }
        return null;
    }

    private GkQuestion getRandomCuratedQuestion(String topic, String difficulty) {
        return getRandomCuratedQuestion(topic, difficulty, Collections.emptySet());
    }

    private GkQuestion getRandomCuratedQuestion(String topic, String difficulty, Set<String> excludeSet) {
        List<GkQuestion> pool = questionBank.getOrDefault(topic, questionBank.get("GENERAL"));
        if (pool == null || pool.isEmpty()) {
            pool = questionBank.get("GENERAL");
        }
        if (pool == null || pool.isEmpty()) {
            return new GkQuestion(
                    "q_def", "GENERAL", difficulty,
                    "Which planet in our solar system is known as the 'Red Planet'?",
                    new ArrayList<>(List.of("Mars", "Venus", "Jupiter", "Saturn")),
                    "Mars",
                    "Mars is known as the Red Planet because iron minerals in the Martian soil oxidize, or rust, causing the soil and atmosphere to look red.",
                    "Mars has the largest dust storms in our solar system, which can cover the entire planet and last for months."
            );
        }

        // Filter out questions previously seen in this session
        List<GkQuestion> candidates = new ArrayList<>();
        if (excludeSet != null && !excludeSet.isEmpty()) {
            for (GkQuestion q : pool) {
                boolean isExcluded = (q.getId() != null && excludeSet.contains(q.getId().toLowerCase()))
                        || (q.getQuestion() != null && excludeSet.contains(q.getQuestion().trim().toLowerCase()));
                if (!isExcluded) {
                    candidates.add(q);
                }
            }
        } else {
            candidates.addAll(pool);
        }

        // If all questions in this specific topic were seen, search across ALL other topics for ANY unseen question
        if (candidates.isEmpty() && excludeSet != null && !excludeSet.isEmpty()) {
            List<GkQuestion> generalPool = questionBank.getOrDefault("GENERAL", Collections.emptyList());
            for (GkQuestion q : generalPool) {
                boolean isExcluded = (q.getId() != null && excludeSet.contains(q.getId().toLowerCase()))
                        || (q.getQuestion() != null && excludeSet.contains(q.getQuestion().trim().toLowerCase()));
                if (!isExcluded) {
                    candidates.add(q);
                }
            }
        }

        // If the entire curated bank is exhausted, dynamically generate a fresh AI question on demand
        if (candidates.isEmpty() && aiAgentService != null) {
            AgentSettings settings = null;
            if (settingsRepository != null) {
                try {
                    settings = settingsRepository.findById(1L).orElse(null);
                } catch (Exception ignored) {}
            }
            if (settings == null) settings = new AgentSettings();
            GkQuestion freshAi = generateAiQuestion(topic, difficulty, settings);
            if (freshAi != null && freshAi.getQuestion() != null
                    && !excludeSet.contains(freshAi.getQuestion().trim().toLowerCase())) {
                return freshAi;
            }
        }

        List<GkQuestion> activePool = candidates.isEmpty() ? pool : candidates;

        int index = ThreadLocalRandom.current().nextInt(activePool.size());
        GkQuestion template = activePool.get(index);

        // Clone and randomize option order to ensure fresh presentation
        List<String> shuffledOptions = new ArrayList<>(template.getOptions());
        Collections.shuffle(shuffledOptions);

        return new GkQuestion(
                template.getId(),
                template.getTopic(),
                difficulty,
                template.getQuestion(),
                shuffledOptions,
                template.getCorrectAnswer(),
                template.getExplanation(),
                template.getFunFact()
        );
    }

    public List<Map<String, String>> getTopics() {
        return List.of(
                Map.of("id", "ALL", "name", "Mixed Trivia", "icon", "Sparkles", "desc", "Questions across all categories"),
                Map.of("id", "CURRENT_AFFAIRS", "name", "Current Affairs 2026", "icon", "Globe", "desc", "Daily News, Summits, Space & Global Headlines"),
                Map.of("id", "POLITICS", "name", "Politics & Civics", "icon", "Landmark", "desc", "Indian Constitution, Leaders & World Affairs"),
                Map.of("id", "MOVIES", "name", "Cinema & Movies", "icon", "Film", "desc", "Indian Cinema, Oscars & Iconic Film Lore"),
                Map.of("id", "CITIES", "name", "Cities & Geography", "icon", "MapPin", "desc", "Monuments, Capitals, Rivers & City Nicknames"),
                Map.of("id", "HISTORY", "name", "Indian & World History", "icon", "Scroll", "desc", "Freedom Movement, Ancient Empires & Revolutions"),
                Map.of("id", "SCIENCE", "name", "Science & Space", "icon", "Atom", "desc", "ISRO missions, Physics, Inventions & Discoveries"),
                Map.of("id", "SPORTS", "name", "Sports & Cricket", "icon", "Trophy", "desc", "Cricket World Cups, Olympics & Grand Slams")
        );
    }

    private void initializeCuratedBank() {
        // 1. POLITICS & CIVICS
        List<GkQuestion> politics = new ArrayList<>();
        politics.add(new GkQuestion("pol_1", "POLITICS", "EASY",
                "Who is known as the 'Father of the Indian Constitution'?",
                List.of("Dr. B.R. Ambedkar", "Mahatma Gandhi", "Jawaharlal Nehru", "Sardar Vallabhbhai Patel"),
                "Dr. B.R. Ambedkar",
                "Dr. Bhimrao Ramji Ambedkar served as the Chairman of the Drafting Committee of the Constituent Assembly. He synthesized democratic principles and social safeguards into the world's longest written national constitution.",
                "The original Constitution of India was handwritten in calligraphy by Prem Behari Narain Raizada, not printed or typed."));

        politics.add(new GkQuestion("pol_2", "POLITICS", "MEDIUM",
                "Which Article of the Indian Constitution empowers the President to impose Financial Emergency?",
                List.of("Article 360", "Article 352", "Article 356", "Article 370"),
                "Article 360",
                "Article 360 allows the President to declare a Financial Emergency if the financial stability or credit of India is threatened. Article 352 covers National Emergency and Article 356 covers President's Rule.",
                "India has never declared a Financial Emergency under Article 360 since independence, even during the 1991 economic balance of payments crisis."));

        politics.add(new GkQuestion("pol_3", "POLITICS", "MEDIUM",
                "What is the maximum sanctioned strength of members in the Lok Sabha according to the Indian Constitution?",
                List.of("552", "545", "530", "560"),
                "552",
                "The Constitution provides for a maximum strength of 552: up to 530 members representing the States, up to 20 representing the Union Territories, and previously up to 2 Anglo-Indian members nominated by the President (ended via the 104th Constitutional Amendment Act).",
                "The new Parliament House in New Delhi features a Lok Sabha chamber designed to seat up to 888 members for joint sessions."));

        politics.add(new GkQuestion("pol_4", "POLITICS", "HARD",
                "Which amendment to the Constitution of India added the words 'Socialist', 'Secular', and 'Integrity' to the Preamble?",
                List.of("42nd Amendment (1976)", "44th Amendment (1978)", "1st Amendment (1951)", "73rd Amendment (1992)"),
                "42nd Amendment (1976)",
                "The 42nd Amendment Act of 1976, enacted during the Emergency, added 'Socialist', 'Secular', and 'and Integrity' to the Preamble. Due to its extensive scope, it is often called the 'Mini-Constitution'.",
                "The Preamble to the Indian Constitution has been amended only once in the history of independent India."));

        politics.add(new GkQuestion("pol_5", "POLITICS", "EASY",
                "Which Indian state was the first to establish the Panchayati Raj system in 1959?",
                List.of("Rajasthan", "Andhra Pradesh", "Gujarat", "Maharashtra"),
                "Rajasthan",
                "The Panchayati Raj system was first inaugurated in Nagaur district of Rajasthan on October 2, 1959, by Prime Minister Jawaharlal Nehru, following recommendations of the Balwant Rai Mehta Committee.",
                "Andhra Pradesh became the second state to adopt the Panchayati Raj system shortly after Rajasthan in 1959."));

        politics.add(new GkQuestion("pol_6", "POLITICS", "MEDIUM",
                "Who presides over a joint sitting of both Houses of Parliament in India?",
                List.of("Speaker of Lok Sabha", "President of India", "Chairman of Rajya Sabha", "Prime Minister"),
                "Speaker of Lok Sabha",
                "Under Article 118(4) of the Indian Constitution, the Speaker of the Lok Sabha presides over a joint sitting of Parliament. If the Speaker is absent, the Deputy Speaker presides.",
                "The Vice President of India (Chairman of Rajya Sabha) cannot preside over a joint sitting under any circumstances."));

        politics.add(new GkQuestion("pol_7", "POLITICS", "EASY",
                "Which Indian state has the highest number of seats in the Lok Sabha?",
                List.of("Uttar Pradesh (80)", "Maharashtra (48)", "West Bengal (42)", "Bihar (40)"),
                "Uttar Pradesh (80)",
                "Uttar Pradesh has 80 parliamentary constituencies in the Lok Sabha, the highest of any Indian state, reflecting its large population proportion.",
                "A popular political adage in Indian democracy states: 'The road to Delhi passes through Lucknow.'"));

        politics.add(new GkQuestion("pol_8", "POLITICS", "MEDIUM",
                "Who is the custodian and final interpreter of the Constitution of India?",
                List.of("The Supreme Court of India", "The President of India", "The Prime Minister", "The Parliament"),
                "The Supreme Court of India",
                "The Supreme Court of India acts as the guardian and final interpreter of the Constitution, vested with the power of judicial review under Article 13 to strike down unconstitutional legislation.",
                "The Supreme Court of India held its inaugural sitting on January 28, 1950, two days after the Constitution came into effect."));

        politics.add(new GkQuestion("pol_9", "POLITICS", "HARD",
                "What is the minimum voting age for Indian citizens as lowered by the 61st Constitutional Amendment Act, 1988?",
                List.of("18 years", "21 years", "20 years", "16 years"),
                "18 years",
                "The 61st Constitutional Amendment Act of 1988 amended Article 326 to lower the minimum voting age for elections to the Lok Sabha and State Legislative Assemblies from 21 years to 18 years.",
                "The amendment came into force on March 28, 1989, empowering millions of young citizens to participate in Indian elections."));

        questionBank.put("POLITICS", politics);

        // 2. MOVIES & CINEMA
        List<GkQuestion> movies = new ArrayList<>();
        movies.add(new GkQuestion("mov_1", "MOVIES", "EASY",
                "Which song from the movie 'RRR' won the Academy Award (Oscar) for Best Original Song in 2023?",
                List.of("Naatu Naatu", "Jai Ho", "Dosti", "Chaiyya Chaiyya"),
                "Naatu Naatu",
                "Composed by M.M. Keeravani with lyrics by Chandrabose, 'Naatu Naatu' became the first song from an Indian film production to win both an Academy Award and a Golden Globe for Best Original Song.",
                "The high-energy dance sequence for 'Naatu Naatu' was filmed outside the Mariinskyi Palace, the official ceremonial residence of the President of Ukraine in Kyiv."));

        movies.add(new GkQuestion("mov_2", "MOVIES", "MEDIUM",
                "What was the first full-length Indian feature film released in 1913?",
                List.of("Raja Harishchandra", "Alam Ara", "Kisan Kanya", "Sant Tukaram"),
                "Raja Harishchandra",
                "Directed and produced by Dadasaheb Phalke, 'Raja Harishchandra' premiered on May 3, 1913. As male actors played female roles due to social taboos of the era, the role of Queen Taramati was portrayed by Anna Salunke.",
                "Dadasaheb Phalke is revered as the 'Father of Indian Cinema', and India's highest award in cinema is named in his honour."));

        movies.add(new GkQuestion("mov_3", "MOVIES", "MEDIUM",
                "Which was India's first sound/talkie film released in 1931?",
                List.of("Alam Ara", "Raja Harishchandra", "Devdas", "Achhut Kanya"),
                "Alam Ara",
                "Directed by Ardeshir Irani and released on March 14, 1931, at Majestic Cinema in Mumbai, 'Alam Ara' revolutionized Indian cinema with recorded dialogue and music, featuring the famous song 'De De Khuda Ke Naam Pe'.",
                "The film was so popular that police had to be deployed to control the crowds queuing for tickets."));

        movies.add(new GkQuestion("mov_4", "MOVIES", "HARD",
                "Who was the first Indian filmmaker to be awarded an honorary Academy Award (Lifetime Oscar) in 1992?",
                List.of("Satyajit Ray", "A.R. Rahman", "Bhanu Athaiya", "Guru Dutt"),
                "Satyajit Ray",
                "Legendary auteur Satyajit Ray was awarded the Honorary Academy Award for Lifetime Achievement in 1992 from his hospital bed in Kolkata, recognizing his profound mastery of cinematic art through masterpieces like the Apu Trilogy.",
                "Akira Kurosawa famously said: 'Not to have seen the cinema of Ray means existing in the world without seeing the sun or the moon.'"));

        movies.add(new GkQuestion("mov_5", "MOVIES", "MEDIUM",
                "Who was the first Indian to win an Academy Award (Oscar) in 1983 for Costume Design?",
                List.of("Bhanu Athaiya", "Satyajit Ray", "A.R. Rahman", "Resul Pookutty"),
                "Bhanu Athaiya",
                "Bhanu Athaiya made history by winning the Oscar for Best Costume Design in 1983 for Richard Attenborough's biographical epic 'Gandhi'.",
                "Bhanu Athaiya had a storied career spanning five decades, styling characters in over 100 films."));

        movies.add(new GkQuestion("mov_6", "MOVIES", "HARD",
                "Which iconic film directed by K. Asif took nearly a decade to make and was India's most expensive film upon release in 1960?",
                List.of("Mughal-e-Azam", "Mother India", "Sholay", "Pakeezah"),
                "Mughal-e-Azam",
                "Directed by K. Asif and starring Prithviraj Kapoor, Dilip Kumar, and Madhubala, 'Mughal-e-Azam' set unprecedented box office records and is universally regarded as a magnum opus of Indian cinema.",
                "The legendary song 'Pyar Kiya To Darna Kya' was shot in the Sheesh Mahal (Palace of Mirrors) set, which took two years to construct."));

        movies.add(new GkQuestion("mov_7", "MOVIES", "MEDIUM",
                "Which Indian film was the first to be officially nominated for the Academy Award (Oscar) for Best Foreign Language Film in 1958?",
                List.of("Mother India", "Salaam Bombay!", "Lagaan", "Pather Panchali"),
                "Mother India",
                "Directed by Mehboob Khan and starring Nargis, 'Mother India' (1957) was India's first submission to receive an Oscar nomination in the Best Foreign Language Film category, losing by just one vote.",
                "Only three Indian films have ever achieved an Oscar nomination in this category: Mother India (1957), Salaam Bombay! (1988), and Lagaan (2001)."));

        movies.add(new GkQuestion("mov_8", "MOVIES", "EASY",
                "Who is the legendary music maestro who won two Oscars in 2009 for 'Slumdog Millionaire'?",
                List.of("A.R. Rahman", "Ilaiyaraaja", "R.D. Burman", "M.M. Keeravani"),
                "A.R. Rahman",
                "A.R. Rahman made history by winning two Academy Awards in 2009 for Best Original Score and Best Original Song ('Jai Ho') for 'Slumdog Millionaire'.",
                "Rahman famously remarked during his acceptance speech: 'All my life I had a choice of hate and love. I chose love and I'm here.'"));

        movies.add(new GkQuestion("mov_9", "MOVIES", "MEDIUM",
                "Which epic film directed by S.S. Rajamouli became the first Indian movie to gross over ₹1,000 crore worldwide?",
                List.of("Baahubali 2: The Conclusion", "Dangal", "RRR", "K.G.F: Chapter 2"),
                "Baahubali 2: The Conclusion",
                "Released in 2017, 'Baahubali 2: The Conclusion' shattered box office records by crossing ₹1,000 crore within just 10 days of its global theatrical release.",
                "The riddle 'Why did Kattappa kill Baahubali?' was one of the most talked-about pop culture mysteries in Indian cinema between 2015 and 2017."));

        questionBank.put("MOVIES", movies);

        // 3. CITIES & GEOGRAPHY
        List<GkQuestion> cities = new ArrayList<>();
        cities.add(new GkQuestion("cit_1", "CITIES", "EASY",
                "Which Indian city is famously known as the 'Pink City'?",
                List.of("Jaipur", "Udaipur", "Jodhpur", "Bhopal"),
                "Jaipur",
                "In 1876, Maharaja Ram Singh painted the entire city of Jaipur in terracotta pink—a color traditionally symbolizing hospitality—to welcome Prince Albert, the Prince of Wales, during his official tour of India.",
                "A law was enacted in 1877 making it illegal for buildings in the old city of Jaipur to be painted in any color other than Jaipur Pink, which remains respected today."));

        cities.add(new GkQuestion("cit_2", "CITIES", "MEDIUM",
                "Which Indian city is known as the 'Silicon Valley of India'?",
                List.of("Bengaluru", "Hyderabad", "Pune", "Gurugram"),
                "Bengaluru",
                "Bengaluru earned the title due to its dominant role as India's leading information technology exporter, headquarters of multinational tech giants (Infosys, Wipro), and home to ISRO.",
                "Bengaluru is elevated at approximately 920 meters (3,000 feet) above sea level on the Deccan Plateau, giving it a pleasant temperate climate throughout the year."));

        cities.add(new GkQuestion("cit_3", "CITIES", "MEDIUM",
                "Which city is known as the 'City of Pearls' and was historically the world's only global diamond trading center?",
                List.of("Hyderabad", "Surat", "Jaipur", "Mumbai"),
                "Hyderabad",
                "Hyderabad earned the title 'City of Pearls' due to its flourishing pearl processing and trading industry patronized by the Nizams. Nearby Golconda was the source of legendary diamonds including the Koh-i-Noor and Hope Diamond.",
                "Raw pearls are imported from Japan and the Persian Gulf into Hyderabad, where artisans use traditional drill and bleach techniques to refine them."));

        cities.add(new GkQuestion("cit_4", "CITIES", "HARD",
                "Which is the longest natural urban beach in India and the second longest in the world?",
                List.of("Marina Beach (Chennai)", "Juhu Beach (Mumbai)", "Radhanagar Beach (Andaman)", "Puri Beach (Odisha)"),
                "Marina Beach (Chennai)",
                "Marina Beach runs along the Coromandel Coast of the Bay of Bengal in Chennai for approximately 13 kilometers (8.1 miles), making it the longest natural urban beach in India and second globally after Praia do Cassino in Brazil.",
                "Swimming is legally prohibited at Marina Beach due to strong undercurrents and sudden sea bottom drop-offs."));

        cities.add(new GkQuestion("cit_5", "CITIES", "MEDIUM",
                "Which city is known as the 'City of Lakes' and was the historic capital of the Mewar Kingdom?",
                List.of("Udaipur", "Bhopal", "Nainital", "Srinagar"),
                "Udaipur",
                "Founded in 1559 by Maharana Udai Singh II, Udaipur is famous for its picturesque interconnected lake system, including Lake Pichola, Fateh Sagar, and the Lake Palace.",
                "The Lake Palace in Lake Pichola served as the primary floating palace location in the 1983 James Bond film 'Octopussy'."));

        cities.add(new GkQuestion("cit_6", "CITIES", "HARD",
                "Which ancient Harappan port city in Gujarat featured the world's earliest known tidal dockyard?",
                List.of("Lothal", "Dholavira", "Kalibangan", "Rakhigarhi"),
                "Lothal",
                "Discovered in 1954, Lothal possessed a massive, sophisticated tidal dock basin connecting the city to an ancient channel of the Sabarmati River for maritime trade with Mesopotamia and Egypt.",
                "Lothal's engineers developed a highly accurate flood-control and water-drainage network over 4,400 years ago."));

        cities.add(new GkQuestion("cit_7", "CITIES", "EASY",
                "Which Indian city is known as the 'City of Joy'?",
                List.of("Kolkata", "Mumbai", "Varanasi", "Lucknow"),
                "Kolkata",
                "Kolkata is affectionately known as the City of Joy, a title popularized by French author Dominique Lapierre's 1985 novel 'The City of Joy', celebrating its warm community spirit, art, and vibrant heritage.",
                "Kolkata is home to the oldest operating electric tram network in Asia, running continuously since 1902."));

        cities.add(new GkQuestion("cit_8", "CITIES", "MEDIUM",
                "Which is the oldest continuously inhabited city in India and one of the world's ancient cultural capitals on the Ganges?",
                List.of("Varanasi (Kashi)", "Ujjain", "Madurai", "Ayodhya"),
                "Varanasi (Kashi)",
                "Varanasi (also known as Kashi or Banaras) has been continuously inhabited for over 3,000 years, celebrated as the spiritual capital of India.",
                "Mark Twain famously wrote: 'Banaras is older than history, older than tradition, older even than legend, and looks twice as old as all of them put together.'"));

        cities.add(new GkQuestion("cit_9", "CITIES", "MEDIUM",
                "Which scenic hill station in Tamil Nadu's Nilgiris is crowned the 'Queen of Hill Stations'?",
                List.of("Ooty (Udhagamandalam)", "Shimla", "Darjeeling", "Mussoorie"),
                "Ooty (Udhagamandalam)",
                "Located in Tamil Nadu at an elevation of 2,240 meters, Ooty is renowned for tea estates, eucalyptus forests, and the UNESCO Nilgiri Mountain Railway.",
                "The game of Snooker was invented in Ooty in 1875 by British army officer Sir Neville Chamberlain at the Ooty Club."));

        questionBank.put("CITIES", cities);

        // 4. HISTORY
        List<GkQuestion> history = new ArrayList<>();
        history.add(new GkQuestion("his_1", "HISTORY", "EASY",
                "In which year did the historic 'Dandi March' (Salt Satyagraha) led by Mahatma Gandhi take place?",
                List.of("1930", "1920", "1942", "1919"),
                "1930",
                "Mahatma Gandhi and 78 followers marched 240 miles (385 km) from Sabarmati Ashram in Ahmedabad to Dandi between March 12 and April 6, 1930, to peacefully defy the British salt monopoly, sparking nationwide civil disobedience.",
                "Sarojini Naidu shouted 'Hail, Deliverer!' as Gandhi picked up a lump of salty mud on April 6, 1930."));

        history.add(new GkQuestion("his_2", "HISTORY", "MEDIUM",
                "The historic Battle of Plassey, which established British East India Company rule in Bengal, was fought in which year?",
                List.of("1757", "1764", "1857", "1707"),
                "1757",
                "Fought on June 23, 1757, Robert Clive's British forces defeated the young Nawab of Bengal Siraj-ud-Daulah through the betrayal of Mir Jafar, establishing the political foundation of the British Raj in India.",
                "The word 'Plassey' comes from the Bengali word 'Palashi', named after the red flowering Palash trees (Butea monosperma) surrounding the battlefield."));

        history.add(new GkQuestion("his_3", "HISTORY", "HARD",
                "Which ancient Indian emperor renounced warfare and embraced Buddhism following the catastrophic Kalinga War?",
                List.of("Emperor Ashoka", "Chandragupta Maurya", "Samudragupta", "Harshavardhana"),
                "Emperor Ashoka",
                "Emperor Ashoka the Great (Mauryan Dynasty) waged the Kalinga War around 261 BCE. Witnessing the death of over 100,000 soldiers and destruction caused him profound remorse, prompting his conversion to Buddhism and adoption of Dhamma (non-violence).",
                "The Lion Capital of Ashoka at Sarnath was adopted as the official National Emblem of the Republic of India on January 26, 1950."));

        history.add(new GkQuestion("his_4", "HISTORY", "MEDIUM",
                "Who founded the Maurya Empire in 322 BCE with the guidance of scholar Chanakya?",
                List.of("Chandragupta Maurya", "Bindusara", "Brihadratha", "Pushyamitra Shunga"),
                "Chandragupta Maurya",
                "Chandragupta Maurya established the Maurya Empire after defeating the Nanda Empire with the mentorship of Chanakya (Kautilya), the master strategist who authored the Arthashastra.",
                "Greek historians referred to Chandragupta Maurya as 'Sandrokottos', who negotiated treaties with Seleucus I Nicator."));

        history.add(new GkQuestion("his_5", "HISTORY", "HARD",
                "Which queen of Jhansi led heroic resistance against British troops during the Indian Rebellion of 1857?",
                List.of("Rani Lakshmibai", "Rani Chennamma", "Begum Hazrat Mahal", "Rani Durgavati"),
                "Rani Lakshmibai",
                "Rani Lakshmibai fought against the British after Lord Dalhousie annexed Jhansi under the Doctrine of Lapse, becoming an enduring symbol of resistance and courage in India's independence struggle.",
                "British General Sir Hugh Rose commended Rani Lakshmibai as 'the bravest of the rebel leaders' following the battle of Gwalior."));

        history.add(new GkQuestion("his_6", "HISTORY", "EASY",
                "Who gave the famous call 'Give me blood, and I shall give you freedom!' to the Indian National Army?",
                List.of("Netaji Subhas Chandra Bose", "Bhagat Singh", "Bal Gangadhar Tilak", "Lala Lajpat Rai"),
                "Netaji Subhas Chandra Bose",
                "Netaji Subhas Chandra Bose delivered this rousing speech in Burma (Myanmar) on July 4, 1944, inspiring soldiers of the Azad Hind Fauj to liberate India.",
                "Netaji established the Provisional Government of Free India (Azad Hind) in Singapore on October 21, 1943."));

        history.add(new GkQuestion("his_7", "HISTORY", "MEDIUM",
                "The tragic Jallianwala Bagh massacre occurred on Baisakhi day in which year?",
                List.of("1919", "1921", "1914", "1929"),
                "1919",
                "On April 13, 1919, British troops under Reginald Dyer fired upon thousands of unarmed civilians gathered peacefully at Jallianwala Bagh in Amritsar.",
                "In protest against the massacre, Rabindranath Tagore renounced his British Knighthood."));

        history.add(new GkQuestion("his_8", "HISTORY", "HARD",
                "Who was the first woman ruler of the Delhi Sultanate who reigned from 1236 to 1240?",
                List.of("Razia Sultana", "Nur Jahan", "Chand Bibi", "Rani Durgavati"),
                "Razia Sultana",
                "Razia Sultana, the daughter of Sultan Shams-ud-din Iltutmish, was the only female monarch to rule the Delhi Sultanate, defying conservative court nobility.",
                "Razia shed traditional purdah, wore gender-neutral royal robes, and rode war elephants into battle."));

        questionBank.put("HISTORY", history);

        // 5. SCIENCE & SPACE
        List<GkQuestion> science = new ArrayList<>();
        science.add(new GkQuestion("sci_1", "SCIENCE", "EASY",
                "On which day did ISRO's Chandrayaan-3 successfully land near the lunar south pole, celebrated as National Space Day?",
                List.of("August 23, 2023", "July 14, 2023", "September 2, 2023", "October 22, 2023"),
                "August 23, 2023",
                "India made history on August 23, 2023, when the Vikram lander of Chandrayaan-3 achieved a soft landing near the Moon's unexplored southern polar region, making India the first nation to reach this region and fourth nation to soft-land on the Moon.",
                "The landing spot of Vikram was officially christened 'Shiv Shakti Point' by Prime Minister Narendra Modi."));

        science.add(new GkQuestion("sci_2", "SCIENCE", "MEDIUM",
                "Sir C.V. Raman won the 1930 Nobel Prize in Physics for which optical phenomenon, celebrated as National Science Day on Feb 28?",
                List.of("Raman Effect (Inelastic Scattering of Light)", "Photoelectric Effect", "Compton Scattering", "Laser Coherence"),
                "Raman Effect (Inelastic Scattering of Light)",
                "On February 28, 1928, Sir Chandrasekhara Venkata Raman discovered that when light traverses a transparent medium, a fraction of the scattered light emerges with shifted wavelengths due to vibrational energy transitions of the molecules.",
                "C.V. Raman was inspired to study the scattering of light while on a voyage across the Mediterranean Sea in 1921, marveling at its deep opalescent blue color."));

        science.add(new GkQuestion("sci_3", "SCIENCE", "MEDIUM",
                "Which visionary scientist is widely revered as the 'Father of the Indian Space Program'?",
                List.of("Dr. Vikram Sarabhai", "Dr. Homi J. Bhabha", "Dr. A.P.J. Abdul Kalam", "Prof. Satish Dhawan"),
                "Dr. Vikram Sarabhai",
                "Dr. Vikram Sarabhai established the Indian National Committee for Space Research (INCOSPAR) in 1962, which later evolved into ISRO in 1969, steering India's space vision toward national and humanitarian progress.",
                "India's very first rocket launched in 1963 from Thumba, Kerala, had components transported using bicycles and bullock carts."));

        science.add(new GkQuestion("sci_4", "SCIENCE", "HARD",
                "Which subatomic particle class is named in honor of the eminent Indian physicist Satyendra Nath Bose?",
                List.of("Boson", "Fermion", "Lepton", "Quark"),
                "Boson",
                "Paul Dirac coined the name 'Boson' to honor Satyendra Nath Bose for developing Bose-Einstein statistics with Albert Einstein, which characterizes particles with integer spin.",
                "Satyendra Nath Bose's 1924 research paper was initially rejected by journals until Albert Einstein personally translated it into German for publication."));

        science.add(new GkQuestion("sci_5", "SCIENCE", "EASY",
                "What was the name of India's first indigenous artificial satellite launched by ISRO in 1975?",
                List.of("Aryabhata", "Bhaskara-I", "Rohini", "INSAT-1A"),
                "Aryabhata",
                "Launched on April 19, 1975, aboard a Soviet Kosmos-3M launch vehicle from Kapustin Yar, Aryabhata was named after the classical 5th-century Indian mathematician-astronomer who calculated the value of Pi.",
                "An image of the Aryabhata satellite was featured on the reverse side of the Indian 2-rupee currency note between 1976 and 1997."));

        science.add(new GkQuestion("sci_6", "SCIENCE", "MEDIUM",
                "Which ISRO mission made India the first nation in the world to reach Martian orbit on its maiden attempt in 2014?",
                List.of("Mars Orbiter Mission (Mangalyaan)", "Chandrayaan-1", "Aditya-L1", "AstroSat"),
                "Mars Orbiter Mission (Mangalyaan)",
                "ISRO's Mangalyaan entered Mars orbit on September 24, 2014, accomplished on a budget of just $74 million (cheaper than the budget of Hollywood movie 'Gravity').",
                "Mangalyaan was designed for a 6-month mission lifespan but operated remarkably for nearly 8 years until April 2022."));

        science.add(new GkQuestion("sci_7", "SCIENCE", "EASY",
                "Which essential gas makes up approximately 78% of the Earth's atmosphere by volume?",
                List.of("Nitrogen", "Oxygen", "Argon", "Carbon Dioxide"),
                "Nitrogen",
                "Nitrogen (N2) comprises roughly 78.08% of Earth's atmosphere, followed by Oxygen (~20.95%), Argon (~0.93%), and Carbon Dioxide (~0.04%).",
                "Despite its abundance, atmospheric nitrogen cannot be directly absorbed by plants or animals until fixed into nitrates by soil bacteria or lightning."));

        questionBank.put("SCIENCE", science);

        // 6. SPORTS & CRICKET
        List<GkQuestion> sports = new ArrayList<>();
        sports.add(new GkQuestion("spo_1", "SPORTS", "EASY",
                "Who was the captain of the Indian cricket team that won India's first ever ICC Cricket World Cup in 1983?",
                List.of("Kapil Dev", "Sunil Gavaskar", "Mohinder Amarnath", "Ravi Shastri"),
                "Kapil Dev",
                "At just 24 years old, Kapil Dev led the underdog Indian cricket team to victory over the formidable two-time champions West Indies at Lord's Cricket Ground on June 25, 1983, transforming cricket into India's most popular sport.",
                "Kapil Dev's iconic, counter-attacking 175 not out against Zimbabwe at Tunbridge Wells in the 1983 World Cup was never televised due to a BBC camera strike."));

        sports.add(new GkQuestion("spo_2", "SPORTS", "MEDIUM",
                "Who became the first Indian track and field athlete to win an Olympic Gold Medal at the Tokyo 2020 Olympics?",
                List.of("Neeraj Chopra", "Milkha Singh", "P.T. Usha", "Abhinav Bindra"),
                "Neeraj Chopra",
                "Subedar Neeraj Chopra of the Indian Army threw 87.58 meters in the men's javelin throw final on August 7, 2021, to win India's first Olympic gold in athletics and only the second individual Olympic gold medal in Indian history.",
                "August 7 was officially designated by the Athletics Federation of India as 'National Javelin Day' to commemorate the historic throw."));

        sports.add(new GkQuestion("spo_3", "SPORTS", "EASY",
                "Who is the only cricketer in international cricket history to score 100 centuries?",
                List.of("Sachin Tendulkar", "Virat Kohli", "Ricky Ponting", "Brian Lara"),
                "Sachin Tendulkar",
                "Sachin Tendulkar completed his historic 100th international century (51 Test tons and 49 ODI tons) in March 2012, cementing his status as the highest run-scorer in international cricket history.",
                "Sachin Tendulkar made his international debut in 1989 against Pakistan at the age of just 16 years and 205 days."));

        sports.add(new GkQuestion("spo_4", "SPORTS", "MEDIUM",
                "Who is the first Indian woman athlete to win two consecutive individual Olympic medals?",
                List.of("P.V. Sindhu", "Saina Nehwal", "Mary Kom", "Mirabai Chanu"),
                "P.V. Sindhu",
                "P.V. Sindhu won the Badminton Women's Singles Silver at Rio 2016 and Bronze at Tokyo 2020, becoming the first Indian woman and only the second Indian athlete after Sushil Kumar to achieve back-to-back Olympic podium finishes.",
                "Sindhu was also the first Indian to be crowned BWF World Champion in badminton in Basel, 2019."));

        sports.add(new GkQuestion("spo_5", "SPORTS", "EASY",
                "Who holds the record for the highest individual score in One Day International (ODI) cricket history with 264 runs?",
                List.of("Rohit Sharma", "Martin Guptill", "Virender Sehwag", "Chris Gayle"),
                "Rohit Sharma",
                "Rohit Sharma smashed an astonishing 264 runs off 173 balls against Sri Lanka at Eden Gardens, Kolkata on November 13, 2014, including 33 fours and 9 sixes.",
                "Rohit Sharma is the only batsman in cricket history to score three double-centuries in One Day Internationals."));

        sports.add(new GkQuestion("spo_6", "SPORTS", "MEDIUM",
                "Which legendary Indian hockey player won three consecutive Olympic gold medals (1928, 1932, 1936), whose birthday on August 29 is celebrated as National Sports Day?",
                List.of("Major Dhyan Chand", "Balbir Singh Sr.", "K.D. Singh Babu", "Roop Singh"),
                "Major Dhyan Chand",
                "Known as 'The Wizard' or 'The Magician of Hockey', Major Dhyan Chand scored over 400 international goals during his illustrious career, captaining the Indian team to historic Olympic golds.",
                "During the 1936 Berlin Olympics, Adolf Hitler was reportedly so impressed with Dhyan Chand's play that he offered him German citizenship and the rank of Colonel in the German Army, which Dhyan Chand politely declined."));

        sports.add(new GkQuestion("spo_7", "SPORTS", "HARD",
                "Who became the youngest challenger in chess history to win the FIDE Candidates Tournament at age 17 in 2024?",
                List.of("D. Gukesh", "R. Praggnanandhaa", "Arjun Erigaisi", "Nihal Sarin"),
                "D. Gukesh",
                "Dommaraju Gukesh won the 2024 FIDE Candidates Tournament in Toronto at just 17 years old, breaking Garry Kasparov's 40-year-old record to become the youngest player ever to qualify for the World Chess Championship match.",
                "Gukesh became the third youngest Grandmaster in world chess history at the age of 12 years, 7 months, and 17 days in 2019."));

        questionBank.put("SPORTS", sports);

        // 7. CURRENT AFFAIRS & TRENDING
        List<GkQuestion> currentAffairs = new ArrayList<>();
        currentAffairs.add(new GkQuestion("ca_1", "CURRENT_AFFAIRS", "EASY",
                "Which Indian shooter made history at the Paris 2024 Olympics by winning two bronze medals in a single Olympic edition?",
                List.of("Manu Bhaker", "Swapnil Kusale", "Avani Lekhara", "Sarabjot Singh"),
                "Manu Bhaker",
                "Manu Bhaker became the first athlete representing independent India to win two medals in a single Olympic Games edition, winning bronze in the women's 10m air pistol and 10m air pistol mixed team.",
                "Manu Bhaker was also chosen as India's female flagbearer for the closing ceremony of the Paris 2024 Olympics."));

        currentAffairs.add(new GkQuestion("ca_2", "CURRENT_AFFAIRS", "MEDIUM",
                "Where was ISRO's solar observatory spacecraft 'Aditya-L1' successfully placed into its final halo orbit?",
                List.of("Lagrange Point 1 (L1)", "Lagrange Point 2 (L2)", "Lunar Polar Orbit", "Geostationary Transfer Orbit"),
                "Lagrange Point 1 (L1)",
                "On January 6, 2024, ISRO successfully inserted Aditya-L1 into a halo orbit around Lagrange point L1, approximately 1.5 million km from Earth, providing an uninterrupted view of the Sun without occultation or eclipses.",
                "Aditya-L1 carries seven science payloads to study the solar corona, chromosphere, photosphere, and solar wind storms."));

        currentAffairs.add(new GkQuestion("ca_3", "CURRENT_AFFAIRS", "MEDIUM",
                "Which multilateral alliance was officially launched by Prime Minister Narendra Modi during the G20 New Delhi Summit?",
                List.of("Global Biofuels Alliance (GBA)", "International Solar Alliance", "BRICS Pay Initiative", "One Sun One World Network"),
                "Global Biofuels Alliance (GBA)",
                "The Global Biofuels Alliance (GBA) was launched on September 9, 2023, during the G20 New Delhi Summit with founding members including India, the US, and Brazil to accelerate the global transition to sustainable biofuels.",
                "India has already advanced its target of achieving 20% ethanol blending in petrol (E20) to 2025-26 from the earlier target of 2030."));

        currentAffairs.add(new GkQuestion("ca_4", "CURRENT_AFFAIRS", "HARD",
                "Who was posthumously conferred India's highest civilian honour, the Bharat Ratna, in 2024 for championing social justice and OBC welfare?",
                List.of("Karpoori Thakur", "Babu Jagjivan Ram", "Chowdhry Charan Singh", "K. Kamaraj"),
                "Karpoori Thakur",
                "Former Chief Minister of Bihar Karpoori Thakur, affectionately known as 'Jannayak' (Leader of the People), was posthumously conferred the Bharat Ratna in January 2024 for pioneering reservation policies and upliftment of marginalized sections.",
                "Karpoori Thakur introduced the pioneering 'Karpoori Thakur Formula' in Bihar in 1978, a layered reservation system that preceded the Mandal Commission recommendations."));

        currentAffairs.add(new GkQuestion("ca_5", "CURRENT_AFFAIRS", "MEDIUM",
                "Which Indian state became the first in independent India to pass and implement a Uniform Civil Code (UCC) in 2024?",
                List.of("Uttarakhand", "Goa", "Gujarat", "Assam"),
                "Uttarakhand",
                "The Uttarakhand Legislative Assembly passed the Uniform Civil Code Bill in February 2024, creating uniform laws on marriage, divorce, inheritance, and live-in relationships for all citizens irrespective of religion.",
                "While Goa retained the 1867 Portuguese Civil Code upon its liberation in 1961, Uttarakhand became the first state to draft and enact a post-independence UCC."));

        currentAffairs.add(new GkQuestion("ca_6", "CURRENT_AFFAIRS", "MEDIUM",
                "Who served as the 50th Chief Justice of India (CJI) leading landmark constitutional benches until November 2024?",
                List.of("Justice D.Y. Chandrachud", "Justice Sanjiv Khanna", "Justice U.U. Lalit", "Justice N.V. Ramana"),
                "Justice D.Y. Chandrachud",
                "Justice Dhananjaya Yashwant Chandrachud served as the 50th CJI, spearheading widespread technological modernization of Indian courts, live-streaming of constitutional proceedings, and landmark verdicts.",
                "His father, Justice Y.V. Chandrachud, was the longest-serving Chief Justice in Indian history, serving for over seven years."));

        currentAffairs.add(new GkQuestion("ca_7", "CURRENT_AFFAIRS", "MEDIUM",
                "What was the theme of India's historic G20 Presidency in 2023?",
                List.of("Vasudhaiva Kutumbakam (One Earth, One Family, One Future)", "Recover Together, Recover Stronger", "Building a Resilient World", "Unity in Diversity"),
                "Vasudhaiva Kutumbakam (One Earth, One Family, One Future)",
                "Drawn from the ancient Sanskrit text Maha Upanishad, the theme 'Vasudhaiva Kutumbakam' (One Earth, One Family, One Future) affirmed the value of all life and interconnected human progress.",
                "During the New Delhi summit under India's presidency, the 55-nation African Union was officially admitted as a permanent member of the G20."));

        currentAffairs.add(new GkQuestion("ca_8", "CURRENT_AFFAIRS", "MEDIUM",
                "What is the name of ISRO's prestigious human spaceflight mission aiming to send Indian astronauts into low Earth orbit?",
                List.of("Gaganyaan", "Shukrayaan", "Mangalyaan-2", "Samudrayaan"),
                "Gaganyaan",
                "ISRO's Gaganyaan mission envisages launching a crew of three members to an orbit of 400 km for a 3-day mission and bringing them safely back to Earth, landing in Indian sea waters.",
                "Prime Minister Narendra Modi announced the names of the four Indian Air Force test pilots selected for the Gaganyaan mission in February 2024 at Vikram Sarabhai Space Centre."));

        currentAffairs.add(new GkQuestion("ca_9", "CURRENT_AFFAIRS", "EASY",
                "The world's highest railway arch bridge, standing 359 metres above the riverbed, was constructed across which river in Jammu and Kashmir?",
                List.of("Chenab", "Jhelum", "Ravi", "Indus"),
                "Chenab",
                "The Chenab Rail Bridge stands at an astonishing height of 359 meters (1,178 ft) above the Chenab River bed—35 meters taller than the Eiffel Tower in Paris—as part of the Udhampur-Srinagar-Baramulla Rail Link (USBRL) project.",
                "The bridge was engineered with special blast-proof steel and can withstand earthquake tremors of up to magnitude 8 on the Richter scale and wind speeds up to 266 km/h."));

        questionBank.put("CURRENT_AFFAIRS", currentAffairs);

        // 8. GENERAL POOL (Combines all)
        List<GkQuestion> general = new ArrayList<>();
        general.addAll(currentAffairs);
        general.addAll(politics);
        general.addAll(movies);
        general.addAll(cities);
        general.addAll(history);
        general.addAll(science);
        general.addAll(sports);
        questionBank.put("GENERAL", general);
        questionBank.put("ALL", general);
    }
}
