using System;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
public class CPHInline {
 static readonly object Gate=new object();
 const string ConfigKey="portable.moduleRouting.config",StateKey="portable.moduleRouting.state";
 string Arg(string key){return args.ContainsKey(key)&&args[key]!=null?args[key].ToString():"";}
 string Read(string key){try{return CPH.GetGlobalVar<string>(key,true)??"";}catch{return "";}}
 JObject Parse(string raw){try{return JObject.Parse(raw);}catch{return new JObject();}}
 public bool Execute(){lock(Gate){try{
   JObject previous=Parse(Read(StateKey));
   JObject results=previous["payload"]?["phoneDeckResults"] as JObject??new JObject();
   string requestId=Arg("requestId");
   bool scoped=Arg("moduleRoutingMode")=="set-mode";
   if(scoped&&requestId!=""&&results[requestId]!=null)return true;
   JObject config=Parse(Read(ConfigKey));
   if(!config.HasValues){JObject old=Parse(Read(StateKey));config=old["payload"] as JObject??new JObject();config.Remove("phoneDeckVersion");config.Remove("phoneDeckResults");}
   if(!(config["modules"] is JObject))config["modules"]=new JObject();
   config["version"]=1;
   // A scoped phone request may only change an existing rule's mode.
   // Never accept a replacement scene list from this operation.
   if(scoped){
     string target=Arg("moduleRoutingTarget"),mode=Arg("moduleRoutingVisibility");
     JObject rule=((JObject)config["modules"])[target] as JObject;
     if(rule==null)throw new Exception("The saved module rule is unavailable.");
     if(mode!="disabled"&&mode!="global"&&mode!="scenes")throw new Exception("Invalid routing mode.");
     if(!(rule["scenes"] is JArray))throw new Exception("The saved scene list is unavailable.");
     rule["mode"]=mode;
   }
   if(Arg("moduleRoutingMode")=="save"){
     JObject supplied=JObject.Parse(Arg("moduleRoutingJson"));
     JObject rules=supplied["modules"] as JObject;
     if(rules==null)throw new Exception("A module rules map is required.");
     foreach(JProperty rule in rules.Properties()){
       JObject value=rule.Value as JObject;if(value==null)throw new Exception("Invalid module rule.");
       string mode=(string)value["mode"]??"disabled";
       if(mode!="disabled"&&mode!="global"&&mode!="scenes")throw new Exception("Invalid routing mode.");
       JArray scenes=value["scenes"] as JArray??new JArray();
       foreach(JToken scene in scenes)if(scene.Type!=JTokenType.String)throw new Exception("Scene names must be text.");
       ((JObject)config["modules"])[rule.Name]=new JObject{{"mode",mode},{"scenes",scenes.DeepClone()}};
     }
   }
   string sceneName=Arg("sceneName");
   try{config["currentScene"]=sceneName!=""?sceneName:CPH.ObsGetCurrentScene();}catch{config["currentScene"]="";}
   long revision=((long?)Parse(Read(StateKey))["revision"]??0)+1;
   CPH.SetGlobalVar(ConfigKey,config.ToString(Formatting.None),true);
   if(scoped&&requestId!="")results[requestId]=new JObject{{"status","completed"}};
   while(results.Count>256){JProperty first=null;foreach(JProperty p in results.Properties()){first=p;break;}first.Remove();}
   JObject payload=(JObject)config.DeepClone();payload["phoneDeckVersion"]=1;payload["phoneDeckResults"]=results.DeepClone();
   JObject envelope=new JObject{{"schemaVersion",1},{"feature","moduleRouting"},{"type","state"},{"revision",revision},{"payload",payload}};
   string json=envelope.ToString(Formatting.None);CPH.SetGlobalVar(StateKey,json,true);try{CPH.WebsocketBroadcastJson(json);}catch{}
 }catch(Exception error){CPH.LogError("[module-routing] "+error.Message);}return true;}}
}
