# Schema Parsing Services

## Overview
The Schema Parsing services are responsible for reading uploaded schema files (JSON, XSD) and extracting a standardized list of `FieldDefinition` entities. This standardization allows the system to map between different formats seamlessly.

## JSON Schema Parser
*   **Class**: `JsonSchemaParserService`
*   **Logic**: 
    *   Parses standard JSON Schema (Draft 4+).
    *   Recursively traverses properties.
    *   Extracts `type`, `description`, and structure.

## XSD Schema Parser
*   **Class**: `XsdSchemaParserService`
*   **Logic**:
    *   Parses XML Schema Definition (XSD) files.
    *   Extracts `xs:element` and `xs:attribute` definitions.
    *   **Enhanced Metadata**: 
        *   `Length`: derived from `maxLength` constraints.
        *   `Example`: derived from `appinfo` or distinct logical defaults if available.

## Output Structure
Both parsers return a list of `FieldDefinition` objects containing:
*   `Name`: Field name.
*   `Path`: Dot-notation path (e.g., `Root.Parent.Child`).
*   `DataType`: String, Int, Date, etc.
*   `Length`: Max length if applicable.
*   `Description`: Documentation from the schema.
