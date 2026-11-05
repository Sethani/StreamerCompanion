using System;
using System.Net.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
public class CPHInline {
 const string ConfigKey="portable.streamLaunch.config", ConfigStateKey="portable.streamLaunch.configState", StateKey="portable.streamLaunch.state", HandledKey="portable.streamLaunch.handledAtMs";
 static readonly object Gate=new object(); static bool Busy=false;
 string Arg(string key){return args.ContainsKey(key)&&args[key]!=null?args[key].ToString().Trim():"";}
 string Read(string key){try{return CPH.GetGlobalVar<string>(key,true)??"";}catch{return "";}}
 JObject Parse(string text){try{return JObject.Parse(text);}catch{return new JObject();}}
 protected virtual long Now(){return DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();}
 protected virtual JObject SpotifyRequest(string route){using(var client=new HttpClient()){client.Timeout=TimeSpan.FromSeconds(20);var response=client.GetAsync("http://127.0.0.1:3127"+route).GetAwaiter().GetResult();if(!response.IsSuccessStatusCode)throw new Exception("Spotify service request failed.");return JObject.Parse(response.Content.ReadAsStringAsync().GetAwaiter().GetResult());}}
 JObject Config(){JObject value=Parse(Read(ConfigKey));bool legacy=value.HasValues;
  if(value["durationSeconds"]==null)value["durationSeconds"]=300;
  if(value["finishedText"]==null)value["finishedText"]="Starting\nsoon";
  if(value["startingSoonScene"]==null)value["startingSoonScene"]="";
  if(value["enabled"]==null)value["enabled"]=legacy;
  if(value["fallbackEnabled"]==null)value["fallbackEnabled"]=legacy;
  if(value["spotifyEnabled"]==null)value["spotifyEnabled"]=true;
  if(value["followupEnabled"]==null)value["followupEnabled"]=legacy;
  if(value["followupAction"]==null)value["followupAction"]="Stream - Announce and Bookkeeping";
  return value;
 }
 void Broadcast(string key,string feature,JObject payload){long revision=((long?)Parse(Read(key))["revision"]??0)+1;string json=new JObject{{"schemaVersion",1},{"feature",feature},{"type","state"},{"revision",revision},{"payload",payload}}.ToString(Formatting.None);CPH.SetGlobalVar(key,json,true);try{CPH.WebsocketBroadcastJson(json);}catch{}}
 void SaveConfig(JObject config){CPH.SetGlobalVar(ConfigKey,config.ToString(Formatting.None),true);Broadcast(ConfigStateKey,"streamLaunchConfig",(JObject)config.DeepClone());}
 JArray Scenes(){if(!CPH.ObsIsConnected())return new JArray();JObject raw=Parse(CPH.ObsSendRaw("GetSceneList","{}"));JObject body=raw["responseData"] as JObject??raw;JArray result=new JArray();foreach(var item in body["scenes"] as JArray??new JArray()){string name=(string)item["sceneName"];if(!String.IsNullOrWhiteSpace(name))result.Add(name);}return result;}
 bool IsControl(string action){foreach(string name in new[]{"GoingLive","Stream - Launch Engine","Stream - Configure Launch","Stream - Launch","Stream - Online Fallback","Stream - Initialize Launch","Stream - Launch Health"})if(String.Equals(name,action,StringComparison.OrdinalIgnoreCase))return true;return false;}
 JObject Check(JObject config){JArray problems=new JArray(),scenes=new JArray();bool connected=CPH.ObsIsConnected(),streaming=connected&&CPH.ObsIsStreaming();
  if(!(bool)config["enabled"])problems.Add("Launch automation is disabled.");
  if(!connected)problems.Add("OBS is disconnected.");else{try{scenes=Scenes();}catch{problems.Add("Could not read OBS scenes.");}}
  string scene=(string)config["startingSoonScene"]??"";bool found=false;foreach(var name in scenes)if((string)name==scene)found=true;if(!found)problems.Add("Choose an available Starting Soon scene.");
  if(!CPH.ActionExists("Countdown - Start"))problems.Add("Countdown actions are missing.");
  if((bool)config["followupEnabled"]){string action=(string)config["followupAction"]??"";if(IsControl(action))problems.Add("Choose a separate follow-up action, not a launch control.");else if(!CPH.ActionExists(action))problems.Add("The configured private follow-up action is unavailable.");}
  if((bool)config["spotifyEnabled"]){try{JObject health=SpotifyRequest("/health");if((string)health["service"]!="spotify"||!((bool?)health["configured"]??false)||!((bool?)health["hasPlaylist"]??true))problems.Add("Configure and start Spotify Music, including its playlist, first.");}catch{problems.Add("Spotify Music is unavailable.");}}
  return new JObject{{"ready",problems.Count==0},{"problems",problems},{"obsConnected",connected},{"obsStreaming",streaming},{"scenes",scenes}};
 }
 void State(string status,string source,string launchId,string error="",JObject check=null,string spotify="",string followup=""){
  JObject payload=new JObject{{"status",status},{"source",source},{"launchId",launchId},{"updatedAtMs",Now()},{"error",error},{"config",Config()},{"spotify",spotify},{"followup",followup}};
  if(check!=null)payload["preflight"]=check;Broadcast(StateKey,"streamLaunch",payload);
 }
 void Validate(JObject value){long seconds; if(!Int64.TryParse(value["durationSeconds"].ToString(),out seconds)||seconds<1||seconds>86400)throw new Exception("Countdown must be 1–86400 whole seconds.");
  foreach(string key in new[]{"enabled","fallbackEnabled","spotifyEnabled","followupEnabled"})if(value[key].Type!=JTokenType.Boolean)throw new Exception("Use true/false for launch switches.");
  foreach(string key in new[]{"startingSoonScene","finishedText","followupAction"})if(value[key].Type!=JTokenType.String||value[key].ToString().Length>1000)throw new Exception("Invalid launch text field.");
  if((bool)value["followupEnabled"]&&String.IsNullOrWhiteSpace((string)value["followupAction"]))throw new Exception("Choose a private follow-up action.");
 }
 bool Configure(){lock(Gate){if(Busy){CPH.LogWarn("[stream-launch] Wait for the current launch before saving.");return true;}}
  JObject value=Config();if(Arg("config")!=""){JObject input=JObject.Parse(Arg("config"));foreach(string key in new[]{"durationSeconds","finishedText","startingSoonScene","enabled","fallbackEnabled","spotifyEnabled","followupEnabled","followupAction"})if(input[key]!=null)value[key]=input[key].DeepClone();}
  else{string seconds=Arg("totalSeconds");if(seconds=="")seconds=Arg("durationSeconds");if(seconds!=""){long parsed;if(!Int64.TryParse(seconds,out parsed))throw new Exception("Use whole seconds.");value["durationSeconds"]=parsed;}foreach(string key in new[]{"startingSoonScene","finishedText"})if(Arg(key)!="")value[key]=Arg(key);}
  Validate(value);SaveConfig(value);State("configured","operator","",check:Check(value));return true;
 }
 bool Start(bool fallback){lock(Gate){if(Busy){CPH.LogWarn("[stream-launch] Launch already in progress.");return true;}Busy=true;}
  string source=fallback?"twitch-online-fallback":"manual",id=Guid.NewGuid().ToString("N"),spotify="disabled",followup="disabled";
  try{
   JObject config=Config();Validate(config);
   if(!(bool)config["enabled"]||(fallback&&!(bool)config["fallbackEnabled"])){CPH.LogInfo("[stream-launch] Disabled launch ignored.");return true;}
   long handled;Int64.TryParse(Read(HandledKey),out handled);if(fallback&&handled>0&&Now()-handled<30*60*1000){CPH.LogInfo("[stream-launch] Duplicate online event ignored.");return true;}
   JObject check=Check(config);if(!((bool)check["ready"]))throw new Exception("Readiness check failed. Check launch settings.");
   if(!fallback&&(bool)check["obsStreaming"])throw new Exception("OBS is already streaming; launch ignored.");
   if(fallback&&!(bool)check["obsStreaming"])throw new Exception("Online fallback requires an active OBS stream.");
   // Persist before effects: an overlapping/late online event must not repeat announcements.
   CPH.SetGlobalVar(HandledKey,Now().ToString(),true);State("starting",source,id,check:check);
   string scene=(string)config["startingSoonScene"];
   if(!fallback){CPH.ObsSetScene(scene);if(CPH.ObsGetCurrentScene()!=scene)throw new Exception("OBS did not select the Starting Soon scene.");}
   CPH.SetArgument("durationSeconds",config["durationSeconds"].ToString());CPH.SetArgument("finishedText",(string)config["finishedText"]);
   if(!CPH.RunAction("Countdown - Start",true))throw new Exception("Countdown could not start.");
   JObject countdown=Parse(Read("portable.countdown.state"))["payload"] as JObject;long end=(long?)countdown?["endTimeMs"]??0;
   if(countdown==null||(string)countdown["status"]!="running"||end<=Now())throw new Exception("Countdown did not publish a running timer.");
   if(!fallback){CPH.ObsStartStreaming();long deadline=Now()+15000;while(!CPH.ObsIsStreaming()&&Now()<deadline)CPH.Wait(250);if(!CPH.ObsIsStreaming())throw new Exception("OBS did not confirm streaming. Follow-up actions were not called.");}
   if((bool)config["spotifyEnabled"]){try{long remaining=Math.Max(1,(long)Math.Ceiling((end-Now())/1000.0));SpotifyRequest("/api/spotify/stream-start?durationSeconds="+remaining);spotify="started";}catch{spotify="failed";}}
   check["obsStreaming"]=true;
   if((bool)config["followupEnabled"]){CPH.SetArgument("launchId",id);CPH.SetArgument("launchSource",source);try{followup=CPH.RunAction((string)config["followupAction"],true)?"requested":"failed";}catch{followup="failed";}}
   State(spotify=="failed"||followup=="failed"?"partial":"complete",source,id,spotify=="failed"||followup=="failed"?"OBS is live; an optional step failed. Review its controls before retrying.":"",check,spotify,followup);
  }catch(Exception error){State("error",source,id,error.Message);CPH.LogError("[stream-launch] "+error.Message);}finally{lock(Gate){Busy=false;}}return true;
 }
 public bool Execute(){try{string mode=Arg("streamLaunchMode").ToLowerInvariant();
  if(mode=="launch")return Start(false);if(mode=="fallback")return Start(true);if(mode=="configure")return Configure();
  if(mode=="initialize"||mode=="health"){JObject config=Config();Validate(config);if(mode=="initialize")SaveConfig(config);JObject previous=Parse(Read(StateKey))["payload"] as JObject;string status=(string)previous?["status"]??"idle",error=(string)previous?["error"]??"";if(status=="starting"&&!Busy){status="interrupted";error="Previous launch interrupted. Review OBS and follow-up status before retrying.";}State(status,(string)previous?["source"]??"operator",(string)previous?["launchId"]??"",error,Check(config),(string)previous?["spotify"]??"",(string)previous?["followup"]??"");return true;}
  CPH.LogError("[stream-launch] Unknown mode; no launch performed.");
 }catch{CPH.LogError("[stream-launch] Invalid launch configuration; no launch performed.");}return true;}
}
