$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$videoSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/video/streamerbot/video---engine-0.cs')
$routingSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/source-modules/streamerbot/module-routing.cs')
$pokemonSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/pokemon-encounters/streamerbot/pokemon-bridge.cs')
$countdownSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/countdown/streamerbot/countdown-engine.cs')
$chatSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/chat-routing/streamerbot/chat-routing.cs')
$launchSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/stream-launch/streamerbot/launch-engine.cs')
$remindersSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/reminders/streamerbot/reminders-engine.cs')
$wheelSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/wheel/streamerbot/wheel-engine.cs')
$walkOnsSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/walk-ons/streamerbot/walk-ons-engine.cs')
$walkSoundSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/walk-ons/streamerbot/walk-on-sound-engine.cs')
$shoutoutSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/shoutout-clips/streamerbot/shoutout-clips-engine.cs')
$fields = 'public FakeCPH CPH = new FakeCPH(); public System.Collections.Generic.Dictionary<string,object> args = new System.Collections.Generic.Dictionary<string,object>();'
$videoSource = $videoSource.Replace('public class CPHInline {', ('public class VideoInline {' + $fields))
$routingSource = $routingSource.Replace('public class CPHInline {', ('public class RoutingInline {' + $fields))
$pokemonSource = $pokemonSource.Replace('public class CPHInline {', ('public class PokemonInline {' + $fields))
$countdownSource = $countdownSource.Replace('public class CPHInline {', ('public class CountdownInline {' + $fields))
$chatSource = $chatSource.Replace('public class CPHInline {', ('public class ChatInline {' + $fields))
$launchSource = $launchSource.Replace('public class CPHInline {', ('public class LaunchInline {' + $fields))
$remindersSource = $remindersSource.Replace('public class CPHInline {', ('public class RemindersInline {' + $fields))
$wheelSource = $wheelSource.Replace('public class CPHInline {', ('public class WheelInline {' + $fields))
$walkOnsSource = $walkOnsSource.Replace('public class CPHInline', ('public class WalkOnsInline')).Replace('private const string StateKey', ($fields + ' private const string StateKey'))
$walkSoundSource = $walkSoundSource.Replace('public class CPHInline', ('public class WalkSoundInline')).Replace('private const string StateKey', ($fields + ' private const string StateKey'))
$shoutoutSource = $shoutoutSource.Replace('public class CPHInline', 'public class ShoutoutInline').Replace('private const string StateKey', ($fields + ' private const string StateKey'))
$fakeSource = @'
using System;
using System.Collections.Generic;
public class FakeCPH {
 public Dictionary<string,object> Globals = new Dictionary<string,object>();
 public List<string> Errors = new List<string>();
 public Dictionary<string,object> Arguments = new Dictionary<string,object>();
 public List<string> Actions = new List<string>();
 public System.Action<string> RunActionHook;
 public bool FailPersist = false;
 public void SetArgument(string key,object value){Arguments[key]=value;}
 public bool RunAction(string name,bool immediate){Actions.Add(name);if(RunActionHook!=null)RunActionHook(name);if(name=="Countdown - Start" && !FailCountdown)Globals["portable.countdown.state"]="{\"payload\":{\"status\":\"running\",\"endTimeMs\":"+(ClockMs+Int64.Parse(Arguments["durationSeconds"].ToString())*1000)+"}}";return !FailCountdown;}
 public long ClockMs = 2000000000000;
 public bool Streaming = false, Connected = true, NeverStream = false, FailCountdown = false;
 public int StreamDelayMs = 0; public long StreamAtMs = 0;
 public List<string> ObsCalls = new List<string>();
 public HashSet<string> MissingActions = new HashSet<string>();
 public bool ActionExists(string name){return !MissingActions.Contains(name);}
 public bool ObsIsConnected(){return Connected;}
 public bool ObsIsStreaming(){if(!NeverStream && StreamAtMs>0 && ClockMs>=StreamAtMs)Streaming=true;return Streaming;}
 public void ObsSetScene(string name){Scene=name;ObsCalls.Add("scene");}
 public void ObsStartStreaming(){ObsCalls.Add("start");if(!NeverStream){StreamAtMs=ClockMs+StreamDelayMs;if(StreamDelayMs==0)Streaming=true;}}
 public void Wait(int ms){ClockMs+=ms;}
 public string ObsSendRaw(string type,string data){return "{\"scenes\":[{\"sceneName\":\"Synthetic Scene\"}]}";}
 public string Scene = "Synthetic Scene";
 public T GetGlobalVar<T>(string key,bool persisted){return Globals.ContainsKey(key)?(T)Globals[key]:default(T);}
 public void SetGlobalVar(string key,object value,bool persisted){if(FailPersist)throw new Exception("Synthetic save failure");Globals[key]=value;}
 public string ObsGetCurrentScene(){return Scene;}
 public void WebsocketBroadcastJson(string json){}
 public void LogInfo(string text){}
 public void LogWarn(string text){}
 public void LogError(string text){Errors.Add(text);}
}
'@
$references = @((Get-ChildItem -LiteralPath (Join-Path $PSHOME 'ref') -Filter '*.dll').FullName) + (Join-Path $PSHOME 'Newtonsoft.Json.dll')
# Add-Type's in-memory assemblies can be shared by compiling all three units together.
# Keep using directives scoped to separate namespaces so each original source remains unchanged.
$combined = 'namespace EngineTest {' + $fakeSource + '}' + "`n" + 'namespace EngineTest {' + $videoSource + '}' + "`n" + 'namespace EngineTest {' + $routingSource + '}' + "`n" + 'namespace EngineTest {' + $pokemonSource + '}' + "`n" + 'namespace EngineTest {' + $countdownSource + '}'
$combined += "`nnamespace EngineTest {" + $chatSource + "}"
$combined += "`nnamespace EngineTest {" + $launchSource + "}"
$combined += "`nnamespace EngineTest {" + $remindersSource + "}"
$combined += "`nnamespace EngineTest {" + $wheelSource + "}"
$combined += "`nnamespace EngineTest {" + $walkOnsSource + "}"
$combined += "`nnamespace EngineTest {" + $walkSoundSource + "}"
$combined += "`nnamespace EngineTest {" + $shoutoutSource + "}"
$combined += @'
namespace EngineTest {
 public class SyntheticLaunch : LaunchInline {
  public System.Collections.Generic.List<string> Requests = new System.Collections.Generic.List<string>();
  public bool FailSpotify = false;
  protected override long Now(){return CPH.ClockMs;}
  protected override Newtonsoft.Json.Linq.JObject SpotifyRequest(string route){Requests.Add(route);if(FailSpotify && route!="/health")throw new System.Exception("Synthetic failure");return Newtonsoft.Json.Linq.JObject.Parse("{\"service\":\"spotify\",\"configured\":true}");}
 }
 public class SyntheticReminders : RemindersInline {
  public long TestNow = 2000000000000;
  protected override long Now(){return TestNow;}
 }
 public static class WalkOnRecorder {
  public static void Play(FakeCPH parent,bool complete) {
   var child=new WalkSoundInline();
   child.CPH.Globals=parent.Globals;
   child.CPH.FailPersist=parent.FailPersist;
   // Streamer.bot passes inputs to a child action; child argument changes do not return.
   child.args=new System.Collections.Generic.Dictionary<string,object>(parent.Arguments);
   child.CPH.Arguments=child.args;
   child.args["walkonSoundMode"]="play";
   child.Execute();
   if(complete){child.args["walkonSoundMode"]="stop";child.Execute();}
  }
  public static void ConcurrentState() {
   const string config="{\"roster\":{\"fixture\":{\"type\":\"sound\",\"value\":\"tone\"}},\"sounds\":{\"tone\":{\"src\":\"http://127.0.0.1:3135/api/public/media/walk-ons/11111111-1111-1111-1111-111111111111.wav\"}},\"settings\":{\"oncePerStream\":true}}";
   var initial=new WalkOnsInline();initial.CPH.Arguments=initial.args;initial.args["walkOnsMode"]="initialize";initial.Execute();initial.args["walkOnsMode"]="configure";initial.args["config"]=config;initial.Execute();
   int plays=0;
   System.Threading.Tasks.Parallel.For(0,32,index=>{
    var engine=new WalkOnsInline();engine.CPH.Globals=initial.CPH.Globals;engine.CPH.Arguments=engine.args;
    engine.CPH.RunActionHook=name=>{if(name=="Walk-on Sound - Play"){System.Threading.Interlocked.Increment(ref plays);Play(engine.CPH,true);}};
    engine.args["walkOnsMode"]=index%2==0?"watch":"configure";engine.args["userName"]="fixture";engine.args["message"]="hello";engine.args["config"]=config;engine.Execute();
   });
   var payload=Newtonsoft.Json.Linq.JObject.Parse((string)initial.CPH.Globals["portable.walkOns.state"])["payload"];
   if(plays!=1 || ((Newtonsoft.Json.Linq.JArray)payload["session"]["seen"]).Count!=1)throw new System.Exception("Concurrent configuration/chat lost once-per-stream eligibility");
  }
 }
 public static class ShoutoutRecorder {
  public static void ConcurrentState() {
   var initial=new ShoutoutInline();initial.args["shoutoutClipMode"]="initialize";initial.Execute();
   System.Threading.Tasks.Parallel.For(0,32,index=>{
    var engine=new ShoutoutInline();engine.CPH.Globals=initial.CPH.Globals;
    engine.args["shoutoutClipMode"]=index%2==0?"play":"configure";
    engine.args["clipId"]="SyntheticClip";engine.args["config"]="{\"maximumDurationSeconds\":17}";engine.Execute();
   });
   var envelope=Newtonsoft.Json.Linq.JObject.Parse((string)initial.CPH.Globals["portable.shoutoutClip.state"]);
   if((long)envelope["revision"]!=33 || !(bool)envelope["payload"]["clip"]["visible"])throw new System.Exception("Concurrent Shoutout configuration/play lost a state change");
  }
 }
}
'@
Add-Type -TypeDefinition $combined -ReferencedAssemblies $references -CompilerOptions '/nowarn:1701,1702'
function Assert-True($Condition, [string]$Message) { if (-not $Condition) { throw $Message } }
function Run-Engine($Engine, [hashtable]$Arguments) {
  $Engine.args.Clear()
  foreach ($entry in $Arguments.GetEnumerator()) { $Engine.args[$entry.Key] = $entry.Value }
  [void]$Engine.Execute()
}
$video = [EngineTest.VideoInline]::new()
Run-Engine $video @{ videoMode = 'initialize' }
$state = $video.CPH.Globals['portable.video.state'] | ConvertFrom-Json
Assert-True (@($state.payload.config.library.PSObject.Properties).Count -eq 0) 'Fresh Video library must be empty'
$config = @{ schemaVersion = 2; library = @{ legacy = @{ src = '/streaming/videos/synthetic.mp4'; label = 'Legacy' }; companion = @{ src = 'http://127.0.0.1:39999/api/public/media/video/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webm'; label = 'New media' }; unsafe = @{ src = 'https://example.invalid/media.mp4' } }; presentation = @{ volumePercent = 30; widthPercent = 66 } } | ConvertTo-Json -Depth 9 -Compress
Run-Engine $video @{ videoMode = 'configure'; config = $config }
$state = $video.CPH.Globals['portable.video.state'] | ConvertFrom-Json
Assert-True ($null -ne $state.payload.config.library.legacy) 'Existing legacy library URL must survive'
Assert-True ($null -ne $state.payload.config.library.companion) 'Companion media URL must be accepted'
Assert-True ($null -eq $state.payload.config.library.unsafe) 'Remote media URL must be rejected'
Run-Engine $video @{ videoMode = 'initialize' }
$state = $video.CPH.Globals['portable.video.state'] | ConvertFrom-Json
Assert-True ($state.payload.config.presentation.widthPercent -eq 66) 'Initialize must preserve saved presentation'
$before = $video.CPH.Globals['portable.video.state']
Run-Engine $video @{ videoMode = 'play' }
Assert-True ($video.CPH.Globals['portable.video.state'] -eq $before) 'Play without a registered ID must not choose personal fallback media'
Run-Engine $video @{ videoMode = 'play'; id = 'companion'; title = 'Synthetic title' }
$state = $video.CPH.Globals['portable.video.state'] | ConvertFrom-Json
Assert-True ($state.payload.current.visible -and $state.payload.moduleVersion -eq '2.2.0') 'Video must enter current playback state'
$start = $state.payload.current.startedAtMs
Run-Engine $video @{ videoMode = 'stop'; startedAtMs = ($start - 1).ToString() }
$state = $video.CPH.Globals['portable.video.state'] | ConvertFrom-Json
Assert-True $state.payload.current.visible 'Stale completion must not stop a newer video'
Run-Engine $video @{ videoMode = 'stop'; startedAtMs = $start.ToString() }
$state = $video.CPH.Globals['portable.video.state'] | ConvertFrom-Json
Assert-True (-not $state.payload.current.visible) 'Matching completion must stop Video'
Assert-True ($video.CPH.Errors.Count -eq 1) 'Only intentional empty-ID test should report an error'
$routing = [EngineTest.RoutingInline]::new()
Run-Engine $routing @{ moduleRoutingMode = 'initialize' }
$config = $routing.CPH.Globals['portable.moduleRouting.config'] | ConvertFrom-Json
Assert-True (@($config.modules.PSObject.Properties).Count -eq 0) 'Fresh routing must not seed personal scene rules'
$routing.CPH.Globals['portable.moduleRouting.config'] = '{"version":1,"modules":{"legacy":{"mode":"global","scenes":[]},"video":{"mode":"scenes","scenes":["Old Scene"]}},"retained":"synthetic"}'
Run-Engine $routing @{ moduleRoutingMode = 'save'; moduleRoutingJson = '{"modules":{"video":{"mode":"scenes","scenes":["Synthetic Scene"]}}}' }
$config = $routing.CPH.Globals['portable.moduleRouting.config'] | ConvertFrom-Json
Assert-True ($config.modules.legacy.mode -eq 'global' -and $config.retained -eq 'synthetic') 'Save must preserve unmentioned module rules and metadata'
Assert-True ($config.modules.video.scenes[0] -eq 'Synthetic Scene') 'Save must update supplied rule'
$before = $routing.CPH.Globals['portable.moduleRouting.config']
Run-Engine $routing @{ moduleRoutingMode = 'save'; moduleRoutingJson = '{"modules":{"video":{"mode":"invalid"}}}' }
Assert-True ($routing.CPH.Globals['portable.moduleRouting.config'] -eq $before) 'Invalid routing save must be atomic'
Run-Engine $routing @{ moduleRoutingMode = 'initialize'; sceneName = 'Changed Scene' }
$state = $routing.CPH.Globals['portable.moduleRouting.state'] | ConvertFrom-Json
Assert-True ($state.payload.currentScene -eq 'Changed Scene') 'OBS scene event must update routing state'
Assert-True ($routing.CPH.Errors.Count -eq 1) 'Only intentional invalid-routing test should report an error'
$scenes = $config.modules.video.scenes | ConvertTo-Json -Compress
Run-Engine $routing @{ moduleRoutingMode = 'set-mode'; moduleRoutingTarget = 'video'; moduleRoutingVisibility = 'global'; requestId = 'routing-one' }
$config = $routing.CPH.Globals['portable.moduleRouting.config'] | ConvertFrom-Json
$state = $routing.CPH.Globals['portable.moduleRouting.state'] | ConvertFrom-Json
Assert-True ($config.modules.video.mode -eq 'global' -and ($config.modules.video.scenes | ConvertTo-Json -Compress) -eq $scenes) 'Scoped mode must preserve saved scenes'
Assert-True ($config.modules.legacy.mode -eq 'global' -and $config.retained -eq 'synthetic') 'Scoped mode must preserve other rules and metadata'
Assert-True ($state.payload.phoneDeckVersion -eq 1 -and $state.payload.phoneDeckResults.'routing-one'.status -eq 'completed') 'Matching acknowledgement follows persistence'
$before = $routing.CPH.Globals['portable.moduleRouting.config']
Run-Engine $routing @{ moduleRoutingMode = 'set-mode'; moduleRoutingTarget = 'video'; moduleRoutingVisibility = 'disabled'; requestId = 'routing-one' }
Assert-True ($routing.CPH.Globals['portable.moduleRouting.config'] -eq $before) 'Duplicate request must not replay after later state'
foreach ($invalid in @(@{moduleRoutingTarget='missing';moduleRoutingVisibility='global'},@{moduleRoutingTarget='Video';moduleRoutingVisibility='global'},@{moduleRoutingTarget='video';moduleRoutingVisibility='invalid'})) {
  $invalid.moduleRoutingMode = 'set-mode'; $invalid.requestId = 'rejected'
  Run-Engine $routing $invalid
  Assert-True ($routing.CPH.Globals['portable.moduleRouting.config'] -eq $before) 'Invalid scoped request must not replace mappings'
}
$routing.CPH.FailPersist = $true
Run-Engine $routing @{moduleRoutingMode='set-mode';moduleRoutingTarget='video';moduleRoutingVisibility='disabled';requestId='failed-save'}
$routing.CPH.FailPersist = $false
$state = $routing.CPH.Globals['portable.moduleRouting.state'] | ConvertFrom-Json
Assert-True ($null -eq $state.payload.phoneDeckResults.'failed-save') 'Failed persistence cannot acknowledge success'
Run-Engine $routing @{moduleRoutingMode='initialize'}
$state = $routing.CPH.Globals['portable.moduleRouting.state'] | ConvertFrom-Json
Assert-True ($state.payload.phoneDeckResults.'routing-one'.status -eq 'completed') 'Refresh must retain terminal results'
foreach($mode in @('disabled','scenes','global')) {
 Run-Engine $routing @{moduleRoutingMode='set-mode';moduleRoutingTarget='video';moduleRoutingVisibility=$mode;requestId=('mode-'+$mode)}
 $config = $routing.CPH.Globals['portable.moduleRouting.config'] | ConvertFrom-Json
 Assert-True ($config.modules.video.mode -eq $mode -and ($config.modules.video.scenes | ConvertTo-Json -Compress) -eq $scenes) 'Each visibility mode preserves the saved scene list'
}
$pokemon = [EngineTest.PokemonInline]::new()
Run-Engine $pokemon @{ pokemonMode = 'initialize' }
$config = $pokemon.CPH.Globals['portable.moduleRouting.config'] | ConvertFrom-Json
Assert-True ($config.modules.pokemon.mode -eq 'disabled') 'New Pokemon routing must be disabled'
$pokemon.CPH.Globals['portable.moduleRouting.config'] = '{"version":1,"modules":{"legacy":{"mode":"global","scenes":[]},"pokemon":{"mode":"scenes","scenes":["Synthetic Scene"]}},"retained":"synthetic"}'
Run-Engine $pokemon @{ pokemonMode = 'initialize' }
$config = $pokemon.CPH.Globals['portable.moduleRouting.config'] | ConvertFrom-Json
Assert-True ($config.modules.pokemon.scenes[0] -eq 'Synthetic Scene' -and $config.modules.legacy.mode -eq 'global' -and $config.retained -eq 'synthetic') 'Pokemon Initialize must preserve existing rules and unknown metadata'
Run-Engine $pokemon @{ pokemonMode = 'message'; userName = 'ordinaryviewer'; message = 'A wild Weedle appears Catch it using !pokecatch' }
Assert-True ($pokemon.CPH.Errors.Count -eq 0) 'Rejected viewer imitation must be inert'
Write-Output 'Actual Video, Source Modules and Pokemon C# compiled against a synthetic CPH adapter; preserved globals, validation, guarded Stop and Pokemon initialization passed. No live HTTP/chat call was made.'

$countdown = [EngineTest.CountdownInline]::new()
Run-Engine $countdown @{ countdownMode = 'initialize' }
$config = $countdown.CPH.Globals['portable.countdown.config'] | ConvertFrom-Json
Assert-True ($config.durationSeconds -eq 300) 'Countdown defaults must be clean'
Run-Engine $countdown @{ countdownMode = 'start'; durationSeconds = '60'; finishedText = 'Synthetic done' }
$state = $countdown.CPH.Globals['portable.countdown.state'] | ConvertFrom-Json
Assert-True ($state.payload.status -eq 'running' -and $state.payload.remainingMs -eq 60000) 'Countdown Start must save running state'
$end = $state.payload.endTimeMs
Run-Engine $countdown @{ countdownMode = 'initialize' }
$state = $countdown.CPH.Globals['portable.countdown.state'] | ConvertFrom-Json
Assert-True ($state.payload.endTimeMs -eq $end) 'Initialize must preserve active timer'
Run-Engine $countdown @{ countdownMode = 'configure'; durationSeconds = '12'; finishedText = 'Next timer' }
$state = $countdown.CPH.Globals['portable.countdown.state'] | ConvertFrom-Json
Assert-True ($state.payload.endTimeMs -eq $end -and $state.payload.finishedText -eq 'Synthetic done') 'Save preset must not restart or alter current timer message'
Run-Engine $countdown @{ countdownMode = 'pause' }
$state = $countdown.CPH.Globals['portable.countdown.state'] | ConvertFrom-Json
Assert-True ($state.payload.status -eq 'paused' -and $state.payload.remainingMs -gt 0 -and $null -eq $state.payload.endTimeMs) 'Pause must freeze remaining duration'
Run-Engine $countdown @{ countdownMode = 'resume' }
$state = $countdown.CPH.Globals['portable.countdown.state'] | ConvertFrom-Json
Assert-True ($state.payload.status -eq 'running' -and $null -ne $state.payload.endTimeMs) 'Resume must restore end timestamp'
$before = $countdown.CPH.Globals['portable.countdown.state']
$beforeConfig = $countdown.CPH.Globals['portable.countdown.config']
Run-Engine $countdown @{ countdownMode = 'start'; durationSeconds = '-1' }
Assert-True ($countdown.CPH.Globals['portable.countdown.state'] -eq $before -and $countdown.CPH.Globals['portable.countdown.config'] -eq $beforeConfig) 'Invalid countdown input must be atomic'
Run-Engine $countdown @{ countdownMode = 'clear' }
$state = $countdown.CPH.Globals['portable.countdown.state'] | ConvertFrom-Json
Assert-True ($state.payload.status -eq 'idle') 'Clear must hide countdown'
Run-Engine $countdown @{ countdownMode = 'start'; durationSeconds = '0' }
$state = $countdown.CPH.Globals['portable.countdown.state'] | ConvertFrom-Json
Assert-True ($state.payload.status -eq 'finished' -and $state.payload.remainingMs -eq 0) 'Zero duration must display finished text'
$countdown.CPH.Globals['portable.countdown.config'] = '{"durationSeconds":44,"finishedText":"Legacy","retained":"synthetic"}'
Run-Engine $countdown @{ countdownMode = 'initialize' }
$config = $countdown.CPH.Globals['portable.countdown.config'] | ConvertFrom-Json
Assert-True ($config.retained -eq 'synthetic' -and $config.durationSeconds -eq 44) 'Countdown initialization must preserve existing preferences'
Assert-True ($countdown.CPH.Errors.Count -eq 1) 'Only deliberate invalid countdown must log an error'
Write-Output 'Actual Countdown C# passed: clean defaults, active-state preservation, preset/start/pause/resume/clear/finish and invalid-input atomicity. No live action was invoked.'

$chat = [EngineTest.ChatInline]::new()
Run-Engine $chat @{ chatMessage = 'Synthetic message'; chatTargets = 'all' }
Assert-True ($chat.CPH.Actions.Count -eq 1 -and $chat.CPH.Actions[0] -eq 'Chat - Twitch Send') 'Plain messages must use the native adapter'
Assert-True (-not $chat.CPH.Arguments['chatIsReply']) 'Plain message must reset reply state'
Run-Engine $chat @{ chatMessage = 'Synthetic reply'; chatIsReply = 'true'; chatReplyId = 'fixture-id' }
Assert-True ($chat.CPH.Arguments['chatIsReply'] -and $chat.CPH.Arguments['chatReplyId'] -eq 'fixture-id') 'Reply arguments must survive routing'
Run-Engine $chat @{ chatMessage = 'Synthetic fallback'; chatIsReply = '1'; chatReplyId = '%chatReplyId%' }
Assert-True (-not $chat.CPH.Arguments['chatIsReply']) 'Missing/unresolved reply ID must become a plain message'
$before = $chat.CPH.Actions.Count
Run-Engine $chat @{}
Run-Engine $chat @{ chatMessage = '   ' }
Run-Engine $chat @{ chatMessage = '%chatMessage%' }
Run-Engine $chat @{ chatMessage = 'Do not log this body'; chatTargets = 'youtube' }
Assert-True ($chat.CPH.Actions.Count -eq $before) 'Empty, unresolved and unsupported-platform requests must not send'
Assert-True ($chat.CPH.Errors.Count -eq 2 -and -not (($chat.CPH.Errors -join ' ') -match 'Do not log this body')) 'Diagnostics must omit message contents'
Write-Output 'Actual Chat Routing C# passed with a recording sink: plain/reply/fallback, empty arguments and unsupported targets. No network or live chat call was made.'

$reminders = [EngineTest.SyntheticReminders]::new()
$reminders.CPH.Globals['portable.reminders.state'] = '{"schemaVersion":1,"feature":"reminders","revision":4,"payload":{"moduleVersion":"1.0.0","items":[{"id":"open-a","targetKey":"viewer_one","targetDisplay":"Viewer One","creatorKey":"creator","creatorDisplay":"Creator","message":"Synthetic private one","status":"open","createdAtMs":1000},{"id":"done-b","targetKey":"viewer_two","targetDisplay":"Viewer Two","creatorKey":"creator","creatorDisplay":"Creator","message":"Synthetic completed two","status":"completed","createdAtMs":2000}],"display":{"visible":true,"target":"viewer_one","title":"Viewer One''s reminders","items":[{"id":"open-a","message":"Synthetic private one","targetDisplay":"Viewer One"}],"hideAtMs":2000000010000},"config":{"maximumPerTarget":20,"messageLength":240,"overlayDurationSeconds":30,"maximumVisible":8,"retained":"synthetic"},"retained":"private-field"}}'
Run-Engine $reminders @{ reminderMode = 'initialize' }
$private = ($reminders.CPH.Globals['portable.reminders.private'] | ConvertFrom-Json).payload
$public = ($reminders.CPH.Globals['portable.reminders.state'] | ConvertFrom-Json).payload
Assert-True (@($private.items).Count -eq 2 -and $private.retained -eq 'private-field' -and $private.config.retained -eq 'synthetic') 'Reminder initialization must preserve legacy items, completion history and unknown private fields'
Assert-True ($public.ready -and $public.moduleVersion -eq '1.0.2' -and $null -eq $public.items -and $null -eq $public.config -and $null -eq $public.display) 'Public reminder state must contain only content-free readiness'
Run-Engine $reminders @{ reminderMode = 'add'; userName = 'viewer_one'; user = 'Viewer One'; rawInput = 'Synthetic self reminder' }
$private = ($reminders.CPH.Globals['portable.reminders.private'] | ConvertFrom-Json).payload
Assert-True (@($private.items).Count -eq 3 -and $reminders.CPH.Arguments['chatMessage'] -eq 'Reminder added to your backlog.') 'Self add must persist and prepare a generic chat acknowledgement'
Run-Engine $reminders @{ reminderMode = 'add'; userName = 'creator'; user = 'Creator'; rawInput = '@viewer_two Synthetic target only' }
$private = ($reminders.CPH.Globals['portable.reminders.private'] | ConvertFrom-Json).payload
Assert-True (@($private.items).Count -eq 4 -and $reminders.CPH.Arguments['chatMessage'] -eq 'Reminder added for viewer_two.') 'Targeted add must not reveal the target backlog'
Run-Engine $reminders @{ reminderMode = 'list-mine'; userName = 'viewer_two' }
Assert-True ($reminders.CPH.Arguments['chatMessage'].Contains('Synthetic target only') -and -not $reminders.CPH.Arguments['chatMessage'].Contains('Synthetic self reminder')) 'List Mine must return only the requester''s unresolved reminders'
$targetId = @($private.items | Where-Object message -eq 'Synthetic target only')[0].id
Run-Engine $reminders @{ reminderMode = 'complete'; id = $targetId; userName = 'operator' }
$private = ($reminders.CPH.Globals['portable.reminders.private'] | ConvertFrom-Json).payload
Assert-True (($private.items | Where-Object id -eq $targetId).status -eq 'completed') 'Complete must retain the record as history'
Run-Engine $reminders @{ reminderMode = 'restore'; id = $targetId }
$private = ($reminders.CPH.Globals['portable.reminders.private'] | ConvertFrom-Json).payload
Assert-True (($private.items | Where-Object id -eq $targetId).status -eq 'open') 'Restore must reopen a completed record'
Run-Engine $reminders @{ reminderMode = 'delete'; id = $targetId }
$private = ($reminders.CPH.Globals['portable.reminders.private'] | ConvertFrom-Json).payload
Assert-True ($null -eq ($private.items | Where-Object id -eq $targetId)) 'Delete must remove only the selected record'
$public = ($reminders.CPH.Globals['portable.reminders.state'] | ConvertFrom-Json).payload
Assert-True ($public.ready -and $null -eq $public.items -and $null -eq $public.config -and $null -eq $public.display) 'Lifecycle changes must keep public state content-free'
$beforePrivate = $reminders.CPH.Globals['portable.reminders.private']
Run-Engine $reminders @{ reminderMode = 'health' }
Assert-True ($reminders.CPH.Globals['portable.reminders.private'] -eq $beforePrivate) 'Health must not rewrite or expose the private backlog'
Run-Engine $reminders @{ reminderMode = 'list-mine' }
Assert-True ($reminders.CPH.Arguments['chatMessage'] -eq 'I could not identify whose reminders to list.') 'Missing chat identity must fail without selecting another viewer'
Write-Output 'Actual Reminders C# passed: legacy private-state migration, content-free public readiness, self/target add, owner-only list and complete/restore/delete. Only synthetic reminder data was used; no overlay behavior exists.'

$wheel = [EngineTest.WheelInline]::new()
$wheel.CPH.Globals['portable.wheel.profiles'] = '{"schemaVersion":2,"moduleVersion":"2.0.0","activeProfile":"synthetic","profiles":{"synthetic":{"name":"Synthetic","entries":[{"label":"Only result","weight":1}],"settings":{"minSpinSeconds":1,"maxSpinSeconds":1,"holdSeconds":2}},"subredeem":{"name":"Synthetic sub","entries":[{"label":"Sub result","weight":1}],"settings":{"minSpinSeconds":1,"maxSpinSeconds":1,"holdSeconds":2}},"self-care":{"name":"Synthetic care","entries":[{"label":"Care result","weight":1}],"settings":{"minSpinSeconds":1,"maxSpinSeconds":1,"holdSeconds":2}}},"position":{"anchor":"bottom-right","offsetX":4,"offsetY":-3,"sizePercent":88},"appearance":{"opacityPercent":71,"labelSize":29,"labelColour":"#ffffff","borderColour":"#eeeeee","pointerColour":"#dddddd","resultColour":"#cccccc","resultBackground":"#141414","resultOpacityPercent":77,"palette":["#e85d75","#4682d9"]}}'
Run-Engine $wheel @{ wheelActionMode = 'initialize' }
$wheelConfig = $wheel.CPH.Globals['portable.wheel.profiles'] | ConvertFrom-Json
$wheelState = $wheel.CPH.Globals['portable.wheel.state'] | ConvertFrom-Json
Assert-True ($wheelConfig.moduleVersion -eq '2.1.1' -and @($wheelConfig.profiles.PSObject.Properties).Count -eq 3) 'Wheel initialize must retain existing profiles while upgrading the module version'
Assert-True ($wheelConfig.position.anchor -eq 'bottom-right' -and $wheelConfig.appearance.opacityPercent -eq 71) 'Wheel initialize must preserve placement and appearance'
Assert-True ($wheelState.payload.status -eq 'idle' -and $wheelState.feature -eq 'wheel') 'Wheel initialize must publish idle state'
$beforeWait = $wheel.CPH.ClockMs
Run-Engine $wheel @{ wheelActionMode = 'trigger-spin'; profile = 'synthetic'; userName = 'synthetic-user' }
$wheelState = $wheel.CPH.Globals['portable.wheel.state'] | ConvertFrom-Json
Assert-True ($wheelState.payload.status -eq 'spinning' -and $wheelState.payload.currentSpin.profile -eq 'synthetic' -and $wheelState.payload.currentSpin.user -eq 'synthetic-user') 'Trigger adapter must use the selected profile and triggering user'
Assert-True ($wheel.CPH.Arguments['result'] -eq 'Only result' -and $wheel.CPH.ClockMs -eq ($beforeWait + 1000)) 'Trigger adapter must expose result and wait for selection completion'
Run-Engine $wheel @{ wheelActionMode = 'selfcare-spin'; userName = 'synthetic-user' }
$wheelState = $wheel.CPH.Globals['portable.wheel.state'] | ConvertFrom-Json
Assert-True ($wheelState.payload.currentSpin.profile -eq 'self-care' -and $wheel.CPH.Arguments['result'] -eq 'Care result') 'Existing Selfcare wheel adapter mode must remain compatible'
Run-Engine $wheel @{ wheelActionMode = 'sub-spin'; userName = 'synthetic-user' }
$wheelState = $wheel.CPH.Globals['portable.wheel.state'] | ConvertFrom-Json
Assert-True ($wheelState.payload.currentSpin.profile -eq 'subredeem' -and $wheel.CPH.Arguments['result'] -eq 'Sub result') 'Existing Sub Spin adapter mode must remain compatible'
Run-Engine $wheel @{ wheelActionMode = 'clear' }
$wheelState = $wheel.CPH.Globals['portable.wheel.state'] | ConvertFrom-Json
Assert-True ($wheelState.payload.status -eq 'idle' -and $null -eq $wheelState.payload.currentSpin) 'Wheel Clear must hide the current spin'
Assert-True ($wheel.CPH.Errors.Count -eq 0) 'Valid Wheel lifecycle must not log errors'
Write-Output 'Actual Wheel C# passed: installed schema/profile preservation, exact adapter compatibility, generic trigger adapter, result argument, wait timing and Clear. Synthetic state only; no live trigger or chat action was invoked.'

$launch = [EngineTest.SyntheticLaunch]::new()
Run-Engine $launch @{ streamLaunchMode = 'initialize' }
$config = $launch.CPH.Globals['portable.streamLaunch.config'] | ConvertFrom-Json
Assert-True (-not $config.enabled -and -not $config.fallbackEnabled -and -not $config.followupEnabled -and $config.startingSoonScene -eq '') 'Fresh launch automation must be inert with no personal scene seed'
Assert-True ($launch.CPH.Actions.Count -eq 0 -and $launch.CPH.ObsCalls.Count -eq 0) 'Initialize may not perform launch effects'
Run-Engine $launch @{}
Assert-True ($launch.CPH.ObsCalls.Count -eq 0) 'An unknown mode must not start OBS'
$launch.CPH.Globals['portable.streamLaunch.config'] = '{"durationSeconds":60,"finishedText":"Legacy finish","startingSoonScene":"Synthetic Scene","retained":"private preference"}'
Run-Engine $launch @{ streamLaunchMode = 'initialize' }
$config = $launch.CPH.Globals['portable.streamLaunch.config'] | ConvertFrom-Json
Assert-True ($config.enabled -and $config.followupEnabled -and $config.retained -eq 'private preference' -and $config.durationSeconds -eq 60) 'Existing settings must migrate without loss and preserve follow-up behavior'
$before = $launch.CPH.Globals['portable.streamLaunch.config']
Run-Engine $launch @{ streamLaunchMode = 'configure'; config = '{"durationSeconds":-1}' }
Assert-True ($launch.CPH.Globals['portable.streamLaunch.config'] -eq $before) 'Invalid launch save must be atomic'
Run-Engine $launch @{ streamLaunchMode = 'launch' }
$state = ($launch.CPH.Globals['portable.streamLaunch.state'] | ConvertFrom-Json).payload
Assert-True ($state.status -eq 'complete' -and $state.followup -eq 'requested' -and $state.spotify -eq 'started') 'Launch must complete with explicit optional-step outcomes'
Assert-True (($launch.CPH.Actions -join ',') -eq 'Countdown - Start,Stream - Announce and Bookkeeping') 'Launch must use Countdown and retained private hook only'
Assert-True (($launch.CPH.ObsCalls -join ',') -eq 'scene,start') 'Only manual launch may select scene and start streaming'
Assert-True ($launch.Requests.Contains('/api/spotify/stream-start?durationSeconds=60')) 'Spotify must use its standalone countdown/fade endpoint'
$before = $launch.CPH.Actions.Count
Run-Engine $launch @{ streamLaunchMode = 'fallback' }
Run-Engine $launch @{ streamLaunchMode = 'launch' }
Assert-True ($launch.CPH.Actions.Count -eq $before) 'Duplicate fallback/already-live manual requests must not repeat countdown or hooks'
$failure = [EngineTest.SyntheticLaunch]::new()
$failure.CPH.Globals['portable.streamLaunch.config'] = $launch.CPH.Globals['portable.streamLaunch.config']
$failure.CPH.NeverStream = $true
Run-Engine $failure @{ streamLaunchMode = 'launch' }
$state = ($failure.CPH.Globals['portable.streamLaunch.state'] | ConvertFrom-Json).payload
Assert-True ($state.status -eq 'error' -and -not $failure.CPH.Actions.Contains('Stream - Announce and Bookkeeping')) 'Failed OBS startup must never announce'
Assert-True (-not ($failure.Requests -join ',').Contains('/api/spotify/stream-start')) 'Failed OBS startup must not start Spotify'
$missing = [EngineTest.SyntheticLaunch]::new()
$missing.CPH.Globals['portable.streamLaunch.config'] = $launch.CPH.Globals['portable.streamLaunch.config']
[void]$missing.CPH.MissingActions.Add('Stream - Announce and Bookkeeping')
Run-Engine $missing @{ streamLaunchMode = 'launch' }
Assert-True ($missing.CPH.Actions.Count -eq 0 -and $missing.CPH.ObsCalls.Count -eq 0) 'A missing required private hook must fail before any launch effects'
$partial = [EngineTest.SyntheticLaunch]::new()
$partial.CPH.Globals['portable.streamLaunch.config'] = $launch.CPH.Globals['portable.streamLaunch.config']
$partial.FailSpotify = $true
Run-Engine $partial @{ streamLaunchMode = 'launch' }
$state = ($partial.CPH.Globals['portable.streamLaunch.state'] | ConvertFrom-Json).payload
Assert-True ($state.status -eq 'partial' -and $partial.CPH.Actions.Contains('Stream - Announce and Bookkeeping')) 'Spotify failure must be visible while preserving private follow-up dispatch'
$external = [EngineTest.SyntheticLaunch]::new()
$external.CPH.Globals['portable.streamLaunch.config'] = $launch.CPH.Globals['portable.streamLaunch.config']
$external.CPH.Streaming = $true
Run-Engine $external @{ streamLaunchMode = 'fallback' }
Assert-True ($external.CPH.ObsCalls.Count -eq 0 -and $external.CPH.Actions.Count -eq 2) 'A real external-online fallback may run integration without changing OBS scene/start'
Run-Engine $external @{ streamLaunchMode = 'fallback' }
Assert-True ($external.CPH.Actions.Count -eq 2) 'Duplicate external events must not rerun follow-up'
Write-Output 'Actual Stream Launch C# passed against recording OBS/action/HTTP adapters: inert startup, migration, validation, ordering, OBS confirmation/failure, missing hook, Spotify partial failure and fallback deduplication. No real OBS/chat/Spotify request was made.'

$delayed = [EngineTest.SyntheticLaunch]::new()
$delayed.CPH.Globals['portable.streamLaunch.config'] = $launch.CPH.Globals['portable.streamLaunch.config']
$delayed.CPH.StreamDelayMs = 2000
Run-Engine $delayed @{ streamLaunchMode = 'launch' }
Assert-True ($delayed.Requests.Contains('/api/spotify/stream-start?durationSeconds=58')) 'Spotify must receive remaining countdown time after OBS confirmation, not restart a second full clock'
$interrupted = [EngineTest.SyntheticLaunch]::new()
$interrupted.CPH.Globals['portable.streamLaunch.config'] = $launch.CPH.Globals['portable.streamLaunch.config']
$interrupted.CPH.Globals['portable.streamLaunch.state'] = '{"payload":{"status":"starting","launchId":"synthetic-interrupted"}}'
Run-Engine $interrupted @{ streamLaunchMode = 'initialize' }
Assert-True ((($interrupted.CPH.Globals['portable.streamLaunch.state'] | ConvertFrom-Json).payload.status) -eq 'interrupted' -and $interrupted.CPH.Actions.Count -eq 0 -and $interrupted.CPH.ObsCalls.Count -eq 0) 'Restart must report interrupted launch without replaying it'
Write-Output 'Remaining-time alignment and interrupted-launch preservation passed.'

$walk = [EngineTest.WalkOnsInline]::new()
$walk.args = $walk.CPH.Arguments
$playSound = [System.Action[string]] { param($name) if ($name -eq 'Walk-on Sound - Play') { [EngineTest.WalkOnRecorder]::Play($walk.CPH, $true) } }
$walk.CPH.RunActionHook = $playSound
Run-Engine $walk @{ walkOnsMode = 'initialize' }
$walkConfig = '{"roster":{"fixture":{"enabled":true,"type":"soundpool","choices":[{"value":"sound-a","weight":3}],"volume":0.4}},"sounds":{"sound-a":{"label":"Synthetic","src":"http://127.0.0.1:3135/api/public/media/walk-ons/11111111-1111-1111-1111-111111111111.wav"}},"settings":{"oncePerStream":true}}'
Run-Engine $walk @{ walkOnsMode = 'configure'; config = $walkConfig }
Run-Engine $walk @{ walkOnsMode = 'watch'; userName = 'fixture'; message = '!command' }
Assert-True ($walk.CPH.Actions.Count -eq 0) 'Chat commands must not trigger walk-ons'
$walk.CPH.Globals['portable.video.state'] = '{"payload":{"current":{"visible":true}}}'
Run-Engine $walk @{ walkOnsMode = 'watch'; userName = 'fixture'; message = 'hello' }
Assert-True ($walk.CPH.Actions.Count -eq 0) 'Busy media must skip a walk-on without dispatch'
$walk.CPH.Globals.Remove('portable.video.state') | Out-Null
Run-Engine $walk @{ walkOnsMode = 'test'; login = 'fixture' }
$walkState = ($walk.CPH.Globals['portable.walkOns.state'] | ConvertFrom-Json).payload
Assert-True ($walkState.session.seen.Count -eq 0 -and $walk.CPH.Actions.Count -eq 1) 'Explicit Test must play without consuming eligibility'
Assert-True (-not $walk.args.ContainsKey('walkOnSoundAccepted')) 'The parent must not receive child acceptance arguments'
Assert-True (-not (($walk.CPH.Globals['portable.walkonSound.state'] | ConvertFrom-Json).payload.current.visible)) 'Acknowledgement must survive immediate completion'
Assert-True ($walk.CPH.Arguments['src'] -like 'http://127.0.0.1:3135/*' -and $walk.CPH.Arguments['volume'] -eq '0.4') 'Weighted selection must forward private media and volume'
Run-Engine $walk @{ walkOnsMode = 'watch'; userName = 'fixture'; message = 'hello' }
Run-Engine $walk @{ walkOnsMode = 'watch'; userName = 'fixture'; message = 'again' }
$walkState = ($walk.CPH.Globals['portable.walkOns.state'] | ConvertFrom-Json).payload
Assert-True ($walk.CPH.Actions.Count -eq 2 -and $walkState.session.seen.Count -eq 1) 'First chat plays once and repeated chat stays silent'
Run-Engine $walk @{ walkOnsMode = 'reset'; login = 'fixture' }
$walk.CPH.RunActionHook = $null
Run-Engine $walk @{ walkOnsMode = 'watch'; userName = 'fixture'; message = 'retry' }
Assert-True ((($walk.CPH.Globals['portable.walkOns.state'] | ConvertFrom-Json).payload.session.seen.Count) -eq 0) 'Rejected playback must leave the person eligible'
$walk.CPH.RunActionHook = $playSound
Run-Engine $walk @{ walkOnsMode = 'watch'; userName = 'fixture'; message = 'retry accepted' }
Assert-True ((($walk.CPH.Globals['portable.walkOns.state'] | ConvertFrom-Json).payload.session.seen.Count) -eq 1) 'Reset and successful retry must permit one entrance'
Run-Engine $walk @{ walkOnsMode = 'reset'; login = 'fixture' }
$walk.CPH.RunActionHook = [System.Action[string]] { param($name) if ($name -eq 'Walk-on Sound - Play') { $walk.args['walkOnSoundAccepted'] = $true } }
Run-Engine $walk @{ walkOnsMode = 'watch'; userName = 'fixture'; message = 'stale acknowledgement' }
Assert-True ((($walk.CPH.Globals['portable.walkOns.state'] | ConvertFrom-Json).payload.session.seen.Count) -eq 0) 'An old request acknowledgement and a child-style argument cannot acknowledge a new play'
$walk.CPH.RunActionHook = $playSound
$walk.CPH.FailPersist = $true
Run-Engine $walk @{ walkOnsMode = 'watch'; userName = 'fixture'; message = 'save failure' }
$walk.CPH.FailPersist = $false
Assert-True ((($walk.CPH.Globals['portable.walkOns.state'] | ConvertFrom-Json).payload.session.seen.Count) -eq 0) 'Failed playback-state save must not consume eligibility'
[EngineTest.WalkOnRecorder]::ConcurrentState()
Run-Engine $walk @{ walkOnsMode = 'initialize' }
$walkState = ($walk.CPH.Globals['portable.walkOns.state'] | ConvertFrom-Json).payload
Assert-True ($walkState.config.roster.fixture.type -eq 'soundpool' -and $walkState.config.sounds.'sound-a'.label -eq 'Synthetic') 'Restart must preserve private configuration'
$videoWalk = [EngineTest.WalkOnsInline]::new()
$videoWalk.args = $videoWalk.CPH.Arguments
Run-Engine $videoWalk @{ walkOnsMode = 'initialize' }
Run-Engine $videoWalk @{ walkOnsMode = 'configure'; config = '{"roster":{"fixture":{"type":"video","value":"synthetic-video"}},"settings":{"oncePerStream":true}}' }
Run-Engine $videoWalk @{ walkOnsMode = 'watch'; userName = 'fixture'; message = 'hello' }
Run-Engine $videoWalk @{ walkOnsMode = 'watch'; userName = 'fixture'; message = 'again' }
Assert-True ($videoWalk.CPH.Actions.Count -eq 1 -and $videoWalk.CPH.Actions[0] -eq 'Video - Play') 'Video assignments must retain once-per-stream behavior without an audio acknowledgement'

$sound = [EngineTest.WalkSoundInline]::new()
$sound.args = $sound.CPH.Arguments
Run-Engine $sound @{ walkonSoundMode = 'play'; id = 'fixture'; src = 'https://example.invalid/private.mp3' }
Assert-True (-not $sound.CPH.Arguments['walkOnSoundAccepted'] -and -not $sound.CPH.Globals.ContainsKey('portable.walkonSound.state')) 'External audio URLs must be rejected without playback state'
Run-Engine $sound @{ walkonSoundMode = 'play'; id = 'fixture'; src = 'http://127.0.0.1:3135/api/public/media/walk-ons/11111111-1111-1111-1111-111111111111.wav'; volume = 0 }
$soundState = ($sound.CPH.Globals['portable.walkonSound.state'] | ConvertFrom-Json).payload
Assert-True ($sound.CPH.Arguments['walkOnSoundAccepted'] -and $soundState.current.visible -and $soundState.current.volume -eq 0) 'Companion audio must be accepted and zero volume preserved'
Run-Engine $sound @{ walkonSoundMode = 'stop'; startedAtMs = 1 }
Assert-True ((($sound.CPH.Globals['portable.walkonSound.state'] | ConvertFrom-Json).payload.current.visible)) 'Stale completion must not stop a newer sound'
Run-Engine $sound @{ walkonSoundMode = 'stop'; startedAtMs = $soundState.current.startedAtMs }
Assert-True (-not (($sound.CPH.Globals['portable.walkonSound.state'] | ConvertFrom-Json).payload.current.visible)) 'Matching completion must stop playback'
Write-Output 'Actual Walk Ons C# passed: command/busy guards, weighted media and volume, Test eligibility, once-per-stream chat, rejected playback retry, restart preservation, URL validation and stale completion protection.'

$clip = [EngineTest.ShoutoutInline]::new()
Run-Engine $clip @{ shoutoutClipMode = 'initialize' }
Run-Engine $clip @{ shoutoutClipMode = 'configure'; config = '{"maximumDurationSeconds":17,"clip":{"x":27,"y":31,"width":850,"height":470,"muted":true,"playerMode":"twitch"},"label":{"fontSize":29,"textColour":"#abcdef","backgroundColour":"#123456","backgroundOpacityPercent":0}}' }
$savedConfig = ($clip.CPH.Globals['portable.shoutoutClip.state'] | ConvertFrom-Json).payload.config | ConvertTo-Json -Depth 10 -Compress
Run-Engine $clip @{ shoutoutClipMode = 'play'; clipId = 'SyntheticClip'; channel = 'Fixture'; title = 'Synthetic title'; durationMs = 60000 }
$state = $clip.CPH.Globals['portable.shoutoutClip.state'] | ConvertFrom-Json
Assert-True ($state.payload.clip.durationMs -eq 17000 -and $state.payload.clip.visible) 'Play must clamp duration to saved maximum'
Assert-True ($state.payload.config.clip.muted -and $state.payload.config.label.backgroundOpacityPercent -eq 0) 'Mute and transparent title settings must survive playback'
$firstStart = $state.payload.clip.startedAtMs
Run-Engine $clip @{ shoutoutClipMode = 'play'; slug = 'SyntheticClip'; durationMs = 1 }
$second = ($clip.CPH.Globals['portable.shoutoutClip.state'] | ConvertFrom-Json).payload.clip
Assert-True ($second.startedAtMs -gt $firstStart -and $second.durationMs -eq 1000) 'Same clip replay must have a unique start identity and minimum duration'
Run-Engine $clip @{ shoutoutClipMode = 'stop'; startedAtMs = $firstStart }
Assert-True (($clip.CPH.Globals['portable.shoutoutClip.state'] | ConvertFrom-Json).payload.clip.visible) 'Old clip completion must not stop the replay'
$restarted = [EngineTest.ShoutoutInline]::new()
$restarted.CPH.Globals = $clip.CPH.Globals
Run-Engine $restarted @{ shoutoutClipMode = 'initialize' }
$afterRestart = ($restarted.CPH.Globals['portable.shoutoutClip.state'] | ConvertFrom-Json).payload
Assert-True (($afterRestart.config | ConvertTo-Json -Depth 10 -Compress) -eq $savedConfig -and $afterRestart.clip.startedAtMs -eq $second.startedAtMs) 'Initialization must preserve settings and current playback'
Run-Engine $restarted @{ shoutoutClipMode = 'stop'; startedAtMs = $second.startedAtMs }
Assert-True (-not ($restarted.CPH.Globals['portable.shoutoutClip.state'] | ConvertFrom-Json).payload.clip.visible) 'Matching Stop must clear playback'
$before = $restarted.CPH.Globals['portable.shoutoutClip.state']
Run-Engine $restarted @{ shoutoutClipMode = 'play' }
Assert-True ($before -eq $restarted.CPH.Globals['portable.shoutoutClip.state']) 'Missing clip input must not change state'
$restarted.CPH.FailPersist = $true
Run-Engine $restarted @{ shoutoutClipMode = 'play'; clipId = 'SyntheticClip' }
Assert-True ($before -eq $restarted.CPH.Globals['portable.shoutoutClip.state']) 'Failed save must not publish accepted playback'
[EngineTest.ShoutoutRecorder]::ConcurrentState()
Write-Output 'Actual Shoutout Clips C# passed: saved layout/mute/title preservation, restart, duration limits, repeated clip identity, stale Stop, rejected input/save and concurrent state updates.'
& (Join-Path $PSScriptRoot 'test-guest-camera-engines.ps1')
& (Join-Path $PSScriptRoot 'test-audio-routing-engines.ps1')
& (Join-Path $PSScriptRoot 'test-scene-links-engines.ps1')

& (Join-Path $PSScriptRoot 'test-named-timers-engine.ps1')
& (Join-Path $PSScriptRoot 'test-redeem-checklist-engine.ps1')
& (Join-Path $PSScriptRoot 'test-phone-backlog-engines.ps1')
