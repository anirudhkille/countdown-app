param(
  [Parameter(Mandatory = $true)][string]$Base,
  [Parameter(Mandatory = $true)][string]$Head,
  [string]$OutFile
)

git rev-parse --verify --quiet $Base | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Error "bad BASE: $Base"; exit 2 }
git rev-parse --verify --quiet $Head | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Error "bad HEAD: $Head"; exit 2 }

if (-not $OutFile) {
  $b = (git rev-parse --short $Base).Trim()
  $h = (git rev-parse --short $Head).Trim()
  $OutFile = Join-Path $PSScriptRoot "review-${b}..${h}.diff"
}

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("# Review package: ${Base}..${Head}")
[void]$sb.AppendLine()
[void]$sb.AppendLine("## Commits")
[void]$sb.AppendLine((git log --oneline "${Base}..${Head}" | Out-String))
[void]$sb.AppendLine("## Files changed")
[void]$sb.AppendLine((git diff --stat "${Base}..${Head}" | Out-String))
[void]$sb.AppendLine("## Diff")
[void]$sb.AppendLine((git diff -U10 "${Base}..${Head}" | Out-String))

Set-Content -Path $OutFile -Value $sb.ToString() -Encoding UTF8
$n = (git rev-list --count "${Base}..${Head}").Trim()
$bytes = (Get-Item $OutFile).Length
Write-Output "wrote ${OutFile}: $n commit(s), $bytes bytes"
