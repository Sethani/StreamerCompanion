using System;
using System.Text.RegularExpressions;
public class CPHInline {
 string Arg(string key){return args.ContainsKey(key)&&args[key]!=null?args[key].ToString():"";}
 public bool Execute(){try{
   string message=Arg("chatMessage");
   if(String.IsNullOrWhiteSpace(message))return true;
   if(Regex.IsMatch(message.Trim(),@"^%[^%]+%$")){CPH.LogError("[chat-routing] Message argument was not resolved.");return true;}
   string targets=Arg("chatTargets").Trim().ToLowerInvariant();
   if(targets!=""&&targets!="all"&&targets!="twitch"){CPH.LogError("[chat-routing] Requested platform is not supported by this adapter.");return true;}
   string replyId=Arg("chatReplyId").Trim();
   bool reply=String.Equals(Arg("chatIsReply"),"true",StringComparison.OrdinalIgnoreCase)||Arg("chatIsReply")=="1";
   if(Regex.IsMatch(replyId,@"^%[^%]+%$"))replyId="";
   CPH.SetArgument("chatMessage",message);
   CPH.SetArgument("chatReplyId",replyId);
   CPH.SetArgument("chatIsReply",reply&&replyId!="");
   if(!CPH.RunAction("Chat - Twitch Send",true))CPH.LogError("[chat-routing] Native send action is unavailable.");
 }catch{CPH.LogError("[chat-routing] Routing failed; check imported actions and account configuration.");}return true;}
}
