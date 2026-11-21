using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    const string Key = "brb.private.state";
    static readonly object Gate = new object();
    static readonly Random Random = new Random();
    static bool Booted;
    string A(string key) { object value; return args.TryGetValue(key, out value) && value != null ? value.ToString().Trim() : ""; }
    long Now() { return DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(); }
    JObject Read(string key) { string raw = CPH.GetGlobalVar<string>(key, true); return String.IsNullOrWhiteSpace(raw) ? null : JObject.Parse(raw); }
    JObject Payload(string key) { return Read(key)?["payload"] as JObject ?? new JObject(); }
    void Save(JObject state) { CPH.SetGlobalVar(Key, state.ToString(Formatting.None), true); }
    JObject Fresh(string owner) { return new JObject { ["schemaVersion"] = 1, ["owner"] = owner, ["active"] = false, ["config"] = new JObject { ["video"] = 34, ["followed"] = 33, ["self"] = 33, ["videos"] = new JArray() }, ["cache"] = new JObject(), ["results"] = new JObject(), ["counts"] = new JObject(), ["credits"] = new JObject(), ["status"] = "Stopped", ["error"] = "" }; }
    IEnumerable<string> Follows()
    {
        var excluded = new HashSet<string>((CPH.GetGlobalVar<List<string>>("autoShoutoutExcludedLogins", true) ?? new List<string>()).Select(Normalize));
        string own = Normalize(CPH.TwitchGetBroadcaster().UserLogin);
        return (CPH.GetGlobalVar<List<string>>("autoShoutoutFollowedLogins", true) ?? new List<string>()).Select(Normalize).Where(x => Regex.IsMatch(x, "^[a-z0-9_]{1,25}$") && x != own && !excluded.Contains(x)).Distinct().OrderBy(x => x, StringComparer.Ordinal).ToArray();
    }
    string Normalize(string value) { return (value ?? "").Trim().TrimStart('@').ToLowerInvariant(); }
    void Result(JObject state, string request, string status, string error = "")
    {
        if (request == "") return;
        var results = (JObject)state["results"]; results[request] = new JObject { ["status"] = status, ["error"] = error };
        while (results.Count > 128) results.Properties().First().Remove();
    }
    void Publish(JObject state)
    {
        var library = Payload("portable.video.state")["config"]?["library"] as JObject ?? new JObject();
        JObject payload = new JObject { ["phoneDeckVersion"] = 1, ["active"] = state["active"], ["status"] = state["status"], ["error"] = state["error"], ["config"] = state["config"].DeepClone(), ["counts"] = state["counts"].DeepClone(), ["phoneDeckResults"] = state["results"].DeepClone(), ["pending"] = state["owned"] is JObject && (string)state["owned"]["phase"] == "pending", ["currentSource"] = (state["owned"] as JObject)?["kind"] ?? "", ["followedCached"] = ((JObject)state["cache"]).Count, ["refreshRemaining"] = (state["refresh"] as JArray)?.Count ?? 0,
            ["videos"] = new JArray(library.Properties().Where(p => (bool?)p.Value["enabled"] != false).Select(p => new JObject { ["id"] = p.Name, ["label"] = p.Value["label"] ?? p.Name })) };
        var envelope = new JObject { ["schemaVersion"] = 1, ["feature"] = "brb", ["type"] = "state", ["revision"] = ((long?)Read("portable.brb.state")?["revision"] ?? 0) + 1, ["payload"] = payload };
        CPH.SetGlobalVar("portable.brb.state", envelope.ToString(Formatting.None), true);
        try { CPH.WebsocketBroadcastJson(envelope.ToString(Formatting.None)); } catch { }
    }
    public bool Execute()
    {
        lock (Gate)
        {
            string request = A("requestId"), mode = A("brbMode").ToLowerInvariant(); JObject state = null;
            try
            {
                var broadcaster = CPH.TwitchGetBroadcaster(); if (broadcaster == null || String.IsNullOrWhiteSpace(broadcaster.UserId)) throw new Exception("Connect the Twitch broadcaster first.");
                if (mode == "command start" || mode == "command stop") {
                    if (A("userId") != broadcaster.UserId && !String.Equals(A("isModerator"), "true", StringComparison.OrdinalIgnoreCase)) { CPH.LogWarn("[brb] Unauthorised command ignored."); return false; }
                    mode = mode == "command start" ? "start" : "stop";
                }
                state = Read(Key) ?? Fresh(broadcaster.UserId);
                if ((int?)state["schemaVersion"] != 1) throw new Exception("Unsupported saved BRB state; restore its backup.");
                // The process-local boot guard prevents persisted active sessions resuming after restart.
                if (!Booted) { state["active"] = false; state["refresh"] = null; state["status"] = "Stopped after startup; start explicitly"; Save(state); Booted = true; Publish(state); }
                if ((string)state["owner"] != broadcaster.UserId) { state["active"] = false; Save(state); throw new Exception("BRB settings belong to a different broadcaster; restore that account before continuing."); }
                if (mode != "tick" && mode != "initialize" && mode != "health") {
                    Guid parsed; if (request == "") request = Guid.NewGuid().ToString();
                    if (!Guid.TryParse(request, out parsed)) throw new Exception("Invalid request identity."); request = parsed.ToString();
                    if (state["results"]?[request] != null) { Publish(state); return true; }
                }
                if (mode == "initialize") { state["active"] = false; state["refresh"] = null; state["status"] = "Stopped; start explicitly"; }
                else if (mode == "health") { Publish(state); return true; }
                else if (mode == "configure") Configure(state);
                else if (mode == "refresh") {
                    RequireStopped(state); string[] follows = Follows().ToArray(); if (follows.Length > 2000) throw new Exception("Follow list exceeds the supported 2,000 channels.");
                    state["refresh"] = new JArray(follows); state["refreshCache"] = new JObject(); state["status"] = "Refreshing followed clips";
                    if (follows.Length == 0) { state["cache"] = new JObject(); state["refresh"] = null; state["refreshCache"] = null; state["status"] = "No followed channels available"; }
                }
                else if (mode == "start" || mode == "toggle" && !(bool)state["active"]) Start(state);
                else if (mode == "stop" || mode == "toggle") Stop(state);
                else if (mode == "clear pending") { RequireStopped(state); if (state["owned"] is JObject && (string)state["owned"]["phase"] == "pending") { state["owned"] = null; state["status"] = "Uncertain ownership cleared without replay or Stop"; } }
                else if (mode == "tick") {
                    if (state["refresh"] is JArray) RefreshOne(state);
                    else if ((bool)state["active"]) Advance(state);
                    else return true;
                }
                else throw new Exception("Unknown BRB operation.");
                if (mode != "tick") Result(state, request, "completed"); Save(state); Publish(state); return true;
            }
            catch (Exception error)
            {
                CPH.LogError("[brb] " + error.Message);
                // Reload saved intent. Never discard a potentially accepted dispatch after a failed write.
                try {
                    var saved = Read(Key); if (saved != null) {
                        if (mode == "tick" || mode == "stop" || mode == "initialize") { saved["active"] = false; saved["refresh"] = null; saved["refreshCache"] = null; saved["status"] = "Stopped: check details"; }
                        saved["error"] = error.Message;
                        if ((string)saved["results"]?[request]?["status"] != "completed") Result(saved, request, saved["owned"] is JObject ? "unknown" : "failed", error.Message);
                        Save(saved); Publish(saved);
                    }
                } catch { }
                return false;
            }
        }
    }
    void RequireStopped(JObject state) { if ((bool)state["active"]) throw new Exception("Stop BRB playback before changing the mix or refreshing clips."); }
    void Configure(JObject state)
    {
        RequireStopped(state); JObject input = JObject.Parse(A("config")); int total = 0;
        var config = new JObject(); foreach (string kind in new[] { "video", "followed", "self" }) { var value = input[kind]; if (value == null || value.Type != JTokenType.Integer || (int)value < 0 || (int)value > 100) throw new Exception("Mix values must be whole percentages from 0 to 100."); config[kind] = value; total += (int)value; }
        if (total != 100) throw new Exception("Mix percentages must total 100.");
        var ids = input["videos"] as JArray; if (ids == null || ids.Count > 1000 || ids.Any(id => id.Type != JTokenType.String || !Regex.IsMatch((string)id, "^[a-z0-9_-]{1,100}$"))) throw new Exception("Choose registered videos.");
        config["videos"] = new JArray(ids.Values<string>().Distinct()); state["config"] = config; state["credits"] = new JObject(); state["error"] = ""; state["status"] = "Mix saved";
    }
    void RefreshOne(JObject state)
    {
        var queue = (JArray)state["refresh"]; if (queue.Count == 0) return;
        string login = (string)queue[0]; var batch = CPH.GetClipsForUser(login, new DateTime(2010, 1, 1, 0, 0, 0, DateTimeKind.Utc), DateTime.UtcNow.AddMinutes(1), 20, (bool?)null);
        if (batch == null) throw new Exception("Followed clip refresh failed; previous cache retained. Refresh again later.");
        var clips = new JArray(); foreach (var item in batch) { JObject clip = JObject.FromObject(item); string id = (string)clip["Id"]; if (String.IsNullOrWhiteSpace(id) || id.Length > 200) continue; clips.Add(new JObject { ["id"] = id, ["title"] = ((string)clip["Title"] ?? "").Substring(0, Math.Min(300, ((string)clip["Title"] ?? "").Length)), ["durationMs"] = Math.Max(1000, Math.Min(300000, (double?)clip["Duration"] * 1000 ?? 60000)) }); }
        state["refreshCache"][login] = clips; queue.RemoveAt(0);
        if (queue.Count == 0) { state["cache"] = state["refreshCache"]; state["refreshCache"] = null; state["refresh"] = null; state["status"] = "Followed clips refreshed"; state["error"] = ""; }
    }
    bool Visible(JObject payload, bool video) { var item = payload[video ? "current" : "clip"]; return (bool?)item?["visible"] == true && (video || (long?)item?["hideAtMs"] > Now()); }
    bool Busy() { return Visible(Payload("portable.video.state"), true) || Visible(Payload("portable.shoutoutClip.state"), false); }
    void Start(JObject state)
    {
        if ((bool)state["active"]) return;
        if (state["owned"] is JObject) throw new Exception("Resolve previous ownership with Stop, or explicitly clear an unconfirmed request before starting.");
        if (state["refresh"] is JArray) throw new Exception("Wait for followed clip refresh or cancel it with Stop.");
        if ((int?)Payload("portable.video.state")["brbRequestProtocol"] != 1 || (int?)Payload("portable.shoutoutClip.state")["selfClipRequestProtocol"] != 1) throw new Exception("Import and initialize the updated Video Player and Shoutout Clips actions first.");
        if (Busy()) throw new Exception("A player is busy; wait or stop its media before starting BRB.");
        if (Available(state).Count == 0) throw new Exception("No enabled source has eligible media. Select videos or refresh clips first.");
        state["active"] = true; state["sessionId"] = Guid.NewGuid().ToString(); state["counts"] = new JObject(); state["credits"] = new JObject(); state["error"] = ""; state["status"] = "Running";
        // Start only arms the session. The timer makes the first selection after this durable write.
    }
    List<string> Available(JObject state)
    {
        var config = (JObject)state["config"]; var result = new List<string>();
        if ((int)config["video"] > 0 && Videos(state).Count > 0) result.Add("video");
        if ((int)config["followed"] > 0 && Followed(state).Count > 0) result.Add("followed");
        var self = Payload("portable.selfClips.state");
        if ((int)config["self"] > 0 && (int?)self["eligibleCount"] > 0 && String.IsNullOrEmpty((string)self["pendingRequestId"]) && String.Equals((string)self["ownerLogin"], CPH.TwitchGetBroadcaster().UserLogin, StringComparison.OrdinalIgnoreCase)) result.Add("self");
        return result;
    }
    List<string> Videos(JObject state) { var lib = Payload("portable.video.state")["config"]?["library"] as JObject ?? new JObject(); return ((JArray)state["config"]["videos"]).Values<string>().Where(id => lib[id] is JObject && (bool?)lib[id]["enabled"] != false).ToList(); }
    List<string> Followed(JObject state) { var cache = (JObject)state["cache"]; return Follows().Where(login => cache[login] is JArray && ((JArray)cache[login]).Count > 0).ToList(); }
    void Increment(JObject state, string key) { state["counts"][key] = ((int?)state["counts"][key] ?? 0) + 1; }
    string Choose(JObject state, List<string> available)
    {
        // Smooth weighted selection by item count. Random ties avoid a fixed first source.
        var credits = (JObject)state["credits"]; foreach (var property in credits.Properties().ToList()) if (!available.Contains(property.Name)) property.Remove();
        int total = available.Sum(kind => (int)state["config"][kind]);
        foreach (string kind in available) credits[kind] = ((int?)credits[kind] ?? 0) + (int)state["config"][kind];
        int best = available.Max(kind => (int)credits[kind]); var ties = available.Where(kind => (int)credits[kind] == best).ToArray(); string chosen = ties[Random.Next(ties.Length)]; credits[chosen] = (int)credits[chosen] - total; return chosen;
    }
    void Reconcile(JObject state)
    {
        JObject owned = state["owned"] as JObject; if (owned == null || (string)owned["phase"] != "pending") return;
        string kind = (string)owned["kind"], request = (string)owned["requestId"];
        var payload = Payload(kind == "video" ? "portable.video.state" : "portable.shoutoutClip.state");
        var accepted = payload[kind == "video" ? "acceptedBrbRequests" : "acceptedSelfClipRequests"]?[request] as JObject;
        if (accepted == null || ((long?)accepted["startedAtMs"] ?? 0) <= 0) throw new Exception("Playback acceptance is unconfirmed. No retry was sent. Stop/check the player before clearing the pending request.");
        owned["phase"] = "accepted"; owned["startedAtMs"] = accepted["startedAtMs"]; owned["deadline"] = Now() + (kind == "video" ? 600000 : 305000); Increment(state, kind + "Accepted");
    }
    void Stop(JObject state)
    {
        state["active"] = false; state["refresh"] = null; state["refreshCache"] = null; state["status"] = "Stopped"; Save(state);
        Reconcile(state);
        var owned = state["owned"] as JObject; if (owned != null) GuardedStop(owned);
        state["owned"] = null; state["error"] = "";
    }
    void GuardedStop(JObject owned) { CPH.SetArgument("startedAtMs", (long)owned["startedAtMs"]); CPH.SetArgument("error", ""); CPH.RunAction((string)owned["kind"] == "video" ? "Video - Stop" : "Shoutout Clips - Stop", true); }
    void Advance(JObject state)
    {
        if (state["owned"] is JObject) {
            Reconcile(state); var owned = (JObject)state["owned"]; bool video = (string)owned["kind"] == "video";
            var item = Payload(video ? "portable.video.state" : "portable.shoutoutClip.state")[video ? "current" : "clip"];
            if ((bool?)item?["visible"] == true && (long?)item["startedAtMs"] != (long?)owned["startedAtMs"]) { state["active"] = false; state["owned"] = null; state["status"] = "Stopped: player taken over by another request"; return; }
            if (Visible(Payload(video ? "portable.shoutoutClip.state" : "portable.video.state"), !video)) { GuardedStop(owned); state["active"] = false; state["owned"] = null; state["status"] = "Stopped: another player started"; return; }
            bool expired = !video && (long?)item?["hideAtMs"] <= Now(); bool timedOut = Now() > (long)owned["deadline"];
            if ((bool?)item?["visible"] == true && !expired && !timedOut) return;
            if (expired || timedOut) GuardedStop(owned);
            Increment(state, timedOut || !String.IsNullOrEmpty((string)item?["lastError"]) ? "failed" : "playerCleared"); state["owned"] = null; Save(state);
        }
        if (Busy()) { state["status"] = "Waiting for another player"; return; }
        var available = Available(state); if (available.Count == 0) { state["active"] = false; state["status"] = "Stopped: no eligible media"; return; }
        string kind = Choose(state, available), request = Guid.NewGuid().ToString();
        var intent = new JObject { ["kind"] = kind, ["requestId"] = request, ["phase"] = "pending" }; state["owned"] = intent; state["status"] = "Running";
        string id = "", title = "", login = ""; double duration = 60000;
        if (kind == "video") { var ids = Videos(state); id = ids[Random.Next(ids.Count)]; }
        if (kind == "followed") { var channels = Followed(state); login = channels[Random.Next(channels.Count)]; var clips = (JArray)state["cache"][login]; var clip = clips[Random.Next(clips.Count)]; id = (string)clip["id"]; title = (string)clip["title"]; duration = (double)clip["durationMs"]; }
        Save(state); // Intent must exist before any player or selector dispatch.
        CPH.SetArgument("requestId", request); CPH.SetArgument("title", title); CPH.SetArgument("startedAtMs", 0L); CPH.SetArgument("error", "");
        if (kind == "self") CPH.RunAction("Self Clips - Play Next", true);
        else if (kind == "video") { CPH.SetArgument("videoRequestId", request); CPH.SetArgument("brbRequestId", request); CPH.SetArgument("id", id); CPH.SetArgument("src", ""); CPH.SetArgument("loop", false); CPH.RunAction("Video - Play", true); }
        else { CPH.SetArgument("clipId", id); CPH.SetArgument("channel", login); CPH.SetArgument("durationMs", duration); CPH.SetArgument("selfClipRequestId", request); CPH.SetArgument("selfClipRejectWhenBusy", true); CPH.RunAction("Shoutout Clips - Play", true); }
        Reconcile(state);
    }
}
