import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: lands, error } = await supabase
      .from("lands")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(lands ?? []);
  } catch (error) {
    console.error("Lands GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
