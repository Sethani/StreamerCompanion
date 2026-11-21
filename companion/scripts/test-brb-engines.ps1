$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$sources=@{Brb='modules/brb-rotation/streamerbot/brb-engine.cs';Video='modules/video/streamerbot/video---engine-0.cs';Self='modules/self-clips/streamerbot/self-clips-engine.cs';Player='modules/shoutout-clips/streamerbot/shoutout-clips-engine.cs'}
$compiled=''
foreach($entry in $sources.GetEnumerator()){
 $source=Get-Content -Raw -LiteralPath (Join-Path $root $entry.Value)
 $source=$source -replace 'public class CPHInline\s*\{','public class CPHInline { public BrbHarness.FakeCPH CPH; public System.Collections.Generic.Dictionary<string,object> args=new System.Collections.Generic.Dictionary<string,object>();'
 $compiled+="`nnamespace $($entry.Key) {"+$source+'}'
}
$harness=@'
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Newtonsoft.Json.Linq;
namespace BrbHarness {
public class Account { public string UserId="owner",UserLogin="fixture",UserName="Fixture"; }
public class Clip { public string Id="SyntheticClip",Title="Synthetic title"; public double Duration=1; }
public class FakeCPH {
 public Dictionary<string,object> Globals=new Dictionary<string,object>();public Dictionary<string,object> Arguments=new Dictionary<string,object>();
 public Account Broadcaster=new Account();public List<string> Calls=new List<string>();public bool ThrowDispatch,ApiFail;public int FailWritesAfterPlay,PrivateFailures,Fetches;
 public T GetGlobalVar<T>(string key,bool persisted){return Globals.ContainsKey(key)?(T)Globals[key]:default(T);}
 public void SetGlobalVar(string key,object value,bool persisted){if(key=="brb.private.state"&&PrivateFailures>0){PrivateFailures--;throw new Exception("Synthetic save failure");}Globals[key]=value;}
 public Account TwitchGetBroadcaster(){return Broadcaster;}
 public List<Clip> GetClipsForUser(string login,DateTime from,DateTime to,int count,bool? featured){Fetches++;if(ApiFail)throw new Exception("Synthetic API failure");return new List<Clip>{new Clip{Id="Clip_"+login}};}
 public List<Clip> GetClipsForUserById(string id,DateTime from,DateTime to,int count,bool? featured){return new List<Clip>{new Clip{Id="SelfOne"},new Clip{Id="SelfTwo"}};}
 public void SetArgument(string name,object value){Arguments[name]=value;}
 public bool RunAction(string name,bool immediate){Calls.Add(name);if(ThrowDispatch)throw new Exception("Synthetic unknown dispatch");var args=new Dictionary<string,object>(Arguments);bool result;
  if(name.StartsWith("Video - ")){args["videoMode"]=name.Substring(8).ToLowerInvariant();result=new Video.CPHInline{CPH=this,args=args}.Execute();}
  else if(name.StartsWith("Shoutout Clips - ")){args["shoutoutClipMode"]=name.Substring(17).ToLowerInvariant();result=new Player.CPHInline{CPH=this,args=args}.Execute();}
  else if(name=="Self Clips - Play Next"){args["selfClipsMode"]="play next";result=new Self.CPHInline{CPH=this,args=args}.Execute();}
  else throw new Exception("Unexpected action: "+name);
  if(FailWritesAfterPlay>0&&name.EndsWith("Play")){FailWritesAfterPlay=0;PrivateFailures=1;}return result;
 }
 public void WebsocketBroadcastJson(string text){}public void LogInfo(string text){}public void LogWarn(string text){}public void LogError(string text){}
}
public static class Checks {
 static void Assert(bool value,string why){if(!value)throw new Exception(why);}
 static JObject Read(FakeCPH f,string key){return JObject.Parse((string)f.Globals[key]);}
 static JObject State(FakeCPH f){return Read(f,"brb.private.state");}
 static void Put(FakeCPH f,string key,JObject value){f.Globals[key]=value.ToString();}
 static bool Run(FakeCPH f,string mode,string request=null,string config=null,string user=null){f.Arguments=new Dictionary<string,object>{{"brbMode",mode},{"requestId",request??Guid.NewGuid().ToString()}};if(config!=null)f.Arguments["config"]=config;if(user!=null)f.Arguments["userId"]=user;return new Brb.CPHInline{CPH=f,args=f.Arguments}.Execute();}
 static string Mix(int video,int followed,int self){return new JObject{{"video",video},{"followed",followed},{"self",self},{"videos",new JArray("synthetic")}}.ToString();}
 static void Boot(){typeof(Brb.CPHInline).GetField("Booted",BindingFlags.Static|BindingFlags.NonPublic).SetValue(null,false);}
 static FakeCPH Fixture(){Boot();var f=new FakeCPH();f.Globals["autoShoutoutFollowedLogins"]=new List<string>{"friend","excluded","friend"};f.Globals["autoShoutoutExcludedLogins"]=new List<string>{"excluded"};
  f.Globals["portable.video.state"]=new JObject{{"payload",new JObject{{"config",new JObject{{"library",new JObject{{"synthetic",new JObject{{"id","synthetic"},{"label","Synthetic"},{"src","/streaming/videos/test.mp4"},{"enabled",true}}}}}}}}}}.ToString();
  new Video.CPHInline{CPH=f,args=new Dictionary<string,object>{{"videoMode","initialize"}}}.Execute();
  new Player.CPHInline{CPH=f,args=new Dictionary<string,object>{{"shoutoutClipMode","initialize"}}}.Execute();
  new Self.CPHInline{CPH=f,args=new Dictionary<string,object>{{"selfClipsMode","refresh"}}}.Execute();
  Assert(Run(f,"initialize"),"Initialize");return f;
 }
 static void Finish(FakeCPH f){foreach(string key in new[]{"portable.video.state","portable.shoutoutClip.state"}){var e=Read(f,key);var item=e["payload"][key.Contains("video")?"current":"clip"];if(item is JObject)item["visible"]=false;Put(f,key,e);}}
 public static void RunAll(){
  var f=Fixture();Assert(f.Calls.Count==0&&f.Fetches==0,"Startup performed effects");Assert(Run(f,"tick")&&f.Calls.Count==0,"Idle timer dispatched");
  Assert(Run(f,"refresh")&&f.Fetches==0,"Refresh should schedule bounded work");Assert(Run(f,"tick")&&f.Fetches==1,"Refresh tick");Assert(((JObject)State(f)["cache"]).Count==1&&State(f)["cache"]["friend"]!=null,"Exclusions/dedup not respected");
  Assert(Run(f,"configure",config:Mix(50,30,20)),"Configure");Assert(Run(f,"start")&&f.Calls.Count==0,"Start should only arm");string session=(string)State(f)["sessionId"];Assert(Run(f,"start")&&(string)State(f)["sessionId"]==session,"Duplicate Start restarted session");
  for(int i=0;i<100;i++){Assert(Run(f,"tick"),"Weighted tick "+i+": "+(string)State(f)["error"]);Assert(State(f)["owned"] is JObject,"Missing accepted selection");Finish(f);}
  var counts=State(f)["counts"];Assert((int)counts["videoAccepted"]==50&&(int)counts["followedAccepted"]==30&&(int)counts["selfAccepted"]==20,"Clip-count weights wrong: "+counts);
  Assert((int)Read(f,"portable.selfClips.state")["payload"]["cycle"]>1,"Self cycles not shared");
  int calls=f.Calls.Count;Assert(!Run(f,"command stop",user:"viewer")&&(bool)State(f)["active"]&&f.Calls.Count==calls,"Unauthorized command stopped playback");
  Assert(!Run(f,"configure",config:Mix(1,1,1))&&(bool)State(f)["active"],"Invalid config stopped running session");
  Assert(Run(f,"command stop",user:"owner")&&!(bool)State(f)["active"],"Broadcaster Stop");calls=f.Calls.Count;Assert(Run(f,"stop")&&f.Calls.Count==calls,"Duplicate Stop sent more effects");
  string toggle=Guid.NewGuid().ToString();Assert(Run(f,"toggle",toggle),"Toggle start");Assert(Run(f,"toggle",toggle)&&(bool)State(f)["active"],"Duplicate toggle changed state twice");Run(f,"stop");
  var zero=Fixture();Run(zero,"configure",config:Mix(100,0,0));Run(zero,"start");Run(zero,"tick");Assert((string)State(zero)["owned"]["kind"]=="video","Zero weight selected disabled source");
  var current=Read(zero,"portable.video.state");current["payload"]["current"]["startedAtMs"]=9999999999999L;current["payload"]["current"]["visible"]=true;Put(zero,"portable.video.state",current);Run(zero,"stop");Assert((bool)Read(zero,"portable.video.state")["payload"]["current"]["visible"],"Stop killed a newer manual video");
  var interrupted=Fixture();Run(interrupted,"configure",config:Mix(100,0,0));Run(interrupted,"start");Run(interrupted,"tick");var other=Read(interrupted,"portable.video.state");other["payload"]["current"]["startedAtMs"]=9999999999999L;Put(interrupted,"portable.video.state",other);calls=interrupted.Calls.Count;Run(interrupted,"tick");Assert(!(bool)State(interrupted)["active"]&&interrupted.Calls.Count==calls,"Takeover not respected");
  var lost=Fixture();Run(lost,"configure",config:Mix(100,0,0));Run(lost,"start");lost.ThrowDispatch=true;Assert(!Run(lost,"tick"),"Unknown dispatch accepted");calls=lost.Calls.Count;Assert(State(lost)["owned"] is JObject&&!(bool)State(lost)["active"],"Unknown intent lost");Run(lost,"tick");Assert(lost.Calls.Count==calls&&!Run(lost,"start"),"Unknown intent retried");Run(lost,"clear pending");Assert(!(State(lost)["owned"] is JObject),"Explicit pending clear failed");
  var crash=Fixture();Run(crash,"configure",config:Mix(100,0,0));Run(crash,"start");crash.FailWritesAfterPlay=1;Assert(!Run(crash,"tick"),"Post-effect save failure hidden");calls=crash.Calls.Count;Assert((string)State(crash)["owned"]["phase"]=="pending","Durable pending lost");Assert(Run(crash,"stop")&&crash.Calls.Count==calls+1,"Accepted interrupted dispatch did not reconcile then guarded stop");
  var restart=Fixture();Run(restart,"configure",config:Mix(100,0,0));Run(restart,"start");calls=restart.Calls.Count;Boot();Run(restart,"tick");Assert(!(bool)State(restart)["active"]&&restart.Calls.Count==calls&&!(bool)Read(restart,"portable.brb.state")["payload"]["active"],"Restart silently resumed");
  var failed=Fixture();Run(failed,"refresh");Run(failed,"tick");string cache=State(failed)["cache"].ToString();Run(failed,"refresh");failed.ApiFail=true;Assert(!Run(failed,"tick")&&State(failed)["cache"].ToString()==cache,"Refresh failure erased prior cache");
  var removed=Fixture();Run(removed,"refresh");Run(removed,"tick");removed.Globals["autoShoutoutExcludedLogins"]=new List<string>{"friend","excluded"};Run(removed,"configure",config:Mix(0,100,0));Assert(!Run(removed,"start"),"New exclusion ignored by cached source");
  var corrupt=Fixture();corrupt.Globals["brb.private.state"]="corrupt";Assert(!Run(corrupt,"start")&&(string)corrupt.Globals["brb.private.state"]=="corrupt","Corrupt history reset");
  var failBefore=Fixture();Run(failBefore,"configure",config:Mix(100,0,0));Run(failBefore,"start");failBefore.PrivateFailures=1;calls=failBefore.Calls.Count;Assert(!Run(failBefore,"tick")&&failBefore.Calls.Count==calls,"Dispatch before durable intent");
  var parallel=Fixture();Run(parallel,"configure",config:Mix(100,0,0));string shared=Guid.NewGuid().ToString();System.Threading.Tasks.Parallel.For(0,20,i=>{var child=new FakeCPH{Globals=parallel.Globals,Calls=parallel.Calls};Assert(Run(child,"toggle",shared),"Concurrent toggle failed");});Assert((bool)State(parallel)["active"],"Concurrent duplicate toggles changed state twice");System.Threading.Tasks.Parallel.For(0,20,i=>{var child=new FakeCPH{Globals=parallel.Globals,Calls=parallel.Calls};Assert(Run(child,"tick"),"Concurrent tick failed");});Assert(parallel.Calls.Count==1,"Concurrent ticks dispatched overlapping media");
  var duplicate=Fixture();Run(duplicate,"configure",config:Mix(100,0,0));Run(duplicate,"start");Run(duplicate,"tick");string acceptedRequest=(string)State(duplicate)["owned"]["requestId"];Run(duplicate,"stop");new Video.CPHInline{CPH=duplicate,args=new Dictionary<string,object>{{"videoMode","initialize"}}}.Execute();new Video.CPHInline{CPH=duplicate,args=new Dictionary<string,object>{{"videoMode","play"},{"brbRequestId",acceptedRequest},{"id","synthetic"}}}.Execute();Assert(!(bool)Read(duplicate,"portable.video.state")["payload"]["current"]["visible"],"Player replayed accepted BRB request after Stop/Initialize");
  var otherPlayer=Fixture();Run(otherPlayer,"configure",config:Mix(100,0,0));Run(otherPlayer,"start");Run(otherPlayer,"tick");var clipPlayer=Read(otherPlayer,"portable.shoutoutClip.state");clipPlayer["payload"]["clip"]=new JObject{{"visible",true},{"startedAtMs",123},{"hideAtMs",DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()+60000}};Put(otherPlayer,"portable.shoutoutClip.state",clipPlayer);Run(otherPlayer,"tick");Assert(!(bool)State(otherPlayer)["active"]&&!(bool)Read(otherPlayer,"portable.video.state")["payload"]["current"]["visible"]&&(bool)Read(otherPlayer,"portable.shoutoutClip.state")["payload"]["clip"]["visible"],"Cross-player takeover did not stop only BRB-owned media");
  var fallback=Fixture();Run(fallback,"configure",config:Mix(50,30,20));Run(fallback,"start");for(int i=0;i<70;i++){Assert(Run(fallback,"tick"),"Fallback tick");Finish(fallback);}var fc=State(fallback)["counts"];Assert((int)fc["videoAccepted"]==50&&(int)fc["selfAccepted"]==20&&fc["followedAccepted"]==null,"Missing source weights not redistributed by item count");
  var timeout=Fixture();Run(timeout,"configure",config:Mix(100,0,0));Run(timeout,"start");Run(timeout,"tick");var ts=State(timeout);ts["owned"]["deadline"]=0;Put(timeout,"brb.private.state",ts);Assert(Run(timeout,"tick")&&(int)State(timeout)["counts"]["failed"]==1,"Watchdog did not terminate stalled owned video");
  var fractional=Fixture();Run(fractional,"refresh");Run(fractional,"tick");var fs=State(fractional);fs["cache"]["friend"][0]["durationMs"]=9399.999618530273;Put(fractional,"brb.private.state",fs);Run(fractional,"configure",config:Mix(0,100,0));Run(fractional,"start");Assert(Run(fractional,"tick"),"Fractional followed dispatch failed");var fp=Read(fractional,"portable.shoutoutClip.state")["payload"]["clip"];Assert((int)fp["durationMs"]==9400&&(long)fp["hideAtMs"]-(long)fp["startedAtMs"]==9400,"BRB fractional followed clip incorrectly waits for maximum duration");
 }
}
}
'@
$references=@((Get-ChildItem -LiteralPath (Join-Path $PSHOME 'ref') -Filter '*.dll').FullName)+(Join-Path $PSHOME 'Newtonsoft.Json.dll')
Add-Type -TypeDefinition ($harness+$compiled) -ReferencedAssemblies $references -CompilerOptions '/nowarn:1701,1702'
[BrbHarness.Checks]::RunAll()
'BRB native engines passed: weighted clip counts, shared self cycles, follow/exclusion reuse, explicit commands/toggle dedup, authorization, guarded takeover/Stop, durable intents, refresh failures and inert restart. All media synthetic.'
