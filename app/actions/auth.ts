"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(state: any, formData: FormData) {
  const usernameOrEmail = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!usernameOrEmail || !password) {
    return { error: "Username dan password wajib diisi." };
  }

  // Internally format username to email if it does not contain '@'
  const email = usernameOrEmail.includes("@")
    ? usernameOrEmail.trim().toLowerCase()
    : `${usernameOrEmail.trim().toLowerCase()}@futaba.co.id`;

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    let errorMsg = authError.message;
    if (errorMsg === "Invalid login credentials") {
      errorMsg = "Username atau password salah.";
    }
    return { error: errorMsg };
  }

  const user = authData.user;
  if (!user) {
    return { error: "User tidak ditemukan." };
  }

  // Ambil role dari tabel profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { success: true, redirectUrl: "/operator" };
  }

  const role = profile.role;
  const redirectUrl = role === "admin" ? "/admin" : "/operator";

  return { success: true, redirectUrl };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
