$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$fields=' public FakeCPH CPH=new FakeCPH(); public System.Collections.Generic.Dictionary<string,object> args=new System.Collections.Generic.Dictionary<string,object>(); '
$camera=(Get-Content -Raw (Join-Path $root 'modules/cameras/streamerbot/cameras-engine.cs')).Replace('public class CPHInline {',('public class CameraInline {'+$fields))
$reactive=(Get-Content -Raw (Join-Path $root 'modules/reactive/streamerbot/reactive-engine.cs')).Replace('public class CPHInline{',('public class ReactiveInline{'+$fields))
$fake=@'
using System;using System.Collections.Generic;using System.Linq;using Newtonsoft.Json.Linq;
public class FakeCPH {
 public Dictionary<string,object> Globals=new Dictionary<string,object>();public Dictionary<string,object> Arguments=new Dictionary<string,object>();
 public List<string> Requests=new List<string>();public List<JObject> Writes=new List<JObject>();public List<string> Errors=new List<string>();public bool Connected=true,FailSave,CameraActions;
 public string FailType="";public Action<string> Hook;
 public Dictionary<string,JArray> Scenes=new Dictionary<string,JArray>();
 public FakeCPH(){Scenes["main"]=Rows("monitor","laptop","self","background","frame");Scenes["secondary"]=Rows("laptop","guest","background","frame");}
 JArray Rows(params string[] names){return new JArray(names.Select((name,index)=>new JObject{["sourceName"]=name,["sceneItemId"]=index+1,["sceneItemEnabled"]=true}));}
 public T GetGlobalVar<T>(string key,bool persisted){return Globals.ContainsKey(key)?(T)Globals[key]:default(T);}
 public void SetGlobalVar(string key,object value,bool persisted){if(FailSave)throw new Exception("Synthetic save failure");Globals[key]=value;}
 public void SetArgument(string key,object value){Arguments[key]=value;}
 public bool ActionExists(string name){return CameraActions;}
 public bool RunAction(string name,bool immediate){if(Hook!=null)Hook(name);return CameraActions;}
 public void WebsocketBroadcastJson(string json){}public void LogError(string text){Errors.Add(text);}public void LogWarn(string text){}public void LogInfo(string text){}
 public bool ObsIsConnected(){return Connected;}
 public string ObsSendRaw(string type,string json){Requests.Add(type);var d=JObject.Parse(json);if(type==FailType)return "{\"requestStatus\":{\"result\":false}}";
  if(type=="GetInputList")return new JObject{["inputs"]=new JArray(new[]{"monitor","laptop","self","guest","background","frame","video"}.Select(name=>new JObject{["inputName"]=name,["inputKind"]=name=="guest"||name=="self"?"browser_source":"dshow_input"}))}.ToString();
  if(type=="GetSceneList")return new JObject{["scenes"]=new JArray(Scenes.Keys.Select(name=>new JObject{["sceneName"]=name}))}.ToString();
  if(type=="GetSceneItemList"){string scene=(string)d["sceneName"];return Scenes.ContainsKey(scene)?new JObject{["sceneItems"]=Scenes[scene]}.ToString():"{\"requestStatus\":{\"result\":false}}";}
  if(type=="GetSceneItemTransform")return "{\"sceneItemTransform\":{\"positionX\":17,\"positionY\":23}}";
  if(type.StartsWith("Set")||type=="CreateSceneItem"){d["requestType"]=type;Writes.Add(d);if(type=="CreateSceneItem"){var rows=Scenes[(string)d["sceneName"]];int id=rows.Count+1;rows.Add(new JObject{["sourceName"]=d["sourceName"],["sceneItemId"]=id,["sceneItemEnabled"]=false});return new JObject{["sceneItemId"]=id}.ToString();}return "{}";}
  throw new Exception("Unexpected fixture OBS request");
 }
}
public static class Fixture {
 public const string Mappings="{\"mainScene\":\"main\",\"secondaryScene\":\"secondary\",\"monitor\":\"monitor\",\"laptop\":\"laptop\",\"selfPng\":\"self\",\"guestPng\":\"guest\",\"frame\":\"frame\",\"background\":\"background\"}";
 public static void Seed(FakeCPH c){c.Globals["portable.cameras.state"]=new JObject{["schemaVersion"]=1,["revision"]=1,["payload"]=new JObject{["config"]=new JObject{["version"]=1,["configured"]=true,["mainConfigured"]=true,["secondaryConfigured"]=false,["mainMode"]="monitor",["secondaryMode"]="off",["reactiveGuestId"]="",["managedSecondarySources"]=new JArray(),["mappings"]=JObject.Parse(Mappings)},["status"]=new JObject{["status"]="ok"}}}.ToString();c.Globals["portable.reactive.state"]="{\"schemaVersion\":1,\"revision\":1,\"payload\":{\"guests\":[{\"id\":\"fixture\",\"name\":\"Synthetic\",\"url\":\"https://example.invalid/avatar\",\"enabled\":false}],\"camera2GuestId\":\"\",\"presentation\":{\"avatarSizePx\":170}}}";}
 public static void Concurrent(){var first=new ReactiveInline();first.args["reactiveActionMode"]="initialize";first.Execute();System.Threading.Tasks.Parallel.For(0,50,i=>{var e=new ReactiveInline();e.CPH.Globals=first.CPH.Globals;e.args["reactiveActionMode"]="save";e.args["id"]="guest"+i;e.args["url"]="https://example.invalid/avatar";e.Execute();});if(((JArray)JObject.Parse((string)first.CPH.Globals["portable.reactive.state"])["payload"]["guests"]).Count!=50)throw new Exception("Concurrent roster save lost guests");}
}
'@
$references=@((Get-ChildItem -LiteralPath (Join-Path $PSHOME 'ref') -Filter '*.dll').FullName)+(Join-Path $PSHOME 'Newtonsoft.Json.dll')
Add-Type -TypeDefinition ('namespace GuestCameraTest{'+$fake+'}namespace GuestCameraTest{'+$camera+'}namespace GuestCameraTest{'+$reactive+'}') -ReferencedAssemblies $references -CompilerOptions '/nowarn:1701,1702'
function Assert($condition,$message){if(-not $condition){throw $message}}
function Run($engine,[hashtable]$arguments){$engine.args.Clear();foreach($entry in $arguments.GetEnumerator()){$engine.args[$entry.Key]=$entry.Value};[void]$engine.Execute()}
function Payload($engine,$key='portable.cameras.state'){return ($engine.CPH.Globals[$key]|ConvertFrom-Json).payload}
$fresh=[GuestCameraTest.CameraInline]::new();Run $fresh @{cameraActionMode='initialize'};Assert ($fresh.CPH.Writes.Count -eq 0) 'Unconfigured startup must never write OBS'
$camera=[GuestCameraTest.CameraInline]::new();[GuestCameraTest.Fixture]::Seed($camera.CPH)
Run $camera @{cameraActionMode='refresh';requestId='read-only'};Assert ($camera.CPH.Writes.Count -eq 0) 'Refresh must only read OBS';Assert ((Payload $camera).lastRequestId -eq 'read-only') 'Read acknowledgement must match request'
Run $camera @{cameraActionMode='mappings';mappings=[GuestCameraTest.Fixture]::Mappings};Assert ($camera.CPH.Writes.Count -eq 0) 'Saving source mappings must not change OBS'
Run $camera @{cameraActionMode='configure';mainMode='laptop';secondaryMode='video';videoSourceName='stale-other-client-choice';changedSlot='main';requestId='main-change'};Assert ((Payload $camera).status.status -eq 'ok') 'Main change should apply';Assert ((Payload $camera).config.secondaryMode -eq 'off') 'Stale other-slot values must not replace saved selection';Assert (@($camera.CPH.Writes|Where-Object{$_['sceneName'] -eq 'secondary'}).Count -eq 0) 'Changing main must not touch Camera 2'
$camera.CPH.Writes.Clear();$camera.CPH.FailType='SetSceneItemEnabled';Run $camera @{cameraActionMode='reapply';requestId='failure'};Assert ((Payload $camera).status.status -eq 'error') 'OBS failures must never report success';$camera.CPH.FailType=''
$camera.CPH.Writes.Clear();Run $camera @{cameraActionMode='assign-reactive';id='missing'};Assert ($camera.CPH.Writes.Count -eq 0) 'Invalid guest must fail before any OBS write'
Run $camera @{cameraActionMode='assign-reactive';id='fixture'};Assert ((Payload $camera).config.secondaryMode -eq 'reactive') 'Camera 2 assignment must apply';Assert ((Payload $camera 'portable.reactive.state').camera2GuestId -eq 'fixture') 'Cameras must update the compatibility selection mirror';Assert (-not (Payload $camera 'portable.reactive.state').guests[0].enabled) 'Camera assignment must not enable the lineup'
$reactive=[GuestCameraTest.ReactiveInline]::new();$reactive.CPH.Globals=$camera.CPH.Globals
Run $reactive @{reactiveActionMode='delete';id='fixture'};Run $camera @{cameraActionMode='sync'};Assert ((Payload $camera).config.secondaryMode -eq 'off' -and (Payload $camera).config.reactiveGuestId -eq '') 'Deleting a selected guest must clear the real camera selection';Assert ((Payload $camera 'portable.reactive.state').camera2GuestId -eq '') 'Deletion must clear the compatibility mirror'
$camera.CPH.Writes.Clear();Run $camera @{cameraActionMode='configure';secondaryMode='video';videoSourceName='video';changedSlot='secondary'};Assert ($camera.CPH.Writes|Where-Object{$_['requestType'] -eq 'CreateSceneItem'}) 'Missing selected video scene item must be created';Assert ($camera.CPH.Writes|Where-Object{$_['requestType'] -eq 'SetSceneItemTransform'}) 'New video item must retain the established template transform'
$camera.CPH.Writes.Clear();$camera.CPH.Connected=$false;Run $camera @{cameraActionMode='observe'};$camera.CPH.Connected=$true;Run $camera @{cameraActionMode='observe'};$writes=$camera.CPH.Writes.Count;Run $camera @{cameraActionMode='observe'};Assert ($writes -gt 0 -and $camera.CPH.Writes.Count -eq $writes) 'Reconnect must apply once without repeated mutation retries'
$camera.CPH.Writes.Clear();$camera.args.Clear();$camera.args['cameraActionMode']='refresh';$camera.CPH.FailSave=$true;[void]$camera.Execute();Assert ($camera.CPH.Writes.Count -eq 0) 'Failed read-state persistence must never change OBS'
[GuestCameraTest.Fixture]::Concurrent()
Write-Output 'Actual Reactive/Cameras C# passed: 50-guest concurrent preservation, inert fresh startup, read-only inventory/mappings, scoped routing, OBS errors, validated guest assignment/mirror/delete, scene-item transforms and one reconnect apply. Synthetic OBS only.'
