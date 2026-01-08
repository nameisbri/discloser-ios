import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const { error } = await supabase
      .from("waitlist")
      .insert({ email, source: "landing" });

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
