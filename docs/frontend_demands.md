# Frontend Demands & Requirements

This document outlines the business, security, and technical requirements for the frontend application (`IntegrationMapper.Web`). It is based on the current implementation and its dependency on the `IntegrationMapper.Api`.

## 1. Business Demands

The primary goal of the frontend is to provide a user-friendly interface for designing integration mappings between systems.

### 1.1 Project Management
*   **Dashboard**: Users must be able to view a list of all existing mapping projects.
*   **Search**: Users must be able to filter projects by name or involved systems.
*   **Creation**: Users must be able to create new mapping projects by defining a name and selecting Source and Target systems.

### 1.2 Schema Management
*   **System Definition**: Users must be able to define "Systems" (e.g., ERP, CRM) that serve as sources or targets.
*   **Schema Ingestion**: The application must support ingesting schemas (JSON/XML/XSD) for these systems to define the available data structures.

### 1.3 Map Design (Core Feature)
*   **Visual Editor**: A node-based canvas (Visual Mapper) is required to represent Source and Target fields side-by-side.
*   **Drag-and-Drop**: Users should map fields by dragging connections from Source to Target nodes.
*   **Auto-Mapping**: The system should provide an "Auto-Map" feature to suggest mappings based on field names and types.
*   **Transformation Logic**: Users must be able to define transformation logic or add comments for each specific mapping connection (e.g., "Concat First + Last Name").

### 1.4 Code Generation & Export
*   **Real-time Preview**: Users should be able to view the generated C# mapping code in real-time within the browser.
*   **Download**: The application must support downloading the mapping definition as:
    *   Executable C# code (`.cs`).
    *   Documentation/Specification Excel sheets (`.xlsx`).

## 2. Security Demands

### 2.1 Authentication & Authorization
*   **Identity Provider**: Integration with the backend's authentication system (currently implemented via `DevAuth` and future-proofed for OAuth/OIDC).
*   **Token Management**: The frontend must securely handle access tokens (Bearer tokens) for all API requests. Tokens should not be stored in `localStorage` if possible (in-memory or secure cookie preferred).
*   **Route Protection**: Unauthenticated users must be redirected to the login page. App routes (`/projects`, `/editor`) must be guarded.

### 2.2 Data Security
*   **Input Validation**: All user inputs (project names, logic scripts) must be validated on the client side before submission to prevent injection attacks or invalid state.
*   **Safe Execution**: Generated code requires safe handling. The frontend serves as a clear separation layer; it must not execute arbitrary code from the backend but rather display it.

## 3. Technical Requests & Suggestions

### 3.1 Architecture
*   **API Dependency**: The frontend MUST be strictly dependent on the Backend API. It should not implement business logic for mapping generation but rather consume the API's endpoints.
*   **Generated Client**: The API client should be auto-generated from the Open API specification (`openapi.json`) to ensure type safety and strict contract adherence.

### 3.2 State Management
*   **Server State Sync**: Use libraries like **TanStack Query (React Query)** for managing server state (Projects, Systems, Schemas) to handle caching, loading states, and error handling more robustly than `useEffect` chains.
*   **Canvas State**: The mapping session state is complex. Continue adhering to the `ReactFlow` state model but consider a robust global store (e.g., Zustand) if cross-component interaction increases.

### 3.3 UX/UI Standards
*   **Responsiveness**: The Mapping Canvas must remain performant even with large schemas (hundreds of nodes). Virtualization or progressive loading of nodes is suggested.
*   **Feedback**: Immediate visual feedback for actions (Save success, Auto-map completion, Network errors) is critical. Use toast notifications.
*   **Design System**: Maintain consistent styling (currently using a mix of inline styles and CSS). Migrating to a utility-first framework like Tailwind CSS or a component library (MUI/Mantine) is suggested for maintainability.

### 3.4 Development Workflow
*   **Mocking**: Maintain a comprehensive set of MSW (Mock Service Worker) handlers or similar to allow frontend development without a running backend.
*   **Testing**: Maintain strict unit testing for utilities and integration testing for the main user flows (Project -> Editor -> Export).
