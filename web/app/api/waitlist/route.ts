import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Simple in-memory rate limiting (per IP, resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
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
    // Get IP for rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    
    // Check rate limit
    if (isRateLimited(ip)) {
      // Return success to not reveal rate limiting to bots
      return NextResponse.json({ success: true });
    }

    const body = await req.json();
    const { email, website, loadTime } = body;

    // Honeypot check - if "website" field is filled, it's a bot
    if (website) {
      // Silently reject but return success to fool the bot
      return NextResponse.json({ success: true });
    }

    // Time-based check - if form submitted in under 2 seconds, likely a bot
    const timeSinceLoad = Date.now() - (loadTime || 0);
    if (!loadTime || timeSinceLoad < 2000) {
      // Silently reject but return success to fool the bot
      return NextResponse.json({ success: true });
    }

    // Email validation
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    
    // More robust email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower) || emailLower.length > 254) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Block disposable email domains (common spam sources)
    const disposableDomains = [
      "tempmail.com", "throwaway.com", "mailinator.com", "guerrillamail.com",
      "10minutemail.com", "fakeinbox.com", "trashmail.com", "getnada.com",
      "temp-mail.org", "mohmal.com", "emailondeck.com", "tempail.com"
    ];
    const emailDomain = emailLower.split("@")[1];
    if (disposableDomains.includes(emailDomain)) {
      return NextResponse.json({ success: true }); // Silent reject
    }

    const { error } = await supabase
      .from("waitlist")
      .insert({ email: emailLower, source: "landing" });

    if (error) {
      // Duplicate email - still return success (don't reveal they're already signed up)
      if (error.code === "23505") {
        return NextResponse.json({ success: true });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Waitlist error:", e);
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }
}
