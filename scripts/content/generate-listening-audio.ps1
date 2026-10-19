# Generates original listening-passage audio via the Windows SAPI
# text-to-speech engine (offline, no API keys, no third-party licensing
# concerns — see docs/DECISIONS.md for why this approach was chosen over
# sourcing/licensing real recordings).
#
# Reads every content/listening/*.json file, speaks each `script` turn with
# a voice chosen by speaker (alternating David/Zira per distinct speaker
# name, consistently across the whole passage), and writes one continuous
# WAV file per passage to public/audio/listening/<audioFile>.
#
# Usage: powershell -File scripts/content/generate-listening-audio.ps1

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$contentDir = Join-Path $repoRoot "content\listening"
$outDir = Join-Path $repoRoot "public\audio\listening"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$voices = @("Microsoft David Desktop", "Microsoft Zira Desktop")

Get-ChildItem -Path $contentDir -Filter "*.json" | ForEach-Object {
    $json = Get-Content $_.FullName -Raw | ConvertFrom-Json
    $outPath = Join-Path $outDir $json.audioFile

    Write-Host "Generating $($json.code) -> $outPath"

    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $synth.Rate = -1
    $synth.SetOutputToWaveFile($outPath)

    $speakerVoice = @{}
    $nextVoiceIndex = 0

    foreach ($turn in $json.script) {
        $speaker = $turn.speaker
        if (-not $speakerVoice.ContainsKey($speaker)) {
            $speakerVoice[$speaker] = $voices[$nextVoiceIndex % $voices.Length]
            $nextVoiceIndex++
        }
        $synth.SelectVoice($speakerVoice[$speaker])
        $synth.Speak($turn.text)
    }

    $synth.SetOutputToNull()
    $synth.Dispose()

    $size = (Get-Item $outPath).Length
    Write-Host "  done: $size bytes"
}

Write-Host "All listening passage audio generated."
