using System;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
public class CPHInline {
 private static readonly object Gate=String.Intern("streamercompanion:scene-bindings:state:v1");
 private static long Pending;
 private static string LastScene;
 private const string ConfigKey="portable.sceneBindings.config",StateKey="portable.sceneBindings.state";
 private const string WindowScript=@"param(
    [ValidateSet(""List"", ""Activate"")]
    [string]$Mode = ""List"",
    [string]$ProcessName = """",
    [string]$TitleContains = """",
    [string]$ProcessNameBase64 = """",
    [string]$TitleContainsBase64 = """"
)

if (-not [string]::IsNullOrWhiteSpace($ProcessNameBase64)) {
    $ProcessName = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($ProcessNameBase64))
}
if (-not [string]::IsNullOrWhiteSpace($TitleContainsBase64)) {
    $TitleContains = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($TitleContainsBase64))
}

$ErrorActionPreference = ""Stop""

function Get-DesktopWindows {
    @(Get-Process | Where-Object {
        $_.MainWindowHandle -ne 0 -and -not [string]::IsNullOrWhiteSpace($_.MainWindowTitle)
    } | ForEach-Object {
        [pscustomobject]@{
            processName = $_.ProcessName
            title = $_.MainWindowTitle
            pid = $_.Id
            handle = [int64]$_.MainWindowHandle
        }
    })
}

if ($Mode -eq ""List"") {
    @(Get-DesktopWindows | Select-Object processName, title, pid) | ConvertTo-Json -Compress
    exit 0
}

if ([string]::IsNullOrWhiteSpace($ProcessName)) {
    throw ""Choose a window process first.""
}

$matches = @(Get-DesktopWindows | Where-Object {
    $_.processName -ieq $ProcessName -and (
        [string]::IsNullOrWhiteSpace($TitleContains) -or
        $_.title.IndexOf($TitleContains, [StringComparison]::OrdinalIgnoreCase) -ge 0
    )
})

if ($matches.Count -eq 0) {
    $titleDetail = if ([string]::IsNullOrWhiteSpace($TitleContains)) { """" } else { "" with title containing '$TitleContains'"" }
    throw ""No open window found for process '$ProcessName'$titleDetail.""
}

$target = $matches[0]
Add-Type -TypeDefinition @""
using System;
using System.Runtime.InteropServices;
public static class SceneWindowActivation {
    [DllImport(""user32.dll"")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport(""user32.dll"")]
    public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
}
""@

$handle = [IntPtr]$target.handle
[void][SceneWindowActivation]::ShowWindowAsync($handle, 9)
$activated = [SceneWindowActivation]::SetForegroundWindow($handle)
if (-not $activated) {
    $shell = New-Object -ComObject WScript.Shell
    $activated = $shell.AppActivate([int]$target.pid)
}
if (-not $activated) {
    throw ""Windows refused to activate '$($target.title)'.""
}

[pscustomobject]@{
    activated = $true
    processName = $target.processName
    title = $target.title
    pid = $target.pid
} | ConvertTo-Json -Compress";
 private string A(string key){return args.ContainsKey(key)&&args[key]!=null?args[key].ToString():"";}
 private string Read(string key){return CPH.GetGlobalVar<string>(key,true)??"";}
 private long Now(){return DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();}
 private JObject Defaults(){return new JObject{["version"]=1,["bindings"]=new JObject()};}
 private string Text(JObject o,string key,int maximum){var v=o[key];if(v==null)return "";if(v.Type!=JTokenType.String)throw new Exception("Invalid "+key+" value.");string s=((string)v).Trim();if(s.Length>maximum)throw new Exception(key+" exceeds its supported length.");return s;}
 private JObject Window(JObject o){return new JObject{["processName"]=Text(o,"processName",160),["titleContains"]=Text(o,"titleContains",240)};}
 private JObject Validate(JObject input,JObject previous){
  if(input["version"]!=null&&(input["version"].Type!=JTokenType.Integer||(int)input["version"]!=1))throw new Exception("Unsupported scene-link configuration version.");
  var result=(JObject)previous.DeepClone();if(input["bindings"]==null)return result;
  var supplied=input["bindings"] as JObject;if(supplied==null)throw new Exception("Scene bindings must be an object.");var bindings=new JObject();
  foreach(var p in supplied.Properties()){if(String.IsNullOrWhiteSpace(p.Name)||p.Name.Length>200||!(p.Value is JObject))throw new Exception("Invalid scene binding.");var b=(JObject)p.Value;var category=Text(b,"category",80);if(b["window"]!=null&&!(b["window"] is JObject))throw new Exception("Window target must be an object.");var window=Window(b["window"] as JObject??new JObject());if(category!=""||(string)window["processName"]!="")bindings[p.Name]=new JObject{["category"]=category,["window"]=window};}
  result["bindings"]=bindings;result["version"]=1;return result;
 }
 private JObject Config(){string raw=Read(ConfigKey);return raw==""?Defaults():Validate(JObject.Parse(raw),Defaults());}
 private JObject Previous(){try{return JObject.Parse(Read(StateKey))["payload"] as JObject??new JObject();}catch{return new JObject();}}
 private void Publish(JObject p,string mode,string status,string error="",bool terminal=true){
  long revision=0;try{revision=(long?)JObject.Parse(Read(StateKey))["revision"]??0;}catch{}
  p["moduleVersion"]="2.0.0";p["serverTimeMs"]=Now();p["operation"]=new JObject{["requestId"]=A("requestId"),["mode"]=mode,["status"]=status,["error"]=error};if(terminal&&A("requestId")!="")p["lastRequestId"]=A("requestId");
  string json=new JObject{["schemaVersion"]=1,["feature"]="sceneBindings",["type"]="state",["revision"]=revision+1,["payload"]=p}.ToString(Formatting.None);
  CPH.SetGlobalVar(StateKey,json,true);try{CPH.WebsocketBroadcastJson(json);}catch{}
 }
 protected virtual string RunHelper(string mode,string process,string title){
  string script="[Console]::OutputEncoding = New-Object Text.UTF8Encoding($false); & {\n"+WindowScript+"\n} -Mode "+mode+" -ProcessNameBase64 "+Convert.ToBase64String(Encoding.UTF8.GetBytes(process==""?" ":process))+" -TitleContainsBase64 "+Convert.ToBase64String(Encoding.UTF8.GetBytes(title==""?" ":title));
  var info=new ProcessStartInfo("powershell.exe","-NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand "+Convert.ToBase64String(Encoding.Unicode.GetBytes(script))){UseShellExecute=false,CreateNoWindow=true,RedirectStandardOutput=true,RedirectStandardError=true};
  using(var child=Process.Start(info)){var output=child.StandardOutput.ReadToEndAsync();var errors=child.StandardError.ReadToEndAsync();if(!child.WaitForExit(10000)){try{child.Kill();child.WaitForExit(2000);}catch{}throw new Exception("Window helper timed out.");}
   if(!Task.WaitAll(new Task[]{output,errors},2000))throw new Exception("Window helper output timed out.");if(child.ExitCode!=0)throw new Exception("Window helper could not complete; the target may be unavailable or Windows refused focus.");return output.Result.Trim();}
 }
 private JObject Obs(string type){if(!CPH.ObsIsConnected())throw new Exception("OBS is disconnected.");var response=JObject.Parse(CPH.ObsSendRaw(type,"{}",0));if((bool?)response["requestStatus"]?["result"]==false||(string)response["status"]=="error")throw new Exception("OBS rejected the scene inventory request.");return response["responseData"] as JObject??response["data"] as JObject??response;}
 private JObject ChannelCategory(){try{var broadcaster=CPH.TwitchGetBroadcaster();if(broadcaster==null)throw new Exception();var info=CPH.TwitchGetExtendedUserInfoById(broadcaster.UserId);if(info==null)throw new Exception();return new JObject{["available"]=true,["name"]=info.Game??"",["id"]=info.GameId??""};}catch{return new JObject{["available"]=false};}}
 private JObject Inventory(JObject config,bool windows){
  var p=Previous();var scenes=new JArray();string current="",obsError="",windowsError="";bool available=false;
  try{var data=Obs("GetSceneList");var items=data["scenes"] as JArray;if(items==null||data["currentProgramSceneName"]?.Type!=JTokenType.String)throw new Exception("OBS scene inventory is unavailable.");current=(string)data["currentProgramSceneName"];foreach(JObject item in items){string name=(string)item["sceneName"];if(name!=null)scenes.Add(name);}available=true;}catch{obsError="OBS scene inventory is unavailable.";}
  JArray list=p["windows"] as JArray??new JArray();if(windows)try{string raw=RunHelper("List","","");var value=raw==""?new JArray():JToken.Parse(raw);list=value is JArray?(JArray)value:new JArray(value);}catch{list=new JArray();windowsError="Window inventory is unavailable.";}
  return new JObject{["config"]=config,["obsAvailable"]=available,["obsError"]=obsError,["windowsError"]=windowsError,["currentScene"]=current,["scenes"]=scenes,["windows"]=list,["channelCategory"]=windows?ChannelCategory():p["channelCategory"]??new JObject{["available"]=false},["missingScenes"]=new JArray(((JObject)config["bindings"]).Properties().Where(b=>!scenes.Any(s=>(string)s==b.Name)).Select(b=>b.Name)),["lastExecution"]=p["lastExecution"]??new JObject()};
 }
 private JObject Focus(JObject window){if((string)window["processName"]=="")return new JObject{["status"]="skipped"};var response=JObject.Parse(RunHelper("Activate",(string)window["processName"],(string)window["titleContains"]));if((bool?)response["activated"]!=true)throw new Exception("Windows did not confirm window activation.");return new JObject{["status"]="success"};}
 private JObject Category(string category){if(category=="")return new JObject{["status"]="skipped"};if(CPH.SetChannelGame(category)==null)throw new Exception("Twitch did not accept the category request.");return new JObject{["status"]="accepted"};}
 private void ExecuteBinding(JObject p,string mode,string scene,JObject binding,long token){
  var execution=new JObject{["sceneName"]=scene,["source"]=mode=="scene-changed"?"obs-trigger":"dock",["status"]="running",["atMs"]=Now()};p["lastExecution"]=execution;Publish((JObject)p.DeepClone(),mode,"running",terminal:false);
  bool failed=false,superseded=false;foreach(string part in new[]{"category","focus"}){
   if(mode=="scene-changed"&&Interlocked.Read(ref Pending)!=token){superseded=true;execution[part]=new JObject{["status"]="superseded"};continue;}
   try{execution[part]=part=="category"?Category((string)binding["category"]??""):Focus(binding["window"] as JObject??Window(new JObject()));}catch{failed=true;execution[part]=new JObject{["status"]="failed",["error"]=part=="category"?"Twitch category request failed.":"Window focus failed or timed out."};}
  }
  execution["status"]=superseded?"superseded":failed?"partial":"success";execution["finishedAtMs"]=Now();Publish(p,mode,superseded?"superseded":failed?"partial":"ok",failed?"Some scene-link operations failed.":"");
 }
 public bool Execute(){
  string mode=A("sceneBindingsMode").Trim().ToLowerInvariant();long token=0;
  if(mode=="scene-changed"){token=Interlocked.Increment(ref Pending);CPH.Wait(350);}
  lock(Gate){JObject p=null;try{
   if(!new[]{"initialize","refresh","save","apply","scene-changed","test-focus","test-category","monitor"}.Contains(mode))throw new Exception("Unknown Scene Links operation.");
   var previous=Previous();if(A("requestId")!=""&&(string)previous["lastRequestId"]==A("requestId")&&(string)previous["operation"]?["status"]!="running")return true;
   var c=Config();if(mode=="save"){if(String.IsNullOrWhiteSpace(A("configJson")))throw new Exception("Scene-link configuration is required.");c=Validate(JObject.Parse(A("configJson")),c);}
   if(Read(ConfigKey)==""||mode=="save")CPH.SetGlobalVar(ConfigKey,c.ToString(Formatting.None),true);
   p=Inventory(c,mode=="initialize"||mode=="refresh");if(mode=="initialize"){Interlocked.Increment(ref Pending);LastScene=(bool)p["obsAvailable"]?(string)p["currentScene"]:null;}
   if(mode=="monitor"){Publish(p,mode,"error","Legacy Monitor is disabled; native OBS events own scene changes.");return true;}
   if(new[]{"initialize","refresh","save"}.Contains(mode)){Publish(p,mode,"ok");return true;}
   string scene=mode=="test-focus"||mode=="test-category"?"test":A("sceneName");if(mode=="scene-changed"){
    scene=A("obs.sceneName");if(scene=="")scene=A("sceneName");
    if(token!=Interlocked.Read(ref Pending)||(bool?)p["obsAvailable"]!=true||scene==""||scene!=(string)p["currentScene"]||scene==LastScene){Publish(p,mode,"superseded");return true;}
    if(LastScene==null){LastScene=scene;Publish(p,mode,"superseded");return true;}LastScene=scene;
   }
   JObject binding;
   if(mode=="test-focus"){binding=new JObject{["category"]="",["window"]=Window(JObject.Parse(A("windowJson")))};}
   else if(mode=="test-category"){binding=new JObject{["category"]=Text(new JObject{["category"]=A("category")},"category",80),["window"]=Window(new JObject())};}
   else{if((bool?)p["obsAvailable"]!=true)throw new Exception("OBS is unavailable; no scene link was applied.");binding=c["bindings"]?[scene] as JObject;if(binding==null){Publish(p,mode,"ok");return true;}}
   ExecuteBinding(p,mode,scene,binding,token);return true;
  }catch{try{Publish(p??Previous(),mode,"error","Scene Links could not complete; check configuration and connections. Saved mappings were not replaced by malformed input.");}catch{}CPH.LogError("[scene-links] Operation failed; inspect private module status.");return true;}}
 }
}

