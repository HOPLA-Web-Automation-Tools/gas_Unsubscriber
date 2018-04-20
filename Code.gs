
var scriptName = "Unsubscriber"
var userProperties = PropertiesService.getUserProperties();
var label_subscriptions = userProperties.getProperty("label_subscriptions") || "Subscriptions",
    label_unsubcribe = userProperties.getProperty("label_unsubcribe") || "Unsubscribe",    
    frequency = userProperties.getProperty("frequency") || 1,
    status = userProperties.getProperty("status") || 'false';

var SubscriptionThreads = []
var user_email = Session.getEffectiveUser().getEmail();
function test(){
   markSubscription();
   Gmail_Unsubscribe();
}

function doGet(e){
  if (e.parameter.setup){ //SETUP    
    deleteAllTriggers()
    
    ScriptApp.newTrigger("markSubscription").timeBased().everyMinutes(5).create();
    ScriptApp.newTrigger("Gmail_Unsubscribe").timeBased().atHour(frequency).everyDays(1).create();
    var content = "<p>"+scriptName+" has been installed on your email " + user_email + ". "
    +'<p>It will:</p>'
    +'<ul style="list-style-type:disc">'
    +'<li>Move incoming emails with unsubscribe link from inbox to "Subscriptions" label.</li>'
    +'<li>Unsubcribe to newsletters under "Unsubscribe" label. </li>'
    +'</ul>'
    +'<p>You can change these settings by clicking the WAT Suite extension icon or WAT Settings on gmail.</p>';




    
    return HtmlService.createHtmlOutput(content);
  }
  else if (e.parameter.test){
    var authInfo = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL)
   return HtmlService.createHtmlOutput(authInfo.getAuthorizationStatus());   
  }
  else if (e.parameter.savesettings){ //SET VARIABLES
    userProperties.setProperty("label_subscriptions", e.parameter.label_subscriptions || label_subscriptions);
    userProperties.setProperty("label_unsubcribe", e.parameter.label_unsubcribe || label_unsubcribe);
    userProperties.setProperty("frequency", (e.parameter.frequency) || frequency);   
    userProperties.setProperty("status",e.parameter.status);
    
    label_subscriptions = userProperties.getProperty("label_subscriptions") || "Subscriptions";
    label_unsubcribe = userProperties.getProperty("label_unsubcribe") || "Unsubscribe";
    frequency = userProperties.getProperty("frequency") || 1;
    
    deleteAllTriggers()
    
    if (e.parameter.status == "true"){
      ScriptApp.newTrigger("markSubscription").timeBased().everyMinutes(5).create();
      ScriptApp.newTrigger("Gmail_Unsubscribe").timeBased().atHour(frequency).everyDays(1).create();
    }
    return ContentService.createTextOutput("settings has been saved.");
    
  }
  else if (e.parameter.unsubscribe_trigger){ //DO IT NOW
    var labeled = markSubscription();
    var unsubscribed = Gmail_Unsubscribe();
    return ContentService.createTextOutput(labeled + " has been labeled as subscription and "+unsubscribed+" unsubscribed.");
  }
  else if (e.parameter.unsubscribe_enable){ //ENABLE
    userProperties.setProperty("status","true");
    deleteAllTriggers();
    ScriptApp.newTrigger("markSubscription").timeBased().everyMinutes(5).create();
    ScriptApp.newTrigger("Gmail_Unsubscribe").timeBased().atHour(frequency).everyDays(1).create();

    return ContentService.createTextOutput("Triggers has been enabled.");
  }
  else if (e.parameter.unsubscribe_disable){ //DISABLE
    userProperties.setProperty("status","false");
    deleteAllTriggers()
    return ContentService.createTextOutput("Triggers has been disabled.");
  }
  else if (e.parameter.unsubscribe_getVariables){ //GET VARIABLES
    var label_subscriptions = userProperties.getProperty("label_subscriptions") || "Subscriptions";
    label_unsubcribe = userProperties.getProperty("label_unsubcribe") || "Unsubscribe";
    frequency = userProperties.getProperty("frequency") || 1;
    status = userProperties.getProperty("status") || 'true';
    var triggers = ScriptApp.getProjectTriggers();
    var status;
    if (triggers.length != 2){
      status = 'false';
    }else{
      status = 'true';
    }
    resjson = {
      'label_subscriptions': label_subscriptions,
      'label_unsubcribe': label_unsubcribe,
      'frequency': frequency,
      'status':status
    }
    
    return ContentService.createTextOutput(JSON.stringify(resjson));
  }
  else { //NO PARAMETERS
     // use an externally hosted stylesheet
    frequency = userProperties.getProperty("frequency") || '1';
    var style = '<link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" rel="stylesheet">';
    
    // get the query "greeting" parameter and set the default to "Hello"
    var greeting = scriptName;
    // get the query "name" parameter and set the default to "World!"
    var name = "has been installed";
    
    // create and use a template
    var heading = HtmlService.createTemplate('<h1><?= greeting ?> <?= name ?>!</h1>')
    
    // set the template variables
    heading.greeting = greeting;
    heading.name = name;
    
    deleteAllTriggers()
    
    var content = "<p>"+scriptName+" has been installed on your email " + user_email + ". "
    +'<p>It will:</p>'
    +'<ul style="list-style-type:disc">'
    +'<li>Move incoming emails with unsubscribe link from inbox to "Subscriptions" label.</li>'
    +'<li>Unsubcribe to newsletters under "Unsubscribe" label. </li>'
    +'</ul>'
    +'<p>You can change these settings by clicking the WAT Suite extension icon or WAT Settings on gmail.</p>';


    ScriptApp.newTrigger("markSubscription").timeBased().everyMinutes(5).create();
    ScriptApp.newTrigger("Gmail_Unsubscribe").timeBased().atHour(frequency).everyDays(1).create();    
    
    var HTMLOutput = HtmlService.createHtmlOutput();
    HTMLOutput.append(style);
    HTMLOutput.append(heading.evaluate().getContent());
    HTMLOutput.append(content);
    
    return HTMLOutput;
  }
  
  

}


function deleteAllTriggers(){
  //DELETE ALL TRIGGERS
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  //DELETE ALL TRIGGERS***
}






function markSubscription(){
  var maxTime = 1500;
  var label_subscriptions = userProperties.getProperty("label_subscriptions") || "Subscriptions";
  var label_unsubcribe = userProperties.getProperty("label_unsubcribe") || "Unsubscribe";
  Logger.log("markSubscription started for " + user_email);
  d = new Date();
  Logger.log("maxTime="+maxTime);
  Logger.log("NOW="+d.getTime()/1000);  
  n = ((d.getTime()/1000) - (maxTime * 60));
  n = n.toFixed();
  Logger.log("n = " + n);
 var filters = [
   'in:inbox',
    'after:' + n
  ];

  var threads = GmailApp.search(filters.join(' ')),
      threadMessages = GmailApp.getMessagesForThreads(threads);
  
  
  var count_pass = 0,count_fail=0;
  for (var i = 0 ; i < threadMessages.length; i++) {
    var lastMessage = threadMessages[i][threadMessages[i].length -1],
        lastFrom = lastMessage.getFrom(),
        body = lastMessage.getRawContent(),
        subject = lastMessage.getSubject(),
        thread = lastMessage.getThread();  
        Logger.log(subject)
    // Logger.log("lastFrom: " + lastFrom)
    //Logger.log("!isMe:"+!isMe(lastFrom)+"|!threadInSubscriptions:"+!threadHasLabel(thread,label_subscriptions)+"|!threadInUnsubscribe:"+!threadHasLabel(thread,label_unsubcribe)+"|regex:"+regex_subscription(body,subject));
    if (regex_subscription(body,subject) ){
      count_pass += 1;
      SubscriptionThreads.push(thread);
    }else{
      count_fail += 1;      
    }
  }
  Logger.log("Subscriptions=" + count_pass + " Not-Subscriptions:" + count_fail);
  
  // Mark unresponded in bulk.
  markLabel(SubscriptionThreads);
  archive(SubscriptionThreads);
  Logger.log('Labeled ' + SubscriptionThreads.length + ' threads as subscriptions.');
  return SubscriptionThreads.length;
}


function Gmail_Unsubscribe() {
  var label_unsubcribe = userProperties.getProperty("label_unsubcribe") || "Unsubscribe";
  var threads = GmailApp.search("label:"+label_unsubcribe);
  var iUnsubscribed = 0;
  for (var t in threads)  {
    
    var message = threads[t].getMessages()[0];
    var label = getLabel(label_unsubcribe);
    threads[t].removeLabel(label);    
    
    var raw = message.getRawContent();
    
    // Search for the List Unsubscribe header in the Email Header
    var urls = raw.match(/^list\-unsubscribe:(.|\r\n\s)+<(https?:\/\/[^>]+)>/im);

    // thanks josh/list-unsubscribe @github

    if (urls) {
      
      // Click the unsubscribe link
      Logger.log("Unsubscribed using: " + urls[2])
      UrlFetchApp.fetch(urls[2], {muteHttpExceptions: true});
      iUnsubscribed += 1;
      
    } else {
      
          // Find the unsubscribe email
          urls = raw.match(/^list\-unsubscribe:(.|\r\n\s)+<mailto:([^>]+)>/im);
          
          if (urls) {
            
            // Send blank email to unsubscribe
            subj = urls[2].match(/subject=([\w ]+)/i)
            if (subj){
              split = urls[2].split('?');
              if (split.length > 1){
                Logger.log("Unsubscribed. sent email w/ subject : " + subj[1]+ " to email address" + split[0])
                GmailApp.sendEmail(split[0], subj[1], "Unsubscribe");                
              }else{
                Logger.log("Unsubscribed. sent email w/ subject : " + subj[1]+ " to email address" + urls[2])
                GmailApp.sendEmail(urls[2], subj[1], "Unsubscribe");                
              }
              
            }else{
              Logger.log("Unsubscribed. sent email to " + urls[2])
              GmailApp.sendEmail(urls[2], "Unsubscribe", "Unsubscribe");
            }
            iUnsubscribed += 1;
            
            
          } else {
            
            // Get the HTML of the email 
            var body = message.getBody().replace(/\s/g, "");
            
            // Regex to find all hyperlinks
            var hrefs = new RegExp(/<a[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi);
            
            // Iterate through all hyperlinks inside the message
            while ( urls = hrefs.exec(body) ) {
              
              // Does the anchor text or hyperlink contain words like unusbcribe or optout
              if (urls[1].match(/unsubscribe|optout|opt\-out|remove/i)
                  || urls[2].match(/unsubscribe|optout|opt\-out|remove/i)) {
                
                // Click the unsubscribe link
                Logger.log("Unsubscribed using : " + urls[1])
                UrlFetchApp.fetch(urls[1], {muteHttpExceptions: true});
                iUnsubscribed += 1;
                break;
                
              }
            }
          } 
    }
  }

  return iUnsubscribed;
}

function regex_subscription(pBody,pSubject){
  pBody = pBody.replace(/3D"/g,'"');
  pBody = pBody.replace(/=\s/g,'');  
 var urls = pBody.match(/^list\-unsubscribe:(.|\r\n\s)+<(https?:\/\/[^>]+)>/im);
  if (urls) {
    Logger.log("Subject: " + pSubject+ " Unsubscribe link: " + urls[2]);    
    return 1;
  }
  
  urls = pBody.match(/^list\-unsubscribe:(.|\r\n\s)+<mailto:([^>]+)>/im);      
  if (urls) {
    Logger.log("Subject: " + pSubject+ " Unsubscribe email: " + urls[2]);
    return 1;
  }
  
  // Regex to find all hyperlinks
  var hrefs = new RegExp(/<a[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi);
  
  // Iterate through all hyperlinks inside the message
  while ( urls = hrefs.exec(pBody) ) {
    
    // Does the anchor text or hyperlink contain words like unusbcribe or optout
    if (urls[1].match(/unsubscribe|optout|opt\-out|remove/i)
        || urls[2].match(/unsubscribe|optout|opt\-out|remove/i)) {      
      
      Logger.log("Subject: " + pSubject+ " HTML unsubscribe link: " +urls[1]);
      return 1;
    }
  }
  
  return 0;
}

function markLabel(threads) {
  var labelName = userProperties.getProperty("label_subscriptions") || "Subscriptions";
  var label = getLabel(labelName);
  var ADD_LABEL_TO_THREAD_LIMIT = 100
  // addToThreads has a limit of 100 threads. Use batching.
  if (threads.length > ADD_LABEL_TO_THREAD_LIMIT) {
    for (var i = 0; i < Math.ceil(threads.length / ADD_LABEL_TO_THREAD_LIMIT); i++) {
        label.addToThreads(threads.slice(100 * i, 100 * (i + 1)));
    }
  } else {
      label.addToThreads(threads);
  }
}
function archive(threads){
  for (var i=0;i<threads.length;i++){
    threads[i].moveToArchive();
  }
}

function threadHasLabel(thread, labelName) {
  var labels = thread.getLabels();

  for (i = 0; i < labels.length; i++) {
    var label = labels[i];

    if (label.getName() == labelName) {
      return true;
    }
  }

  return false;
}

function isMe(fromAddress) {
  var addresses = getEmailAddresses();
  for (i = 0; i < addresses.length; i++) {
    var address = addresses[i],
        r = RegExp(address, 'i');

    if (r.test(fromAddress)) {
      return true;
    }
  }

  return false;
}
function getEmailAddresses() {
  // Cache email addresses to cut down on API calls.
  if (!this.emails) {    
    var me = Session.getActiveUser().getEmail(),
        emails = GmailApp.getAliases();

    emails.push(me);
    this.emails = emails;    
  }
  return this.emails;
}

function getLabel(labelName) {
  // Cache the labels.
  this.labels = this.labels || {};
  label = this.labels[labelName];

  if (!label) {
    //Logger.log('Could not find cached label "' + labelName + '". Fetching.', this.labels);

    var label = GmailApp.getUserLabelByName(labelName);

    if (label) {
      //Logger.log('Label exists.');
    } else {
      //Logger.log('Label does not exist. Creating it.');
      label = GmailApp.createLabel(labelName);
    }
    this.labels[labelName] = label;
  }
  return label;
}