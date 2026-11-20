using System;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    private const string StateKey = "portable.walkonSound.state";
    private static readonly object StateLock = new object();
    public bool Execute()
    {
        lock (StateLock)
        {
            string request = Arg("requestId");
            try
            {
                JObject p = Payload();
                Guid parsed;
                if (request != "" && !Guid.TryParse(request, out parsed)) throw new Exception("Invalid request ID.");
                if (request != "" && p["phoneDeckResults"]?[request] != null) return true;
                string mode = Arg("soundPlayerMode").ToLowerInvariant();
                if (mode == "health") { CPH.LogInfo("[sound-player] Native owner 1.0.0 ready."); return true; }
                if (mode == "initialize")
                {
                    if (Arg("compatibilityInitialize") == "true") return true;
                    if ((bool?)p["current"]?["visible"] == true) p["current"] = Hidden("Playback interrupted by startup; play again explicitly.");
                }
                else if (mode == "configure")
                {
                    if (Arg("migrateWalkOns") == "true") Migrate(p);
                    else p["config"] = ValidateConfig(JObject.Parse(Arg("config")));
                    if ((bool?)p["current"]?["visible"] == true) p["current"]["volume"] = ((double?)p["current"]["gain"] ?? 1) * (double)p["config"]["settings"]["masterVolumePercent"] / 100;
                }
                else if (mode == "play" || mode == "pool" || mode == "assigned" || mode == "adapter") Play(p, mode);
                else if (mode == "stop")
                {
                    if (!MatchesStart(p)) return true;
                    p["current"] = Hidden(Arg("error"));
                }
                else if (mode == "volume")
                {
                    double volume = Number("volumePercent", 100, 0, 100);
                    p["config"]["settings"]["masterVolumePercent"] = volume;
                    if ((bool?)p["current"]?["visible"] == true) p["current"]["volume"] = ((double?)p["current"]["gain"] ?? 1) * volume / 100;
                }
                else if (mode == "renderer")
                {
                    if (!MatchesStart(p) || (bool?)p["current"]?["visible"] != true) return true;
                    string owner = Arg("rendererId");
                    if (!Guid.TryParse(owner, out parsed)) throw new Exception("Invalid renderer ID.");
                    string existing = (string)p["current"]["rendererId"] ?? "";
                    if (Arg("rendererOperation") == "claim")
                    {
                        if (existing != "") return true;
                        p["current"]["rendererId"] = owner;
                    }
                    else
                    {
                        if (existing != owner) return true;
                        p["current"] = Hidden(Arg("error"));
                    }
                }
                else throw new Exception("Unknown sound operation.");
                Result(p, request, "completed", "");
                return Write(p);
            }
            catch (Exception ex)
            {
                CPH.LogError("[sound-player] " + ex.Message);
                // Failure must never leave a success acknowledgement in durable state.
                if (request != "") try { JObject failed = Payload(); Result(failed, request, "failed", ex.Message); Write(failed); } catch {}
                return false;
            }
        }
    }
    private void Play(JObject p, string mode)
    {
        string accepted = Arg("walkOnSoundRequestId");
        if (accepted == "") accepted = Arg("requestId");
        if (accepted == "") accepted = Guid.NewGuid().ToString();
        Guid parsed;
        if (!Guid.TryParse(accepted, out parsed)) throw new Exception("Invalid playback request.");
        accepted = parsed.ToString();
        JObject history = p["acceptedRequests"] as JObject ?? new JObject();
        if (history[accepted] != null) return;
        bool assigned = mode == "assigned";
        if ((assigned || Arg("rejectWhenBusy") == "true") &&
            ((bool?)p["current"]?["visible"] == true || Visible("portable.video.state", "current") || Visible("portable.shoutoutClip.state", "clip")))
            throw new Exception("Media is busy; the entrance remains eligible.");
        string id = Arg("id"), poolId = Arg("poolId");
        double gain = Number("volume", 1, 0, 1);
        bool legacyPool = false;
        if (assigned)
        {
            JObject roster = ReadPayload("portable.walkOns.state");
            JObject person = roster["config"]?["roster"]?[Arg("login")] as JObject;
            if (person == null || (bool?)person["enabled"] == false) throw new Exception("Entrance is unavailable.");
            gain = (double?)person["volume"] ?? 1;
            if ((string)person["type"] == "soundpool")
            {
                poolId = (string)person["poolId"] ?? "";
                string migratedId = (string)p["migratedAssignments"]?[Arg("login")] ?? "";
                if (poolId == "" && migratedId != "" && JToken.DeepEquals(person["choices"], p["migratedOriginalChoices"]?[Arg("login")])) poolId = migratedId;
                if (poolId == "") { id = Pick(person["choices"] as JArray); legacyPool = true; }
            }
            else id = (string)person["value"] ?? "";
        }
        if (mode == "pool" || poolId != "")
        {
            JObject pool = p["config"]?["pools"]?[poolId] as JObject;
            if (pool == null || (bool?)pool["enabled"] == false) throw new Exception("Pool is unavailable.");
            id = Pick(pool["choices"] as JArray);
            legacyPool = (string)pool["semantics"] == "walk-ons-v2";
        }
        JObject item = p["config"]?["library"]?[id] as JObject;
        string src = assigned || mode == "pool" || poolId != "" ? "" : Arg("src");
        if (item != null && ((bool?)item["enabled"] != false || legacyPool)) src = src == "" ? (string)item["src"] ?? "" : src;
        if (src == "" && item == null && Arg("legacyCompatibility") == "true" && !assigned && mode != "pool" && poolId == "" && Regex.IsMatch(id, "^[a-z0-9_-]+$")) src = "http://127.0.0.1:7474/streaming/sounds/" + id + ".mp3";
        if (!Safe(src)) throw new Exception("Sound is missing, disabled, or has an unsupported source.");
        if (!Finite(gain) || gain < 0 || gain > 1) throw new Exception("Invalid entrance volume.");
        long start = Math.Max(Now(), ((long?)p["lastStartAtMs"] ?? (long?)p["current"]?["lastStartAtMs"] ?? 0) + 1);
        p["lastStartAtMs"] = start;
        p["current"] = new JObject { ["visible"] = true, ["id"] = id, ["label"] = (string)item?["label"] ?? id,
            ["src"] = Absolute(src), ["gain"] = gain, ["volume"] = gain * (double)p["config"]["settings"]["masterVolumePercent"] / 100,
            ["startedAtMs"] = start, ["lastStartAtMs"] = start, ["requestId"] = accepted, ["rendererId"] = "", ["lastError"] = "" };
        p["lastAcceptedRequestId"] = accepted;
        history[accepted] = start;
        while (history.Count > 128) history.Properties().First().Remove();
        p["acceptedRequests"] = history;
    }
    private void Migrate(JObject p)
    {
        if ((bool?)p["walkOnsMigrated"] == true) return;
        JObject old = ReadPayload("portable.walkOns.state");
        JObject lib = (JObject)p["config"]["library"], pools = (JObject)p["config"]["pools"];
        foreach (JProperty s in (old["config"]?["sounds"] as JObject ?? new JObject()).Properties())
        {
            if (lib[s.Name] != null && !JToken.DeepEquals(lib[s.Name], s.Value)) throw new Exception("Sound migration collision; original state retained.");
            lib[s.Name] = s.Value.DeepClone();
        }
        // Private opaque IDs; the authoritative roster is intentionally never written here.
        JObject assignments = new JObject(), originalChoices = new JObject();
        foreach (JProperty person in (old["config"]?["roster"] as JObject ?? new JObject()).Properties())
        {
            if ((string)person.Value["type"] != "soundpool") continue;
            string id = Guid.NewGuid().ToString();
            pools[id] = new JObject { ["label"] = "Imported entrance pool", ["enabled"] = true, ["semantics"] = "walk-ons-v2", ["choices"] = person.Value["choices"]?.DeepClone() ?? new JArray() };
            assignments[person.Name] = id;
            originalChoices[person.Name] = person.Value["choices"]?.DeepClone() ?? new JArray();
        }
        p["migratedAssignments"] = assignments;
        p["migratedOriginalChoices"] = originalChoices;
        p["walkOnsMigrated"] = true;
    }
    private string Pick(JArray choices)
    {
        if (choices == null || choices.Count == 0) throw new Exception("Pool has no choices.");
        double total = 0;
        foreach (JToken choice in choices) { double w = (double?)choice["weight"] ?? 1; if (!Finite(w) || w <= 0 || w > 1000) throw new Exception("Invalid pool weight."); total += w; }
        double roll = new Random(Guid.NewGuid().GetHashCode()).NextDouble() * total;
        foreach (JToken choice in choices) { roll -= (double?)choice["weight"] ?? 1; if (roll < 0) return (string)choice["value"] ?? ""; }
        return (string)choices.Last["value"] ?? "";
    }
    private JObject ValidateConfig(JObject config)
    {
        JObject lib = config["library"] as JObject, pools = config["pools"] as JObject;
        if (lib == null || pools == null) throw new Exception("Sound library and pools are required.");
        foreach (JProperty item in lib.Properties()) if (!Regex.IsMatch(item.Name, "^[a-z0-9_-]{1,80}$") || item.Value is JObject == false || !Safe((string)item.Value["src"])) throw new Exception("Invalid sound registration.");
        foreach (JProperty pool in pools.Properties())
        {
            if (!Regex.IsMatch(pool.Name, "^[a-z0-9_-]{1,80}$") || !(pool.Value is JObject)) throw new Exception("Invalid pool.");
            JArray choices = pool.Value["choices"] as JArray;
            if (choices == null || choices.Count == 0) throw new Exception("Pool has no choices.");
            foreach (JToken choice in choices) { double weight = (double?)choice["weight"] ?? 1; if (!Finite(weight) || weight <= 0 || weight > 1000 || String.IsNullOrWhiteSpace((string)choice["value"])) throw new Exception("Invalid pool choice."); }
            if ((string)pool.Value["semantics"] != "walk-ons-v2") foreach (JToken c in choices) if (lib[(string)c["value"] ?? ""] == null || (bool?)lib[(string)c["value"]]["enabled"] == false) throw new Exception("Pool references an unavailable sound.");
        }
        double master = (double?)config["settings"]?["masterVolumePercent"] ?? 100;
        if (!Finite(master) || master < 0 || master > 100) throw new Exception("Volume must be between 0 and 100.");
        config["settings"] = new JObject { ["masterVolumePercent"] = master };
        return config;
    }
    private bool MatchesStart(JObject p) { long expected; bool renderer = Arg("soundPlayerMode") == "renderer"; if (renderer && Arg("playbackRequestId") == "") return false; if (Arg("startedAtMs") == "") return !renderer; return Int64.TryParse(Arg("startedAtMs"), out expected) && expected > 0 && expected == (long?)p["current"]?["startedAtMs"] && (Arg("playbackRequestId") == "" || Arg("playbackRequestId") == (string)p["current"]?["requestId"]); }
    private JObject Payload() { JObject p = ReadPayload(StateKey); if (!(p["config"] is JObject)) p["config"] = new JObject { ["library"] = new JObject(), ["pools"] = new JObject(), ["settings"] = new JObject { ["masterVolumePercent"] = 100 } }; if (!(p["current"] is JObject)) p["current"] = Hidden(""); p["phoneDeckVersion"] = 1; p["moduleVersion"] = "1.0.0"; return p; }
    private JObject ReadPayload(string key) { string raw = CPH.GetGlobalVar<string>(key, true); return String.IsNullOrWhiteSpace(raw) ? new JObject() : JObject.Parse(raw)["payload"] as JObject ?? new JObject(); }
    private bool Visible(string key, string part) { return (bool?)ReadPayload(key)[part]?["visible"] ?? false; }
    private JObject Hidden(string error) { return new JObject { ["visible"] = false, ["startedAtMs"] = JValue.CreateNull(), ["label"] = "", ["lastError"] = error }; }
    private void Result(JObject p, string id, string status, string error) { if (id == "") return; JObject results = p["phoneDeckResults"] as JObject ?? new JObject(); results[id] = new JObject { ["status"] = status, ["error"] = error }; while (results.Count > 128) results.Properties().First().Remove(); p["phoneDeckResults"] = results; }
    private bool Write(JObject p) { long revision = 0; string raw = CPH.GetGlobalVar<string>(StateKey, true); if (!String.IsNullOrWhiteSpace(raw)) revision = (long?)JObject.Parse(raw)["revision"] ?? 0; p["serverTimeMs"] = Now(); string json = new JObject { ["schemaVersion"] = 1, ["feature"] = "walkonSound", ["type"] = "state", ["revision"] = revision + 1, ["payload"] = p }.ToString(Formatting.None); CPH.SetGlobalVar(StateKey, json, true); try { CPH.WebsocketBroadcastJson(json); } catch { CPH.LogWarn("[sound-player] State saved; broadcast unavailable."); } return true; }
    private bool Safe(string source) { Uri uri; if (!Uri.TryCreate(Absolute(source), UriKind.Absolute, out uri) || uri.Scheme != "http" || (uri.Host != "localhost" && uri.Host != "127.0.0.1") || uri.UserInfo != "" || uri.Query != "" || uri.Fragment != "") return false; return uri.Port == 3135 && Regex.IsMatch(uri.AbsolutePath, "^/api/public/media/(walk-ons|sound-player)/[a-f0-9-]+[.](mp3|wav|ogg|m4a)$", RegexOptions.IgnoreCase) || uri.Port == 7474 && Regex.IsMatch(uri.AbsolutePath, "^/streaming/sounds/[^/]+[.](mp3|wav|ogg|m4a)$", RegexOptions.IgnoreCase); }
    private string Absolute(string value) { value = (value ?? "").Trim(); return value.StartsWith("/streaming/sounds/") ? "http://127.0.0.1:7474" + value : value; }
    private bool Finite(double value) { return !Double.IsNaN(value) && !Double.IsInfinity(value); }
    private double Number(string key, double fallback, double min, double max) { double value; if (Arg(key) == "") return fallback; if (!Double.TryParse(Arg(key), NumberStyles.Any, CultureInfo.InvariantCulture, out value) || !Finite(value) || value < min || value > max) throw new Exception("Invalid " + key + "."); return value; }
    private string Arg(string key) { return args.ContainsKey(key) && args[key] != null ? args[key].ToString().Trim() : ""; }
    private long Now() { return DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(); }
}
