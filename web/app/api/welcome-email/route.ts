import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { welcomeEmail } from "@/lib/emails/welcome-email";

export async function POST(req: Request) {
  try {
    // Extract JWT from Authorization header
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create a Supabase client and verify the user's JWT
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.email) {
      // No email on file (e.g. OAuth without email scope) — skip silently
      return NextResponse.json({ success: true });
    }

    // Atomically claim the send slot (prevents duplicate emails from concurrent requests)
    const { data: claimed } = await supabase
      .from("profiles")
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq("id", user.id)
      .is("welcome_email_sent_at", null)
      .select("id")
      .single();

    if (!claimed) {
      // Already sent (or profile not found) — skip
      return NextResponse.json({ success: true });
    }

    // Send welcome email via Titan SMTP
    const transporter = nodemailer.createTransport({
      host: "smtp.titan.email",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const emailContent = welcomeEmail(user.email);
    await transporter.sendMail({
      from: emailContent.from,
      to: emailContent.to,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Welcome email error:", e);
    // Return 200 so the mobile app doesn't see an error — email is non-critical
    return NextResponse.json({ success: true });
  }
}
