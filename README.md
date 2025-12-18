# Claims Governance Logic Builder — MVP

## Overview

The **Claims Governance Logic Builder** is a proof-of-capability MVP that demonstrates how **Retrieval Augmented Generation (RAG)** and **Chain-of-Thought (CoT) prompting** can be used to **reliably generate governed, production-ready C# microservices** for regulated insurance claims logic.

This repository showcases how AI can operate as a **compliant engineering agent**—not just a code generator—by enforcing:
- Enterprise architectural standards
- Control Plane / Application Plane (CP/AP) segregation
- Approved data governance rules
- Automated validation and test-driven reliability

---

## Problem Statement

In regulated domains such as insurance and financial services, AI-generated code introduces risks:
- Architectural drift
- Non-deterministic logic
- PII leakage
- Undocumented or unauditable decisions

This MVP addresses those risks by combining **contextual grounding, explicit reasoning, and automated verification** to ensure AI outputs are:
- Deterministic
- Secure
- Auditable
- Platform-compliant

---

## MVP Scope

### Governance Rule Implemented
> **All Personally Identifiable Information (PII) must be masked before logging to the Claims Log Service (CLS).**

### What This MVP Demonstrates
- Deterministic enforcement of PII masking using **enterprise-approved libraries**
- Strict **Control Plane (CP) vs Application Plane (AP)** boundaries
- Explicit reasoning for complex claims decision logic
- Automated test generation and execution
- Continuous evaluation to mitigate LLM hallucination

---

## Architecture Overview
```
Jira Context Packet
        |
        v
RAG Pipeline (Vector Database)
        |
        v
Thinking Partner LLM (CoT Reasoning)
        |
        v
Code Generation LLM
        |
        v
C# Microservice + Test Suite
        |
        v
Automated Validation (LangSmith / HoneyHive)
```

---

## Key Concepts

### Retrieval Augmented Generation (RAG)

The LLM is grounded using proprietary documentation retrieved from a vector database:
- Architectural Decision Records (ADRs)
- Claims Data Governance documentation
- Platform microservice standards

This prevents architectural hallucination and enforces approved implementations.

### Chain-of-Thought (CoT) Reasoning

For complex claims logic, the LLM is required to:
1. Explicitly enumerate decision steps
2. Validate logical dependencies
3. Generate code only after reasoning is complete

This ensures correctness, explainability, and auditability.

### Control Plane vs Application Plane (CP/AP)

- **Control Plane (CP):** Platform-owned configuration and logging infrastructure  
- **Application Plane (AP):** Tenant-level claims logic and governance enforcement  

Prompt-level guardrails prevent AP code from accessing or modifying CP master configuration.

---

## Repository Structure
```
/src
  /ClaimsGovernance
    ├── ApplicationPlane
    │   └── ClaimsDataGovernanceService.cs
    ├── ControlPlane
    │   └── IClaimsLoggingClient.cs
/tests
  └── ClaimsGovernance.Tests
      └── PiiMaskingTests.cs
/docs
  └── adr
      └── data-masking.md
```

---

## How It Works

1. A **Context Packet** (e.g., Jira ticket) defines business intent.
2. The RAG pipeline retrieves approved ADRs and governance docs.
3. The Thinking Partner LLM performs Chain-of-Thought reasoning.
4. A coding-focused LLM generates:
   - C# microservice implementation
   - xUnit/NUnit test suite
5. Automated evaluation executes the tests and governance checks.
6. Failures trigger prompt refinement and regeneration.

---

## Validation & Reliability

The MVP uses automated evaluation to overcome LLM non-determinism:

- Generated tests must pass against generated code
- Custom metrics verify:
  - Approved library usage
  - CP/AP segregation
  - Absence of unmasked PII logging
- Failed runs are logged and retried automatically

Only fully compliant outputs are considered successful.

---

## Getting Started

### Prerequisites
- .NET 7+
- xUnit or NUnit
- Access to RAG vector store (ADRs + governance docs)
- LangSmith or HoneyHive (optional, for evaluation)

### Run Tests
```bash
dotnet test
```

---

## Non-Goals

- Runtime rule editing
- UI-based logic authoring
- Production data access
- Replacement of platform Control Plane systems

---

## Security & Compliance Notes

- No production PII is used
- All PII handling follows approved ADRs
- No Control Plane master configuration is accessed by Application Plane code
- All governance enforcement is test-validated

---

## Definition of Done

- All tests pass
- No architectural or governance violations
- PII masking enforced before all logging
- Deterministic output on re-runs
- Reasoning artifacts available for audit

---

## Why This Matters

This MVP demonstrates a new operating model for AI in regulated software:

- AI as a governed co-engineer
- Compliance enforced by design
- Logic that is explainable, testable, and repeatable

---

## License

Internal use only.  
Subject to enterprise security and compliance policies.
