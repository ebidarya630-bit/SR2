import {NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {getSession} from "@/lib/auth";
import {all,first,run} from "@/lib/db";
export const runtime="nodejs";
export async function GET(){
 const user=await getSession();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const tickets=await all("SELECT DISTINCT t.id,t.brand_id brandId,t.subject,t.status,t.priority,t.created_at createdAt,(SELECT count(*) FROM support_messages m WHERE m.ticket_id=t.id AND m.internal_note=0) messageCount,(SELECT body FROM support_messages m WHERE m.ticket_id=t.id AND m.internal_note=0 ORDER BY m.created_at DESC LIMIT 1) lastMessage FROM support_tickets t LEFT JOIN brand_members bm ON bm.brand_id=t.brand_id WHERE t.created_by=? OR bm.user_id=? ORDER BY t.created_at DESC LIMIT 100",user.id,user.id);
 return NextResponse.json({tickets});
}
export async function POST(request:Request){
 const user=await getSession();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const body=await request.json();const ticketId=String(body.ticketId??"");const subject=String(body.subject??"").trim().slice(0,180);const message=String(body.message??"").trim().slice(0,5000);const brandId=String(body.brandId??"");
  if(!message)return NextResponse.json({error:"Write a message before sending."},{status:400});
  if(ticketId){
   const ticket=await first("SELECT t.id FROM support_tickets t LEFT JOIN brand_members bm ON bm.brand_id=t.brand_id WHERE t.id=? AND (t.created_by=? OR bm.user_id=?) AND t.status<>'closed'",ticketId,user.id,user.id);
   if(!ticket)return NextResponse.json({error:"Ticket not found, closed or inaccessible."},{status:404});
   await run("INSERT INTO support_messages(id,ticket_id,sender_id,body,internal_note) VALUES(?,?,?,?,0)",randomUUID(),ticketId,user.id,message);
   return NextResponse.json({ok:true,message:"Reply sent."});
  }
  if(!subject)return NextResponse.json({error:"A subject is required for a new ticket."},{status:400});
  if(brandId){const member=await first("SELECT 1 AS found FROM brand_members WHERE brand_id=? AND user_id=?",brandId,user.id);if(!member)return NextResponse.json({error:"You do not have access to this company."},{status:403});}
  const id=randomUUID();
  await run("INSERT INTO support_tickets(id,created_by,brand_id,subject) VALUES(?,?,?,?)",id,user.id,brandId||null,subject);
  await run("INSERT INTO support_messages(id,ticket_id,sender_id,body,internal_note) VALUES(?,?,?,?,0)",randomUUID(),id,user.id,message);
  if(brandId)await run("INSERT INTO brand_activity_logs(id,brand_id,actor_user_id,action,details) VALUES(?,?,?,'support_ticket_created',?)",randomUUID(),brandId,user.id,JSON.stringify({ticketId:id,subject}));
  return NextResponse.json({ok:true,ticketId:id,message:"Support ticket created."});
 }catch{return NextResponse.json({error:"Unable to process support request."},{status:400});}
}
