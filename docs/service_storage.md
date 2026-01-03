# File Storage Service

## Overview
The `IFileStorageService` abstraction handles the physical storage of uploaded schema files. This allows the application to switch between local storage (for development) and cloud storage (e.g., Azure Blob Storage) with minimal changes.

## Local Implementation
*   **Class**: `LocalFileStorageService`
*   **Environment**: Registered when `ASPNETCORE_ENVIRONMENT` is `Development`.
*   **Storage Location**: Saves files to a `SchemaStorage` directory in the application root.
*   **File Naming**: Prefixes files with a GUID to prevent collision (e.g., `guid_filename.xsd`).

## Interface Methods
*   `UploadFileAsync(Stream, string)`: Saves a file and returns a unique reference ID.
*   `GetFileAsync(string)`: Retrieves the file stream using the reference ID.
*   `DeleteFileAsync(string)`: Removes the file from storage.
