import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET - Fetch production reports for a specific land
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const landId = searchParams.get("landId");

    if (!landId) {
      return NextResponse.json(
        { error: "Land ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: reports, error } = await supabase
      .from("production_reports")
      .select("*")
      .eq("land_id", landId)
      .order("report_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching production reports:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(reports ?? []);
  } catch (error) {
    console.error("Production reports GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Submit a new production report with updated fields
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      land_id,
      report_date,
      shift,
      operator_name,
      start_time,
      end_time,
      part_number,
      qty,
      ng_qty,
      ng_category,
      break_minutes,
    } = body;

    // Validate required fields
    if (
      !land_id ||
      !report_date ||
      !shift ||
      !operator_name ||
      !start_time ||
      !end_time ||
      !part_number ||
      typeof qty === "undefined" ||
      typeof ng_qty === "undefined" ||
      typeof break_minutes === "undefined"
    ) {
      return NextResponse.json(
        { error: "Beberapa field wajib belum terisi" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("production_reports")
      .insert({
        land_id,
        report_date,
        shift,
        operator_name: operator_name.trim(),
        start_time,
        end_time,
        part_number: part_number.trim(),
        qty: parseInt(qty) || 0,
        ng_qty: parseInt(ng_qty) || 0,
        ng_category: ng_category ? ng_category.trim() : null,
        break_minutes: parseInt(break_minutes) || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating production report:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Production reports POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
