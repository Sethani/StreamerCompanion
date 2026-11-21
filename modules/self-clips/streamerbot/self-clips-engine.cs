using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    private const string PrivateKey = "selfClips.private.state";
    private const string PublicKey = "portable.selfClips.state";
    private const string PlayerKey = "portable.shoutoutClip.state";
    private static readonly object Gate = new object();
    private static readonly Random Random = new Random();
    private const int MaxClips = 20000;
    private string Arg(string name) { object value; return args.TryGetValue(name, out value) && value != null ? value.ToString().Trim() : ""; }
    private long Now() { return DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(); }
    private JObject Read(string key) { string raw = CPH.GetGlobalVar<string>(key, true); return String.IsNullOrWhiteSpace(raw) ? null : JObject.Parse(raw); }
    private JObject Fresh() { return new JObject { ["catalogue"] = new JArray(), ["used"] = new JArray(), ["cycle"] = 1, ["results"] = new JObject(), ["offset"] = 0, ["lastError"] = "" }; }
    private void Save(JObject root) { CPH.SetGlobalVar(PrivateKey, root.ToString(Formatting.None), true); }
    private void Result(JObject account, string request, string status, string error = "")
    {
        JObject results = (JObject)account["results"];
        results[request] = new JObject { ["status"] = status, ["error"] = error };
        while (results.Count > 128) results.Properties().First().Remove();
        account["lastError"] = error;
    }
    private void Publish(JObject account, string login)
    {
        JArray clips = (JArray)account["catalogue"];
        var used = new HashSet<string>(((JArray)account["used"]).Values<string>());
        int count = clips.Count(c => used.Contains((string)c["id"]));
        JObject pending = account["pending"] as JObject;
        int offset = Math.Max(0, Math.Min((int?)account["offset"] ?? 0, Math.Max(0, clips.Count - 1)));
        JObject payload = new JObject { ["phoneDeckVersion"] = 1, ["ownerLogin"] = login, ["cycle"] = account["cycle"], ["eligibleCount"] = clips.Count, ["usedCount"] = count, ["remainingCount"] = clips.Count - count,
            ["lastTitle"] = account["last"]?["title"] ?? "", ["lastClipId"] = account["last"]?["id"] ?? "", ["lastStatus"] = account["lastStatus"] ?? "Not requested", ["lastError"] = account["lastError"] ?? "",
            ["pendingRequestId"] = pending?["requestId"] ?? "", ["lastRefreshAtMs"] = account["lastRefreshAtMs"] ?? 0, ["phoneDeckResults"] = account["results"].DeepClone(),
            ["view"] = new JObject { ["offset"] = offset, ["total"] = clips.Count, ["clips"] = new JArray(clips.Skip(offset).Take(50).Select(c => new JObject { ["id"] = c["id"], ["title"] = c["title"], ["used"] = used.Contains((string)c["id"]) })) } };
        long revision = (long?)Read(PublicKey)?["revision"] ?? 0;
        JObject envelope = new JObject { ["schemaVersion"] = 1, ["feature"] = "selfClip", ["type"] = "state", ["revision"] = revision + 1, ["payload"] = payload };
        CPH.SetGlobalVar(PublicKey, envelope.ToString(Formatting.None), true);
        try { CPH.WebsocketBroadcastJson(envelope.ToString(Formatting.None)); } catch { /* Saved projection can be reread. */ }
    }
    public bool Execute()
    {
        lock (Gate)
        {
            JObject root = null, account = null; string request = Arg("requestId"), login = "";
            try
            {
                Guid parsed;
                if (request == "") request = Guid.NewGuid().ToString();
                if (!Guid.TryParse(request, out parsed)) throw new Exception("Invalid request identity.");
                request = parsed.ToString();
                var broadcaster = CPH.TwitchGetBroadcaster();
                if (broadcaster == null || String.IsNullOrWhiteSpace(broadcaster.UserId)) throw new Exception("Connect the Twitch broadcaster account first.");
                string owner = broadcaster.UserId; login = broadcaster.UserLogin ?? "";
                root = Read(PrivateKey) ?? new JObject { ["schemaVersion"] = 1, ["accounts"] = new JObject() };
                if ((int?)root["schemaVersion"] != 1 || !(root["accounts"] is JObject)) throw new Exception("Unsupported saved clip history; restore its backup before continuing.");
                account = root["accounts"][owner] as JObject;
                if (account == null) { account = Fresh(); root["accounts"][owner] = account; }
                if (account["results"]?[request] != null) { Publish(account, login); return true; }
                string mode = Arg("selfClipsMode").ToLowerInvariant();
                if (mode == "initialize" || mode == "health") { Reconcile(account); Save(root); Publish(account, login); return true; }
                if (mode == "refresh") Refresh(account, owner);
                else if (mode == "play next") { Play(root, account, request); Publish(account, login); return true; }
                else if (mode == "return last") ReturnLast(account);
                else if (mode == "skip pending") {
                    Reconcile(account);
                    if (account["pending"] is JObject) {
                        JObject pending = (JObject)account["pending"]; var used = new HashSet<string>(((JArray)account["used"]).Values<string>());
                        used.Add((string)pending["clip"]["id"]); account["used"] = new JArray(used.OrderBy(id => id, StringComparer.Ordinal));
                        Result(account, (string)pending["requestId"], "completed", "Selection skipped after unknown playback; not retried."); account["pending"] = null; account["lastStatus"] = "Unconfirmed selection skipped";
                    }
                }
                else if (mode == "stop") {
                    Reconcile(account); JObject last = account["last"] as JObject;
                    if (last == null || (long?)last["startedAtMs"] == null) throw new Exception("No self clip playback to stop.");
                    CPH.SetArgument("startedAtMs", (long)last["startedAtMs"]); CPH.RunAction("Shoutout Clips - Stop", true);
                }
                else if (mode == "resolve pending") { Reconcile(account); if (account["pending"] is JObject) throw new Exception("Playback outcome remains unknown. Check the player; do not retry automatically."); }
                else if (mode == "show clips") { int offset; if (!Int32.TryParse(Arg("offset"), out offset) || offset < 0) throw new Exception("Invalid clip page."); account["offset"] = offset; }
                else throw new Exception("Unknown self clip operation.");
                Result(account, request, "completed"); Save(root); Publish(account, login); return true;
            }
            catch (Exception error)
            {
                CPH.LogError("[self-clips] " + error.Message);
                // Reload authoritative state: a failed final save may leave a durable pending
                // intent after the player accepted. Never replace that with a retryable failure.
                if (root != null && account != null)
                {
                    try {
                        var broadcaster = CPH.TwitchGetBroadcaster(); JObject saved = Read(PrivateKey);
                        JObject original = saved?["accounts"]?[broadcaster.UserId] as JObject;
                        if (saved == null) { saved = new JObject { ["schemaVersion"] = 1, ["accounts"] = new JObject() }; original = Fresh(); saved["accounts"][broadcaster.UserId] = original; }
                        else if (original == null && (int?)saved["schemaVersion"] == 1 && saved["accounts"] is JObject) { original = Fresh(); saved["accounts"][broadcaster.UserId] = original; }
                        if (original != null) {
                            if ((string)original["results"]?[request]?["status"] == "completed") { try { Publish(original, login); } catch { } return true; }
                            Result(original, request, original["pending"] is JObject ? "unknown" : "failed", error.Message);
                            Save(saved); Publish(original, login);
                        }
                    } catch { /* No durable success is reported after persistence failure. */ }
                }
                return false;
            }
        }
    }
    private void Refresh(JObject account, string owner)
    {
        if (account["pending"] is JObject) throw new Exception("Resolve the previous request before refreshing clips.");
        var clips = new Dictionary<string, JObject>(); int calls = 0;
        try { Fetch(owner, new DateTime(2010, 1, 1, 0, 0, 0, DateTimeKind.Utc), DateTime.UtcNow.AddMinutes(1), clips, ref calls); }
        catch { throw new Exception("Clip refresh could not complete. Existing catalogue and history were retained; try refreshing later."); }
        account["catalogue"] = new JArray(clips.Values.OrderBy(c => (string)c["id"], StringComparer.Ordinal));
        account["lastRefreshAtMs"] = Now(); account["offset"] = 0;
    }
    private void Fetch(string owner, DateTime start, DateTime end, Dictionary<string, JObject> result, ref int calls)
    {
        if (++calls > 128) throw new Exception("Clip catalogue request limit reached.");
        var batch = CPH.GetClipsForUserById(owner, start, end, 1000, (bool?)null);
        if (batch == null) throw new Exception("Clip catalogue unavailable.");
        if (batch.Count >= 1000) {
            if ((end - start).TotalMinutes <= 2) throw new Exception("Too many clips in one time window.");
            long minutes = (long)(end - start).TotalMinutes / 2;
            DateTime middle = start.AddMinutes(minutes);
            // Twitch truncates query times to minutes. Overlap the split minute,
            // then deduplicate IDs, so boundary clips cannot fall through a gap.
            Fetch(owner, start, middle.AddMinutes(1), result, ref calls); Fetch(owner, middle, end, result, ref calls); return;
        }
        foreach (var clip in batch) {
            JObject item = JObject.FromObject(clip);
            string id = (string)item["Id"];
            if (String.IsNullOrWhiteSpace(id) || id.Length > 200) continue;
            string title = ((string)item["Title"] ?? ""); if (title.Length > 300) title = title.Substring(0, 300);
            var saved = new JObject { ["id"] = id, ["title"] = title };
            double seconds = (double?)item["Duration"] ?? 0;
            if (seconds > 0 && !Double.IsNaN(seconds) && !Double.IsInfinity(seconds)) saved["durationMs"] = (int)Math.Ceiling(Math.Min(300000, seconds * 1000));
            result[id] = saved;
            if (result.Count > MaxClips) throw new Exception("Clip catalogue is too large.");
        }
    }
    private JObject Player() { return Read(PlayerKey)?["payload"] as JObject ?? new JObject(); }
    private void Reconcile(JObject account)
    {
        JObject pending = account["pending"] as JObject; if (pending == null) return;
        string request = (string)pending["requestId"], clip = (string)pending["clip"]["id"];
        JObject accepted = Player()["acceptedSelfClipRequests"]?[request] as JObject;
        if (accepted == null || (string)accepted["clipId"] != clip) return;
        var used = new HashSet<string>(((JArray)account["used"]).Values<string>()); used.Add(clip);
        account["used"] = new JArray(used.OrderBy(id => id, StringComparer.Ordinal));
        account["last"] = pending["clip"].DeepClone(); account["last"]["startedAtMs"] = accepted["startedAtMs"];
        account["last"]["requestId"] = request;
        account["last"]["cycle"] = account["cycle"]; account["pending"] = null; account["lastStatus"] = "Accepted by clip player";
        Result(account, request, "completed");
    }
    private void Play(JObject root, JObject account, string request)
    {
        Reconcile(account);
        if (account["pending"] is JObject) throw new Exception("Previous playback is unconfirmed; check pending before requesting another clip.");
        JArray catalogue = (JArray)account["catalogue"];
        if (catalogue.Count == 0) throw new Exception("Refresh your clips first; no eligible clips are available.");
        JObject player = Player();
        if ((int?)player["selfClipRequestProtocol"] != 1 || (int?)player["durationProtocol"] != 1) throw new Exception("Import Shoutout Clips 2.2.1 actions and initialize that player first.");
        if ((bool?)player["clip"]?["visible"] == true && (long?)player["clip"]?["hideAtMs"] > Now()) throw new Exception("The clip player is busy. Stop it or wait before requesting the next clip.");
        var used = new HashSet<string>(((JArray)account["used"]).Values<string>());
        var available = catalogue.Where(c => !used.Contains((string)c["id"])).ToList();
        if (available.Count == 0) { used.Clear(); account["used"] = new JArray(); account["cycle"] = (long)account["cycle"] + 1; available = catalogue.ToList(); }
        string last = (string)account["last"]?["id"];
        var candidates = available.Count > 1 ? available.Where(c => (string)c["id"] != last).ToList() : available;
        JObject selected = (JObject)candidates[Random.Next(candidates.Count)].DeepClone();
        account["pending"] = new JObject { ["requestId"] = request, ["clip"] = selected, ["createdAtMs"] = Now() };
        Result(account, request, "unknown", "Playback request pending confirmation."); Save(root);
        CPH.SetArgument("clipId", (string)selected["id"]); CPH.SetArgument("title", (string)selected["title"]);
        CPH.SetArgument("durationMs", (int?)selected["durationMs"] ?? ((int?)player["config"]?["maximumDurationSeconds"] ?? 60) * 1000);
        CPH.SetArgument("channel", CPH.TwitchGetBroadcaster().UserName ?? "");
        CPH.SetArgument("selfClipRequestId", request); CPH.SetArgument("selfClipRejectWhenBusy", true);
        CPH.RunAction("Shoutout Clips - Play", true);
        Reconcile(account);
        if (account["pending"] is JObject) {
            // Immediate call returned with no acceptance. If it reported a matching
            // rejection, release the reservation; otherwise keep an unknown intent.
            JObject rejection = Player()["rejectedSelfClipRequests"]?[request] as JObject;
            if (rejection != null) { account["pending"] = null; Result(account, request, "failed", "Clip player rejected the request; it remains unused."); }
            else account["lastError"] = "Player acceptance is unknown. Check pending; this request will not replay automatically.";
        }
        Save(root);
    }
    private void ReturnLast(JObject account)
    {
        if (account["pending"] is JObject) throw new Exception("Resolve the pending request first.");
        JObject last = account["last"] as JObject;
        if (last == null || (long?)last["cycle"] != (long?)account["cycle"]) throw new Exception("No clip from this cycle can be returned.");
        var used = new HashSet<string>(((JArray)account["used"]).Values<string>());
        used.Remove((string)last["id"]); account["used"] = new JArray(used.OrderBy(id => id, StringComparer.Ordinal));
        account["lastStatus"] = "Returned to unused";
    }
}
