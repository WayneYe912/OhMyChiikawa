[CmdletBinding()]
param(
    [ValidateSet("usagi", "chiikawa", "hachiware", "momonga", "all")]
    [string]$Pet = "all",
    [switch]$Remote,
    [string]$CodexHome
)

$ErrorActionPreference = "Stop"
$RemoteBase = if ($env:OHMYCHIIKAWA_PET_BASE_URL) {
    $env:OHMYCHIIKAWA_PET_BASE_URL.TrimEnd("/")
} else {
    "https://raw.githubusercontent.com/WayneYe912/OhMyChiikawa/main/codex_pet/install-ohmychiikawa-pets/assets/pets"
}

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillRoot = Split-Path -Parent $ScriptRoot
$LocalPets = Join-Path $SkillRoot "assets\pets"
if (-not $Remote -and -not (Test-Path $LocalPets -PathType Container)) {
    $Remote = $true
}

if ([string]::IsNullOrWhiteSpace($CodexHome)) {
    $CodexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
}
$PetsRoot = Join-Path $CodexHome "pets"
$BackupsRoot = Join-Path $CodexHome "pet-backups"
New-Item -ItemType Directory -Force -Path $PetsRoot | Out-Null

$PetIds = if ($Pet -eq "all") {
    @("usagi", "chiikawa", "hachiware", "momonga")
} else {
    @($Pet)
}

function Test-PetChecksums {
    param([Parameter(Mandatory = $true)][string]$Directory)

    $ChecksumPath = Join-Path $Directory "SHA256SUMS"
    foreach ($Line in Get-Content -LiteralPath $ChecksumPath) {
        if ($Line -notmatch '^([0-9a-fA-F]{64})\s{2}(.+)$') {
            throw "Invalid checksum line: $Line"
        }
        $Expected = $Matches[1].ToLowerInvariant()
        $FileName = $Matches[2]
        $FilePath = Join-Path $Directory $FileName
        $Actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $FilePath).Hash.ToLowerInvariant()
        if ($Actual -ne $Expected) {
            throw "Checksum mismatch: $FileName"
        }
        Write-Host "$FileName`: OK"
    }
}

foreach ($PetId in $PetIds) {
    $InstallId = "ohmychiikawa-$PetId"
    $Stage = Join-Path $PetsRoot ".$InstallId.tmp-$PID-$(Get-Random)"
    New-Item -ItemType Directory -Path $Stage | Out-Null

    if ($Remote) {
        foreach ($FileName in @("pet.json", "source.json", "spritesheet.webp", "SHA256SUMS")) {
            $Uri = "$RemoteBase/$InstallId/$FileName"
            Invoke-WebRequest -UseBasicParsing -Uri $Uri -OutFile (Join-Path $Stage $FileName)
        }
    } else {
        $Source = Join-Path $LocalPets $InstallId
        if (-not (Test-Path $Source -PathType Container)) {
            throw "Missing local pet package: $Source"
        }
        Copy-Item -Recurse -Force -Path (Join-Path $Source "*") -Destination $Stage
    }

    Test-PetChecksums -Directory $Stage
    if (-not (Test-Path (Join-Path $Stage "pet.json")) -or
        -not (Test-Path (Join-Path $Stage "spritesheet.webp"))) {
        throw "Pet package is incomplete: $InstallId"
    }

    $Target = Join-Path $PetsRoot $InstallId
    foreach ($LegacyBackup in Get-ChildItem -LiteralPath $PetsRoot -Directory -Filter "$InstallId.backup-*" -ErrorAction SilentlyContinue) {
        New-Item -ItemType Directory -Force -Path $BackupsRoot | Out-Null
        $LegacyDestination = Join-Path $BackupsRoot $LegacyBackup.Name
        if (Test-Path $LegacyDestination) {
            $LegacyDestination = "$LegacyDestination-$PID-$(Get-Random)"
        }
        Move-Item -LiteralPath $LegacyBackup.FullName -Destination $LegacyDestination
        Write-Host "Moved legacy pet backup out of the Pets directory: $LegacyDestination"
    }
    if (Test-Path $Target) {
        New-Item -ItemType Directory -Force -Path $BackupsRoot | Out-Null
        $Backup = Join-Path $BackupsRoot "$InstallId.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')-$PID"
        Move-Item -LiteralPath $Target -Destination $Backup
        Write-Host "Backed up existing pet to: $Backup"
    }
    Move-Item -LiteralPath $Stage -Destination $Target
    Write-Host "Installed $InstallId -> $Target"
}

Write-Host ""
Write-Host "Open ChatGPT/Codex Settings > Pets, select Refresh, then choose the new pet."
Write-Host "Enter /pet or choose Wake Pet to show the floating desktop pet."
Write-Host "In Codex CLI, run /pets to open the pet picker."
