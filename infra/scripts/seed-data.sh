#!/bin/bash
set -euo pipefail

# Seed script — inserts sample question bank data for development.
# Usage: docker compose exec mongodb bash /docker-entrypoint-initdb.d/seed-data.sh
#   or:  bash infra/scripts/seed-data.sh

MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_USER="${MONGO_INITDB_ROOT_USERNAME:-ccode}"
MONGO_PASS="${MONGO_INITDB_ROOT_PASSWORD:-ccode_secret}"
MONGO_DB="${MONGO_INITDB_DATABASE:-ccode}"

echo "==> Seeding sample question bank data..."

mongosh "mongodb://${MONGO_USER}:${MONGO_PASS}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin" <<'EOJS'

const now = new Date();

// ---- Seed question bank ----
db.question_banks.insertMany([
    {
        name: "General Programming Fundamentals",
        category: "programming",
        description: "Core programming concepts covering variables, loops, functions, and data structures.",
        questionCount: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now
    },
    {
        name: "Data Structures & Algorithms",
        category: "dsa",
        description: "Questions on arrays, linked lists, trees, graphs, sorting, and searching algorithms.",
        questionCount: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now
    },
    {
        name: "Database Management",
        category: "database",
        description: "SQL, NoSQL, normalization, indexing, and query optimization questions.",
        questionCount: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now
    }
]);

// ---- Seed sample questions ----
db.questions.insertMany([
    {
        text: "What is the time complexity of binary search on a sorted array?",
        type: "mcq",
        category: "dsa",
        difficulty: "easy",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        answer: "O(log n)",
        explanation: "Binary search divides the search space in half at each step, resulting in logarithmic time complexity.",
        tags: ["algorithms", "searching", "time-complexity"],
        metadata: { source: "seed", version: 1 },
        createdAt: now,
        updatedAt: now
    },
    {
        text: "Which data structure uses FIFO (First In, First Out) ordering?",
        type: "mcq",
        category: "dsa",
        difficulty: "easy",
        options: ["Stack", "Queue", "Binary Tree", "Hash Map"],
        answer: "Queue",
        explanation: "A queue follows FIFO ordering where the first element added is the first one removed.",
        tags: ["data-structures", "queue", "fundamentals"],
        metadata: { source: "seed", version: 1 },
        createdAt: now,
        updatedAt: now
    },
    {
        text: "Explain the difference between SQL and NoSQL databases.",
        type: "essay",
        category: "database",
        difficulty: "medium",
        options: [],
        answer: "",
        explanation: "SQL databases are relational with fixed schemas; NoSQL databases are non-relational with flexible schemas.",
        tags: ["database", "sql", "nosql", "comparison"],
        metadata: { source: "seed", version: 1 },
        createdAt: now,
        updatedAt: now
    },
    {
        text: "A linked list allows O(1) random access to elements.",
        type: "true_false",
        category: "dsa",
        difficulty: "easy",
        options: ["True", "False"],
        answer: "False",
        explanation: "Linked lists require O(n) traversal for random access since elements are not stored contiguously in memory.",
        tags: ["data-structures", "linked-list"],
        metadata: { source: "seed", version: 1 },
        createdAt: now,
        updatedAt: now
    },
    {
        text: "Write a function that reverses a singly linked list in-place.",
        type: "coding",
        category: "dsa",
        difficulty: "medium",
        options: [],
        answer: "",
        explanation: "Iterate through the list, reversing each node's next pointer to point to the previous node.",
        tags: ["algorithms", "linked-list", "coding"],
        metadata: { source: "seed", version: 1 },
        createdAt: now,
        updatedAt: now
    }
]);

// Update question counts in banks
db.question_banks.updateOne(
    { name: "Data Structures & Algorithms" },
    { $set: { questionCount: db.questions.countDocuments({ category: "dsa" }) } }
);
db.question_banks.updateOne(
    { name: "Database Management" },
    { $set: { questionCount: db.questions.countDocuments({ category: "database" }) } }
);

print("==> Seed data inserted successfully.");
print("    Question banks: " + db.question_banks.countDocuments());
print("    Questions: " + db.questions.countDocuments());
EOJS

echo "==> Seeding complete."
