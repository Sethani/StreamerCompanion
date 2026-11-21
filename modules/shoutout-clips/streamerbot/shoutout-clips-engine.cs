using System;
using System.Globalization;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    private static readonly object StateLock = new object();
    private static long LastStartAtMs;
    private const string StateKey = "portable.shoutoutClip.state";

    public bool Execute()
    {
        lock (StateLock) return ExecuteMode();
    }

    private bool ExecuteMode()
    {
        try
        {
            string mode = Arg("shoutoutClipMode").ToLowerInvariant();
            if (mode == "initialize") return Initialize();
            if (mode == "health") return Health();
            if (mode == "configure") return Configure();
            if (mode == "play") return Play();
            if (mode == "stop") return Stop();
            throw new Exception("Unknown shoutout clip mode: " + mode);
        }
        catch (Exception ex)
        {
            CPH.LogError("[shoutout-clips] " + ex.Message);
            Guid request;
            if (Guid.TryParse(Arg("selfClipRequestId"), out request))
            {
                try {
                    JObject failed = Payload();
                    JObject rejected = failed["rejectedSelfClipRequests"] as JObject ?? new JObject();
                    rejected[request.ToString()] = new JObject { ["status"] = "failed" };
                    while (rejected.Count > 256) rejected.Properties().First().Remove();
                    failed["rejectedSelfClipRequests"] = rejected; Write(failed);
                } catch { }
            }
            return true;
        }
    }

    private bool Initialize()
    {
        JObject existing = Payload();
        JObject config = NormalizeConfig(existing["config"] as JObject ?? new JObject());
        return Write(new JObject { ["moduleVersion"] = "2.2.1", ["serverTimeMs"] = Now(), ["config"] = config, ["clip"] = existing["clip"] ?? Hidden() });
    }

    private bool Health()
    {
        JObject payload = Payload();
        JObject config = NormalizeConfig(payload["config"] as JObject ?? new JObject());
        CPH.LogInfo("[shoutout-clips] Health OK: schema=2 module=2.2.1 player=" + (string)config["clip"]?["playerMode"] + " maxSeconds=" + (int)config["maximumDurationSeconds"]);
        return true;
    }

    private bool Configure()
    {
        string raw = Arg("config");
        if (String.IsNullOrWhiteSpace(raw)) throw new Exception("Clip config is required.");
        JObject payload = Payload();
        return Write(new JObject { ["moduleVersion"] = "2.2.1", ["serverTimeMs"] = Now(), ["config"] = NormalizeConfig(JObject.Parse(raw)), ["clip"] = payload["clip"] ?? Hidden() });
    }

    private bool Play()
    {
        string selfRequest = Arg("selfClipRequestId");
        Guid request;
        if (selfRequest != "" && !Guid.TryParse(selfRequest, out request)) throw new Exception("Invalid self clip request identity.");
        if (selfRequest != "") selfRequest = Guid.Parse(selfRequest).ToString();
        string clipId = Arg("clipId");
        if (String.IsNullOrWhiteSpace(clipId)) clipId = Arg("slug");
        if (String.IsNullOrWhiteSpace(clipId)) throw new Exception("Play requires clipId.");
        long now = Now();
        JObject existing = Payload();
        JObject accepted = existing["acceptedSelfClipRequests"] as JObject ?? new JObject();
        if (selfRequest != "" && accepted[selfRequest] != null) {
            if ((string)accepted[selfRequest]["clipId"] != clipId) throw new Exception("Self clip request identity conflict.");
            return true;
        }
        if (selfRequest != "" && Bool("selfClipRejectWhenBusy", true) && (bool?)existing["clip"]?["visible"] == true && (long?)existing["clip"]?["hideAtMs"] > Now()) throw new Exception("Clip player is busy.");
        // Start identity must remain unique even for two plays in one millisecond.
        now = Math.Max(now, Math.Max(LastStartAtMs, (long?)existing["clip"]?["lastStartAtMs"] ?? 0) + 1);
        LastStartAtMs = now;
        JObject config = NormalizeConfig(existing["config"] as JObject ?? new JObject());
        int maximumMs = (int)config["maximumDurationSeconds"] * 1000;
        int durationMs = DurationMs(maximumMs);
        JObject clip = new JObject {
            ["visible"] = true,
            ["clipId"] = clipId,
            ["title"] = Arg("title"),
            ["channel"] = Arg("channel"),
            ["durationMs"] = durationMs,
            ["startedAtMs"] = now,
            ["lastStartAtMs"] = now,
            ["hideAtMs"] = now + durationMs,
            ["lastStartError"] = ""
        };
        if (selfRequest != "") {
            clip["selfClipRequestId"] = selfRequest;
            accepted[selfRequest] = new JObject { ["clipId"] = clipId, ["startedAtMs"] = now };
            while (accepted.Count > 256) accepted.Properties().First().Remove();
        }
        JObject payload = new JObject { ["moduleVersion"] = "2.2.1", ["config"] = config, ["clip"] = clip };
        payload["acceptedSelfClipRequests"] = accepted;
        payload["serverTimeMs"] = now;
        return Write(payload);
    }

    private bool Stop()
    {
        JObject existing = Payload();
        long expected;
        if (Int64.TryParse(Arg("startedAtMs"), out expected) && expected > 0)
        {
            long active = (long?)existing["clip"]?["startedAtMs"] ?? 0;
            if (active > 0 && active != expected) return true;
        }
        JObject payload = new JObject { ["moduleVersion"] = "2.2.1", ["config"] = NormalizeConfig(existing["config"] as JObject ?? new JObject()), ["clip"] = Hidden() };
        payload["serverTimeMs"] = Now();
        return Write(payload);
    }

    private JObject NormalizeConfig(JObject input)
    {
        JObject old = input["clip"] as JObject ?? new JObject();
        JObject label = input["label"] as JObject ?? new JObject();
        return new JObject {
          ["schemaVersion"] = 2,
          ["maximumDurationSeconds"] = Clamp((int?)input["maximumDurationSeconds"] ?? 60, 5, 60),
          ["clip"] = new JObject {
            ["x"] = Clamp((int?)old["x"] ?? 463, 0, 3840),
            ["y"] = Clamp((int?)old["y"] ?? 245, 0, 2160),
            ["width"] = Clamp((int?)old["width"] ?? 960, 160, 1920),
            ["height"] = Clamp((int?)old["height"] ?? 540, 90, 1080),
            ["scaleX"] = 1,
            ["scaleY"] = 1,
            ["muted"] = (bool?)old["muted"] ?? false,
            ["playerMode"] = Choice((string)old["playerMode"], new [] { "mustached", "twitch" }, "mustached")
          },
          ["label"] = new JObject {
            ["fontSize"] = Clamp((int?)label["fontSize"] ?? 24, 12, 64),
            ["textColour"] = Colour((string)label["textColour"], "#f8fbff"),
            ["backgroundColour"] = Colour((string)label["backgroundColour"], "#000000"),
            ["backgroundOpacityPercent"] = Clamp((int?)label["backgroundOpacityPercent"] ?? 68, 0, 100)
          }
        };
    }

    private JObject Hidden()
    {
        return new JObject {
            ["visible"] = false,
            ["startedAtMs"] = JValue.CreateNull(),
            ["hideAtMs"] = JValue.CreateNull(),
            ["lastStartError"] = Arg("error")
        };
    }

    private bool Write(JObject payload)
    {
        JObject previous = Payload();
        foreach (string name in new [] { "acceptedSelfClipRequests", "rejectedSelfClipRequests" })
            if (payload[name] == null && previous[name] != null) payload[name] = previous[name].DeepClone();
        payload["selfClipRequestProtocol"] = 1;
        payload["durationProtocol"] = 1;
        long revision = 1;
        try { revision = ((long?)JObject.Parse(Read())["revision"] ?? 0) + 1; } catch {}
        JObject envelope = new JObject {
            ["schemaVersion"] = 1,
            ["feature"] = "shoutoutClip",
            ["type"] = "state",
            ["revision"] = revision,
            ["payload"] = payload
        };
        CPH.SetGlobalVar(StateKey, envelope.ToString(Formatting.None), true);
        try { CPH.WebsocketBroadcastJson(envelope.ToString(Formatting.None)); }
        catch (Exception ex) { CPH.LogWarn("[shoutout-clips] State saved, but WebSocket broadcast failed: " + ex.Message); }
        return true;
    }

    private JObject Payload() { try { return (JObject)JObject.Parse(Read())["payload"] ?? new JObject(); } catch { return new JObject(); } }
    private string Read() { try { return CPH.GetGlobalVar<string>(StateKey, true) ?? ""; } catch { return ""; } }
    private long Now() { return DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(); }
    private string Arg(string key) { try { return args.ContainsKey(key) && args[key] != null ? args[key].ToString().Trim() : ""; } catch { return ""; } }
    private bool Bool(string key, bool fallback) { bool value; return Boolean.TryParse(Arg(key), out value) ? value : fallback; }
    private int Integer(string key, int fallback) { int value; return Int32.TryParse(Arg(key), out value) ? value : fallback; }
    private int DurationMs(int maximumMs)
    {
        object raw; double value;
        if (!args.TryGetValue("durationMs", out raw) || raw == null) return maximumMs;
        // Keep numeric arguments numeric: ToString() can add fractions or locale separators.
        if (raw is string) { if (!Double.TryParse((string)raw, NumberStyles.Float, CultureInfo.InvariantCulture, out value)) return maximumMs; }
        else { try { value = Convert.ToDouble(raw, CultureInfo.InvariantCulture); } catch { return maximumMs; } }
        if (Double.IsNaN(value) || Double.IsInfinity(value)) throw new Exception("Clip duration must be finite.");
        return (int)Math.Ceiling(Math.Max(1000, Math.Min(value, maximumMs)));
    }
    private int Clamp(int value, int min, int max) { return Math.Max(min, Math.Min(max, value)); }
    private string Colour(string value, string fallback) { return System.Text.RegularExpressions.Regex.IsMatch(value ?? "", "^#[0-9a-fA-F]{6}$") ? value : fallback; }
    private string Choice(string value, string[] choices, string fallback) { foreach (string choice in choices) if (String.Equals(value, choice, StringComparison.OrdinalIgnoreCase)) return choice; return fallback; }
}
