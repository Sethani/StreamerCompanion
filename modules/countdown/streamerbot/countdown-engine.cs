using System;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
public class CPHInline {
 const string StateKey="portable.countdown.state", ConfigKey="portable.countdown.config";
 string Arg(string key){return args.ContainsKey(key)&&args[key]!=null?args[key].ToString().Trim():"";}
 string Read(string key){try{return CPH.GetGlobalVar<string>(key,true)??"";}catch{return "";}}
 JObject Parse(string value){try{return JObject.Parse(value);}catch{return new JObject();}}
 long Now(){return DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();}
 long Number(string key,long fallback){string raw=Arg(key);long value;if(raw=="")return fallback;if(!Int64.TryParse(raw,out value)||value<0)throw new Exception("Enter a nonnegative whole number for "+key+".");return value;}
 long Duration(JObject config){long value=Number("durationSeconds",-1);if(value<0){long h=Number("hours",0),m=Number("minutes",0),s=Number("seconds",0);value=checked(checked(h*3600)+checked(m*60)+s);if(value<=0)value=(long?)config["durationSeconds"]??300;}if(value<0||value>Int32.MaxValue)throw new Exception("Duration is outside the supported range.");return value;}
 JObject Config(){JObject config=Parse(Read(ConfigKey));if(config["durationSeconds"]==null)config["durationSeconds"]=300;if(config["finishedText"]==null)config["finishedText"]="Starting\nsoon";return config;}
 JObject Payload(){JObject envelope=Parse(Read(StateKey));return envelope["payload"] as JObject??new JObject{{"status","idle"},{"remainingMs",0},{"endTimeMs",JValue.CreateNull()},{"finishedText",(string)Config()["finishedText"]}};}
 void Save(JObject payload){payload["serverTimeMs"]=Now();payload["config"]=Config();long revision=((long?)Parse(Read(StateKey))["revision"]??0)+1;JObject envelope=new JObject{{"schemaVersion",1},{"feature","countdown"},{"type","state"},{"revision",revision},{"payload",payload}};string json=envelope.ToString(Formatting.None);CPH.SetGlobalVar(StateKey,json,true);try{CPH.WebsocketBroadcastJson(json);}catch{}}
 JObject Preferences(){JObject config=Config();config["durationSeconds"]=Duration(config);string finished=Arg("finishedText");if(finished!=""){if(finished.Length>500)throw new Exception("Finished text must be at most 500 characters.");config["finishedText"]=finished;}return config;}
 public bool Execute(){try{
   string mode=Arg("countdownMode").ToLowerInvariant();
   if(mode=="health"){CPH.LogInfo("[countdown] Timer state available.");return true;}
   if(mode=="initialize"){if(Read(ConfigKey)=="")CPH.SetGlobalVar(ConfigKey,Config().ToString(Formatting.None),true);Save(Payload());return true;}
   if(mode=="start"||mode=="configure"){
     JObject config=Preferences();long milliseconds=checked(((long)config["durationSeconds"])*1000);long end=checked(Now()+milliseconds);
     CPH.SetGlobalVar(ConfigKey,config.ToString(Formatting.None),true);
     if(mode=="configure"){Save(Payload());return true;}
     Save(new JObject{{"status",milliseconds>0?"running":"finished"},{"remainingMs",milliseconds},{"endTimeMs",milliseconds>0?(JToken)end:JValue.CreateNull()},{"finishedText",(string)config["finishedText"]}});return true;
   }
   JObject payload=Payload();
   if(mode=="pause"){if((string)payload["status"]!="running")return true;long remaining=Math.Max(0,((long?)payload["endTimeMs"]??Now())-Now());payload["status"]=remaining>0?"paused":"finished";payload["remainingMs"]=remaining;payload["endTimeMs"]=JValue.CreateNull();}
   else if(mode=="resume"){if((string)payload["status"]!="paused")return true;long remaining=(long?)payload["remainingMs"]??0;payload["status"]=remaining>0?"running":"finished";payload["endTimeMs"]=remaining>0?(JToken)(Now()+remaining):JValue.CreateNull();}
   else if(mode=="clear"){payload["status"]="idle";payload["remainingMs"]=0;payload["endTimeMs"]=JValue.CreateNull();}
   else throw new Exception("Unknown countdown mode.");
   Save(payload);
 }catch(Exception error){CPH.LogError("[countdown] "+error.Message);}return true;}
}
