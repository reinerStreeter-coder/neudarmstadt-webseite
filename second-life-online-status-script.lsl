// Neudarmstadt Online-Status Script fuer Second Life
// In ein Objekt in Second Life legen.
// Wichtig: localhost funktioniert nicht. Die Webseite muss oeffentlich erreichbar sein.

string SERVER_URL = "https://DEINE-DOMAIN.de/api/sl-status";
string SECRET = "neudarmstadt-status-2026";

list AVATARS = [
"Jayden Mercury","70b14dcd-628b-4d00-b6cc-7a3d5e1fe78c",
"Atriata","2547bfa8-8c31-409d-ac6b-66b7b87ee9d8",
"Novadien","19142569-ce4a-44f0-a722-9be5148ee5a7",
"Katarina Ballinger","0962da00-9827-4d47-9b80-9aa3a7dbde25",
"Reiner Streeter","5258e13e-54b7-4e8a-bcf2-1f175eae95cb",
"Nani Martinek-Uggla","21b335c9-f609-400a-acae-ecb5469eaf83"
];

integer index = 0;
key currentUUID;

default
{
    state_entry(){ llSetTimerEvent(60.0); llOwnerSay("Neudarmstadt Online-Status gestartet."); }
    timer(){
        if(index >= llGetListLength(AVATARS)) index = 0;
        currentUUID = (key)llList2String(AVATARS, index + 1);
        llRequestAgentData(currentUUID, DATA_ONLINE);
        index += 2;
    }
    dataserver(key queryid, string data){
        string body = llList2Json(JSON_OBJECT, ["secret", SECRET, "uuid", (string)currentUUID, "online", (integer)data]);
        llHTTPRequest(SERVER_URL, [HTTP_METHOD, "POST", HTTP_MIMETYPE, "application/json"], body);
    }
}
