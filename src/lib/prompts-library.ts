export interface PromptItem {
  category: string;
  title: string;
  prompt: string;
}

export const PROMPT_LIBRARY: PromptItem[] = [
  // Coding
  { category: "Coding", title: "Code Review", prompt: "Review the following code for bugs, security issues, performance, and idiomatic style. Suggest concrete fixes:\n\n```\n<paste code here>\n```" },
  { category: "Coding", title: "Explain Code", prompt: "Explain what this code does line-by-line, then summarize its purpose and time/space complexity:\n\n```\n<paste code>\n```" },
  { category: "Coding", title: "Convert Language", prompt: "Convert this code to <Rust/Go/Python/TS> keeping behavior identical. Note any idiomatic differences:" },
  { category: "Coding", title: "Write Tests", prompt: "Write thorough unit tests (happy path, edge cases, error cases) for the following function using <Vitest/Jest/Pytest>:" },
  { category: "Coding", title: "Refactor", prompt: "Refactor this code for readability and performance without changing behavior. Explain each change:" },
  { category: "Coding", title: "Regex Builder", prompt: "Build a regex that matches <describe> and explain each group. Provide JS, Python, and PCRE flavors." },
  { category: "Coding", title: "SQL Optimizer", prompt: "Optimize this SQL query for Postgres. Show EXPLAIN ANALYZE expectations and suggest indexes:" },
  { category: "Coding", title: "Bug Hunter", prompt: "I'm getting this error: <paste error>. Here's the relevant code: <paste>. Diagnose root cause and give the minimal fix." },
  { category: "Coding", title: "API Design", prompt: "Design a REST API for <feature>. Include endpoints, payloads, status codes, auth, and rate-limit strategy." },
  { category: "Coding", title: "System Design", prompt: "Design a scalable system for <e.g. Twitter feed>. Cover data model, caching, queues, sharding, and trade-offs." },

  // Writing
  { category: "Writing", title: "Cold Email", prompt: "Write a 4-sentence cold email to <persona> selling <product>. Make it sound human, not AI. Include 3 subject line variants." },
  { category: "Writing", title: "LinkedIn Post", prompt: "Write a punchy LinkedIn post about <topic>. Hook in line 1, story in middle, lesson at end. Add 3 hashtags." },
  { category: "Writing", title: "Tweet Thread", prompt: "Write a viral 8-tweet thread about <topic>. Each tweet under 280 chars, builds curiosity, ends with a strong CTA." },
  { category: "Writing", title: "Blog Outline", prompt: "Create a detailed blog post outline on <topic> with H2/H3 structure, target keyword, and meta description." },
  { category: "Writing", title: "Resume Bullet", prompt: "Rewrite this resume bullet using strong verbs + metrics (X% / $Y / Z users): <paste>" },
  { category: "Writing", title: "Cover Letter", prompt: "Write a 3-paragraph cover letter for <role> at <company>. My background: <paste>. Match their job description." },

  // Learning
  { category: "Learning", title: "ELI5", prompt: "Explain <concept> like I'm 5, then like I'm a college student, then like I'm a domain expert." },
  { category: "Learning", title: "Roadmap", prompt: "Create a 30-day learning roadmap to master <skill>. Daily breakdown with resources (books, courses, projects)." },
  { category: "Learning", title: "Flashcards", prompt: "Generate 20 Anki-style flashcards (Q/A) covering the key concepts of <topic>." },
  { category: "Learning", title: "Mental Models", prompt: "List 10 mental models from <field> with a one-line explanation and a concrete example for each." },
  { category: "Learning", title: "Quiz Me", prompt: "Quiz me on <topic>. 10 questions, increasing difficulty. Wait for my answer before giving the next one." },

  // Business
  { category: "Business", title: "SWOT Analysis", prompt: "Do a detailed SWOT analysis for <business/product>. Include actionable next steps for each quadrant." },
  { category: "Business", title: "Pricing Strategy", prompt: "Recommend a pricing strategy for <product> targeting <ICP>. Consider value-based, freemium, tiered. Suggest exact prices." },
  { category: "Business", title: "Growth Loops", prompt: "Design 3 viral growth loops for <product>. Map the inputs, actions, and outputs. Estimate K-factor." },
  { category: "Business", title: "Competitor Analysis", prompt: "Compare <product> vs <competitor>. Cover positioning, pricing, features, weaknesses, opportunities to win." },
  { category: "Business", title: "Investor Pitch", prompt: "Write a 60-second elevator pitch and a 10-slide pitch deck outline for <startup>. Include traction, ask, use of funds." },

  // Creative
  { category: "Creative", title: "Story Plot", prompt: "Generate 3 unique story plots in the <genre> genre using the 'save the cat' beat structure." },
  { category: "Creative", title: "Character Sheet", prompt: "Create a deep character profile for <name>: backstory, motivation, fatal flaw, arc, speech patterns, key relationships." },
  { category: "Creative", title: "World Build", prompt: "Build a fictional world for <setting>. Cover geography, factions, economy, magic/tech system, central conflict." },
  { category: "Creative", title: "Brand Names", prompt: "Generate 20 brand name ideas for <product>. Mix invented words, metaphors, and compound names. Check .com availability assumption." },
  { category: "Creative", title: "Logo Concept", prompt: "Suggest 5 logo concept directions for <brand> in <industry>. Describe shape, color palette (hex), and meaning." },

  // Life
  { category: "Life", title: "Meal Plan", prompt: "Build a 7-day meal plan: <kcal>/day, <diet>, budget-friendly, max 30 min prep. Include grocery list." },
  { category: "Life", title: "Workout Plan", prompt: "Design a 4-week workout plan for <goal>. Equipment: <home/gym>. Frequency: <X> days/week. Include progression." },
  { category: "Life", title: "Travel Plan", prompt: "Plan a <N>-day trip to <destination> for <budget>. Day-by-day itinerary, must-see spots, local food, transit tips." },
  { category: "Life", title: "Habit Stack", prompt: "Design a morning habit stack to achieve <goal> in 90 days. Atomic Habits style — cue, craving, response, reward." },

  // AI Hacks
  { category: "AI", title: "Prompt Improver", prompt: "Take this rough prompt and turn it into a world-class prompt with role, context, format, constraints, examples:\n\n<your rough prompt>" },
  { category: "AI", title: "Chain of Thought", prompt: "Solve <problem> step by step. Think out loud, consider alternatives, then commit to an answer. Show your reasoning." },
  { category: "AI", title: "Tree of Thoughts", prompt: "For <problem>, generate 3 different approaches. Evaluate pros/cons of each. Pick the best and execute it." },
  { category: "AI", title: "Self-Critique", prompt: "Answer <question>, then critique your own answer harshly, then write a v2 fixing the weaknesses." },
  { category: "AI", title: "Persona Stack", prompt: "Answer <question> from 3 perspectives: a skeptic, an expert, a beginner. Then synthesize." },

  // Research
  { category: "Research", title: "Literature Sweep", prompt: "Summarize the current state of research on <topic>. Key papers, consensus, open questions, contrarian views." },
  { category: "Research", title: "Compare Options", prompt: "Compare <A> vs <B> vs <C> for <use case>. Build a decision matrix with weighted criteria." },
  { category: "Research", title: "Steelman", prompt: "Build the strongest possible case FOR <position>, then the strongest case AGAINST. Then give your verdict with reasoning." },

  // Data
  { category: "Data", title: "CSV → Insights", prompt: "Here's CSV data:\n<paste>\n\nFind patterns, outliers, and 3 actionable insights. Suggest charts to visualize." },
  { category: "Data", title: "JSON Schema", prompt: "Infer a strict JSON schema (with types, required fields, enums) from this sample data:\n<paste>" },
  { category: "Data", title: "SQL Query", prompt: "Write a SQL query that <describe goal>. Tables and columns:\n<paste schema>" },
];

export const PROMPT_CATEGORIES = Array.from(new Set(PROMPT_LIBRARY.map((p) => p.category)));
