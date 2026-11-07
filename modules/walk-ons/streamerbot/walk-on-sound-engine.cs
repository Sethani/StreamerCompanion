using System;
using System.Globalization;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    private const string StateKey = "portable.walkonSound.state";
    private const string LegacyBase = "http://127.0.0.1:7474";

    public bool Execute()
    {
        CPH.SetArgument("walkOnSoundAccepted", false);
        try
        {
            string mode = Arg("walkonSoundMode").ToLowerInvariant();
            if (mode == "initialize") return Initialize();
            if (mode == "play") return Play();
            if (mode == "stop") return Stop();
            throw new Exception("Unknown walk-on sound mode: " + mode);
        }
        catch (Exception ex)
        {
            CPH.LogError("[walk-on-sound] " + ex.Message);
            return true;
        }
    }

    private bool Initialize()
    {
        if (!String.IsNullOrWhiteSpace(Read())) return true;
        return Write(new JObject { ["serverTimeMs"] = Now(), ["current"] = Hidden() });
    }

    private bool Play()
    {
        string id = CleanId(Arg("id"));
        string source = Arg("src");
        if (String.IsNullOrWhiteSpace(source) && !String.IsNullOrWhiteSpace(id)) source = LegacyBase + "/streaming/sounds/" + id + ".mp3";
        source = Absolute(source);
        if (!Safe(source)) throw new Exception("Play requires registered Companion audio or a supported legacy local sound URL.");
        long now = Now();
        JObject current = new JObject {
            ["visible"] = true, ["id"] = id, ["src"] = source,
            ["volume"] = Number("volume", 1, 0, 1), ["startedAtMs"] = now,
            ["lastStartAtMs"] = now, ["lastError"] = ""
        };
        CPH.SetArgument("walkOnSoundAccepted", true);
        return Write(new JObject { ["serverTimeMs"] = now, ["current"] = current });
    }

    private bool Stop()
    {
        JObject existing = Payload(); long expected;
        if (Int64.TryParse(Arg("startedAtMs"), out expected) && expected > 0)
        {
            long active = (long?)existing["current"]?["startedAtMs"] ?? 0;
            if (active > 0 && active != expected) return true;
        }
        return Write(new JObject { ["serverTimeMs"] = Now(), ["current"] = Hidden() });
    }

    private JObject Hidden()
    {
        return new JObject { ["visible"] = false, ["startedAtMs"] = JValue.CreateNull(), ["lastError"] = Arg("error") };
    }

    private bool Safe(string value)
    {
        Uri uri;
        if (!Uri.TryCreate(value, UriKind.Absolute, out uri) || uri.Scheme != "http" || (uri.Host != "127.0.0.1" && uri.Host != "localhost") || uri.Query != "" || uri.Fragment != "") return false;
        if (uri.Port == 3135) return Regex.IsMatch(uri.AbsolutePath, "^/api/public/media/walk-ons/[a-f0-9-]+[.](mp3|wav|ogg|m4a)$", RegexOptions.IgnoreCase);
        if (uri.Port == 7474) return Regex.IsMatch(uri.AbsolutePath, "^/streaming/sounds/[^/]+[.](mp3|wav|ogg|m4a)$", RegexOptions.IgnoreCase);
        return false;
    }

    private string Absolute(string value)
    {
        if ((value ?? "").StartsWith("/streaming/sounds/", StringComparison.OrdinalIgnoreCase)) return LegacyBase + value;
        return (value ?? "").Trim();
    }

    private bool Write(JObject payload)
    {
        long revision = 1; try { revision = ((long?)JObject.Parse(Read())["revision"] ?? 0) + 1; } catch {}
        JObject envelope = new JObject { ["schemaVersion"] = 1, ["feature"] = "walkonSound", ["type"] = "state", ["revision"] = revision, ["payload"] = payload };
        string json = envelope.ToString(Formatting.None); CPH.SetGlobalVar(StateKey, json, true);
        try { CPH.WebsocketBroadcastJson(json); } catch (Exception ex) { CPH.LogWarn("[walk-on-sound] State saved, but WebSocket broadcast failed: " + ex.Message); }
        return true;
    }

    private JObject Payload() { try { return (JObject)JObject.Parse(Read())["payload"] ?? new JObject(); } catch { return new JObject(); } }
    private string Read() { try { return CPH.GetGlobalVar<string>(StateKey, true) ?? ""; } catch { return ""; } }
    private long Now() { return DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(); }
    private string Arg(string key) { try { return args.ContainsKey(key) && args[key] != null ? args[key].ToString().Trim() : ""; } catch { return ""; } }
    private double Number(string key, double fallback, double min, double max) { double value; if (!Double.TryParse(Arg(key), NumberStyles.Any, CultureInfo.InvariantCulture, out value)) value = fallback; return Math.Max(min, Math.Min(max, value)); }
    private string CleanId(string value) { return Regex.Replace((value ?? "").Trim().ToLowerInvariant(), "[^a-z0-9_-]", ""); }
}
