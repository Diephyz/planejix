# Baixa o backup diário mais recente do banco da VM Oracle para o PC (OneDrive).
# Agendado no Windows Task Scheduler ("Planejix Backup Pull", diário às 09:00).
# A VM gera os backups às 2h via backend/jobs/backup.js (mantém 7 por lá).

$ErrorActionPreference = 'Stop'

$Key       = 'C:\Users\jeffb\OneDrive\Documents\Projects Claude\Key para acessar servidor\keyplanejix.key'
$RemoteSsh = 'ubuntu@api-planejix.duckdns.org'
$RemoteDir = '/home/ubuntu/planejix/backend/backups'
$LocalDir  = 'C:\Users\jeffb\OneDrive\Documents\Projects Claude\PlanejixBackups'
$LogFile   = Join-Path $LocalDir 'backup-pull.log'
$MaxLocal  = 30  # retenção local: 30 backups diários

if (-not (Test-Path $LocalDir)) { New-Item -ItemType Directory -Force -Path $LocalDir | Out-Null }

function Write-Log([string]$msg) {
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg" | Out-File -Append -Encoding utf8 $LogFile
}

try {
    $newest = (ssh -i $Key -o StrictHostKeyChecking=no -o ConnectTimeout=30 $RemoteSsh "ls -t $RemoteDir/expenses_*.db 2>/dev/null | head -1") | Select-Object -First 1
    if (-not $newest) { throw 'Nenhum backup encontrado na VM' }

    $name = ($newest -split '/')[-1].Trim()
    $dest = Join-Path $LocalDir $name

    scp -i $Key -o StrictHostKeyChecking=no -q "${RemoteSsh}:$($newest.Trim())" $dest
    if ($LASTEXITCODE -ne 0) { throw "scp falhou (exit $LASTEXITCODE)" }

    $f = Get-Item $dest
    if ($f.Length -lt 10KB) { throw "Arquivo suspeito de corrompido: $name tem só $($f.Length) bytes" }

    Write-Log "OK: $name ($([math]::Round($f.Length / 1KB)) KB)"

    Get-ChildItem $LocalDir -Filter 'expenses_*.db' |
        Sort-Object Name -Descending |
        Select-Object -Skip $MaxLocal |
        Remove-Item -Force
}
catch {
    Write-Log "ERRO: $($_.Exception.Message)"
    exit 1
}
