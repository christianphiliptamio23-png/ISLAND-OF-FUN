param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$url = 'http://127.0.0.1:8080'

function Test-IslandServer {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "$url/health" -TimeoutSec 2
    return $response.StatusCode -eq 200 -and $response.Content -eq 'island-of-fun'
  } catch { return $false }
}

if (-not (Test-IslandServer)) {
  $node = Get-Command node.exe -ErrorAction Stop
  Start-Process -FilePath $node.Source -ArgumentList 'server.mjs' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Milliseconds 300
    if (Test-IslandServer) { $ready = $true; break }
  }
  if (-not $ready) { throw 'Island of Fun server did not start. Check that Node.js is installed and port 8080 is available.' }
}

if (-not $NoBrowser) { Start-Process "$url/" }
