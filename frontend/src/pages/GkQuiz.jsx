import React, { useState, useEffect, useRef } from 'react';
import { getGkNextQuestion, getGkTopics, saveGkScore, getGkScore } from '../services/api';
import {
  Sparkles, Award, Flame, CheckCircle2, XCircle, RefreshCw,
  HelpCircle, Volume2, VolumeX, ArrowRight, BookOpen, Lightbulb,
  Landmark, Film, MapPin, Scroll, Atom, Trophy, Shuffle, Globe, Zap
} from 'lucide-react';

const FALLBACK_QUESTIONS = {
  CURRENT_AFFAIRS: [
    {
      id: 'fb_ca_1',
      topic: 'CURRENT_AFFAIRS',
      difficulty: 'EASY',
      question: "Which Indian shooter made history at the Paris 2024 Olympics by winning two bronze medals in a single Olympic edition?",
      options: ["Manu Bhaker", "Swapnil Kusale", "Avani Lekhara", "Sarabjot Singh"],
      correctAnswer: "Manu Bhaker",
      explanation: "Manu Bhaker became the first athlete representing independent India to win two medals in a single Olympic Games edition, winning bronze in the women's 10m air pistol and 10m air pistol mixed team.",
      funFact: "Manu Bhaker was also chosen as India's female flagbearer for the closing ceremony of the Paris 2024 Olympics."
    },
    {
      id: 'fb_ca_2',
      topic: 'CURRENT_AFFAIRS',
      difficulty: 'MEDIUM',
      question: "Where was ISRO's solar observatory spacecraft 'Aditya-L1' successfully placed into its final halo orbit?",
      options: ["Lagrange Point 1 (L1)", "Lagrange Point 2 (L2)", "Lunar Polar Orbit", "Geostationary Transfer Orbit"],
      correctAnswer: "Lagrange Point 1 (L1)",
      explanation: "On January 6, 2024, ISRO successfully inserted Aditya-L1 into a halo orbit around Lagrange point L1, approximately 1.5 million km from Earth, providing an uninterrupted view of the Sun without occultation or eclipses.",
      funFact: "Aditya-L1 carries seven science payloads to study the solar corona, chromosphere, photosphere, and solar wind storms."
    },
    {
      id: 'fb_ca_3',
      topic: 'CURRENT_AFFAIRS',
      difficulty: 'MEDIUM',
      question: "Which multilateral alliance was officially launched by Prime Minister Narendra Modi during the G20 New Delhi Summit?",
      options: ["Global Biofuels Alliance (GBA)", "International Solar Alliance", "BRICS Pay Initiative", "One Sun One World Network"],
      correctAnswer: "Global Biofuels Alliance (GBA)",
      explanation: "The Global Biofuels Alliance (GBA) was launched on September 9, 2023, during the G20 New Delhi Summit with founding members including India, the US, and Brazil to accelerate the global transition to sustainable biofuels.",
      funFact: "India has already advanced its target of achieving 20% ethanol blending in petrol (E20) to 2025-26 from the earlier target of 2030."
    },
    {
      id: 'fb_ca_4',
      topic: 'CURRENT_AFFAIRS',
      difficulty: 'HARD',
      question: "Who was posthumously conferred India's highest civilian honour, the Bharat Ratna, in 2024 for championing social justice and OBC welfare?",
      options: ["Karpoori Thakur", "Babu Jagjivan Ram", "Chowdhry Charan Singh", "K. Kamaraj"],
      correctAnswer: "Karpoori Thakur",
      explanation: "Former Chief Minister of Bihar Karpoori Thakur, affectionately known as 'Jannayak' (Leader of the People), was posthumously conferred the Bharat Ratna in January 2024 for pioneering reservation policies and upliftment of marginalized sections.",
      funFact: "Karpoori Thakur introduced the pioneering 'Karpoori Thakur Formula' in Bihar in 1978, a layered reservation system that preceded the Mandal Commission recommendations."
    },
    {
      id: 'fb_ca_5',
      topic: 'CURRENT_AFFAIRS',
      difficulty: 'MEDIUM',
      question: "Which Indian state became the first in independent India to pass and implement a Uniform Civil Code (UCC) in 2024?",
      options: ["Uttarakhand", "Goa", "Gujarat", "Assam"],
      correctAnswer: "Uttarakhand",
      explanation: "The Uttarakhand Legislative Assembly passed the Uniform Civil Code Bill in February 2024, creating uniform laws on marriage, divorce, inheritance, and live-in relationships for all citizens irrespective of religion.",
      funFact: "While Goa retained the 1867 Portuguese Civil Code upon its liberation in 1961, Uttarakhand became the first state to draft and enact a post-independence UCC."
    },
    {
      id: 'fb_ca_6',
      topic: 'CURRENT_AFFAIRS',
      difficulty: 'MEDIUM',
      question: "Who served as the 50th Chief Justice of India (CJI) leading landmark constitutional benches until November 2024?",
      options: ["Justice D.Y. Chandrachud", "Justice Sanjiv Khanna", "Justice U.U. Lalit", "Justice N.V. Ramana"],
      correctAnswer: "Justice D.Y. Chandrachud",
      explanation: "Justice Dhananjaya Yashwant Chandrachud served as the 50th CJI, spearheading widespread technological modernization of Indian courts, live-streaming of constitutional proceedings, and landmark verdicts.",
      funFact: "His father, Justice Y.V. Chandrachud, was the longest-serving Chief Justice in Indian history, serving for over seven years."
    },
    {
      id: 'fb_ca_7',
      topic: 'CURRENT_AFFAIRS',
      difficulty: 'MEDIUM',
      question: "What was the theme of India's historic G20 Presidency in 2023?",
      options: ["Vasudhaiva Kutumbakam (One Earth, One Family, One Future)", "Recover Together, Recover Stronger", "Building a Resilient World", "Unity in Diversity"],
      correctAnswer: "Vasudhaiva Kutumbakam (One Earth, One Family, One Future)",
      explanation: "Drawn from the ancient Sanskrit text Maha Upanishad, the theme 'Vasudhaiva Kutumbakam' (One Earth, One Family, One Future) affirmed the value of all life and interconnected human progress.",
      funFact: "During the New Delhi summit under India's presidency, the 55-nation African Union was officially admitted as a permanent member of the G20."
    },
    {
      id: 'fb_ca_8',
      topic: 'CURRENT_AFFAIRS',
      difficulty: 'MEDIUM',
      question: "What is the name of ISRO's prestigious human spaceflight mission aiming to send Indian astronauts into low Earth orbit?",
      options: ["Gaganyaan", "Shukrayaan", "Mangalyaan-2", "Samudrayaan"],
      correctAnswer: "Gaganyaan",
      explanation: "ISRO's Gaganyaan mission envisages launching a crew of three members to an orbit of 400 km for a 3-day mission and bringing them safely back to Earth, landing in Indian sea waters.",
      funFact: "Prime Minister Narendra Modi announced the names of the four Indian Air Force test pilots selected for the Gaganyaan mission in February 2024 at Vikram Sarabhai Space Centre."
    },
    {
      id: 'fb_ca_9',
      topic: 'CURRENT_AFFAIRS',
      difficulty: 'EASY',
      question: "The world's highest railway arch bridge, standing 359 metres above the riverbed, was constructed across which river in Jammu and Kashmir?",
      options: ["Chenab", "Jhelum", "Ravi", "Indus"],
      correctAnswer: "Chenab",
      explanation: "The Chenab Rail Bridge stands at an astonishing height of 359 meters (1,178 ft) above the Chenab River bed—35 meters taller than the Eiffel Tower in Paris—as part of the Udhampur-Srinagar-Baramulla Rail Link (USBRL) project.",
      funFact: "The bridge was engineered with special blast-proof steel and can withstand earthquake tremors of up to magnitude 8 on the Richter scale and wind speeds up to 266 km/h."
    }
  ],
  POLITICS: [
    {
      id: 'fb_pol_1',
      topic: 'POLITICS',
      difficulty: 'EASY',
      question: "Who is known as the 'Father of the Indian Constitution'?",
      options: ["Dr. B.R. Ambedkar", "Mahatma Gandhi", "Jawaharlal Nehru", "Sardar Vallabhbhai Patel"],
      correctAnswer: "Dr. B.R. Ambedkar",
      explanation: "Dr. Bhimrao Ramji Ambedkar served as the Chairman of the Drafting Committee of the Constituent Assembly, synthesizing democratic principles and social safeguards into the world's longest written constitution.",
      funFact: "The original Constitution of India was handwritten in flowing calligraphy by Prem Behari Narain Raizada, not printed or typed."
    },
    {
      id: 'fb_pol_2',
      topic: 'POLITICS',
      difficulty: 'MEDIUM',
      question: "Which Article of the Indian Constitution empowers the President to impose Financial Emergency?",
      options: ["Article 360", "Article 352", "Article 356", "Article 370"],
      correctAnswer: "Article 360",
      explanation: "Article 360 allows the President to declare a Financial Emergency if the financial stability or credit of India is threatened. India has never declared a Financial Emergency under Article 360 since independence.",
      funFact: "Even during the severe 1991 balance of payments crisis, Article 360 was never invoked."
    },
    {
      id: 'fb_pol_3',
      topic: 'POLITICS',
      difficulty: 'HARD',
      question: "Which Constitutional Amendment added the terms 'Socialist', 'Secular', and 'Integrity' to the Preamble?",
      options: ["42nd Amendment (1976)", "44th Amendment (1978)", "1st Amendment (1951)", "73rd Amendment (1992)"],
      correctAnswer: "42nd Amendment (1976)",
      explanation: "Enacted during the Emergency, the 42nd Amendment Act of 1976 amended the Preamble for the only time in Indian history and is widely known as the 'Mini-Constitution'.",
      funFact: "The Preamble is based on the 'Objective Resolution' drafted and moved by Pandit Jawaharlal Nehru on December 13, 1946."
    },
    {
      id: 'fb_pol_4',
      topic: 'POLITICS',
      difficulty: 'EASY',
      question: "Which Indian state was the first to establish the Panchayati Raj system in 1959?",
      options: ["Rajasthan", "Andhra Pradesh", "Gujarat", "Maharashtra"],
      correctAnswer: "Rajasthan",
      explanation: "The Panchayati Raj system was first inaugurated in Nagaur district of Rajasthan on October 2, 1959, by Prime Minister Jawaharlal Nehru, following recommendations of the Balwant Rai Mehta Committee.",
      funFact: "Andhra Pradesh became the second state to adopt the Panchayati Raj system shortly after Rajasthan in 1959."
    },
    {
      id: 'fb_pol_5',
      topic: 'POLITICS',
      difficulty: 'MEDIUM',
      question: "Who presides over a joint sitting of both Houses of Parliament in India?",
      options: ["Speaker of Lok Sabha", "President of India", "Chairman of Rajya Sabha", "Prime Minister"],
      correctAnswer: "Speaker of Lok Sabha",
      explanation: "Under Article 118(4) of the Indian Constitution, the Speaker of the Lok Sabha presides over a joint sitting of Parliament. If the Speaker is absent, the Deputy Speaker presides.",
      funFact: "The Vice President of India (Chairman of Rajya Sabha) cannot preside over a joint sitting under any circumstances."
    },
    {
      id: 'fb_pol_6',
      topic: 'POLITICS',
      difficulty: 'MEDIUM',
      question: "What is the maximum sanctioned strength of members in the Lok Sabha according to the Indian Constitution?",
      options: ["552", "545", "530", "560"],
      correctAnswer: "552",
      explanation: "The Constitution provides for a maximum strength of 552: up to 530 members representing the States, up to 20 representing the Union Territories, and previously up to 2 nominated Anglo-Indian members.",
      funFact: "The new Parliament House in New Delhi features a Lok Sabha chamber designed to seat up to 888 members for joint sessions."
    },
    {
      id: 'fb_pol_7',
      topic: 'POLITICS',
      difficulty: 'EASY',
      question: "Which Indian state has the highest number of seats in the Lok Sabha?",
      options: ["Uttar Pradesh (80)", "Maharashtra (48)", "West Bengal (42)", "Bihar (40)"],
      correctAnswer: "Uttar Pradesh (80)",
      explanation: "Uttar Pradesh has 80 parliamentary constituencies in the Lok Sabha, the highest of any Indian state, reflecting its large population proportion.",
      funFact: "A popular political adage in Indian democracy states: 'The road to Delhi passes through Lucknow.'"
    },
    {
      id: 'fb_pol_8',
      topic: 'POLITICS',
      difficulty: 'MEDIUM',
      question: "Who is the custodian and final interpreter of the Constitution of India?",
      options: ["The Supreme Court of India", "The President of India", "The Prime Minister", "The Parliament"],
      correctAnswer: "The Supreme Court of India",
      explanation: "The Supreme Court of India acts as the guardian and final interpreter of the Constitution, vested with the power of judicial review under Article 13 to strike down unconstitutional legislation.",
      funFact: "The Supreme Court of India held its inaugural sitting on January 28, 1950, two days after the Constitution came into effect."
    },
    {
      id: 'fb_pol_9',
      topic: 'POLITICS',
      difficulty: 'HARD',
      question: "What is the minimum voting age for Indian citizens as lowered by the 61st Constitutional Amendment Act, 1988?",
      options: ["18 years", "21 years", "20 years", "16 years"],
      correctAnswer: "18 years",
      explanation: "The 61st Constitutional Amendment Act of 1988 amended Article 326 to lower the minimum voting age for elections to the Lok Sabha and State Legislative Assemblies from 21 years to 18 years.",
      funFact: "The amendment came into force on March 28, 1989, empowering millions of young citizens to participate in Indian elections."
    }
  ],
  MOVIES: [
    {
      id: 'fb_mov_1',
      topic: 'MOVIES',
      difficulty: 'EASY',
      question: "Which song from the movie 'RRR' won the Academy Award (Oscar) for Best Original Song in 2023?",
      options: ["Naatu Naatu", "Jai Ho", "Dosti", "Chaiyya Chaiyya"],
      correctAnswer: "Naatu Naatu",
      explanation: "Composed by M.M. Keeravani with lyrics by Chandrabose, 'Naatu Naatu' became the first song from an Indian film production to win both an Academy Award and a Golden Globe for Best Original Song.",
      funFact: "The dance sequence for 'Naatu Naatu' was filmed outside the Mariinskyi Palace, the official residence of the President of Ukraine in Kyiv."
    },
    {
      id: 'fb_mov_2',
      topic: 'MOVIES',
      difficulty: 'MEDIUM',
      question: "What was the first full-length Indian feature film released in 1913?",
      options: ["Raja Harishchandra", "Alam Ara", "Kisan Kanya", "Sant Tukaram"],
      correctAnswer: "Raja Harishchandra",
      explanation: "Directed and produced by Dadasaheb Phalke, 'Raja Harishchandra' premiered on May 3, 1913. As male actors played female roles due to social taboos of the era, the role of Queen Taramati was portrayed by Anna Salunke.",
      funFact: "Dadasaheb Phalke is revered as the 'Father of Indian Cinema', and India's highest cinema award is named in his honor."
    },
    {
      id: 'fb_mov_3',
      topic: 'MOVIES',
      difficulty: 'HARD',
      question: "Who was the first Indian filmmaker to be awarded an honorary Lifetime Achievement Oscar in 1992?",
      options: ["Satyajit Ray", "A.R. Rahman", "Bhanu Athaiya", "Guru Dutt"],
      correctAnswer: "Satyajit Ray",
      explanation: "Legendary auteur Satyajit Ray was awarded the Honorary Academy Award for Lifetime Achievement in 1992, recognizing his mastery of cinematic art through masterpieces like the Apu Trilogy.",
      funFact: "Akira Kurosawa famously said: 'Not to have seen the cinema of Ray means existing in the world without seeing the sun or the moon.'"
    },
    {
      id: 'fb_mov_4',
      topic: 'MOVIES',
      difficulty: 'MEDIUM',
      question: "Who was the first Indian to win an Academy Award (Oscar) in 1983 for Costume Design?",
      options: ["Bhanu Athaiya", "Satyajit Ray", "A.R. Rahman", "Resul Pookutty"],
      correctAnswer: "Bhanu Athaiya",
      explanation: "Bhanu Athaiya made history by winning the Oscar for Best Costume Design in 1983 for Richard Attenborough's biographical epic 'Gandhi'.",
      funFact: "Bhanu Athaiya had a storied career spanning five decades, styling characters in over 100 films."
    },
    {
      id: 'fb_mov_5',
      topic: 'MOVIES',
      difficulty: 'HARD',
      question: "Which iconic film directed by K. Asif took nearly a decade to make and was India's most expensive film upon release in 1960?",
      options: ["Mughal-e-Azam", "Mother India", "Sholay", "Pakeezah"],
      correctAnswer: "Mughal-e-Azam",
      explanation: "Directed by K. Asif and starring Prithviraj Kapoor, Dilip Kumar, and Madhubala, 'Mughal-e-Azam' set unprecedented box office records and is universally regarded as a magnum opus of Indian cinema.",
      funFact: "The legendary song 'Pyar Kiya To Darna Kya' was shot in the Sheesh Mahal (Palace of Mirrors) set, which took two years to construct."
    },
    {
      id: 'fb_mov_6',
      topic: 'MOVIES',
      difficulty: 'MEDIUM',
      question: "Which was India's first sound/talkie film released in 1931?",
      options: ["Alam Ara", "Raja Harishchandra", "Devdas", "Achhut Kanya"],
      correctAnswer: "Alam Ara",
      explanation: "Directed by Ardeshir Irani and released on March 14, 1931, at Majestic Cinema in Mumbai, 'Alam Ara' revolutionized Indian cinema with recorded dialogue and music, featuring the famous song 'De De Khuda Ke Naam Pe'.",
      funFact: "The film was so popular that police had to be deployed to control the crowds queuing for tickets."
    },
    {
      id: 'fb_mov_7',
      topic: 'MOVIES',
      difficulty: 'MEDIUM',
      question: "Which Indian film was the first to be officially nominated for the Academy Award (Oscar) for Best Foreign Language Film in 1958?",
      options: ["Mother India", "Salaam Bombay!", "Lagaan", "Pather Panchali"],
      correctAnswer: "Mother India",
      explanation: "Directed by Mehboob Khan and starring Nargis, 'Mother India' (1957) was India's first submission to receive an Oscar nomination in the Best Foreign Language Film category, losing by just one vote.",
      funFact: "Only three Indian films have ever achieved an Oscar nomination in this category: Mother India (1957), Salaam Bombay! (1988), and Lagaan (2001)."
    },
    {
      id: 'fb_mov_8',
      topic: 'MOVIES',
      difficulty: 'EASY',
      question: "Who is the legendary music maestro who won two Oscars in 2009 for 'Slumdog Millionaire'?",
      options: ["A.R. Rahman", "Ilaiyaraaja", "R.D. Burman", "M.M. Keeravani"],
      correctAnswer: "A.R. Rahman",
      explanation: "A.R. Rahman made history by winning two Academy Awards in 2009 for Best Original Score and Best Original Song ('Jai Ho') for 'Slumdog Millionaire'.",
      funFact: "Rahman famously remarked during his acceptance speech: 'All my life I had a choice of hate and love. I chose love and I'm here.'"
    },
    {
      id: 'fb_mov_9',
      topic: 'MOVIES',
      difficulty: 'MEDIUM',
      question: "Which epic film directed by S.S. Rajamouli became the first Indian movie to gross over ₹1,000 crore worldwide?",
      options: ["Baahubali 2: The Conclusion", "Dangal", "RRR", "K.G.F: Chapter 2"],
      correctAnswer: "Baahubali 2: The Conclusion",
      explanation: "Released in 2017, 'Baahubali 2: The Conclusion' shattered box office records by crossing ₹1,000 crore within just 10 days of its global theatrical release.",
      funFact: "The riddle 'Why did Kattappa kill Baahubali?' was one of the most talked-about pop culture mysteries in Indian cinema between 2015 and 2017."
    }
  ],
  CITIES: [
    {
      id: 'fb_cit_1',
      topic: 'CITIES',
      difficulty: 'EASY',
      question: "Which Indian city is famously known as the 'Pink City'?",
      options: ["Jaipur", "Udaipur", "Jodhpur", "Bhopal"],
      correctAnswer: "Jaipur",
      explanation: "In 1876, Maharaja Ram Singh painted the entire city of Jaipur in terracotta pink—a color traditionally symbolizing hospitality—to welcome Prince Albert, the Prince of Wales.",
      funFact: "A law was enacted in 1877 making it illegal for buildings in the old city of Jaipur to be painted in any color other than Jaipur Pink, which is still respected today."
    },
    {
      id: 'fb_cit_2',
      topic: 'CITIES',
      difficulty: 'MEDIUM',
      question: "Which Indian city is known as the 'Silicon Valley of India'?",
      options: ["Bengaluru", "Hyderabad", "Pune", "Gurugram"],
      correctAnswer: "Bengaluru",
      explanation: "Bengaluru earned the title due to its dominant role as India's leading IT exporter, headquarters of multinational tech giants (Infosys, Wipro), and home to ISRO.",
      funFact: "Bengaluru is elevated at approximately 920 meters (3,000 feet) above sea level on the Deccan Plateau, giving it a pleasant temperate climate throughout the year."
    },
    {
      id: 'fb_cit_3',
      topic: 'CITIES',
      difficulty: 'HARD',
      question: "Which is the longest natural urban beach in India and the second longest in the world?",
      options: ["Marina Beach (Chennai)", "Juhu Beach (Mumbai)", "Radhanagar Beach (Andaman)", "Puri Beach (Odisha)"],
      correctAnswer: "Marina Beach (Chennai)",
      explanation: "Marina Beach runs along the Coromandel Coast of the Bay of Bengal in Chennai for approximately 13 kilometers (8.1 miles), making it the longest natural urban beach in India and second globally after Praia do Cassino in Brazil.",
      funFact: "Swimming is legally prohibited at Marina Beach due to strong undercurrents and sudden sea bottom drop-offs."
    },
    {
      id: 'fb_cit_4',
      topic: 'CITIES',
      difficulty: 'MEDIUM',
      question: "Which city is known as the 'City of Lakes' and was the historic capital of the Mewar Kingdom?",
      options: ["Udaipur", "Bhopal", "Nainital", "Srinagar"],
      correctAnswer: "Udaipur",
      explanation: "Founded in 1559 by Maharana Udai Singh II, Udaipur is famous for its picturesque interconnected lake system, including Lake Pichola, Fateh Sagar, and the Lake Palace.",
      funFact: "The Lake Palace in Lake Pichola served as the primary floating palace location in the 1983 James Bond film 'Octopussy'."
    },
    {
      id: 'fb_cit_5',
      topic: 'CITIES',
      difficulty: 'HARD',
      question: "Which ancient Harappan port city in Gujarat featured the world's earliest known tidal dockyard?",
      options: ["Lothal", "Dholavira", "Kalibangan", "Rakhigarhi"],
      correctAnswer: "Lothal",
      explanation: "Discovered in 1954, Lothal possessed a massive, sophisticated tidal dock basin connecting the city to an ancient channel of the Sabarmati River for maritime trade with Mesopotamia and Egypt.",
      funFact: "Lothal's engineers developed a highly accurate flood-control and water-drainage network over 4,400 years ago."
    },
    {
      id: 'fb_cit_6',
      topic: 'CITIES',
      difficulty: 'MEDIUM',
      question: "Which city is known as the 'City of Pearls' and was historically the world's only global diamond trading center?",
      options: ["Hyderabad", "Surat", "Jaipur", "Mumbai"],
      correctAnswer: "Hyderabad",
      explanation: "Hyderabad earned the title 'City of Pearls' due to its flourishing pearl processing and trading industry patronized by the Nizams. Nearby Golconda was the source of legendary diamonds including the Koh-i-Noor.",
      funFact: "Raw pearls are imported from Japan and the Persian Gulf into Hyderabad, where artisans use traditional drill and bleach techniques to refine them."
    },
    {
      id: 'fb_cit_7',
      topic: 'CITIES',
      difficulty: 'EASY',
      question: "Which Indian city is known as the 'City of Joy'?",
      options: ["Kolkata", "Mumbai", "Varanasi", "Lucknow"],
      correctAnswer: "Kolkata",
      explanation: "Kolkata is affectionately known as the City of Joy, a title popularized by French author Dominique Lapierre's 1985 novel 'The City of Joy', celebrating its warm community spirit, art, and vibrant heritage.",
      funFact: "Kolkata is home to the oldest operating electric tram network in Asia, running continuously since 1902."
    },
    {
      id: 'fb_cit_8',
      topic: 'CITIES',
      difficulty: 'MEDIUM',
      question: "Which is the oldest continuously inhabited city in India and one of the world's ancient cultural capitals on the Ganges?",
      options: ["Varanasi (Kashi)", "Ujjain", "Madurai", "Ayodhya"],
      correctAnswer: "Varanasi (Kashi)",
      explanation: "Varanasi (also known as Kashi or Banaras) has been continuously inhabited for over 3,000 years, celebrated as the spiritual capital of India.",
      funFact: "Mark Twain famously wrote: 'Banaras is older than history, older than tradition, older even than legend, and looks twice as old as all of them put together.'"
    },
    {
      id: 'fb_cit_9',
      topic: 'CITIES',
      difficulty: 'MEDIUM',
      question: "Which scenic hill station in Tamil Nadu's Nilgiris is crowned the 'Queen of Hill Stations'?",
      options: ["Ooty (Udhagamandalam)", "Shimla", "Darjeeling", "Mussoorie"],
      correctAnswer: "Ooty (Udhagamandalam)",
      explanation: "Located in Tamil Nadu at an elevation of 2,240 meters, Ooty is renowned for tea estates, eucalyptus forests, and the UNESCO Nilgiri Mountain Railway.",
      funFact: "The game of Snooker was invented in Ooty in 1875 by British army officer Sir Neville Chamberlain at the Ooty Club."
    }
  ],
  HISTORY: [
    {
      id: 'fb_his_1',
      topic: 'HISTORY',
      difficulty: 'EASY',
      question: "In which year did the historic 'Dandi March' (Salt Satyagraha) led by Mahatma Gandhi take place?",
      options: ["1930", "1920", "1942", "1919"],
      correctAnswer: "1930",
      explanation: "Mahatma Gandhi and 78 followers marched 240 miles (385 km) from Sabarmati Ashram in Ahmedabad to Dandi between March 12 and April 6, 1930, to peacefully defy the British salt monopoly, sparking nationwide civil disobedience.",
      funFact: "Sarojini Naidu shouted 'Hail, Deliverer!' as Gandhi picked up a lump of salty mud on April 6, 1930."
    },
    {
      id: 'fb_his_2',
      topic: 'HISTORY',
      difficulty: 'MEDIUM',
      question: "The historic Battle of Plassey, which established British East India Company rule in Bengal, was fought in which year?",
      options: ["1757", "1764", "1857", "1707"],
      correctAnswer: "1757",
      explanation: "Fought on June 23, 1757, Robert Clive's British forces defeated the young Nawab of Bengal Siraj-ud-Daulah through the betrayal of Mir Jafar, establishing the political foundation of the British Raj in India.",
      funFact: "The word 'Plassey' comes from the Bengali word 'Palashi', named after the red flowering Palash trees surrounding the battlefield."
    },
    {
      id: 'fb_his_3',
      topic: 'HISTORY',
      difficulty: 'HARD',
      question: "Which ancient Indian emperor renounced warfare and embraced Buddhism following the catastrophic Kalinga War?",
      options: ["Emperor Ashoka", "Chandragupta Maurya", "Samudragupta", "Harshavardhana"],
      correctAnswer: "Emperor Ashoka",
      explanation: "Emperor Ashoka the Great (Mauryan Dynasty) waged the Kalinga War around 261 BCE. Witnessing the death of over 100,000 soldiers caused him profound remorse, prompting his conversion to Buddhism and adoption of Dhamma.",
      funFact: "The Lion Capital of Ashoka at Sarnath was adopted as the official National Emblem of the Republic of India on January 26, 1950."
    },
    {
      id: 'fb_his_4',
      topic: 'HISTORY',
      difficulty: 'MEDIUM',
      question: "Who founded the Maurya Empire in 322 BCE with the guidance of scholar Chanakya?",
      options: ["Chandragupta Maurya", "Bindusara", "Brihadratha", "Pushyamitra Shunga"],
      correctAnswer: "Chandragupta Maurya",
      explanation: "Chandragupta Maurya established the Maurya Empire after defeating the Nanda Empire with the mentorship of Chanakya (Kautilya), the master strategist who authored the Arthashastra.",
      funFact: "Greek historians referred to Chandragupta Maurya as 'Sandrokottos', who negotiated treaties with Seleucus I Nicator."
    },
    {
      id: 'fb_his_5',
      topic: 'HISTORY',
      difficulty: 'HARD',
      question: "Which queen of Jhansi led heroic resistance against British troops during the Indian Rebellion of 1857?",
      options: ["Rani Lakshmibai", "Rani Chennamma", "Begum Hazrat Mahal", "Rani Durgavati"],
      correctAnswer: "Rani Lakshmibai",
      explanation: "Rani Lakshmibai fought against the British after Lord Dalhousie annexed Jhansi under the Doctrine of Lapse, becoming an enduring symbol of resistance and courage in India's independence struggle.",
      funFact: "British General Sir Hugh Rose commended Rani Lakshmibai as 'the bravest of the rebel leaders' following the battle of Gwalior."
    },
    {
      id: 'fb_his_6',
      topic: 'HISTORY',
      difficulty: 'EASY',
      question: "Who gave the famous call 'Give me blood, and I shall give you freedom!' to the Indian National Army?",
      options: ["Netaji Subhas Chandra Bose", "Bhagat Singh", "Bal Gangadhar Tilak", "Lala Lajpat Rai"],
      correctAnswer: "Netaji Subhas Chandra Bose",
      explanation: "Netaji Subhas Chandra Bose delivered this rousing speech in Burma (Myanmar) on July 4, 1944, inspiring soldiers of the Azad Hind Fauj to liberate India.",
      funFact: "Netaji established the Provisional Government of Free India (Azad Hind) in Singapore on October 21, 1943."
    },
    {
      id: 'fb_his_7',
      topic: 'HISTORY',
      difficulty: 'MEDIUM',
      question: "The tragic Jallianwala Bagh massacre occurred on Baisakhi day in which year?",
      options: ["1919", "1921", "1914", "1929"],
      correctAnswer: "1919",
      explanation: "On April 13, 1919, British troops under Reginald Dyer fired upon thousands of unarmed civilians gathered peacefully at Jallianwala Bagh in Amritsar.",
      funFact: "In protest against the massacre, Rabindranath Tagore renounced his British Knighthood."
    },
    {
      id: 'fb_his_8',
      topic: 'HISTORY',
      difficulty: 'HARD',
      question: "Who was the first woman ruler of the Delhi Sultanate who reigned from 1236 to 1240?",
      options: ["Razia Sultana", "Nur Jahan", "Chand Bibi", "Rani Durgavati"],
      correctAnswer: "Razia Sultana",
      explanation: "Razia Sultana, the daughter of Sultan Shams-ud-din Iltutmish, was the only female monarch to rule the Delhi Sultanate, defying conservative court nobility.",
      funFact: "Razia shed traditional purdah, wore gender-neutral royal robes, and rode war elephants into battle."
    }
  ],
  SCIENCE: [
    {
      id: 'fb_sci_1',
      topic: 'SCIENCE',
      difficulty: 'EASY',
      question: "On which day did ISRO's Chandrayaan-3 successfully land near the lunar south pole, celebrated as National Space Day?",
      options: ["August 23, 2023", "July 14, 2023", "September 2, 2023", "October 22, 2023"],
      correctAnswer: "August 23, 2023",
      explanation: "India made history on August 23, 2023, when the Vikram lander achieved a soft landing near the Moon's unexplored southern polar region, making India the first nation to reach this region and fourth nation to soft-land on the Moon.",
      funFact: "The landing spot of Vikram was officially christened 'Shiv Shakti Point' by Prime Minister Narendra Modi."
    },
    {
      id: 'fb_sci_2',
      topic: 'SCIENCE',
      difficulty: 'MEDIUM',
      question: "Sir C.V. Raman won the 1930 Nobel Prize in Physics for which optical phenomenon, celebrated as National Science Day on Feb 28?",
      options: ["Raman Effect (Scattering of Light)", "Photoelectric Effect", "Compton Scattering", "Laser Coherence"],
      correctAnswer: "Raman Effect (Scattering of Light)",
      explanation: "On February 28, 1928, Sir C.V. Raman discovered that when light traverses a transparent medium, a fraction of the scattered light emerges with shifted wavelengths due to vibrational energy transitions of molecules.",
      funFact: "C.V. Raman was inspired to study the scattering of light while on a voyage across the Mediterranean Sea in 1921, marveling at its deep opalescent blue color."
    },
    {
      id: 'fb_sci_3',
      topic: 'SCIENCE',
      difficulty: 'MEDIUM',
      question: "Which visionary scientist is widely revered as the 'Father of the Indian Space Program'?",
      options: ["Dr. Vikram Sarabhai", "Dr. Homi J. Bhabha", "Dr. A.P.J. Abdul Kalam", "Prof. Satish Dhawan"],
      correctAnswer: "Dr. Vikram Sarabhai",
      explanation: "Dr. Vikram Sarabhai established the Indian National Committee for Space Research (INCOSPAR) in 1962, which later evolved into ISRO in 1969, steering India's space vision toward national and humanitarian progress.",
      funFact: "India's very first rocket launched in 1963 from Thumba, Kerala, had components transported using bicycles and bullock carts."
    },
    {
      id: 'fb_sci_4',
      topic: 'SCIENCE',
      difficulty: 'HARD',
      question: "Which subatomic particle class is named in honor of the eminent Indian physicist Satyendra Nath Bose?",
      options: ["Boson", "Fermion", "Lepton", "Quark"],
      correctAnswer: "Boson",
      explanation: "Paul Dirac coined the name 'Boson' to honor Satyendra Nath Bose for developing Bose-Einstein statistics with Albert Einstein, which characterizes particles with integer spin.",
      funFact: "Satyendra Nath Bose's 1924 research paper was initially rejected by journals until Albert Einstein personally translated it into German for publication."
    },
    {
      id: 'fb_sci_5',
      topic: 'SCIENCE',
      difficulty: 'EASY',
      question: "What was the name of India's first indigenous artificial satellite launched by ISRO in 1975?",
      options: ["Aryabhata", "Bhaskara-I", "Rohini", "INSAT-1A"],
      correctAnswer: "Aryabhata",
      explanation: "Launched on April 19, 1975, aboard a Soviet Kosmos-3M launch vehicle from Kapustin Yar, Aryabhata was named after the classical 5th-century Indian mathematician-astronomer who calculated the value of Pi.",
      funFact: "An image of the Aryabhata satellite was featured on the reverse side of the Indian 2-rupee currency note between 1976 and 1997."
    },
    {
      id: 'fb_sci_6',
      topic: 'SCIENCE',
      difficulty: 'MEDIUM',
      question: "Which ISRO mission made India the first nation in the world to reach Martian orbit on its maiden attempt in 2014?",
      options: ["Mars Orbiter Mission (Mangalyaan)", "Chandrayaan-1", "Aditya-L1", "AstroSat"],
      correctAnswer: "Mars Orbiter Mission (Mangalyaan)",
      explanation: "ISRO's Mangalyaan entered Mars orbit on September 24, 2014, accomplished on a budget of just $74 million (cheaper than the budget of Hollywood movie 'Gravity').",
      funFact: "Mangalyaan was designed for a 6-month mission lifespan but operated remarkably for nearly 8 years until April 2022."
    },
    {
      id: 'fb_sci_7',
      topic: 'SCIENCE',
      difficulty: 'EASY',
      question: "Which essential gas makes up approximately 78% of the Earth's atmosphere by volume?",
      options: ["Nitrogen", "Oxygen", "Argon", "Carbon Dioxide"],
      correctAnswer: "Nitrogen",
      explanation: "Nitrogen (N2) comprises roughly 78.08% of Earth's atmosphere, followed by Oxygen (~20.95%), Argon (~0.93%), and Carbon Dioxide (~0.04%).",
      funFact: "Despite its abundance, atmospheric nitrogen cannot be directly absorbed by plants or animals until fixed into nitrates by soil bacteria or lightning."
    }
  ],
  SPORTS: [
    {
      id: 'fb_spo_1',
      topic: 'SPORTS',
      difficulty: 'EASY',
      question: "Who was the captain of the Indian cricket team that won India's first ever ICC Cricket World Cup in 1983?",
      options: ["Kapil Dev", "Sunil Gavaskar", "Mohinder Amarnath", "Ravi Shastri"],
      correctAnswer: "Kapil Dev",
      explanation: "At just 24 years old, Kapil Dev led the underdog Indian cricket team to victory over the formidable two-time champions West Indies at Lord's Cricket Ground on June 25, 1983, transforming cricket into India's most popular sport.",
      funFact: "Kapil Dev's iconic, counter-attacking 175 not out against Zimbabwe in that tournament was never televised due to a BBC camera strike."
    },
    {
      id: 'fb_spo_2',
      topic: 'SPORTS',
      difficulty: 'MEDIUM',
      question: "Who became the first Indian track and field athlete to win an Olympic Gold Medal at the Tokyo 2020 Olympics?",
      options: ["Neeraj Chopra", "Milkha Singh", "P.T. Usha", "Abhinav Bindra"],
      correctAnswer: "Neeraj Chopra",
      explanation: "Subedar Neeraj Chopra of the Indian Army threw 87.58 meters in the men's javelin throw final on August 7, 2021, to win India's first Olympic gold in athletics and only the second individual Olympic gold medal in Indian history.",
      funFact: "August 7 was officially designated by the Athletics Federation of India as 'National Javelin Day' to commemorate the historic throw."
    },
    {
      id: 'fb_spo_3',
      topic: 'SPORTS',
      difficulty: 'EASY',
      question: "Who is the only cricketer in international cricket history to score 100 centuries?",
      options: ["Sachin Tendulkar", "Virat Kohli", "Ricky Ponting", "Brian Lara"],
      correctAnswer: "Sachin Tendulkar",
      explanation: "Sachin Tendulkar completed his historic 100th international century (51 Test tons and 49 ODI tons) in March 2012, cementing his status as the highest run-scorer in international cricket history.",
      funFact: "Sachin Tendulkar made his international debut in 1989 against Pakistan at the age of just 16 years and 205 days."
    },
    {
      id: 'fb_spo_4',
      topic: 'SPORTS',
      difficulty: 'MEDIUM',
      question: "Who is the first Indian woman athlete to win two consecutive individual Olympic medals?",
      options: ["P.V. Sindhu", "Saina Nehwal", "Mary Kom", "Mirabai Chanu"],
      correctAnswer: "P.V. Sindhu",
      explanation: "P.V. Sindhu won the Badminton Women's Singles Silver at Rio 2016 and Bronze at Tokyo 2020, becoming the first Indian woman and only the second Indian athlete after Sushil Kumar to achieve back-to-back Olympic podium finishes.",
      funFact: "Sindhu was also the first Indian to be crowned BWF World Champion in badminton in Basel, 2019."
    },
    {
      id: 'fb_spo_5',
      topic: 'SPORTS',
      difficulty: 'EASY',
      question: "Who holds the record for the highest individual score in One Day International (ODI) cricket history with 264 runs?",
      options: ["Rohit Sharma", "Martin Guptill", "Virender Sehwag", "Chris Gayle"],
      correctAnswer: "Rohit Sharma",
      explanation: "Rohit Sharma smashed an astonishing 264 runs off 173 balls against Sri Lanka at Eden Gardens, Kolkata on November 13, 2014, including 33 fours and 9 sixes.",
      funFact: "Rohit Sharma is the only batsman in cricket history to score three double-centuries in One Day Internationals."
    },
    {
      id: 'fb_spo_6',
      topic: 'SPORTS',
      difficulty: 'MEDIUM',
      question: "Which legendary Indian hockey player won three consecutive Olympic gold medals (1928, 1932, 1936), whose birthday on August 29 is celebrated as National Sports Day?",
      options: ["Major Dhyan Chand", "Balbir Singh Sr.", "K.D. Singh Babu", "Roop Singh"],
      correctAnswer: "Major Dhyan Chand",
      explanation: "Known as 'The Wizard' or 'The Magician of Hockey', Major Dhyan Chand scored over 400 international goals during his illustrious career, captaining the Indian team to historic Olympic golds.",
      funFact: "During the 1936 Berlin Olympics, Adolf Hitler was reportedly so impressed with Dhyan Chand's play that he offered him German citizenship and the rank of Colonel in the German Army, which Dhyan Chand politely declined."
    },
    {
      id: 'fb_spo_7',
      topic: 'SPORTS',
      difficulty: 'HARD',
      question: "Who became the youngest challenger in chess history to win the FIDE Candidates Tournament at age 17 in 2024?",
      options: ["D. Gukesh", "R. Praggnanandhaa", "Arjun Erigaisi", "Nihal Sarin"],
      correctAnswer: "D. Gukesh",
      explanation: "Dommaraju Gukesh won the 2024 FIDE Candidates Tournament in Toronto at just 17 years old, breaking Garry Kasparov's 40-year-old record to become the youngest player ever to qualify for the World Chess Championship match.",
      funFact: "Gukesh became the third youngest Grandmaster in world chess history at the age of 12 years, 7 months, and 17 days in 2019."
    }
  ]
};

// Permanent Anti-Repetition Storage Helpers
const SEEN_STORAGE_KEY = 'jobagent_gk_seen_questions_v1';
const MAX_STORED_SEEN = 1000;

const getStoredSeenSet = () => {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr.map(s => String(s).toLowerCase()));
      }
    }
  } catch (e) {
    console.warn('Could not read seen questions from localStorage:', e);
  }
  return new Set();
};

const saveStoredSeenSet = (seenSet) => {
  try {
    if (!seenSet) return;
    const arr = Array.from(seenSet).slice(-MAX_STORED_SEEN);
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn('Could not persist seen questions to localStorage:', e);
  }
};

const getFallbackQuestion = (topic = 'ALL', seenSet = null) => {
  let pool = [];
  if (topic && topic !== 'ALL' && FALLBACK_QUESTIONS[topic]) {
    pool = FALLBACK_QUESTIONS[topic];
  } else {
    Object.values(FALLBACK_QUESTIONS).forEach(list => pool.push(...list));
  }

  // Filter out any questions that have already been seen
  let candidates = pool;
  if (seenSet && seenSet.size > 0) {
    candidates = pool.filter(q => {
      const idMatch = q.id && seenSet.has(String(q.id).toLowerCase());
      const textMatch = q.question && seenSet.has(q.question.trim().toLowerCase());
      return !idMatch && !textMatch;
    });
  }

  // If all questions in this topic were seen, search across ALL categories for any unseen question
  if (candidates.length === 0 && seenSet && seenSet.size > 0) {
    const allPool = [];
    Object.values(FALLBACK_QUESTIONS).forEach(list => allPool.push(...list));
    candidates = allPool.filter(q => {
      const idMatch = q.id && seenSet.has(String(q.id).toLowerCase());
      const textMatch = q.question && seenSet.has(q.question.trim().toLowerCase());
      return !idMatch && !textMatch;
    });
  }

  // If still empty (all offline questions seen across all topics), fallback to full pool
  const activePool = candidates.length > 0 ? candidates : pool;
  const randomIndex = Math.floor(Math.random() * activePool.length);
  const template = activePool[randomIndex];
  const shuffled = [...template.options].sort(() => Math.random() - 0.5);
  return { ...template, options: shuffled };
};

export default function GkQuiz() {
  const [topics, setTopics] = useState([
    { id: 'ALL', name: 'Mixed Trivia', icon: 'Sparkles' },
    { id: 'CURRENT_AFFAIRS', name: 'Current Affairs 2026', icon: 'Globe' },
    { id: 'POLITICS', name: 'Politics & Civics', icon: 'Landmark' },
    { id: 'MOVIES', name: 'Movies & Cinema', icon: 'Film' },
    { id: 'CITIES', name: 'Cities & Geography', icon: 'MapPin' },
    { id: 'HISTORY', name: 'History', icon: 'Scroll' },
    { id: 'SCIENCE', name: 'Science & Space', icon: 'Atom' },
    { id: 'SPORTS', name: 'Sports & Cricket', icon: 'Trophy' }
  ]);

  const [selectedTopic, setSelectedTopic] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('MEDIUM');
  
  // Permanent Anti-repetition tracking: backed by localStorage so questions NEVER repeat across visits
  const seenQuestionIds = useRef(getStoredSeenSet());

  // Initialize with an instant verified question guaranteed to be unseen
  const [currentQuestion, setCurrentQuestion] = useState(() => getFallbackQuestion('ALL', seenQuestionIds.current));
  const [loading, setLoading] = useState(false);

  const markSeen = (q) => {
    if (!q) return;
    if (q.id) seenQuestionIds.current.add(String(q.id).toLowerCase());
    if (q.question) seenQuestionIds.current.add(q.question.trim().toLowerCase());
    saveStoredSeenSet(seenQuestionIds.current);
  };

  // User & DB persistence helpers
  const getStoredUser = () => {
    try {
      const raw = localStorage.getItem('jobagent_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  const getGuestId = () => {
    let gid = localStorage.getItem('jobagent_gk_guest_id');
    if (!gid) {
      gid = 'guest_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('jobagent_gk_guest_id', gid);
    }
    return gid;
  };

  // Interaction State
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Score & Game Stats (Only score/stats are persisted in the database, questions are 100% ephemeral)
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [savedToCloud, setSavedToCloud] = useState(false);

  // Auto-advance timer ref & background pre-fetch buffer
  const autoAdvanceTimer = useRef(null);
  const nextQuestionBuffer = useRef(null);

  // Web Audio API Synthesizer (Zero asset dependencies)
  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'correct') {
        const now = ctx.currentTime;
        [1046.5, 1318.5, 1567.98].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.2, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.3);
        });
      } else if (type === 'wrong') {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      console.warn("Audio synthesis error:", e);
    }
  };

  useEffect(() => {
    // Seed initial question into seen set so it cannot repeat
    if (currentQuestion) {
      markSeen(currentQuestion);
    }
    loadTopics();
    loadSavedScore();
    // Pre-fetch the next question silently in the background while user plays current question
    prefetchNextQuestion(selectedTopic, selectedDifficulty);
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  const loadSavedScore = async () => {
    try {
      const user = getStoredUser();
      const guestId = getGuestId();
      const identifier = user?.email || guestId;
      const res = await getGkScore(identifier);
      if (res.data && typeof res.data.score === 'number') {
        if (res.data.score > 0) setScore(res.data.score);
        if (res.data.bestStreak > 0) setBestStreak(res.data.bestStreak);
        if (res.data.totalAnswered > 0) setTotalAnswered(res.data.totalAnswered);
        if (res.data.totalCorrect > 0) setTotalCorrect(res.data.totalCorrect);
        setSavedToCloud(true);
      }
    } catch (e) {
      console.warn("Could not load score from database:", e);
    }
  };

  const syncScoreToDb = async (newScore, newStreak, newBestStreak, newAnswered, newCorrect) => {
    try {
      const user = getStoredUser();
      const guestId = getGuestId();
      await saveGkScore({
        userIdentifier: user?.email || guestId,
        userName: user?.fullName || 'Trivia Player',
        score: newScore,
        streak: newStreak,
        bestStreak: newBestStreak,
        totalAnswered: newAnswered,
        totalCorrect: newCorrect,
        lastTopic: selectedTopic,
        lastDifficulty: selectedDifficulty
      });
      setSavedToCloud(true);
    } catch (e) {
      console.warn("Could not sync score to database:", e);
    }
  };

  const loadTopics = async () => {
    try {
      const res = await getGkTopics();
      if (res.data && res.data.length > 0) {
        setTopics(res.data);
      }
    } catch (e) {
      console.warn("Using fallback topics:", e);
    }
  };

  const prefetchNextQuestion = async (topic = selectedTopic, difficulty = selectedDifficulty) => {
    try {
      // Send up to 100 most recent seen IDs or questions to backend for server-side exclusion
      const excludeList = Array.from(seenQuestionIds.current).slice(-100).join(',');
      const res = await getGkNextQuestion(topic, difficulty, excludeList);
      if (res.data && res.data.question && res.data.options && res.data.options.length === 4) {
        const id = res.data.id ? String(res.data.id).toLowerCase() : null;
        const qText = res.data.question ? res.data.question.trim().toLowerCase() : null;
        // Verify that the incoming question is truly unseen before buffering
        const alreadySeen = (id && seenQuestionIds.current.has(id)) || (qText && seenQuestionIds.current.has(qText));
        if (!alreadySeen) {
          nextQuestionBuffer.current = res.data;
          return;
        }
      }
    } catch (err) {
      // quiet fallback
    }
    if (!nextQuestionBuffer.current) {
      nextQuestionBuffer.current = getFallbackQuestion(topic, seenQuestionIds.current);
    }
  };

  const loadQuestion = (topic = selectedTopic, difficulty = selectedDifficulty) => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);

    let next = null;

    // Check if buffer has a ready question that is genuinely unseen
    if (nextQuestionBuffer.current && (nextQuestionBuffer.current.topic === topic || topic === 'ALL' || nextQuestionBuffer.current.topic === 'CURRENT_AFFAIRS')) {
      const cand = nextQuestionBuffer.current;
      const id = cand.id ? String(cand.id).toLowerCase() : null;
      const qText = cand.question ? cand.question.trim().toLowerCase() : null;
      const alreadySeen = (id && seenQuestionIds.current.has(id)) || (qText && seenQuestionIds.current.has(qText));
      if (!alreadySeen) {
        next = cand;
      }
    }
    nextQuestionBuffer.current = null;

    // If buffer was empty or contained a seen question, pick a guaranteed unseen question from fallback pool
    if (!next) {
      next = getFallbackQuestion(topic, seenQuestionIds.current);
    }

    markSeen(next);
    setCurrentQuestion(next);
    setLoading(false);
    // Immediately prefetch following question in the background with updated exclusion list
    prefetchNextQuestion(topic, difficulty);
  };

  const handleTopicChange = (newTopic) => {
    setSelectedTopic(newTopic);
    nextQuestionBuffer.current = null;
    loadQuestion(newTopic, selectedDifficulty);
  };

  const handleDifficultyChange = (newDiff) => {
    setSelectedDifficulty(newDiff);
    nextQuestionBuffer.current = null;
    loadQuestion(selectedTopic, newDiff);
  };

  const handleSelectOption = (option) => {
    if (isAnswered || loading || !currentQuestion) return;

    setSelectedOption(option);
    setIsAnswered(true);

    const correct = option.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
    setIsCorrect(correct);
    const newAnswered = totalAnswered + 1;
    setTotalAnswered(newAnswered);

    if (correct) {
      playSound('correct');
      const newStreak = streak + 1;
      setStreak(newStreak);
      const newBestStreak = Math.max(bestStreak, newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      const basePoints = selectedDifficulty === 'HARD' ? 30 : selectedDifficulty === 'MEDIUM' ? 20 : 10;
      const streakBonus = Math.min(newStreak * 5, 25);
      const newScore = score + basePoints + streakBonus;
      setScore(newScore);
      const newCorrect = totalCorrect + 1;
      setTotalCorrect(newCorrect);

      // Persist updated score & stats to database
      syncScoreToDb(newScore, newStreak, newBestStreak, newAnswered, newCorrect);

      // Auto-advance after 1.1s on victory (snappy gamified transition)
      autoAdvanceTimer.current = setTimeout(() => {
        loadQuestion();
      }, 1100);
    } else {
      playSound('wrong');
      setStreak(0);
      // Persist stats on wrong answer too (streak resets, totalAnswered increments)
      syncScoreToDb(score, 0, bestStreak, newAnswered, totalCorrect);
      // On wrong answer, do NOT auto-advance so user can read explanation
    }
  };

  const renderTopicIcon = (iconName) => {
    switch (iconName) {
      case 'Globe': return <Globe size={15} />;
      case 'Landmark': return <Landmark size={15} />;
      case 'Film': return <Film size={15} />;
      case 'MapPin': return <MapPin size={15} />;
      case 'Scroll': return <Scroll size={15} />;
      case 'Atom': return <Atom size={15} />;
      case 'Trophy': return <Trophy size={15} />;
      default: return <Sparkles size={15} />;
    }
  };

  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 100;

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* 1. Header & Live Game Stats */}
      <div style={{
        background: '#0b0f19',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '20px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                <Sparkles size={12} />
                AI Real-Time Quiz Studio
              </span>
              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                <Zap size={12} />
                Daily Live AI Feed • 2026
              </span>
              {savedToCloud && (
                <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                  <Award size={12} />
                  Score Stored in DB
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px', margin: 0 }}>
              AI General Knowledge Studio
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Daily Current Affairs, Politics, Cinema, Cities, History, Science & Sports. Questions are dynamic & in-memory — only your score & statistics are stored in the database.
            </p>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute sound effects" : "Unmute sound effects"}
            style={{
              background: soundEnabled ? 'rgba(99, 102, 241, 0.15)' : '#111827',
              color: soundEnabled ? '#818cf8' : '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>
        </div>

        {/* Live HUD Stats (Score, Streak, Accuracy) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          background: '#070b14',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '12px 16px'
        }}>
          {/* Score */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Score</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>{score} <span style={{ fontSize: '11px', color: '#818cf8' }}>pts</span></span>
            <span style={{ fontSize: '10px', color: '#10b981', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>● Saved in Database</span>
          </div>

          {/* Current Streak */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Current Streak</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: streak > 2 ? '#f59e0b' : '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {streak > 0 && <Flame size={18} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.8))' }} />}
              {streak} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>🔥</span>
            </span>
          </div>

          {/* Accuracy */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Accuracy</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#34d399' }}>{accuracy}%</span>
          </div>

          {/* Total Answered */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Answered</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>{totalCorrect} / {totalAnswered}</span>
          </div>
        </div>
      </div>

      {/* 2. Topic Selector Pills */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px',
        WebkitOverflowScrolling: 'touch'
      }}>
        {topics.map(t => {
          const active = selectedTopic === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTopicChange(t.id)}
              style={{
                background: active ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' : '#0b0f19',
                color: active ? '#ffffff' : '#94a3b8',
                border: active ? '1px solid #818cf8' : '1px solid var(--border)',
                borderRadius: '999px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: active ? '0 0 14px rgba(99, 102, 241, 0.4)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {renderTopicIcon(t.icon)}
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Difficulty Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Difficulty:</span>
          {['EASY', 'MEDIUM', 'HARD'].map(d => (
            <button
              key={d}
              onClick={() => handleDifficultyChange(d)}
              style={{
                background: selectedDifficulty === d ? 'rgba(56, 189, 248, 0.2)' : '#070b14',
                color: selectedDifficulty === d ? '#38bdf8' : '#64748b',
                border: selectedDifficulty === d ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {d}
            </button>
          ))}
        </div>

        <button
          onClick={() => loadQuestion()}
          disabled={loading}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          <RefreshCw size={13} className={loading ? "spin" : ""} />
          <span>Skip / New Question</span>
        </button>
      </div>

      {/* 4. Question & Options Display Card */}
      <div style={{
        background: '#0b0f19',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '24px 20px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <RefreshCw size={28} className="spin" color="#818cf8" />
            <p style={{ fontSize: '15px', color: '#ffffff', fontWeight: '700' }}>Synthesizing fresh AI GK question...</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Querying topic: {selectedTopic}</p>
          </div>
        ) : currentQuestion ? (
          <>
            {/* Question Header */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="badge badge-purple" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                  {currentQuestion.topic || selectedTopic}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Difficulty: <strong style={{ color: '#ffffff' }}>{currentQuestion.difficulty || selectedDifficulty}</strong>
                </span>
              </div>

              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', lineHeight: '1.5' }}>
                {currentQuestion.question}
              </h2>
            </div>

            {/* 4 Clickable Options */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {currentQuestion.options?.map((option, idx) => {
                const optLetter = String.fromCharCode(65 + idx); // A, B, C, D
                const isSelected = selectedOption === option;
                const isCorrectOption = option.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();

                let bg = '#070b14';
                let border = '1px solid var(--border)';
                let color = '#f8fafc';
                let shadow = 'none';

                if (isAnswered) {
                  if (isCorrectOption) {
                    bg = 'rgba(16, 185, 129, 0.2)';
                    border = '2px solid #10b981';
                    color = '#34d399';
                    shadow = '0 0 16px rgba(16, 185, 129, 0.4)';
                  } else if (isSelected && !isCorrectOption) {
                    bg = 'rgba(239, 68, 68, 0.2)';
                    border = '2px solid #ef4444';
                    color = '#fca5a5';
                    shadow = '0 0 16px rgba(239, 68, 68, 0.4)';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(option)}
                    disabled={isAnswered}
                    style={{
                      background: bg,
                      border: border,
                      borderRadius: '10px',
                      padding: '14px 16px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      cursor: isAnswered ? 'default' : 'pointer',
                      boxShadow: shadow,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      outline: 'none',
                      transform: isSelected && isCorrect ? 'scale(1.02)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        background: isAnswered && isCorrectOption ? '#10b981' : isAnswered && isSelected ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {optLetter}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: color }}>
                        {option}
                      </span>
                    </div>

                    {isAnswered && (
                      <div>
                        {isCorrectOption && <CheckCircle2 size={20} color="#10b981" />}
                        {isSelected && !isCorrectOption && <XCircle size={20} color="#ef4444" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Victory Auto-Advance Banner */}
            {isAnswered && isCorrect && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: '700', fontSize: '13px' }}>
                  <CheckCircle2 size={18} />
                  <span>Correct! Streak: {streak} 🔥 (+{selectedDifficulty === 'HARD' ? 30 : selectedDifficulty === 'MEDIUM' ? 20 : 10} pts)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#a7f3d0' }}>
                  <span>Next question in 1.1s...</span>
                  <button
                    type="button"
                    onClick={() => loadQuestion()}
                    className="btn-success"
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                  >
                    Next ➜
                  </button>
                </div>
              </div>
            )}

            {/* Wrong Answer Explanation Card */}
            {isAnswered && !isCorrect && (
              <div style={{
                background: '#070b14',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: '800', fontSize: '14px' }}>
                    <XCircle size={18} />
                    <span>Incorrect! Correct Answer: <strong style={{ color: '#34d399' }}>{currentQuestion.correctAnswer}</strong></span>
                  </div>

                  <button
                    type="button"
                    onClick={() => loadQuestion()}
                    className="btn-primary"
                    style={{
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Next Question</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#cbd5e1'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#38bdf8', marginBottom: '6px' }}>
                    <BookOpen size={15} />
                    <span>Detailed Context & Explanation:</span>
                  </div>
                  <p style={{ margin: 0 }}>{currentQuestion.explanation}</p>
                </div>

                {currentQuestion.funFact && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '12px',
                    color: '#fde68a',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <Lightbulb size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ color: '#ffffff' }}>Did You Know? </strong>
                      <span>{currentQuestion.funFact}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
            <p>No question available right now.</p>
            <button onClick={() => loadQuestion()} className="btn-primary" style={{ marginTop: '10px' }}>
              Load Question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
