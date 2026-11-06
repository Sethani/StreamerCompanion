$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$source = Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'modules/named-timers/streamerbot/named-timers-engine.cs')
$fields = 'public FakeCPH CPH = new FakeCPH(); public System.Collections.Generic.Dictionary<string,object> args = new System.Collections.Generic.Dictionary<string,object>();'
$source = $source.Replace('public class CPHInline {', ('public class NamedTimersInline {' + $fields))
$fake = @'
using System;
using System.Collections.Generic;
public class FakeGlobal { public string VariableName; public object Value; }
public class FakeCPH {
 public Dictionary<string,object> Globals = new Dictionary<string,object>();
 public Dictionary<string,object> Arguments = new Dictionary<string,object>();
 public List<string> Errors = new List<string>();
 public List<string> Broadcasts = new List<string>();
 public List<string> Fulfilled = new List<string>();
 public bool FulfilmentSucceeds = true;
 public T GetGlobalVar<T>(string key,bool persisted){return Globals.ContainsKey(key)?(T)Globals[key]:default(T);}
 public void SetGlobalVar(string key,object value,bool persisted){Globals[key]=value;}
 public void SetArgument(string key,object value){Arguments[key]=value;}
 public List<FakeGlobal> GetGlobalVarValues(bool persisted){var values=new List<FakeGlobal>();foreach(var item in Globals)values.Add(new FakeGlobal{VariableName=item.Key,Value=item.Value});return values;}
 public void WebsocketBroadcastJson(string json){Broadcasts.Add(json);}
 public bool TwitchRedemptionFulfill(string reward,string redemption){Fulfilled.Add(redemption);return FulfilmentSucceeds;}
 public void LogError(string text){Errors.Add(text);}
 public void LogInfo(string text){}
}
'@
$combined = 'namespace NamedTimersTest {' + $fake + '}' + "`nnamespace NamedTimersTest {" + $source + '}' + @'
namespace NamedTimersTest {
public class SyntheticNamedTimers : NamedTimersInline {
 public long Seconds = 2000000000;
 protected override long NowSeconds(){return Seconds;}
 protected override long NowMilliseconds(){return Seconds*1000;}
}
}
'@
$references = @((Get-ChildItem -LiteralPath (Join-Path $PSHOME 'ref') -Filter '*.dll').FullName) + (Join-Path $PSHOME 'Newtonsoft.Json.dll')
Add-Type -TypeDefinition $combined -ReferencedAssemblies $references -CompilerOptions '/nowarn:1701,1702'
function Assert-True($Condition,[string]$Message){if(-not $Condition){throw $Message}}
function Run-Engine($Engine,[hashtable]$Arguments){$Engine.args.Clear();$Engine.CPH.Arguments.Clear();foreach($entry in $Arguments.GetEnumerator()){$Engine.args[$entry.Key]=$entry.Value};[void]$Engine.Execute()}

$engine=[NamedTimersTest.SyntheticNamedTimers]::new()
$engine.CPH.Globals['timer_end_existing']=[string]($engine.Seconds+60)
Run-Engine $engine @{namedTimersMode='add';timerSeconds='30';timerTitle='Existing'}
Assert-True ($engine.CPH.Globals['timer_end_existing'] -eq [string]($engine.Seconds+90)) 'Active timer must extend from its current end'
Assert-True ($engine.CPH.Arguments['chatMessage'].StartsWith('Added 30s to the existing timer')) 'Extension must preserve the established chat text'
Run-Engine $engine @{namedTimersMode='add';timerSeconds='60';timerTitle='Synthetic New!'}
Assert-True ($engine.CPH.Globals['timer_end_synthetic_new'] -eq [string]($engine.Seconds+60)) 'New timer must normalize the title and start from now'
$before=$engine.CPH.Globals.Count
Run-Engine $engine @{namedTimersMode='add';timerSeconds='0';timerTitle='invalid'}
Assert-True ($engine.CPH.Globals.Count -eq $before -and $engine.CPH.Arguments['chatMessage'].Contains('more than 0')) 'Invalid add must not create a timer'

$engine.CPH.Globals['timer_end_finished']=[string]($engine.Seconds-1)
$engine.CPH.Globals['timer_end_german']=[string]($engine.Seconds-1)
Run-Engine $engine @{namedTimersMode='check'}
Assert-True ($engine.CPH.Globals['timer_end_finished'] -eq '0') 'Ordinary expired timer must reset to zero'
Assert-True ($engine.CPH.Globals['timer_end_german'] -ne '0') 'Managed language timer must remain owned by the language checker'
Assert-True ($engine.CPH.Arguments['chatMessage'] -eq 'finished timer is done!') 'Completion must use the established chat text'
Run-Engine $engine @{namedTimersMode='publish'}
$state=$engine.CPH.Globals['portable.timers.state']|ConvertFrom-Json
Assert-True ($state.schemaVersion -eq 1 -and $state.feature -eq 'timers' -and $state.payload.serverTimeMs -eq ($engine.Seconds*1000)) 'Publisher must retain the schema-1 timer envelope'
Assert-True (@($state.payload.timers).Count -eq 2) 'Publisher must include only active parseable timer globals'

Run-Engine $engine @{namedTimersMode='command';rawInput='45 Tea Break'}
Assert-True ($engine.CPH.Arguments['timerCommandValid'] -and $engine.CPH.Arguments['timerSeconds'] -eq '45' -and $engine.CPH.Arguments['timerTitle'] -eq 'Tea Break') 'Command must preserve seconds/title arguments'
Run-Engine $engine @{namedTimersMode='command';rawInput='bad'}
Assert-True (-not $engine.CPH.Arguments['timerCommandValid'] -and $engine.CPH.Arguments['chatMessage'].Contains('not a valid number')) 'Invalid command must not request Timer_Add'

Run-Engine $engine @{namedTimersMode='language-queue';language='german';durationSeconds='300';rewardId='synthetic-reward-a';redemptionId='synthetic-redemption-a';user='Synthetic User'}
$queue=$engine.CPH.Globals['managedLanguageRedemptionsJson']|ConvertFrom-Json
Assert-True (@($queue).Count -eq 1 -and $queue[0].startsAt -eq $engine.Seconds -and $queue[0].dueAt -eq ($engine.Seconds+300)) 'First language redemption must start immediately for five minutes'
Assert-True ($engine.CPH.Globals['managedLanguageActive'] -eq 'german' -and $engine.CPH.Globals['timer_end_german'] -eq [string]($engine.Seconds+300)) 'Immediate language must become the only active managed timer'
Run-Engine $engine @{namedTimersMode='language-queue';language='french';durationSeconds='300';rewardId='synthetic-reward-b';redemptionId='synthetic-redemption-b';user='Synthetic User'}
$queue=$engine.CPH.Globals['managedLanguageRedemptionsJson']|ConvertFrom-Json
Assert-True (@($queue).Count -eq 2 -and $queue[1].startsAt -eq ($engine.Seconds+300) -and $queue[1].dueAt -eq ($engine.Seconds+600)) 'Different languages must share one serial queue'
Assert-True ($engine.CPH.Arguments['chatMessage'].Contains('queued')) 'Queued language must prepare the established queue message'

$engine.Seconds+=301
Run-Engine $engine @{namedTimersMode='language-check'}
$queue=$engine.CPH.Globals['managedLanguageRedemptionsJson']|ConvertFrom-Json
Assert-True (@($queue).Count -eq 1 -and $queue[0].language -eq 'french') 'Successful fulfilment must remove the completed item and retain the next one'
Assert-True ($engine.CPH.Globals['managedLanguageActive'] -eq 'french' -and $engine.CPH.Fulfilled.Contains('synthetic-redemption-a')) 'Language checker must advance and record the Twitch fulfilment request'
$engine.Seconds+=300;$engine.CPH.FulfilmentSucceeds=$false
Run-Engine $engine @{namedTimersMode='language-check'}
$queue=$engine.CPH.Globals['managedLanguageRedemptionsJson']|ConvertFrom-Json
Assert-True (@($queue).Count -eq 1 -and $engine.CPH.Globals['managedLanguageActive'] -eq '') 'Failed fulfilment must stay queued but stop displaying after due time'
$engine.CPH.FulfilmentSucceeds=$true
Run-Engine $engine @{namedTimersMode='language-check'}
$queue=$engine.CPH.Globals['managedLanguageRedemptionsJson']|ConvertFrom-Json
Assert-True (@($queue).Count -eq 0) 'Successful retry must remove the due language redemption'
Assert-True ($engine.CPH.Errors.Count -eq 0) 'Valid synthetic timer lifecycle must not log errors'
Write-Output 'Actual Named Timers C# passed: title normalization, start/extend, invalid input, expiry/exclusions, schema publishing, command parsing, serial language transitions and fulfilment retry. Synthetic state only; no live Twitch/chat/OBS action was invoked.'
