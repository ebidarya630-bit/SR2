import {NextResponse} from "next/server";
import {getSession} from "@/lib/auth";
import {all,first} from "@/lib/db";
export const runtime="nodejs";
export async function GET(request:Request){
 const user=await getSession();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const id=new URL(request.url).searchParams.get("id")||"";
 const ticket=await first("SELECT t.id,t.brand_id brandId,t.subject,t.status,t.priority,t.created_at createdAt FROM support_tickets t LEFT JOIN brand_members bm ON bm.brand_id=t.brand_id WHERE t.id=? AND (t.created_by=? OR bm.user_id=?)",id,user.id,user.id);
 if(!ticket)return NextResponse.json({error:"Ticket not found."},{status:404});
 const messages=await all("SELECT m.id,m.body,m.created_at createdAt,m.sender_id senderId,u.username,u.email FROM support_messages m JOIN users u ON u.id=m.sender_id WHERE m.ticket_id=? AND m.internal_note=0 ORDER BY m.created_at ASC",id);
 return NextResponse.json({ticket,messages});
}
