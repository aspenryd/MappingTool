# Tech Stack Architecture

This document outlines the recommended technology stack and architecture patterns for modern full-stack web applications. It serves as a reusable template for new projects.

---

## 1. Architecture Overview

### Clean Architecture Pattern
The solution follows **Clean Architecture** principles with clear separation of concerns:

```
┌──────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────────────┐    ┌────────────────────────────┐  │
│  │   Web (Frontend)     │    │   API (Backend REST)       │  │
│  │   React + TypeScript │    │   ASP.NET Core             │  │
│  └──────────────────────┘    └────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│              Services, DTOs, Business Logic                  │
└──────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                        Domain Layer                          │
│               Entities, Interfaces, Value Objects            │
└──────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                      │
│        Data Access, External Services, File Storage          │
└──────────────────────────────────────────────────────────────┘
```

### Project Structure

```
├── [AppName].Api             # Backend REST API layer
├── [AppName].Core            # Domain layer (Entities, Interfaces)
├── [AppName].Infrastructure  # Implementation layer (Data, Services)
├── [AppName].Integrations    # Integration dependencies (consumed APIs, external services)
├── [AppName].Tests           # Unit and Integration tests
├── [AppName].Web             # Frontend application
└── docs                      # Documentation
```

---

## 2. Backend Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **ASP.NET Core** | .NET 8/9+ | Web API framework |
| **Entity Framework Core** | 8.x+ | ORM / Data Access |
| **C#** | 12+ | Primary language |

### Data Layer
*   **Production Database**: SQL Server, PostgreSQL, or Azure SQL
*   **Development Database**: In-Memory or SQLite (for rapid testing)
*   **Migrations**: EF Core Migrations for schema versioning

### Key Dependencies

| Package | Purpose |
|---------|---------|
| **Swashbuckle / Scalar** | OpenAPI documentation |
| **Microsoft.Identity.Web** | Azure AD / OAuth authentication |
| **Moq** | Unit test mocking |
| **xUnit** | Testing framework |
| **FuzzySharp** | Fuzzy string matching / AI suggestions |

### API Design Principles
*   **REST-based**: Follow RESTful conventions for resource endpoints
*   **OpenAPI Spec**: Generate and maintain OpenAPI specification for contract
*   **Versioning**: Support API versioning (URL path or header-based)
*   **DTOs**: Use Data Transfer Objects to decouple API contracts from entities

---

## 3. Frontend Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19+ | UI Library |
| **TypeScript** | 5.x+ | Type-safe JavaScript |
| **Jest** | Testing framework |
| **ESLint** | 9+ | Config |

### UI & Visualization
| Package | Purpose |
|---------|---------|
| **React Flow** | Node-based visual editor / Canvas |
| **Tailwind CSS** | 4 | Styling |

### State Management
*   **Local State**: React `useState` / `useReducer` for component state
*   **Server State**: **TanStack Query (React Query)** for API data caching
*   **Complex State**: **Zustand** or Context API for cross-component state

### Key Development Practices
*   **Generated API Client**: Auto-generate TypeScript client from OpenAPI spec
*   **Type Safety**: Strict TypeScript configuration
*   **Component Architecture**: Composable, reusable components

---

## 4. Authentication & Identity

### Development Environment
*   **DevAuth**: Simplified JWT-based authentication for local development
*   **No External Dependencies**: Works without cloud services

### Production Environment
| Provider | Configuration |
|----------|---------------|
| **Azure AD** | OIDC / OAuth 2.0 integration |
| **AWS Cognito** | Alternative cloud provider |
| **Custom OIDC** | Any OIDC-compliant provider |

### Implementation
*   **Backend**: `Microsoft.Identity.Web` or custom JWT validation middleware
*   **Frontend**: Token management in memory, secure HTTP-only cookies

---

## 5. Infrastructure Services

### File Storage
| Environment | Implementation |
|-------------|----------------|
| Development | **LocalFileStorageService** (file system) |
| Production | **Azure Blob Storage** / **AWS S3** |

*   Abstract behind `IFileStorageService` interface for environment switching

### Schema Parsing Services
*   **JSON Schema Parser**: Parse JSON Schema (Draft 4+)
*   **XSD Schema Parser**: Parse XML Schema Definition files
*   Both produce standardized `FieldDefinition` output

### AI / Matching Services
*   **Fuzzy Matching**: FuzzySharp for intelligent field matching
*   **Configurable Thresholds**: Matching sensitivity as configuration

---

## 6. Testing Strategy

### Backend Tests
| Type | Framework | Coverage |
|------|-----------|----------|
| **Unit Tests** | xUnit + Moq | Services, Business Logic |
| **Integration Tests** | xUnit + TestServer | API endpoints, Data access |

### Frontend Tests
| Type | Framework | Coverage |
|------|-----------|----------|
| **Unit Tests** | Jest | Utilities, Hooks |
| **Component Tests** | React Testing Library | Component rendering |
| **E2E Tests** | Playwright / Cypress | User flows |

### Testing Principles
*   **Mocking**: Use MSW (Mock Service Worker) for frontend API mocking
*   **In-Memory DB**: Use EF Core In-Memory provider for fast test isolation
*   **CI Integration**: All tests run in CI/CD pipeline

---

## 7. Development Workflow

### Prerequisites
*   **.NET SDK** (8.0 or 9.0+)
*   **Node.js** (LTS version)
*   **npm** (or yarn/pnpm)

### Running Locally

1. **Backend API**
   ```bash
   dotnet restore
   dotnet run --project [AppName].Api --urls "http://localhost:5000"
   ```
   *Swagger/Scalar UI available at `/scalar/v1`*

2. **Frontend Dev Server**
   ```bash
   cd [AppName].Web
   npm install
   npm run dev
   ```
   *Runs at `http://localhost:3000`*

### API Documentation
*   **Development**: Interactive Swagger/Scalar UI
*   **Production**: Disable or protect documentation endpoints
*   **OpenAPI Export**: Maintain `openapi.json` / `openapi.yaml` in docs

---

## 8. Environment Configuration

### Configuration Hierarchy
1. `appsettings.json` - Default settings
2. `appsettings.{Environment}.json` - Environment overrides
3. **Environment Variables** - Runtime overrides (secrets)
4. **Secrets Manager** - Production secrets (Azure Key Vault, AWS Secrets Manager)

### Key Configuration Areas
| Area | Settings |
|------|----------|
| **Database** | Connection strings, provider |
| **Authentication** | Identity provider config, JWT settings |
| **Storage** | Blob storage connection, local paths |
| **Features** | Feature flags, toggles |

---

## 9. Deployment Architecture

### Container Support
*   **Docker**: Multi-stage Dockerfile for optimized builds
*   **Compose**: Local multi-service development

### Cloud Platforms

| Platform | Backend | Frontend | Database |
|----------|---------|----------|----------|
| **Azure** | App Service / Container Apps | Static Web Apps | Azure SQL |
| **AWS** | ECS / App Runner | CloudFront + S3 | RDS |
| **Generic** | Kubernetes | CDN + Object Storage | Managed SQL |

### CI/CD Pipeline Stages
1. **Build**: Compile, transpile, bundle
2. **Test**: Run all test suites
3. **Security Scan**: SAST, dependency audit
4. **Publish**: Create artifacts
5. **Deploy**: Environment-specific deployment

---

## Summary

| Layer | Primary Technology | Alternative |
|-------|-------------------|-------------|
| **Frontend** | React + TypeScript + Vite | Vue.js, Angular |
| **Backend API** | ASP.NET Core (.NET 9) | Node.js, Go |
| **ORM** | Entity Framework Core | Dapper |
| **Database** | SQL Server / PostgreSQL | MongoDB (if document-based) |
| **Auth** | Azure AD / OIDC | Auth0, Keycloak |
| **File Storage** | Azure Blob / AWS S3 | Local (dev only) |
| **Testing** | xUnit, Vitest, Playwright | NUnit, Jest, Cypress |

---

> [!TIP]
> When starting a new project, copy this document and customize the specific technologies and versions to match your requirements.
