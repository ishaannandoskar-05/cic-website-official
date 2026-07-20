# Proposed Deployment Solution  
**Render + Redpanda Docker Sandbox (Free Tier)**

---

## 1. Objective

Design a **free, reliable Docker-based sandbox deployment** using Render that avoids service inactivity (sleep) while supporting an **event-driven architecture** with Redpanda.

This solution is intended for:
- Learning & experimentation
- College / demo projects
- Microservices & Kafka-style pipelines
- Low-cost proof-of-concepts

---

## 2. Problem Statement

Render’s free-tier web services automatically **sleep after inactivity**.  
The following approaches **do not prevent sleep**:
- Internal cronjobs
- Background loops
- Self-HTTP calls
- Internal container traffic (e.g., Redpanda events)

This leads to:
- API downtime
- Message broker instability
- Consumer/producer failures

---

## 3. Proposed Solution (High-Level)

Use **explicit external programming** to send **periodic HTTP requests** to the Render service, ensuring it always registers as active.

### Key Principle
> **Only external inbound HTTP traffic prevents inactivity on Render.**

---

## 4. Architecture Overview

```text
[ GitHub Actions (External Scheduler) ]
                |
                v
[ API Web Service (Docker on Render) ]
        |                    |
        v                    v
[ /health endpoint ]   [ Redpanda Broker ]