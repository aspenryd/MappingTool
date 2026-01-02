# Frontend Component Structure - Mapping Canvas

## Overview
The "Mapping Canvas" is the core component of the Integration Mapper. It allows users to visualize source and target fields side-by-side and draw connections between them.

## Technology Choice
- **Library**: `React Flow` (recommended) or `SVG` based custom implementation.
- **Reasoning**: React Flow handles zooming, panning, and node connectivity out of the box.

## Component Structure

```
src/
  components/
    MappingCanvas/
      MappingCanvas.tsx       # Main Container, handles layout and React Flow instance
      msg/
        SourceNode.tsx        # Custom Node for Source Fields
        TargetNode.tsx        # Custom Node for Target Fields
        ConnectionLine.tsx    # Custom styling for mapping lines
      hooks/
        useMappingState.ts    # Manages the list of mappings and updates
      utils/
        layout.ts             # Auto-layout algorithm to align fields
```

## Interaction Design

### Scrolling & Zooming
- **Zooming**: Handled by React Flow's `<ReactFlow />` wrapper. Users can scroll-wheel to zoom in/out to see large schemas.
- **Panning**: Click-drag on empty space to pan the view.
- **Independent Column Scrolling**:
  - Requires a custom approach if using React Flow, as React Flow acts as a single infinite canvas.
  - **Alternative**: Two fixed sidebars (HTML `overflow-y: auto`) with an SVG overlay for lines.
  - **Chosen Approach**: **SVG Overlay with Fixed Columns**.
    - **Left Column**: Source Fields List (Scrollable).
    - **Right Column**: Target Fields List (Scrollable).
    - **Center Layer**: SVG `div` overlaying the space between columns to draw Bezier curves.

### Connection Logic (SVG Overlay Approach)
1. **Ref Tracking**: Each `FieldItem` component registers its DOM position (Y-coordinate) relative to the container.
2. **Drawing**:
    - The SVG layer computes curves from `(LeftCol_RightEdge, SourceField_Y)` to `(RightCol_LeftEdge, TargetField_Y)`.
    - Updates on scroll event of either column.

### Drawing Connections
- **Drag**: User clicks and drags from a Source Field "handle".
- **Drop**: User releases on a Target Field.
- **Validation**: Prevent duplicate mappings if 1:1 is required (optional).

## State Management
- `mappings`: Array of `{ sourceId, targetId, transformation }`.
- `selectedMapping`: The currently clicked line (for editing logic).
```
