param([int]$ParentProcessId, [string]$DataDirectory, [int]$PollMilliseconds = 50)
$ErrorActionPreference = "Stop"
$parentProcess = [System.Diagnostics.Process]::GetProcessById($ParentProcessId)
$pidPath = Join-Path $DataDirectory "controller-xinput-bridge.pid"
$source = @"
using System;
using System.Runtime.InteropServices;
public static class StreamingXInput {
    [StructLayout(LayoutKind.Sequential)] public struct Gamepad { public ushort Buttons; public byte LeftTrigger; public byte RightTrigger; public short ThumbLX; public short ThumbLY; public short ThumbRX; public short ThumbRY; }
    [StructLayout(LayoutKind.Sequential)] public struct State { public uint PacketNumber; public Gamepad Gamepad; }
    [DllImport("xinput1_4.dll", EntryPoint = "XInputGetState")] public static extern uint GetState(uint userIndex, out State state);
}
"@
Add-Type -TypeDefinition $source

function Convert-Axis([int]$value, [int]$deadZone, [bool]$invert) {
    if ([Math]::Abs($value) -le $deadZone) { return 0 }
    $normalized = if ($value -lt 0) { $value / 32768.0 } else { $value / 32767.0 }
    if ($invert) { $normalized = -$normalized }
    return [Math]::Round([Math]::Max(-1, [Math]::Min(1, $normalized)), 3)
}

function Get-ControllerState {
    $pads = @()
    for ($index = 0; $index -lt 4; $index++) {
        $state = New-Object StreamingXInput+State
        if ([StreamingXInput]::GetState($index, [ref]$state) -ne 0) { continue }
        $gamepad = $state.Gamepad; $buttons = [int]$gamepad.Buttons
        $pressed = [System.Collections.Generic.List[int]]::new()
        $map = @(@(0x1000,0),@(0x2000,1),@(0x4000,2),@(0x8000,3),@(0x0100,4),@(0x0200,5),@(0x0020,8),@(0x0010,9),@(0x0040,10),@(0x0080,11),@(0x0001,12),@(0x0002,13),@(0x0004,14),@(0x0008,15))
        foreach ($entry in $map) { if (($buttons -band $entry[0]) -ne 0) { $pressed.Add($entry[1]) } }
        if ($gamepad.LeftTrigger -gt 30) { $pressed.Add(6) }; if ($gamepad.RightTrigger -gt 30) { $pressed.Add(7) }
        $pads += @{ index=$index; id="Windows XInput Controller"; connected=$true; mapping="standard"; pressed=@($pressed); axes=@((Convert-Axis $gamepad.ThumbLX 7849 $false),(Convert-Axis $gamepad.ThumbLY 7849 $true),(Convert-Axis $gamepad.ThumbRX 8689 $false),(Convert-Axis $gamepad.ThumbRY 8689 $true)) }
    }
    return @{ supported=$true; error=""; source="native-xinput"; pads=$pads; atMs=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() } | ConvertTo-Json -Depth 6 -Compress
}


Set-Content -LiteralPath $pidPath -Value $PID -Encoding ascii
try { while (-not $parentProcess.HasExited) { [Console]::Out.WriteLine((Get-ControllerState)); [Console]::Out.Flush(); Start-Sleep -Milliseconds $PollMilliseconds } } finally { if (Test-Path -LiteralPath $pidPath) { if ((Get-Content -LiteralPath $pidPath -Raw).Trim() -eq [string]$PID) { Remove-Item -LiteralPath $pidPath -Force } } }
