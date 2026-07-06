import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHidden = searchParams.get("includeHidden") === "true";
    const supabase = await createClient();

    let query = supabase
      .from("lands")
      .select("*")
      .eq("is_active", true);

    if (!includeHidden) {
      query = query.eq("hidden_from_operator", false);
    }

    const { data: lands, error } = await query.order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(lands ?? []);
  } catch (error) {
    console.error("Lands GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;

    if (!name) {
      return NextResponse.json(
        { error: "Land name is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: newLand, error } = await supabase
      .from("lands")
      .insert({
        name,
        description,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(newLand, { status: 201 });
  } catch (error) {
    console.error("Lands POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;

    if (!id) {
      return NextResponse.json(
        { error: "Land ID is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Land name is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: updatedLand, error } = await supabase
      .from("lands")
      .update({
        name,
        description,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updatedLand);
  } catch (error) {
    console.error("Lands PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const hiddenFromOperator = body.hidden_from_operator;

    if (!id) {
      return NextResponse.json(
        { error: "Land ID is required" },
        { status: 400 }
      );
    }

    if (typeof hiddenFromOperator !== "boolean") {
      return NextResponse.json(
        { error: "Hidden from operator must be a boolean" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: updatedLand, error } = await supabase
      .from("lands")
      .update({
        hidden_from_operator: hiddenFromOperator,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updatedLand);
  } catch (error) {
    console.error("Lands PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Land ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("lands")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Land deleted successfully",
    });
  } catch (error) {
    console.error("Lands DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
