# Architecture Diagram

Current architecture of the Accessibility Analyzer (grounded in the live code, 2026-09-08).

## 1. High-level system

```mermaid
flowchart TD
    USER["User Browser"]

    subgraph CLIENT["Client — React 19 SPA (Vite + MUI 7)"]
        UI["UI Components<br/>Home · Login · Dashboard · Results · History"]
        CONTEXT["Contexts<br/>AuthContext · ThemeContext"]
        API["apiClient (fetch)<br/>JWT Bearer + X-CSRF-Token<br/>30s timeout · 401 redirect · offline handling"]
        CHATBOT["AiChatbot<br/>(lazy, authenticated users only)"]
        UPLOAD["UploadCard<br/>URL · File · HTML + WCAG options"]
    end

    subgraph SERVER["Server — FastAPI (main.py)"]
        MW["Middleware chain<br/>RequestContext → CORS → GZip → Cache →<br/>SecurityHeaders → RequestSizeLimit(6MB) → CSRF"]
        RATE["Rate Limiting (slowapi)<br/>/token 5/min · /ai 30/min · /analyze 10/min"]
        AUTH["Auth — JWT HS256 + bcrypt<br/>/token /register /demo-login /forgot-password /reset-password"]
        SCAN["Analyzer Service<br/>/analyze/url /analyze/html /analyze/file"]
        AI["AI Service<br/>/ai/chat /ai/explain /ai/summary"]
        HIST["History & User<br/>/history /users/me"]
    end

    subgraph SCANENGINE["Scan Engine (analyzer/)"]
        SSRF["SSRF Guard<br/>per-request page.route"]
        LOOP["_ScanLoop thread<br/>Proactor loop · warm Chromium"]
        SEM["Semaphore<br/>SCAN_CONCURRENCY=3"]
        AXE["axe-core<br/>(vendored, WCAG tags)"]
    end

    subgraph DATA["Data Layer"]
        MONGO[(MongoDB<br/>Motor · pooling 5-50)]
    end

    API -->|"HTTP/REST"| MW
    MW --> RATE
    RATE --> AUTH
    RATE --> SCAN
    RATE --> AI
    RATE --> HIST
    SCAN --> SSRF --> SEM --> LOOP --> AXE
    AI -->|"context + topic guard"| FILTER["content_filter.py<br/>tolerant guard"]
    FILTER -->|"allowed"| GEMINI["Gemini API<br/>gemini-2.5-flash"]
    SCAN -->|"sanitized results"| MONGO
    AI -->|"cached per user"| MONGO
    AUTH -->|"users · password_reset_tokens"| MONGO
    HIST -->|"analyses"| MONGO

    classDef client fill:#e8f0fe,stroke:#4361ee,stroke-width:2px;
    classDef server fill:#f3e8fd,stroke:#7209b7,stroke-width:2px;
    classDef engine fill:#fff7e6,stroke:#e85d04,stroke-width:2px;
    classDef data fill:#e6f9ee,stroke:#2b9348,stroke-width:2px;
    classDef external fill:#fde2e4,stroke:#d62828,stroke-width:2px;
    class USER,UI,CONTEXT,API,CHATBOT,UPLOAD client;
    class MW,RATE,AUTH,SCAN,AI,HIST server;
    class SSRF,LOOP,SEM,AXE engine;
    class MONGO data;
    class FILTER,GEMINI external;
```

## 2. Scan pipeline (analysis flow)

```mermaid
sequenceDiagram
    participant U as User
    participant C as React SPA
    participant B as FastAPI
    participant G as SSRF Guard
    participant P as Playwright (warm Chromium)
    participant X as axe-core
    participant M as MongoDB

    U->>C: Upload URL / file / HTML (+ WCAG opts)
    C->>B: POST /analyze/url (Bearer + CSRF)
    Note over B: acquire SCAN_CONCURRENCY=3 semaphore
    B->>P: schedule on _ScanLoop (Proactor thread)
    P->>G: navigate to target
    G-->>P: allow (blocked private/redirect if unsafe)
    P->>P: create context/page (1280x720)
    P->>X: inject axe-core
    X-->>P: axe.run(tags) → violations
    P-->>B: results
    B->>B: sanitize nodes[].html
    B->>M: insert (owner_email scoped)
    B-->>C: results + id
    C-->>U: ResultsPage (score, violations, export)
```

## 3. AI chat flow (guarded)

```mermaid
sequenceDiagram
    participant U as User
    participant C as Chatbot (React)
    participant B as FastAPI /ai/chat
    participant F as content_filter
    participant G as Gemini
    participant M as MongoDB (cache)

    U->>C: message
    C->>B: {message, context}
    B->>F: filter_user_query(query, context)
    alt harmful
        F-->>B: reject
        B-->>C: friendly rejection (as content)
    else unrelated but no a11y signal
        F-->>B: reject
        B-->>C: friendly rejection
    else accessibility-related (keyword, fuzzy, or context follow-up)
        F-->>B: allow
        B->>G: chat completion
        G-->>B: reply
        B-->>C: reply
    else ambiguous
        F-->>B: allow (permissive default)
        B->>G: chat completion
        G-->>B: reply
        B-->>C: reply
    end
```

## 4. Security & ops notes

- CSRF: signed token via `GET /csrf-token`; checked on every state-changing request except `/token` and `/demo-login` (JWT protects those).
- SSRF: per-request `page.route` guards all page requests, redirects and subresources (DNS-rebinding safe).
- Headers: `nosniff`, `DENY`, `frame-ancestors 'none'`, Permissions-Policy; CSP on index; HSTS behind TLS.
- Deploy: Docker `mcr.microsoft.com/playwright/python:v1.41.1-jammy`, non-root `appuser` (uid 1001); Railway/Render; CI backend job pinned `ubuntu-22.04`.