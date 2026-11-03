/* GitHub Actions scheduled sender. The service account and VAPID private key
 * are GitHub Actions Secrets ONLY -- never commit them to this repository. */
'use strict';
const admin = require('firebase-admin');
const webpush = require('web-push');
const crypto = require('node:crypto');

const PROJECT='koutama-jikan-1692d';
const ROOM='koutama-couple-v1';
const ALLOWED_UIDS=new Set(['h6laPpE3T7SYsdr09PmWEvwzbQH2','yCYHhxISJjeacBy26M015oVv16y2']);
const VAPID_PUBLIC=process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE=process.env.VAPID_PRIVATE_KEY;
if(!process.env.FIREBASE_SERVICE_ACCOUNT_JSON || !VAPID_PUBLIC || !VAPID_PRIVATE) {
 throw new Error('GitHub Secrets: FIREBASE_SERVICE_ACCOUNT_JSON, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY が必要です');
}
const serviceAccount=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
if(serviceAccount.project_id!==PROJECT)throw new Error('サービスアカウントのFirebaseプロジェクトが一致しません');
admin.initializeApp({credential:admin.credential.cert(serviceAccount)});
const db=admin.firestore();
webpush.setVapidDetails('https://zou-bit222.github.io',VAPID_PUBLIC,VAPID_PRIVATE);
const room=db.collection('coupleRooms').doc(ROOM);
const LEADS=new Set([5,10,15,30,60]);
const MAX_LATENESS_MS=7*60*1000;
const MAX_EVENTS=300;
const formatId=(eventId,lead,uid)=>crypto.createHash('sha256').update([eventId,lead,uid].join('|')).digest('hex');
async function main(){
 const now=Date.now();
 const [evSnap,deviceSnap]=await Promise.all([
   room.collection('events').limit(MAX_EVENTS).get(),
   room.collection('pushDevices').get()
 ]);
 const devices=deviceSnap.docs.map(d=>d.data()).filter(d=>
   ALLOWED_UIDS.has(d.ownerUid) &&
   typeof d.endpoint==='string' &&
   typeof d.keys?.p256dh==='string' && typeof d.keys?.auth==='string'
 );
 console.log(`予定 ${evSnap.size} 件・端末 ${devices.length} 台を確認`);
 let total=0,fail=0;
 for(const doc of evSnap.docs){
  const e=doc.data();if(!Number.isFinite(e.at)||typeof e.name!=='string')continue;
  const leads=Array.isArray(e.leads)?e.leads.filter(n=>LEADS.has(n)):[15,30];
  for(const lead of new Set(leads)){
   const due=e.at-lead*60000, lateness=now-due;
   if(lateness<0 || lateness>MAX_LATENESS_MS)continue;
   for(const device of devices){
    const receipt=room.collection('pushSent').doc(formatId(doc.id,lead,device.ownerUid));
    if((await receipt.get()).exists)continue;
    const body=`${e.name.slice(0,80)}まであと${lead}分。予定を確認してね。`;
    const payload=JSON.stringify({title:'こうたま時間',body,tag:doc.id+'-'+lead});
    try{
     // A successful push service acceptance is recorded, not guaranteed device delivery.
     await webpush.sendNotification({endpoint:device.endpoint,keys:device.keys},payload,{TTL:900,urgency:'high'});
     await receipt.set({eventId:doc.id,lead,uid:device.ownerUid,due,acceptedAt:admin.firestore.FieldValue.serverTimestamp()});
     total++;console.log(`送信受付: event=${doc.id}, ${lead}m, device=${device.ownerUid.slice(0,6)}…`);
    }catch(err){
     fail++;
     console.error(`通知送信失敗: event=${doc.id}, ${lead}m, HTTP=${err?.statusCode||'unknown'}, ${err.message}`);
    }
   }
  }
 }
 console.log(`送信受付 ${total} 件 / 失敗 ${fail} 件`);
 if(fail)process.exitCode=1;
}
main().catch(err=>{console.error(err);process.exitCode=1});
