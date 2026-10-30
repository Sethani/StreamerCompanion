$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$videoSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/video/streamerbot/video---engine-0.cs')
$routingSource = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/source-modules/streamerbot/module-routing.cs')
$fields = 'public FakeCPH CPH = new FakeCPH(); public System.Collections.Generic.Dictionary<string,object> args = new System.Collections.Generic.Dictionary<string,object>();'
$videoSource = $videoSource.Replace('public class CPHInline {', ('public class VideoInline {' + $fields))
$routingSource = $routingSource.Replace('public class CPHInline {', ('public class RoutingInline {' + $fields))
$fakeSource = @'
using System;
using System.Collections.Generic;
public class FakeCPH {
 public Dictionary<string,object> Globals = new Dictionary<string,object>();
 public List<string> Errors = new List<string>();
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
$combined = 'namespace EngineTest {' + $fakeSource + '}' + "`n" + 'namespace EngineTest {' + $videoSource + '}' + "`n" + 'namespace EngineTest {' + $routingSource + '}'
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
Write-Output 'Actual Video and Source Modules C# compiled against a synthetic CPH adapter; clean defaults, preserved globals, validation and guarded Stop passed.'
