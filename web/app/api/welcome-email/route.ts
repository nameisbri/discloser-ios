import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { welcomeEmail } from "@/lib/emails/welcome-email";

// Simple in-memory rate limiting (per user, resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS_PER_WINDOW = 3;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(userId);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  record.count++;
  return false;
}

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

    // Check rate limit per user
    if (isRateLimited(user.id)) {
      return NextResponse.json({ success: true });
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
