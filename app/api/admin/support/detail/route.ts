import {NextResponse} from "next/server";
import {getSession} from "@/lib/auth";
import {all,first} from "@/lib/db";
export const runtime="nodejs";
export async function GET(request:Request){const user=await getSession();if(!user||user.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});
 const id=new URL(request.url).searchParams.get("id")||"";const ticket=await first("SELECT id FROM support_tickets WHERE id=?",id);if(!ticket)return NextResponse.json({error:"Ticket not found."},{status:404});
 const messages=await all("SELECT m.id,m.body,m.internal_note internalNote,m.created_at createdAt,u.email FROM support_messages m JOIN users u ON u.id=m.sender_id WHERE m.ticket_id=? ORDER BY m.created_at ASC",id);return NextResponse.json({messages});}
