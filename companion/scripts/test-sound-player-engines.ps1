$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$source = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/sound-player/streamerbot/sound-player-engine.cs')
$source = $source.Replace('private const string StateKey', 'public FakeCPH CPH = new FakeCPH(); public System.Collections.Generic.Dictionary<string,object> args = new System.Collections.Generic.Dictionary<string,object>(); private const string StateKey')
$fake = @'
using System;
using System.Collections.Generic;
public class FakeCPH {
 public Dictionary<string,object> Globals = new Dictionary<string,object>();
 public bool FailPersist;
 public T GetGlobalVar<T>(string key,bool persist){return Globals.ContainsKey(key)?(T)Globals[key]:default(T);}
 public void SetGlobalVar(string key,object value,bool persist){if(FailPersist)throw new Exception("Synthetic save failure");Globals[key]=value;}
 public void WebsocketBroadcastJson(string json){}
 public void LogInfo(string text){}
 public void LogWarn(string text){}
 public void LogError(string text){}
}
'@
$tests = @'
using System;
using Newtonsoft.Json.Linq;
public static class Checks {
 static void Assert(bool value,string message){if(!value)throw new Exception(message);}
 static JObject Payload(CPHInline e){return (JObject)JObject.Parse((string)e.CPH.Globals["portable.walkonSound.state"])["payload"];}
 static bool Run(CPHInline e,string mode,params string[] pairs){e.args.Clear();e.args["soundPlayerMode"]=mode;for(int i=0;i<pairs.Length;i+=2)e.args[pairs[i]]=pairs[i+1];return e.Execute();}
 public static void RunAll(){
  var e=new CPHInline();Run(e,"initialize");
  const string src="http://127.0.0.1:3135/api/public/media/sound-player/11111111-1111-1111-1111-111111111111.wav";
  var config=JObject.Parse("{\"library\":{},\"pools\":{},\"settings\":{\"masterVolumePercent\":50}}");
  config["library"]["tone"]=new JObject{{"label","Synthetic tone"},{"src",src},{"enabled",true}};
  Assert(Run(e,"configure","config",config.ToString()),"Configure");
  string request=Guid.NewGuid().ToString();Assert(Run(e,"play","id","tone","volume","0.4","requestId",request),"Play");
  var p=Payload(e);long start=(long)p["current"]["startedAtMs"];
  Assert((double)p["current"]["volume"]==0.2,"Master gain exactly once");
  Run(e,"play","id","tone","requestId",request);Assert((long)Payload(e)["current"]["startedAtMs"]==start,"Retry replayed");
  string one=Guid.NewGuid().ToString(),two=Guid.NewGuid().ToString(),playback=(string)p["current"]["requestId"];
  Run(e,"renderer","rendererOperation","claim","rendererId",one,"startedAtMs",start.ToString(),"playbackRequestId",playback);
  Run(e,"renderer","rendererOperation","claim","rendererId",two,"startedAtMs",start.ToString(),"playbackRequestId",playback);
  Assert((string)Payload(e)["current"]["rendererId"]==one,"Duplicate claim");
  Run(e,"renderer","rendererOperation","complete","rendererId",two,"startedAtMs",start.ToString(),"playbackRequestId",playback);
  Assert((bool)Payload(e)["current"]["visible"],"Wrong renderer completed");
  Run(e,"volume","volumePercent","0");Assert((double)Payload(e)["current"]["volume"]==0 && (long)Payload(e)["current"]["startedAtMs"]==start,"Volume restarted");
  Assert(!Run(e,"play","id","tone","rejectWhenBusy","true"),"Guarded play replaced audio");
  Run(e,"play","id","tone");Assert((long)Payload(e)["current"]["startedAtMs"]>start,"Replacement identity");
  Run(e,"stop","startedAtMs",start.ToString());Assert((bool)Payload(e)["current"]["visible"],"Stale completion");
  Run(e,"initialize");Assert(!(bool)Payload(e)["current"]["visible"] && (string)Payload(e)["lastAcceptedRequestId"]!="","Startup replay/ack loss");
  e.CPH.FailPersist=true;string failed=Guid.NewGuid().ToString();Assert(!Run(e,"play","id","tone","requestId",failed),"Persistence failure accepted");e.CPH.FailPersist=false;
  Assert((string)Payload(e)["lastAcceptedRequestId"]!=failed,"Failed durable acceptance");
  config["library"]["tone"]["enabled"]=false;Run(e,"configure","config",config.ToString());Assert(!Run(e,"play","id","tone"),"Disabled sound fallback");
  Assert(!Run(e,"play","src","https://example.com/test.wav"),"Remote source accepted");
  Assert(!Run(e,"volume","volumePercent","NaN"),"Nonfinite volume accepted");
  config["library"]["tone"]["enabled"]=true;Run(e,"configure","config",config.ToString());Run(e,"stop");
  int guardedAccepted=0;
  System.Threading.Tasks.Parallel.For(0,24,index=>{var child=new CPHInline();child.CPH.Globals=e.CPH.Globals;if(Run(child,"play","id","tone","rejectWhenBusy","true"))System.Threading.Interlocked.Increment(ref guardedAccepted);});
  Assert(guardedAccepted==1,"Concurrent guarded requests must accept exactly one");Run(e,"stop");
  config["pools"]["mix"]=new JObject{{"label","Synthetic pool"},{"enabled",true},{"choices",new JArray(new JObject{{"value","tone"},{"weight",3}})}};
  Run(e,"configure","config",config.ToString());Assert(Run(e,"adapter","id","tone"),"Custom fixed-sound trigger recipe");Run(e,"stop");Assert(Run(e,"adapter","poolId","mix"),"Custom trigger adapter must resolve saved pools");Run(e,"stop");
  string roster="{\"payload\":{\"config\":{\"roster\":{\"fixture\":{\"type\":\"soundpool\",\"volume\":0,\"choices\":[{\"value\":\"tone\",\"weight\":3}]}},\"sounds\":{\"tone\":{\"src\":\""+src+"\",\"enabled\":false}},\"settings\":{}},\"session\":{\"seen\":[\"existing\"]}}}";
  e.CPH.Globals["portable.walkOns.state"]=roster;
  // Start with a distinct owner profile to exercise idempotent migration and rollback data.
  var migrated=new CPHInline();migrated.CPH.Globals["portable.walkOns.state"]=roster;Run(migrated,"initialize");
  Assert(Run(migrated,"configure","migrateWalkOns","true"),"Migration");var first=Payload(migrated)["config"].ToString();Run(migrated,"configure","migrateWalkOns","true");Assert(Payload(migrated)["config"].ToString()==first,"Migration repeated");
  Assert((string)migrated.CPH.Globals["portable.walkOns.state"]==roster,"Migration reset ledger");
  Assert(Run(migrated,"assigned","login","fixture"),"Legacy disabled positive choice changed");Assert((double)Payload(migrated)["current"]["volume"]==0,"Zero entrance volume");
  Run(migrated,"stop");var pool=(JObject)Payload(migrated)["config"]["pools"];foreach(var prop in pool.Properties())prop.Value["choices"][0]["value"]="missing";var changed=Payload(migrated)["config"];changed["pools"]=pool;Run(migrated,"configure","config",changed.ToString());Assert(!Run(migrated,"assigned","login","fixture"),"Missing legacy selection fell back");
 }
}
'@
$references = @((Get-ChildItem -LiteralPath (Join-Path $PSHOME 'ref') -Filter '*.dll').FullName) + (Join-Path $PSHOME 'Newtonsoft.Json.dll')
Add-Type -TypeDefinition ('namespace SoundTest {' + $fake + "}`nnamespace SoundTest {" + $source + "}`nnamespace SoundTest {" + $tests + '}') -ReferencedAssemblies $references -CompilerOptions '/nowarn:1701,1702'
[SoundTest.Checks]::RunAll()
Write-Output 'Sound native engine passed: persistence, deduplication, replacement/busy policy, claims, stale completion, volume, safe sources, migration and ledger preservation.'

