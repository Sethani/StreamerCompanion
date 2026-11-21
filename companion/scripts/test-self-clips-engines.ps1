$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$inject='public class CPHInline { public ClipHarness.FakeCPH CPH; public System.Collections.Generic.Dictionary<string,object> args = new System.Collections.Generic.Dictionary<string,object>();'
$owner=(Get-Content -Raw (Join-Path $root 'modules/self-clips/streamerbot/self-clips-engine.cs')) -replace 'public class CPHInline\s*\{',$inject
$player=(Get-Content -Raw (Join-Path $root 'modules/shoutout-clips/streamerbot/shoutout-clips-engine.cs')) -replace 'public class CPHInline\s*\{',$inject
$harness=@'
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
namespace ClipHarness {
public class Account { public string UserId="owner-a",UserLogin="fixture",UserName="Fixture"; }
public class Clip { public string Id,Title; public DateTime CreatedAt; public double Duration=9.399999618530273; }
public class FakeCPH {
 public Dictionary<string,string> Globals=new Dictionary<string,string>();
 public Dictionary<string,object> Arguments=new Dictionary<string,object>();
 public Account Broadcaster=new Account();
 public List<Clip> Clips=new List<Clip>();
 public int Fetches,Plays,FailPrivateWrites,FailPublicWrites; public bool ApiFail,ThrowBeforePlay,FailAfterAccept,RejectRace;
 public string LastError="";
 public T GetGlobalVar<T>(string key,bool persisted){return Globals.ContainsKey(key)?(T)(object)Globals[key]:default(T);}
 public void SetGlobalVar(string key,object value,bool persisted){if(key=="selfClips.private.state"&&FailPrivateWrites>0){FailPrivateWrites--;throw new Exception("Synthetic private save failure");}if(key=="portable.selfClips.state"&&FailPublicWrites>0){FailPublicWrites--;throw new Exception("Synthetic projection failure");}Globals[key]=(string)value;}
 public Account TwitchGetBroadcaster(){return Broadcaster;}
 public List<Clip> GetClipsForUserById(string id,DateTime from,DateTime to,int count,bool? featured){Fetches++;if(ApiFail)throw new Exception("Synthetic lookup failure");return Clips.Where(c=>c.CreatedAt>=from&&c.CreatedAt<=to).Take(count).ToList();}
 public void SetArgument(string name,object value){Arguments[name]=value;}
 public bool RunAction(string name,bool immediate){
  var args=new Dictionary<string,object>(Arguments);
  if(name=="Shoutout Clips - Play"){
   Plays++;if(ThrowBeforePlay)throw new Exception("Synthetic unknown delivery");
   if(RejectRace){var p=JObject.Parse(Globals["portable.shoutoutClip.state"]);p["payload"]["clip"]=new JObject{{"visible",true},{"hideAtMs",DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()+60000},{"startedAtMs",123}};Globals["portable.shoutoutClip.state"]=p.ToString();}
   args["shoutoutClipMode"]="play";
  }else if(name=="Shoutout Clips - Stop")args["shoutoutClipMode"]="stop";else throw new Exception("Unexpected native action");
  bool result=new PlayerOwner.CPHInline{CPH=this,args=args}.Execute();if(FailAfterAccept){FailAfterAccept=false;FailPrivateWrites=1;}return result;
 }
 public void WebsocketBroadcastJson(string text){}public void LogInfo(string text){}public void LogWarn(string text){}public void LogError(string text){LastError=text;}
}
public static class Checks {
 static void Assert(bool ok,string message){if(!ok)throw new Exception(message);}
 static string Id(){return Guid.NewGuid().ToString();}
 static JObject State(FakeCPH f){return JObject.Parse(f.Globals["portable.selfClips.state"])["payload"] as JObject;}
 static JObject Private(FakeCPH f){return (JObject)JObject.Parse(f.Globals["selfClips.private.state"])["accounts"][f.Broadcaster.UserId];}
 static bool Run(FakeCPH f,string mode,string request=null){f.Arguments=new Dictionary<string,object>{{"selfClipsMode",mode},{"requestId",request??Id()}};return new SelfOwner.CPHInline{CPH=f,args=f.Arguments}.Execute();}
 static void Stop(FakeCPH f){new PlayerOwner.CPHInline{CPH=f,args=new Dictionary<string,object>{{"shoutoutClipMode","stop"}}}.Execute();}
 static FakeCPH Fixture(int count=3){var f=new FakeCPH();for(int i=0;i<count;i++)f.Clips.Add(new Clip{Id="Clip"+i,Title="Synthetic "+i,CreatedAt=DateTime.UtcNow.AddDays(-i-1)});new PlayerOwner.CPHInline{CPH=f,args=new Dictionary<string,object>{{"shoutoutClipMode","initialize"}}}.Execute();Assert(Run(f,"initialize"),"Initialize");return f;}
 public static void RunAll(){
  var f=Fixture();Assert(f.Fetches==0&&f.Plays==0,"Initialization must not look up or play clips");Assert(Run(f,"refresh"),"Refresh");Assert((int)State(f)["eligibleCount"]==3,"Catalogue count");
  var selected=new HashSet<string>();string last=null,firstRequest=Id();
  for(int i=0;i<3;i++){bool played=Run(f,"play next",i==0?firstRequest:Id());Assert(played,"Play: "+f.LastError);string id=(string)State(f)["lastClipId"];Assert(selected.Add(id),"Repeat inside cycle");last=id;if(i==0){int calls=f.Plays;Assert(Run(f,"play next",firstRequest)&&f.Plays==calls,"Exact request replay dispatched twice");Assert(!Run(f,"play next"),"Busy player silently replaced");}Stop(f);}
  Assert((int)State(f)["remainingCount"]==0,"Complete cycle");Assert(Run(f,"play next"),"Next cycle");Assert((int)State(f)["cycle"]==2&&(string)State(f)["lastClipId"]!=last,"Cycle boundary repeat or reset");Stop(f);
  int plays=f.Plays,fetches=f.Fetches;Assert(Run(f,"initialize"),"Restart initialization");Assert(f.Plays==plays&&f.Fetches==fetches&&(int)State(f)["cycle"]==2,"Restart reset or effect");
  Assert(Run(f,"return last")&&(int)State(f)["remainingCount"]==3,"Return failed clip to unused");
  string catalogue=Private(f)["catalogue"].ToString();f.ApiFail=true;Assert(!Run(f,"refresh"),"Refresh failure accepted");Assert(Private(f)["catalogue"].ToString()==catalogue,"Failed refresh erased catalogue");f.ApiFail=false;
  var large=Fixture(1001);Assert(Run(large,"refresh")&&(int)State(large)["eligibleCount"]==1001&&large.Fetches>1,"Clips beyond API page cap lost");
  var saturated=Fixture(1000);foreach(var c in saturated.Clips)c.CreatedAt=DateTime.UtcNow.AddDays(-1);Assert(!Run(saturated,"refresh"),"Saturated minute published incomplete catalogue");Assert((int)State(saturated)["eligibleCount"]==0,"Incomplete refresh saved");
  var lost=Fixture();Run(lost,"refresh");lost.ThrowBeforePlay=true;Assert(!Run(lost,"play next"),"Unknown outcome reported accepted");int attempts=lost.Plays;Assert(!Run(lost,"play next")&&lost.Plays==attempts,"Pending request replayed");Assert(Run(lost,"initialize")&&lost.Plays==attempts,"Startup replayed unknown intent");Assert(Run(lost,"skip pending")&&(int)State(lost)["usedCount"]==1,"Explicit skip did not release unknown intent");
  var crash=Fixture();Run(crash,"refresh");crash.FailAfterAccept=true;Assert(!Run(crash,"play next"),"Failed post-acceptance save hidden");Assert(Private(crash)["pending"] is JObject,"Accepted pending intent lost");int acceptedPlays=crash.Plays;Assert(Run(crash,"initialize"),"Reconcile after interrupted save");Assert(crash.Plays==acceptedPlays&&(int)State(crash)["usedCount"]==1&&!(Private(crash)["pending"] is JObject),"Reconciliation replayed or lost clip");
  var race=Fixture();Run(race,"refresh");race.RejectRace=true;Assert(Run(race,"play next"),"Rejection response handling");Assert((int)State(race)["usedCount"]==0&&!(Private(race)["pending"] is JObject),"Rejected playback consumed clip");
  var projection=Fixture();Run(projection,"refresh");projection.FailPublicWrites=1;Assert(Run(projection,"play next"),"Committed acceptance downgraded after projection failure");Assert((int)State(projection)["usedCount"]==1,"Accepted history not republished");
  var accounts=Fixture();Run(accounts,"refresh");Run(accounts,"play next");Stop(accounts);accounts.Broadcaster.UserId="owner-b";Run(accounts,"refresh");Assert((int)State(accounts)["usedCount"]==0,"Different account inherited history");accounts.Broadcaster.UserId="owner-a";Run(accounts,"initialize");Assert((int)State(accounts)["usedCount"]==1,"Original account history lost");
  var broken=Fixture();broken.Globals["selfClips.private.state"]="broken";Assert(!Run(broken,"refresh")&&broken.Globals["selfClips.private.state"]=="broken","Corrupt history reset silently");
  var player=Fixture();Run(player,"refresh");string replay=Id();Run(player,"play next",replay);Stop(player);int starts=player.Plays;Run(player,"play next",replay);Assert(player.Plays==starts,"Selector duplicate after Stop replayed");
  var concurrent=Fixture();Run(concurrent,"refresh");var globals=concurrent.Globals;Parallel.For(0,12,i=>{var child=new FakeCPH{Globals=globals,Clips=concurrent.Clips};Run(child,"play next");});Run(concurrent,"health");Assert((int)State(concurrent)["usedCount"]==1,"Concurrent selectors replaced player or lost history");
  var timing=Fixture();Run(timing,"refresh");Run(timing,"play next");Assert((int)JObject.Parse(timing.Globals["portable.shoutoutClip.state"])["payload"]["clip"]["durationMs"]==9400,"Self clip omitted actual cached duration");Stop(timing);
  foreach(object duration in new object[]{9399.999618530273,"9399.999618530273",32599.998474121094,25000}){
   var previous=System.Globalization.CultureInfo.CurrentCulture;try{System.Globalization.CultureInfo.CurrentCulture=new System.Globalization.CultureInfo("nl-NL");new PlayerOwner.CPHInline{CPH=timing,args=new Dictionary<string,object>{{"shoutoutClipMode","play"},{"clipId","SyntheticFractional"},{"durationMs",duration}}}.Execute();}finally{System.Globalization.CultureInfo.CurrentCulture=previous;}
   var clip=JObject.Parse(timing.Globals["portable.shoutoutClip.state"])["payload"]["clip"];int expected=(int)Math.Ceiling(Convert.ToDouble(duration,System.Globalization.CultureInfo.InvariantCulture));Assert((int)clip["durationMs"]==expected&&(long)clip["hideAtMs"]-(long)clip["startedAtMs"]==expected,"Fractional duration fell back to maximum");Stop(timing);
  }
 }
}
}
'@
$references=@((Get-ChildItem -LiteralPath (Join-Path $PSHOME 'ref') -Filter '*.dll').FullName)+(Join-Path $PSHOME 'Newtonsoft.Json.dll')
Add-Type -TypeDefinition ($harness+"`nnamespace SelfOwner {"+$owner+"}`nnamespace PlayerOwner {"+$player+'}') -ReferencedAssemblies $references -CompilerOptions '/nowarn:1701,1702'
[ClipHarness.Checks]::RunAll()
Write-Output 'Self Clips native contracts passed: full catalogue/split limits, no-repeat cycles, restarts/accounts, duplicate/busy/concurrent requests, failed refresh/save/projection, unknown recovery, explicit skip/return and player acceptance. All effects synthetic.'
