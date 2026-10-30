using System;
using System.Net.Http;
public class CPHInline {
  string Arg(string key) { try { return args.ContainsKey(key) && args[key] != null ? args[key].ToString().Trim() : ""; } catch { return ""; } }
  string ReadVolatile(string key) { try { return CPH.GetGlobalVar<string>(key, false) ?? ""; } catch { return ""; } }
  public bool Execute() {
    string scene = Arg("obs.sceneName");
    if (String.IsNullOrWhiteSpace(scene)) scene = Arg("sceneName");
    if (String.IsNullOrWhiteSpace(scene)) return true;
    string token = Guid.NewGuid().ToString("N");
    CPH.SetGlobalVar("spotify.scene.pending", token, false);
    CPH.Wait(350);
    if (ReadVolatile("spotify.scene.pending") != token) return true;
    try {
      using (var client = new HttpClient()) {
        client.Timeout = TimeSpan.FromSeconds(12);
        string url = "http://127.0.0.1:3127/api/spotify/scene?scene=" + Uri.EscapeDataString(scene);
        var response = client.GetAsync(url).GetAwaiter().GetResult();
        if (!response.IsSuccessStatusCode) CPH.LogWarn("[spotify-scenes] Companion returned HTTP " + (int)response.StatusCode + " for scene '" + scene + "'.");
      }
    } catch (Exception ex) { CPH.LogWarn("[spotify-scenes] Companion unavailable: " + ex.Message); }
    return true;
  }
}