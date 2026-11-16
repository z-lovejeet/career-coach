// Practice catalogue: academic subjects and placement-test sections.

export interface Subject { id: string; name: string; group: "academic" | "placement"; blurb: string; topics: string[] }

export const SUBJECTS: Subject[] = [
  { id: "dsa", name: "Data Structures & Algorithms", group: "academic", blurb: "Complexity, core structures and classic techniques.",
    topics: ["Arrays & Strings", "Linked Lists", "Stacks & Queues", "Hashing", "Trees & BST", "Heaps", "Graphs", "Sorting & Searching", "Recursion & Backtracking", "Dynamic Programming", "Greedy Algorithms", "Time Complexity"] },
  { id: "os", name: "Operating Systems", group: "academic", blurb: "Processes, scheduling, memory and concurrency.",
    topics: ["Processes & Threads", "CPU Scheduling", "Synchronization", "Deadlocks", "Memory Management", "Virtual Memory & Paging", "File Systems"] },
  { id: "dbms", name: "Database Systems", group: "academic", blurb: "Relational model, SQL and transactions.",
    topics: ["ER Model", "Relational Algebra", "SQL Queries", "Normalization", "Transactions & ACID", "Concurrency Control", "Indexing & B+ Trees"] },
  { id: "cn", name: "Computer Networks", group: "academic", blurb: "Layers, protocols and addressing.",
    topics: ["OSI & TCP/IP Models", "IP Addressing & Subnetting", "TCP vs UDP", "Routing", "DNS, HTTP & TLS", "Congestion & Flow Control"] },
  { id: "oop", name: "Object-Oriented Programming", group: "academic", blurb: "Design principles used in every interview.",
    topics: ["Classes & Objects", "Inheritance", "Polymorphism", "Abstraction & Interfaces", "SOLID Principles", "Design Patterns"] },
  { id: "ml", name: "Machine Learning", group: "academic", blurb: "Models, evaluation and the maths behind them.",
    topics: ["Supervised Learning", "Regression", "Classification", "Model Evaluation & Metrics", "Bias–Variance & Regularization", "Decision Trees & Ensembles", "Neural Networks", "Unsupervised Learning"] },
  { id: "maths", name: "Engineering Mathematics", group: "academic", blurb: "Probability, linear algebra and discrete maths.",
    topics: ["Probability", "Statistics", "Linear Algebra", "Discrete Mathematics", "Calculus"] },
  { id: "quant", name: "Quantitative Aptitude", group: "placement", blurb: "The numbers section of every placement test.",
    topics: ["Percentages", "Profit & Loss", "Ratio & Proportion", "Time & Work", "Time, Speed & Distance", "Simple & Compound Interest", "Permutations & Combinations", "Probability (Aptitude)", "Averages & Mixtures", "Number System"] },
  { id: "logical", name: "Logical Reasoning", group: "placement", blurb: "Patterns, arrangements and deductions.",
    topics: ["Number & Letter Series", "Coding–Decoding", "Blood Relations", "Syllogisms", "Seating Arrangement", "Direction Sense", "Puzzles", "Data Sufficiency"] },
  { id: "verbal", name: "Verbal Ability", group: "placement", blurb: "Grammar, vocabulary and comprehension.",
    topics: ["Sentence Correction", "Synonyms & Antonyms", "Reading Comprehension", "Para Jumbles", "Fill in the Blanks", "Idioms & Phrases"] },
  { id: "code", name: "Programming & Output", group: "placement", blurb: "Predict output, spot bugs, reason about code.",
    topics: ["C / C++ Output", "Java Fundamentals", "Python Fundamentals", "Pointers & Memory", "Code Complexity", "Debugging Snippets"] },
];

export function findSubject(idOrName: string) {
  return SUBJECTS.find((s) => s.id === idOrName || s.name.toLowerCase() === idOrName.toLowerCase());
}

export const SECONDS_PER_QUESTION = { easy: 45, medium: 75, hard: 120 } as const;
