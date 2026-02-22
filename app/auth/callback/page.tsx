"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(() => router.push("/"));
  }, [router]);

  return <p style={{ padding: 40 }}>Signing you in...</p>;
}