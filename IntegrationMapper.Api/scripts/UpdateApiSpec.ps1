$ErrorActionPreference = "Stop"
$originalLocation = Get-Location

try {
    # Define paths relative to the script location
    $scriptPath = $MyInvocation.MyCommand.Path
    $scriptDir = Split-Path $scriptPath
    $projectRoot = (Resolve-Path "$scriptDir\..").Path
    $docsDir = (Resolve-Path "$projectRoot\..\docs").Path
    $outputFile = Join-Path $docsDir "openapi.json"
    $apiUrl = "http://localhost:5000/openapi/v1.json"

    Write-Host "Fetching OpenAPI spec from $apiUrl..."
    
    try {
        $response = Invoke-RestMethod -Uri $apiUrl -Method Get
    }
    catch {
        Write-Error "Failed to fetch spec. Ensure the backend API is running at http://localhost:5000"
        exit 1
    }

    # Format JSON
    $jsonContent = $response | ConvertTo-Json -Depth 10

    # Write to file
    $jsonContent | Set-Content -Path $outputFile -Encoding utf8
    Write-Host "Successfully updated OpenAPI spec at $outputFile"
}
catch {
    Write-Error "An unexpected error occurred: $_"
    exit 1
}
finally {
    Set-Location $originalLocation
}
