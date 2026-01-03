# AI Mapping Service

## Overview
The `AiMappingService` is responsible for generating intelligent field mapping suggestions between a Source and a Target data object. It uses fuzzy string matching and context awareness to propose likely connections.

## Implementation Details

*   **Class**: `IntegrationMapper.Infrastructure.Services.AiMappingService`
*   **Interface**: `IAiMappingService`
*   **Dependencies**: `FuzzySharp` (NuGet package)

## Matching Logic

The service calculates a matching score based on two criteria:

1.  **Name Match (70% Weight)**: 
    *   Uses `FuzzySharp.WeightedRatio` to compare field names (e.g., "CustomerName" vs "ClientName").
2.  **Path Context Match (30% Weight)**:
    *   Uses `FuzzySharp.TokenSetRatio` to compare the full path hierarchy (e.g., "Order/BillTo/City" vs "Invoice/BillingAddress/City").

### Scoring Algorithm
```csharp
double totalScore = (nameScore * 0.7) + (pathScore * 0.3);
```

### Filtering & Selection
1.  **Threshold**: Only pairs with a `totalScore >= 70` are considered.
2.  **Existing Mappings**: Targets that are already mapped in the current profile are excluded from suggestions to prevent duplicates.
3.  **Greedy Allocation**: The algorithm sorts all candidates by score (descending) and assigns the highest scoring matches first, ensuring a **1-to-1 mapping**. Once a Source or Target field is used, it is removed from the pool.

## Usage
The service is called by the `MappingsController` via the `/suggest` endpoint.
