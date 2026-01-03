# Frontend Component Structure

## Overview
The frontend is built with **React**, **Vite**, and **TypeScript**. It supports a multi-view layout managed by `App.tsx`: Systems, Projects, Project Detail, and Mapping Canvas.

## Navigation Structure

1.  **System List**: View and manage Integration Systems and Data Objects.
2.  **System Detail**: View schemas and download content.
3.  **Project List**: View and create Mapping Projects.
4.  **Project Detail**: View mappings profiles within a project.
5.  **Mapping Canvas**: The core interface for mapping fields of a specific profile.

## Key Components

### Layout
*   `NavBar.tsx`: Top navigation bar with Logo, View Switcher (Systems/Projects), and User Info.
*   `CodeViewerModal.tsx`: Modal to view and copy generated C# code.

### Mapping Canvas (`src/components/MappingCanvas`)
*   `MappingCanvas.tsx`: Main container. Integrates `React Flow`.
    *   **Props**: `profileId: number`.
    *   **State**: `nodes` (Source/Target fields), `edges` (Mappings), `selectedEdges`.
    *   **Features**:
        *   **Auto-Map**: Calls AI service.
        *   **Export**: Excel/C# download buttons.
        *   **View Code**: Opens `CodeViewerModal`.
        *   **Delete**: Edge deletion support.
*   `FieldNode.tsx`: Custom React Flow node. Displays field name, type, and detailed Tooltip.

### Projects (`src/components/Projects`)
*   `ProjectList.tsx`: Lists projects.
*   `ProjectDetail.tsx`: Lists profiles + "Create Profile" button.
*   `CreateProfileModal.tsx`: Form to select Source/Target objects for a new profile.

### Systems (`src/components/Systems`)
*   `SchemaViewerModal.tsx`: Displays raw schema content (JSON/XSD).

## State Management
*   **Local State**: Most state is managed locally in components (or parent `App` for navigation).
*   **React Flow Store**: Internal state for nodes/edges/tracking.

## Interaction Design
*   **Drag & Drop**: Connect Source Node (Right Handle) to Target Node (Left Handle).
*   **Zoom/Pan**: Native React Flow controls.
*   **Selection**: Click edge to select, "Delete Selected" button to remove.
