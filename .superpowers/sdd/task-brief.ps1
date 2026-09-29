param(
  [Parameter(Mandatory = $true)][string]$Plan,
  [Parameter(Mandatory = $true)][int]$Number,
  [string]$OutFile
)

if (-not (Test-Path $Plan)) { Write-Error "no such plan file: $Plan"; exit 2 }
if (-not $OutFile) { $OutFile = Join-Path $PSScriptRoot "task-$Number-brief.md" }

$lines = Get-Content $Plan
$out = New-Object System.Collections.Generic.List[string]
$inFence = $false
$inTask = $false

foreach ($line in $lines) {
  if ($line -match '^```') { $inFence = -not $inFence }
  if ((-not $inFence) -and $line -match '^#+\s+Task\s+[0-9]+') {
    $inTask = $line -match ("^#+\s+Task\s+" + $Number + "(?![0-9])")
  }
  if ($inTask) { $out.Add($line) }
}

if ($out.Count -eq 0) { Write-Error "task $Number not found in $Plan"; exit 3 }

Set-Content -Path $OutFile -Value $out -Encoding UTF8
Write-Output "wrote ${OutFile}: $($out.Count) lines"
