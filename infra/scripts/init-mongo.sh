#!/bin/bash
set -euo pipefail

# MongoDB initialization script
# Runs automatically on first container start via /docker-entrypoint-initdb.d/

echo "==> Initializing MongoDB collections and indexes..."

mongosh --username "$MONGO_INITDB_ROOT_USERNAME" \
        --password "$MONGO_INITDB_ROOT_PASSWORD" \
        --authenticationDatabase admin \
        "$MONGO_INITDB_DATABASE" <<'EOJS'

// ---- Questions collection ----
db.createCollection("questions", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["text", "type", "category", "difficulty"],
            properties: {
                text:       { bsonType: "string", description: "Question text" },
                type:       { enum: ["mcq", "true_false", "short_answer", "essay", "coding"] },
                category:   { bsonType: "string" },
                difficulty: { enum: ["easy", "medium", "hard", "expert"] },
                options:    { bsonType: "array" },
                answer:     { bsonType: ["string", "array"] },
                explanation:{ bsonType: "string" },
                tags:       { bsonType: "array" },
                metadata:   { bsonType: "object" },
                createdAt:  { bsonType: "date" },
                updatedAt:  { bsonType: "date" }
            }
        }
    }
});

db.questions.createIndex({ category: 1, difficulty: 1 });
db.questions.createIndex({ type: 1 });
db.questions.createIndex({ tags: 1 });
db.questions.createIndex({ text: "text" });
db.questions.createIndex({ createdAt: -1 });

// ---- User responses collection ----
db.createCollection("user_responses");

db.user_responses.createIndex({ userId: 1, attemptId: 1 });
db.user_responses.createIndex({ questionId: 1 });
db.user_responses.createIndex({ attemptId: 1, questionId: 1 }, { unique: true });
db.user_responses.createIndex({ createdAt: -1 });

// ---- ML predictions / analytics collection ----
db.createCollection("ml_predictions");

db.ml_predictions.createIndex({ userId: 1, createdAt: -1 });
db.ml_predictions.createIndex({ modelVersion: 1 });
db.ml_predictions.createIndex({ predictionType: 1 });

// ---- Question bank metadata collection ----
db.createCollection("question_banks");

db.question_banks.createIndex({ name: 1 }, { unique: true });
db.question_banks.createIndex({ category: 1 });
db.question_banks.createIndex({ isActive: 1 });

// ---- Audit log collection (TTL: 90 days) ----
db.createCollection("audit_log");

db.audit_log.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
db.audit_log.createIndex({ userId: 1, action: 1 });

print("==> MongoDB initialization complete.");
EOJS
