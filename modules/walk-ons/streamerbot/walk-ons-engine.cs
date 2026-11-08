using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    private const string StateKey = "portable.walkOns.state";
    private const string LegacyRosterKey = "walkOnRosterJson";
    private static readonly object StateLock = new object();

    public bool Execute()
    {
        lock (StateLock) { return ExecuteMode(); }
    }

    private bool ExecuteMode()
    {
        try
        {
            string mode = Arg("walkOnsMode").ToLowerInvariant();
            if (mode == "initialize") return Initialize();
            if (mode == "health") return Health();
            if (mode == "configure") return Configure();
            if (mode == "upsert") return Upsert();
            if (mode == "add") return AddCommand();
            if (mode == "delete") return Delete();
            if (mode == "remove") return RemoveCommand();
            if (mode == "watch") return Watch();
            if (mode == "reset") return Reset();
            if (mode == "list") return ListAll();
            if (mode == "test") return Test();
            throw new Exception("Unknown walk-on mode: " + mode);
        }
        catch (Exception ex)
        {
            CPH.LogError("[walk-ons] " + ex.Message);
            return true;
        }
    }

    private JObject Defaults()
    {
        return new JObject {
            ["schemaVersion"] = 2,
            ["moduleVersion"] = "2.1.1",
            ["config"] = new JObject {
                ["roster"] = new JObject(),
                ["sounds"] = new JObject(),
                ["settings"] = new JObject { ["oncePerStream"] = true, ["defaultVolumePercent"] = 100 }
            },
            ["session"] = new JObject { ["seen"] = new JArray() },
            ["lastEvent"] = JValue.CreateNull()
        };
    }

    private bool Initialize()
    {
        JObject payload = Payload();
        if (payload["config"] == null)
        {
            payload = Defaults();
            try
            {
                string legacy = CPH.GetGlobalVar<string>(LegacyRosterKey, true);
                if (!String.IsNullOrWhiteSpace(legacy))
                {
                    JObject roster = (JObject)payload["config"]["roster"];
                    foreach (JProperty item in JObject.Parse(legacy).Properties()) roster[item.Name] = item.Value.DeepClone();
                }
            }
            catch {}
        }
        else
        {
            payload["config"] = Normalize(payload["config"] as JObject ?? new JObject());
        }
        payload["schemaVersion"] = 2;
        payload["moduleVersion"] = "2.1.1";
        payload["session"] = new JObject { ["seen"] = new JArray() };
        if (payload["lastEvent"] == null) payload["lastEvent"] = JValue.CreateNull();
        return Write(payload);
    }

    private bool Health()
    {
        JObject payload = Payload();
        JObject config = payload["config"] as JObject ?? new JObject();
        CPH.LogInfo("[walk-ons] Health OK: schema=2 module=2.1.1 people=" + ((JObject)(config["roster"] ?? new JObject())).Count + " sounds=" + ((JObject)(config["sounds"] ?? new JObject())).Count);
        return true;
    }

    private bool Configure()
    {
        JObject payload = Payload();
        payload["config"] = Normalize(JObject.Parse(Arg("config")));
        payload["schemaVersion"] = 2;
        payload["moduleVersion"] = "2.1.1";
        return Write(payload);
    }

    private JObject Normalize(JObject input)
    {
        JObject roster = new JObject();
        JObject suppliedRoster = input["roster"] as JObject ?? new JObject();
        foreach (JProperty property in suppliedRoster.Properties())
        {
            string login = Login(property.Name);
            JObject item = property.Value as JObject;
            if (login == "" || item == null) continue;
            string type = Choice((string)item["type"], new[] { "sound", "soundpool", "video" }, "sound");
            roster[login] = new JObject {
                ["enabled"] = (bool?)item["enabled"] ?? true,
                ["type"] = type,
                ["value"] = Limit((string)item["value"], 80),
                ["choices"] = NormalizeChoices(item["choices"] as JArray),
                ["title"] = Limit((string)item["title"], 140),
                ["volume"] = Clamp((double?)item["volume"] ?? 1, 0, 1)
            };
        }
        JObject sounds = new JObject();
        JObject suppliedSounds = input["sounds"] as JObject ?? new JObject();
        foreach (JProperty property in suppliedSounds.Properties())
        {
            string id = Id(property.Name);
            JObject item = property.Value as JObject;
            if (id == "" || item == null) continue;
            sounds[id] = new JObject {
                ["id"] = id,
                ["label"] = Limit((string)item["label"] ?? id, 80),
                ["src"] = Limit((string)item["src"], 500),
                ["enabled"] = (bool?)item["enabled"] ?? true
            };
        }
        JObject settings = input["settings"] as JObject ?? new JObject();
        return new JObject {
            ["roster"] = roster,
            ["sounds"] = sounds,
            ["settings"] = new JObject {
                ["oncePerStream"] = (bool?)settings["oncePerStream"] ?? true,
                ["defaultVolumePercent"] = Clamp((double?)settings["defaultVolumePercent"] ?? 100, 0, 100)
            }
        };
    }

    private JArray NormalizeChoices(JArray input)
    {
        JArray result = new JArray();
        if (input == null) return result;
        foreach (JToken token in input)
        {
            string value = Id((string)token["value"]);
            double weight = Clamp((double?)token["weight"] ?? 1, 0, 1000);
            if (value != "" && weight > 0) result.Add(new JObject { ["value"] = value, ["weight"] = weight });
        }
        return result;
    }

    private bool Upsert()
    {
        JObject payload = Payload();
        JObject config = payload["config"] as JObject ?? (JObject)Defaults()["config"];
        JObject roster = config["roster"] as JObject ?? new JObject();
        string login = Login(Arg("login"));
        if (login == "") throw new Exception("Login is required.");
        JObject item;
        string raw = Arg("item");
        if (raw != "") item = JObject.Parse(raw);
        else item = new JObject {
            ["enabled"] = BooleanArg("enabled", true), ["type"] = Arg("type"), ["value"] = Arg("value"),
            ["choices"] = Parse(Arg("choices")), ["title"] = Arg("title"), ["volume"] = NumberArg("volume", 1)
        };
        JObject normalized = Normalize(new JObject {
            ["roster"] = new JObject { [login] = item }, ["sounds"] = config["sounds"], ["settings"] = config["settings"]
        });
        roster[login] = normalized["roster"][login];
        config["roster"] = roster;
        payload["config"] = config;
        return Write(payload);
    }

    private bool AddCommand()
    {
        string[] parts = Arg("rawInput").Split(new[] { ' ' }, 3, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 3) throw new Exception("Usage: !walkonadd login sound soundid OR soundpool soundA:3 soundB:1 OR video videoid title");
        string type = parts[1].ToLowerInvariant(), rest = parts[2], value = rest, title = "";
        JArray choices = new JArray();
        if (type == "video")
        {
            string[] video = rest.Split(new[] { ' ' }, 2, StringSplitOptions.RemoveEmptyEntries);
            value = video.Length > 0 ? video[0] : "";
            title = video.Length > 1 ? video[1] : "";
        }
        else if (type == "soundpool")
        {
            value = "";
            foreach (string entry in rest.Split(new[] { ' ', ',' }, StringSplitOptions.RemoveEmptyEntries))
            {
                string[] pair = entry.Split(':');
                double weight = 1;
                if (pair.Length > 1) Double.TryParse(pair[1], NumberStyles.Any, CultureInfo.InvariantCulture, out weight);
                if (pair[0] != "" && weight > 0) choices.Add(new JObject { ["value"] = pair[0], ["weight"] = weight });
            }
        }
        CPH.SetArgument("login", parts[0]); CPH.SetArgument("type", type); CPH.SetArgument("value", value);
        CPH.SetArgument("choices", choices.ToString(Formatting.None)); CPH.SetArgument("title", title);
        CPH.SetArgument("volume", "1"); CPH.SetArgument("enabled", "true");
        return Upsert();
    }

    private bool Delete()
    {
        JObject payload = Payload();
        JObject roster = payload["config"]?["roster"] as JObject;
        if (roster != null) roster.Remove(Login(Arg("login")));
        return Write(payload);
    }

    private bool RemoveCommand() { CPH.SetArgument("login", Arg("rawInput")); return Delete(); }

    private bool Reset()
    {
        JObject payload = Payload();
        string login = Login(Arg("login")); if (login == "") login = Login(Arg("rawInput"));
        JArray seen = payload["session"]?["seen"] as JArray ?? new JArray();
        if (login == "" || login == "all") seen.RemoveAll();
        else for (int index = seen.Count - 1; index >= 0; index--) if (Login((string)seen[index]) == login) seen.RemoveAt(index);
        payload["session"] = new JObject { ["seen"] = seen };
        return Write(payload);
    }

    private bool Watch()
    {
        string login = Login(Arg("userName")); if (login == "") login = Login(Arg("user"));
        string message = Arg("message");
        if (login == "" || message.StartsWith("!")) return true;
        return Trigger(login, false);
    }

    private bool Test()
    {
        string login = Login(Arg("login"));
        if (login == "") throw new Exception("Test login is required.");
        return Trigger(login, true);
    }

    private bool Trigger(string login, bool test)
    {
        JObject payload = Payload();
        JObject item = payload["config"]?["roster"]?[login] as JObject;
        if (item == null || !((bool?)item["enabled"] ?? true)) return true;
        JArray seen = payload["session"]?["seen"] as JArray ?? new JArray();
        bool once = (bool?)payload["config"]?["settings"]?["oncePerStream"] ?? true;
        if (!test && once && Contains(seen, login)) return true;
        if (Busy()) { CPH.LogInfo("[walk-ons] Media busy; " + login + " remains eligible."); return true; }
        string type = (string)item["type"] ?? "", value = (string)item["value"] ?? "";
        if (type == "soundpool") value = Pick(item["choices"] as JArray);
        if (value == "") throw new Exception(login + " has incomplete configuration.");
        CPH.SetArgument("id", value);
        CPH.SetArgument("volume", ((double?)item["volume"] ?? 1).ToString(CultureInfo.InvariantCulture));
        if (type == "video")
        {
            string title = (string)item["title"] ?? ""; if (title == "") title = login + " has entered chat";
            CPH.SetArgument("title", title);
            if (!CPH.RunAction("Video - Play", true)) throw new Exception("Video player rejected the walk-on.");
        }
        else
        {
            JObject sound = payload["config"]?["sounds"]?[value] as JObject;
            string requestId = Guid.NewGuid().ToString();
            CPH.SetArgument("walkOnSoundRequestId", requestId);
            CPH.SetArgument("src", (string)sound?["src"] ?? "");
            if (!CPH.RunAction("Walk-on Sound - Play", true)) throw new Exception("Sound player rejected the walk-on.");
            JObject playback = JObject.Parse(CPH.GetGlobalVar<string>("portable.walkonSound.state", true) ?? "{}");
            if ((string)playback["payload"]?["lastAcceptedRequestId"] != requestId) throw new Exception("Sound player rejected the walk-on.");
        }
        if (!test && !Contains(seen, login)) seen.Add(login);
        payload["session"] = new JObject { ["seen"] = seen };
        payload["lastEvent"] = new JObject { ["login"] = login, ["type"] = type, ["value"] = value, ["atMs"] = Now(), ["test"] = test };
        return Write(payload);
    }

    private bool Busy()
    {
        return Visible("portable.video.state", "current") || Visible("portable.shoutoutClip.state", "clip") || Visible("portable.walkonSound.state", "current");
    }

    private bool Visible(string key, string part)
    {
        try { return (bool?)JObject.Parse(CPH.GetGlobalVar<string>(key, true) ?? "")["payload"]?[part]?["visible"] ?? false; }
        catch { return false; }
    }

    private bool ListAll()
    {
        JObject roster = Payload()["config"]?["roster"] as JObject ?? new JObject();
        List<string> names = new List<string>();
        foreach (JProperty item in roster.Properties()) names.Add(item.Name + ":" + ((string)item.Value["type"] ?? "?"));
        names.Sort(); CPH.LogInfo(names.Count == 0 ? "[walk-ons] None configured." : "[walk-ons] " + String.Join(", ", names));
        return true;
    }

    private string Pick(JArray choices)
    {
        if (choices == null) return "";
        double total = 0; List<KeyValuePair<string, double>> valid = new List<KeyValuePair<string, double>>();
        foreach (JToken item in choices)
        {
            string value = (string)item["value"] ?? ""; double weight = (double?)item["weight"] ?? 1;
            if (value != "" && weight > 0) { valid.Add(new KeyValuePair<string, double>(value, weight)); total += weight; }
        }
        double roll = new Random(Guid.NewGuid().GetHashCode()).NextDouble() * total;
        foreach (KeyValuePair<string, double> item in valid) { roll -= item.Value; if (roll < 0) return item.Key; }
        return valid.Count > 0 ? valid[valid.Count - 1].Key : "";
    }

    private JObject Payload() { try { return (JObject)JObject.Parse(Read())["payload"] ?? new JObject(); } catch { return new JObject(); } }
    private string Read() { try { return CPH.GetGlobalVar<string>(StateKey, true) ?? ""; } catch { return ""; } }
    private bool Write(JObject payload)
    {
        long revision = 1; try { revision = ((long?)JObject.Parse(Read())["revision"] ?? 0) + 1; } catch {}
        JObject envelope = new JObject { ["schemaVersion"] = 1, ["feature"] = "walkOns", ["type"] = "state", ["revision"] = revision, ["payload"] = payload };
        string json = envelope.ToString(Formatting.None); CPH.SetGlobalVar(StateKey, json, true); try { CPH.WebsocketBroadcastJson(json); } catch {}
        return true;
    }
    private JToken Parse(string raw) { if (String.IsNullOrWhiteSpace(raw)) return new JArray(); try { return JToken.Parse(raw); } catch { return new JArray(); } }
    private bool Contains(JArray items, string login) { foreach (JToken item in items) if (Login((string)item) == login) return true; return false; }
    private string Arg(string key) { try { return args.ContainsKey(key) && args[key] != null ? args[key].ToString().Trim() : ""; } catch { return ""; } }
    private string Login(string value) { return Regex.Replace((value ?? "").Trim().TrimStart('@').ToLowerInvariant(), "[^a-z0-9_]", ""); }
    private string Id(string value) { return Regex.Replace((value ?? "").Trim().ToLowerInvariant(), "[^a-z0-9_-]", ""); }
    private string Limit(string value, int maximum) { value = (value ?? "").Trim(); return value.Length <= maximum ? value : value.Substring(0, maximum); }
    private double Clamp(double value, double minimum, double maximum) { return Math.Max(minimum, Math.Min(maximum, value)); }
    private double NumberArg(string key, double fallback) { double value; return Double.TryParse(Arg(key), NumberStyles.Any, CultureInfo.InvariantCulture, out value) ? Clamp(value, 0, 1) : fallback; }
    private bool BooleanArg(string key, bool fallback) { bool value; return Boolean.TryParse(Arg(key), out value) ? value : fallback; }
    private string Choice(string value, string[] allowed, string fallback) { foreach (string item in allowed) if (value == item) return item; return fallback; }
    private long Now() { return DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(); }
}
