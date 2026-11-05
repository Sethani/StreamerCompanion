$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$videoSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/video/streamerbot/video---engine-0.cs')
$routingSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/source-modules/streamerbot/module-routing.cs')
$pokemonSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/pokemon-encounters/streamerbot/pokemon-bridge.cs')
$countdownSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/countdown/streamerbot/countdown-engine.cs')
$chatSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/chat-routing/streamerbot/chat-routing.cs')
$launchSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/stream-launch/streamerbot/launch-engine.cs')
$remindersSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/reminders/streamerbot/reminders-engine.cs')
$fields = 'public FakeCPH CPH = new FakeCPH(); public System.Collections.Generic.Dictionary<string,object> args = new System.Collections.Generic.Dictionary<string,object>();'
$videoSource = $videoSource.Replace('public class CPHInline {', ('public class VideoInline {' + $fields))
$routingSource = $routingSource.Replace('public class CPHInline {', ('public class RoutingInline {' + $fields))
$pokemonSource = $pokemonSource.Replace('public class CPHInline {', ('public class PokemonInline {' + $fields))
$countdownSource = $countdownSource.Replace('public class CPHInline {', ('public class CountdownInline {' + $fields))
$chatSource = $chatSource.Replace('public class CPHInline {', ('public class ChatInline {' + $fields))
$launchSource = $launchSource.Replace('public class CPHInline {', ('public class LaunchInline {' + $fields))
$remindersSource = $remindersSource.Replace('public class CPHInline {', ('public class RemindersInline {' + $fields))
$fakeSource = @'
using System;
using System.Collections.Generic;
public class FakeCPH {
 public Dictionary<string,object> Globals = new Dictionary<string,object>();
 public List<string> Errors = new List<string>();
 public Dictionary<string,object> Arguments = new Dictionary<string,object>();
 public List<string> Actions = new List<string>();
 public void SetArgument(string key,object value){Arguments[key]=value;}
 public bool RunAction(string name,bool immediate){Actions.Add(name);if(name=="Countdown - Start" && !FailCountdown)Globals["portable.countdown.state"]="{\"payload\":{\"status\":\"running\",\"endTimeMs\":"+(ClockMs+Int64.Parse(Arguments["durationSeconds"].ToString())*1000)+"}}";return !FailCountdown;}
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
 public void SetGlobalVar(string key,object value,bool persisted){Globals[key]=value;}
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
Assert-True ($public.ready -and $public.moduleVersion -eq '1.0.1' -and $null -eq $public.items -and $null -eq $public.config -and $null -eq $public.display) 'Public reminder state must contain only content-free readiness'
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
