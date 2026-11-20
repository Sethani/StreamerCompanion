using System;
// Compatibility action IDs stay in Walk Ons; Sound Player is the sole state writer.
public class CPHInline
{
    public bool Execute()
    {
        string mode = args.ContainsKey("walkonSoundMode") ? Convert.ToString(args["walkonSoundMode"]).ToLowerInvariant() : "";
        string command = mode == "initialize" ? "Initialize" : mode == "play" ? "Play" : mode == "stop" ? "Stop" : "";
        if (command == "" || !CPH.ActionExists("Sound Player - " + command)) { CPH.LogError("[walk-on-sound] Import Sound Player before using sound playback."); return false; }
        CPH.SetArgument("legacyCompatibility", "true");
        if (mode == "initialize") CPH.SetArgument("compatibilityInitialize", "true");
        return CPH.RunAction("Sound Player - " + command, true);
    }
}
