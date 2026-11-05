using System;
using System.Linq;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
public class CPHInline {
 const string PublicKey="portable.reminders.state",PrivateKey="portable.reminders.private",Version="1.0.0";
 string Arg(string key){try{return args.ContainsKey(key)&&args[key]!=null?args[key].ToString().Trim():"";}catch{return "";}}
 protected virtual long Now(){return DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();}
 string Login(string value){return Regex.Replace((value??"").Trim().TrimStart('@').ToLowerInvariant(),"[^a-z0-9_]","");}
 JObject Parse(string value){try{return JObject.Parse(value??"");}catch{return new JObject();}}
 JObject Envelope(string key){try{return Parse(CPH.GetGlobalVar<string>(key,true));}catch{return new JObject();}}
 JObject DefaultDisplay(){return new JObject{{"visible",false},{"target",""},{"title","Reminders"},{"items",new JArray()},{"hideAtMs",JValue.CreateNull()}};}
 JObject DefaultConfig(){return new JObject{{"maximumPerTarget",20},{"messageLength",240},{"overlayDurationSeconds",30},{"maximumVisible",8}};}
 JObject Load(){JObject payload=Envelope(PrivateKey)["payload"] as JObject;
  if(payload==null){JObject legacy=Envelope(PublicKey)["payload"] as JObject;payload=new JObject();if(legacy!=null){foreach(var property in legacy.Properties())payload[property.Name]=property.Value.DeepClone();}}
  if(!(payload["items"] is JArray))payload["items"]=new JArray();if(!(payload["display"] is JObject))payload["display"]=DefaultDisplay();if(!(payload["config"] is JObject))payload["config"]=DefaultConfig();
  JObject config=(JObject)payload["config"],defaults=DefaultConfig();foreach(var property in defaults.Properties())if(config[property.Name]==null)config[property.Name]=property.Value.DeepClone();payload["moduleVersion"]=Version;return payload;
 }
 long Revision(string key){return (long?)Envelope(key)["revision"]??0;}
 void Store(string key,string feature,JObject payload,bool publish){JObject envelope=new JObject{{"schemaVersion",1},{"feature",feature},{"type","state"},{"revision",Revision(key)+1},{"payload",payload}};string json=envelope.ToString(Formatting.None);CPH.SetGlobalVar(key,json,true);if(publish)try{CPH.WebsocketBroadcastJson(json);}catch{}}
 void Save(JObject payload){long now=Now();payload["moduleVersion"]=Version;payload["serverTimeMs"]=now;Store(PrivateKey,"remindersPrivate",payload,false);JObject display=payload["display"] as JObject??DefaultDisplay();Store(PublicKey,"reminders",new JObject{{"moduleVersion",Version},{"display",display.DeepClone()},{"serverTimeMs",now}},true);}
 int Limit(JObject config,string key,int fallback,int minimum,int maximum){int value=(int?)config[key]??fallback;return Math.Max(minimum,Math.Min(maximum,value));}
 void Reply(string text){CPH.SetArgument("chatMessage",text);CPH.SetArgument("chatReplyId",Arg("msgId"));CPH.SetArgument("chatReplyUser",Arg("userName"));CPH.SetArgument("chatIsReply",true);CPH.SetArgument("chatTargets","all");}
 JArray OpenFor(JObject payload,string target){return new JArray(((JArray)payload["items"]).OfType<JObject>().Where(item=>(string)item["status"]!="completed"&&(String.IsNullOrWhiteSpace(target)||(string)item["targetKey"]==target)).OrderBy(item=>(long?)item["createdAtMs"]??0));}
 bool Initialize(){Save(Load());return true;}
 bool Add(){JObject payload=Load(),config=(JObject)payload["config"];string raw=Arg("rawInput");if(String.IsNullOrWhiteSpace(raw))raw=Arg("message");string creator=Login(Arg("userName")),creatorDisplay=Arg("user");if(String.IsNullOrWhiteSpace(creatorDisplay))creatorDisplay=Arg("userName");if(String.IsNullOrWhiteSpace(creator))throw new Exception("I could not identify who created this reminder.");
  string target=creator,targetDisplay=creatorDisplay,message=raw;string[] parts=raw.Split(new[]{' '},2,StringSplitOptions.RemoveEmptyEntries);if(parts.Length>1&&parts[0].StartsWith("@")){target=Login(parts[0]);targetDisplay=parts[0].TrimStart('@');message=parts[1].Trim();}
  int maxLength=Limit(config,"messageLength",240,1,1000);if(String.IsNullOrWhiteSpace(target)||String.IsNullOrWhiteSpace(message))throw new Exception("Use !rem <message> or !rem @person <message>.");if(message.Length>maxLength)throw new Exception("That reminder is too long. Maximum: "+maxLength+" characters.");if(OpenFor(payload,target).Count>=Limit(config,"maximumPerTarget",20,1,100))throw new Exception("That reminder backlog is full.");
  ((JArray)payload["items"]).Add(new JObject{{"id",Guid.NewGuid().ToString("N")},{"targetKey",target},{"targetDisplay",targetDisplay},{"creatorKey",creator},{"creatorDisplay",creatorDisplay},{"message",message},{"status","open"},{"createdAtMs",Now()},{"completedAtMs",JValue.CreateNull()},{"completedBy",JValue.CreateNull()}});Save(payload);Reply(target==creator?"Reminder added to your backlog.":"Reminder added for "+targetDisplay+".");return true;
 }
 bool ListMine(){JObject payload=Load();string target=Login(Arg("userName"));if(String.IsNullOrWhiteSpace(target))throw new Exception("I could not identify whose reminders to list.");JArray list=OpenFor(payload,target);if(list.Count==0){Reply("You have no unresolved reminders.");return true;}var messages=list.Take(5).Select((item,index)=>(index+1)+". "+((string)item["message"]??""));Reply("Your reminders: "+String.Join(" | ",messages)+(list.Count>5?" (and "+(list.Count-5)+" more)":""));return true;}
 bool Show(){JObject payload=Load(),config=(JObject)payload["config"];string target=Login(Arg("target"));if(String.IsNullOrWhiteSpace(target))target=Login(Arg("rawInput"));JArray list=OpenFor(payload,target);int maximum=Limit(config,"maximumVisible",8,1,20);JArray shown=new JArray(list.Take(maximum).Select(item=>new JObject{{"id",item["id"]},{"message",item["message"]},{"targetDisplay",item["targetDisplay"]}}));int seconds;if(!Int32.TryParse(Arg("durationSeconds"),out seconds)||seconds<5)seconds=Limit(config,"overlayDurationSeconds",30,5,300);seconds=Math.Min(300,seconds);string title=String.IsNullOrWhiteSpace(target)?"Reminders":((string)list.FirstOrDefault()?["targetDisplay"]??target)+"'s reminders";payload["display"]=new JObject{{"visible",shown.Count>0},{"target",target},{"title",title},{"items",shown},{"hideAtMs",shown.Count>0?(JToken)(Now()+seconds*1000):JValue.CreateNull()}};Save(payload);return true;}
 bool Hide(){JObject payload=Load();payload["display"]=DefaultDisplay();Save(payload);return true;}
 JObject Find(JObject payload,string id){return ((JArray)payload["items"]).OfType<JObject>().FirstOrDefault(item=>(string)item["id"]==id);}
 bool Status(string status){JObject payload=Load(),item=Find(payload,Arg("id"));if(item==null)throw new Exception("Reminder was not found.");item["status"]=status;if(status=="completed"){item["completedAtMs"]=Now();item["completedBy"]=Arg("userName");}else{item["completedAtMs"]=JValue.CreateNull();item["completedBy"]=JValue.CreateNull();}Save(payload);return true;}
 bool Delete(){JObject payload=Load(),item=Find(payload,Arg("id"));if(item==null)throw new Exception("Reminder was not found.");item.Remove();Save(payload);return true;}
 bool Health(){JObject payload=Load();CPH.LogInfo("[Reminders] Health OK: "+((JArray)payload["items"]).Count+" stored reminder(s), module "+Version+".");return true;}
 public bool Execute(){string mode=Arg("reminderMode").ToLowerInvariant();try{if(mode=="initialize")return Initialize();if(mode=="health")return Health();if(mode=="add")return Add();if(mode=="list-mine")return ListMine();if(mode=="show")return Show();if(mode=="hide")return Hide();if(mode=="complete")return Status("completed");if(mode=="restore")return Status("open");if(mode=="delete")return Delete();throw new Exception("Unknown reminder mode.");}catch(Exception error){CPH.LogError("[Reminders] "+error.Message);if(mode=="add"||mode=="list-mine")Reply(error.Message);return true;}}
}
