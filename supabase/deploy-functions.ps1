# Publica todas as Edge Functions que têm index.ts (Windows / PowerShell).
# Uso na raiz do repositório:
#   .\supabase\deploy-functions.ps1
#   .\supabase\deploy-functions.ps1 -ProjectRef lfhsugwhnjqudqomzegp
# Pré-requisitos: `npx supabase@latest login` (ou SUPABASE_ACCESS_TOKEN) e Node 20+.

param(
    [string]$ProjectRef = ''
)

$ErrorActionPreference = 'Stop'
$fnRoot = Join-Path $PSScriptRoot 'functions'

$names = Get-ChildItem -Path $fnRoot -Directory -ErrorAction Stop |
    Where-Object { Test-Path (Join-Path $_.FullName 'index.ts') } |
    ForEach-Object { $_.Name } |
    Sort-Object

foreach ($fn in $names) {
    Write-Host ""
    Write-Host "==> deploy: $fn" -ForegroundColor Cyan
    if ($ProjectRef.Trim()) {
        npx supabase@latest functions deploy $fn --no-verify-jwt --project-ref $($ProjectRef.Trim())
    }
    else {
        npx supabase@latest functions deploy $fn --no-verify-jwt
    }
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host ""
Write-Host "Concluído: $($names.Count) funções." -ForegroundColor Green
