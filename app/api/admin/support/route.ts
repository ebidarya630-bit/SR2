import {NextResponse} from "next/server";
import {randomUUID} from "node:crypto";
import {getSession} from "@/lib/auth";
import {all,first,run} from "@/lib/db";
export const runtime="nodejs";
async function admin(){const user=await getSession();return user?.role==="admin"?user:null;}
export async function GET(){const user=await admin();if(!user)return NextResponse.json({error:"Forbidden"},{status:403});
 const tickets=await all("SELECT t.id,t.subject,t.status,t.priority,t.created_at createdAt,u.email creatorEmail,b.display_name brandName,(SELECT body FROM support_messages m WHERE m.ticket_id=t.id AND m.internal_note=0 ORDER BY m.created_at DESC LIMIT 1) lastMessage FROM support_tickets t JOIN users u ON u.id=t.created_by LEFT JOIN brands b ON b.id=t.brand_id ORDER BY CASE t.status WHEN 'open' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,t.created_at DESC LIMIT 200");
 return NextResponse.json({tickets});
}
export async function POST(request:Request){const user=await admin();if(!user)return NextResponse.json({error:"Forbidden"},{status:403});
 try{const body=await request.json();const ticketId=String(body.ticketId??"");const message=String(body.message??"").trim().slice(0,5000);const internal=body.internalNote===true?1:0;if(!ticketId||!message)return NextResponse.json({error:"Ticket and message are required."},{status:400});
 const ticket=await first<{id:string}>("SELECT id FROM support_tickets WHERE id=?",ticketId);if(!ticket)return NextResponse.json({error:"Ticket not found."},{status:404});
 await run("INSERT INTO support_messages(id,ticket_id,sender_id,body,internal_note) VALUES(?,?,?,?,?)",randomUUID(),ticketId,user.id,message,internal);
 if(!internal)await run("UPDATE support_tickets SET status='pending' WHERE id=?",ticketId);
 await run("INSERT INTO admin_audit_logs(admin_id,action,target_type,target_id,details) VALUES(?,?,?,?,?)",user.id,"support_reply_sent","support_ticket",ticketId,JSON.stringify({internalNote:!!internal}));
 return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Unable to send support reply."},{status:400});}}
export async function PATCH(request:Request){const user=await admin();if(!user)return NextResponse.json({error:"Forbidden"},{status:403});
 try{const body=await request.json();const id=String(body.ticketId??"");const status=String(body.status??"");if(!id||!["open","pending","closed"].includes(status))return NextResponse.json({error:"Invalid ticket status."},{status:400});
 const r=await run("UPDATE support_tickets SET status=? WHERE id=?",status,id);if(!(r.meta.changes??0))return NextResponse.json({error:"Ticket not found."},{status:404});
 await run("INSERT INTO admin_audit_logs(admin_id,action,target_type,target_id,details) VALUES(?,?,?,?,?)",user.id,"support_status_changed","support_ticket",id,JSON.stringify({status}));return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Unable to update ticket."},{status:400});}}
