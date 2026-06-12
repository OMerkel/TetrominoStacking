Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Resolve-Path -Path (Join-Path $PSScriptRoot "..")

$candidateFiles = Get-ChildItem -Path $root -Recurse -File | Where-Object {
  ($_.Extension -in @(".sh", ".bash", ".ksh", ".zsh")) -or
  (Select-String -Path $_.FullName -Pattern '^#!.*(sh|bash|ksh|zsh)' -Quiet -ErrorAction SilentlyContinue)
}

$filesToCheck = $candidateFiles | Where-Object {
  $_.FullName -notmatch '\\node_modules\\\.bin\\'
}

if (-not $filesToCheck) {
  Write-Host "No shell script files found to check."
  exit 0
}

$shellcheck = Get-Command shellcheck -ErrorAction SilentlyContinue
if (-not $shellcheck) {
  Write-Error "shellcheck is not installed or not available on PATH."
  exit 1
}

& $shellcheck.Source @($filesToCheck.FullName)
exit $LASTEXITCODE
