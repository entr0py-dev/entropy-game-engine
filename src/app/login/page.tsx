"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// --- CONFIG ---
// REPLACE THIS with your actual Framer URL
const FRAMER_HOME_URL = "https://www.entropyofficial.com"; 

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // FIX: Redirect to Framer Home instead of local placeholder
      window.location.href = FRAMER_HOME_URL;
    }
  }

  return (
    // Added solid background color so login page isn't transparent
    <div className="flex flex-col items-center justify-center h-screen gap-4 bg-[#008080]">
      <h1 className="text-3xl font-bold text-white">Entropy OS Login</h1>

      <input
        className="border p-2 rounded w-72 text-black"
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        className="border p-2 rounded w-72 text-black"
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      {error && <p className="text-red-500 bg-black p-2">{error}</p>}

      <button
        onClick={handleLogin}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded border-2 border-white shadow-[4px_4px_0_black] active:translate-y-1 active:shadow-none"
      >
        {loading ? "Accessing..." : "Login"}
      </button>

      <a href="/signup" className="text-white underline text-sm">
        Create an account
      </a>
    </div>
  );
}
