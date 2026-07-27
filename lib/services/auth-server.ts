import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface UserProfile {
  user: any | null;
  role: "admin" | "operator" | null;
  landId: string | null;
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { user: null, role: null, landId: null };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, land_id")
      .eq("id", user.id)
      .single();

    return {
      user,
      role: (profile?.role as "admin" | "operator") ?? null,
      landId: profile?.land_id ?? null,
    };
  } catch (err) {
    console.error("Error fetching current user profile:", err);
    return { user: null, role: null, landId: null };
  }
}

/**
 * Helper terpusat untuk memvalidasi autentikasi & hak akses (role) di server (API Routes / Actions).
 */
export async function validateUserRole(allowedRoles?: ("admin" | "operator")[]) {
  const profile = await getCurrentUserProfile();

  if (!profile.user) {
    return {
      profile: null,
      errorResponse: NextResponse.json(
        { error: "Unauthorized: Silakan login terlebih dahulu" },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!profile.role || !allowedRoles.includes(profile.role)) {
      return {
        profile,
        errorResponse: NextResponse.json(
          { error: "Forbidden: Anda tidak memiliki hak akses untuk tindakan ini" },
          { status: 403 }
        ),
      };
    }
  }

  return {
    profile,
    errorResponse: null,
  };
}

/**
 * Validasi role khusus Admin
 */
export async function requireAdmin() {
  return validateUserRole(["admin"]);
}

/**
 * Validasi role Admin atau Operator
 */
export async function requireAdminOrOperator() {
  return validateUserRole(["admin", "operator"]);
}

/**
 * Validasi pengguna terautentikasi (semua role yang login)
 */
export async function requireAuthenticatedUser() {
  return validateUserRole();
}
