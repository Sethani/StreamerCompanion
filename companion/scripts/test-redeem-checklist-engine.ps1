$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$source = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/redeem-checklist/streamerbot/redeem-checklist-engine.cs')
$fields = 'public FakeCPH CPH = new FakeCPH(); public System.Collections.Generic.Dictionary<string,object> args = new System.Collections.Generic.Dictionary<string,object>();'
$source = $source.Replace('public class CPHInline {', ('public class RedeemChecklistInline {' + $fields))
$fake = @'
using System;
using System.Collections.Generic;
public class FakeCPH {
 public Dictionary<string,object> Globals = new Dictionary<string,object>();
 public Dictionary<string,object> Arguments = new Dictionary<string,object>();
 public List<string> Errors = new List<string>();
 public List<string> Broadcasts = new List<string>();
 public List<string> Fulfilled = new List<string>();
 public List<string> Cancelled = new List<string>();
 public bool FulfilmentSucceeds = true;
 public bool CancellationSucceeds = true;
 public T GetGlobalVar<T>(string key,bool persisted){return Globals.ContainsKey(key)?(T)Globals[key]:default(T);}
 public void SetGlobalVar(string key,object value,bool persisted){Globals[key]=value;}
 public void SetArgument(string key,object value){Arguments[key]=value;}
 public void WebsocketBroadcastJson(string json){Broadcasts.Add(json);}
 public bool TwitchRedemptionFulfill(string reward,string redemption){Fulfilled.Add(redemption);return FulfilmentSucceeds;}
 public bool TwitchRedemptionCancel(string reward,string redemption){Cancelled.Add(redemption);return CancellationSucceeds;}
 public void LogError(string text){Errors.Add(text);}
 public void LogInfo(string text){}
}
'@
$combined = 'namespace RedeemChecklistTest {' + $fake + '}' + "`nnamespace RedeemChecklistTest {" + $source + '}' + @'
namespace RedeemChecklistTest {
public class SyntheticRedeemChecklist : RedeemChecklistInline {
 public long Milliseconds = 2000000000000;
 protected override long Now(){return Milliseconds;}
}
}
'@
$references = @((Get-ChildItem -LiteralPath (Join-Path $PSHOME 'ref') -Filter '*.dll').FullName) + (Join-Path $PSHOME 'Newtonsoft.Json.dll')
Add-Type -TypeDefinition $combined -ReferencedAssemblies $references -CompilerOptions '/nowarn:1701,1702'
function Assert-True($Condition,[string]$Message){if(-not $Condition){throw $Message}}
function Run-Engine($Engine,[hashtable]$Arguments){$Engine.args.Clear();$Engine.CPH.Arguments.Clear();foreach($entry in $Arguments.GetEnumerator()){$Engine.args[$entry.Key]=$entry.Value};[void]$Engine.Execute()}
function State($Engine){return $Engine.CPH.Globals['portable.redeems.state']|ConvertFrom-Json}

$engine=[RedeemChecklistTest.SyntheticRedeemChecklist]::new()
$engine.CPH.Globals['portable.redeems.state']='{"schemaVersion":1,"feature":"redeems","type":"state","revision":4,"payload":{"version":1,"pending":[],"history":[{"redemptionId":"synthetic-history","status":"completed","retained":"yes"}],"retained":"yes"}}'
Run-Engine $engine @{redeemMode='initialize'}
$state=State $engine
Assert-True ($state.revision -eq 5 -and $state.payload.history.Count -eq 1 -and $state.payload.history[0].retained -eq 'yes' -and $state.payload.retained -eq 'yes') 'Initialize must preserve installed history and unknown fields in place'

Run-Engine $engine @{redeemMode='add';rewardId='reward-live';redemptionId='redemption-live';rewardTitle='Synthetic Live';category='live';userName='viewer_one';user='Viewer One';rawInput='Synthetic input'}
$state=State $engine
Assert-True ($state.payload.pending.Count -eq 1 -and $state.payload.pending[0].category -eq 'live' -and $state.payload.pending[0].status -eq 'pending') 'Add must create a live pending item'
Run-Engine $engine @{redeemMode='add';rewardId='reward-live';redemptionId='redemption-live';rewardTitle='Duplicate';category='writing'}
Assert-True ((State $engine).payload.pending.Count -eq 1) 'Duplicate redemption ID must not be added twice'
Run-Engine $engine @{redeemMode='add';rewardId='reward-writing';redemptionId='redemption-writing';rewardTitle='Synthetic Writing';category='writing';userName='viewer_two'}
Assert-True ((State $engine).payload.pending[1].category -eq 'writing') 'Writing category must be retained'

$engine.CPH.Globals['managedRedeemDockBacklogJson']='[{"rewardId":"reward-backlog","redemptionId":"redemption-backlog","rewardTitle":"Backlog","category":"live"},{"rewardId":"reward-live","redemptionId":"redemption-live","rewardTitle":"Duplicate","category":"live"}]'
Run-Engine $engine @{redeemMode='migrate'}
$state=State $engine
Assert-True ($state.payload.pending.Count -eq 3 -and $engine.CPH.Globals['managedRedeemDockBacklogJson'] -eq '[]') 'Legacy backlog must migrate once and clear after a durable state write'

$engine.CPH.Globals['managedRedeemRewardsJson']='[{"id":"managed-language","title":"Speak French","kind":"language"},{"id":"managed-checklist","title":"Synthetic Checklist","category":"writing","kind":"checklist"}]'
Run-Engine $engine @{redeemMode='route';rewardId='managed-language';redemptionId='language-redemption';user='Viewer'}
Assert-True ($engine.CPH.Arguments['redeemRouteKind'] -eq 'language' -and $engine.CPH.Arguments['language'] -eq 'french' -and $engine.CPH.Arguments['durationSeconds'] -eq 300) 'Managed language reward must prepare Named Timers arguments'
Run-Engine $engine @{redeemMode='route';rewardId='managed-checklist';redemptionId='checklist-redemption'}
Assert-True ($engine.CPH.Arguments['redeemRouteKind'] -eq 'checklist' -and $engine.CPH.Arguments['rewardTitle'] -eq 'Synthetic Checklist' -and $engine.CPH.Arguments['category'] -eq 'writing') 'Managed checklist reward must prepare Add arguments'
Run-Engine $engine @{redeemMode='route';rewardId='unmanaged';redemptionId='ignored'}
Assert-True ($engine.CPH.Arguments['redeemRouteKind'] -eq 'ignore') 'Unmanaged rewards must remain untouched'

Run-Engine $engine @{redeemMode='resolve';redemptionId='redemption-live';resolution='complete'}
$state=State $engine
Assert-True ($engine.CPH.Fulfilled.Contains('redemption-live') -and $state.payload.pending.Count -eq 2 -and $state.payload.history[0].status -eq 'completed') 'Complete must call Twitch once and move the item to history'
Run-Engine $engine @{redeemMode='resolve';redemptionId='redemption-writing';resolution='refund'}
$state=State $engine
Assert-True ($engine.CPH.Cancelled.Contains('redemption-writing') -and $state.payload.history[0].status -eq 'refunded') 'Refund must call Twitch cancellation and record refunded history'
$engine.CPH.FulfilmentSucceeds=$false
Run-Engine $engine @{redeemMode='resolve';redemptionId='redemption-backlog';resolution='complete'}
$state=State $engine
Assert-True ($state.payload.pending[0].status -eq 'error' -and $state.payload.pending[0].lastError -ne '' -and -not $engine.CPH.Arguments['redeemResolveSuccess']) 'Failed Twitch update must remain pending with an error'
Assert-True ($engine.CPH.Errors.Count -eq 0) 'Valid synthetic checklist lifecycle must not log engine errors'
Write-Output 'Actual Redeem Checklist C# passed: in-place history, deduplication, categories, backlog migration, managed routing, language handoff arguments and complete/refund/failure handling. Synthetic state and Twitch sinks only.'
