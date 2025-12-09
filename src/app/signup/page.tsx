"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const FRAMER_HOME = "https://www.entropyofficial.com";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: FRAMER_HOME,
      },
    });

    if (error) {
      // --- DUPLICATE ACCOUNT DETECTION ---
      // Supabase typically returns "User already registered"
      if (error.message.includes("already registered") || error.status === 400) {
        setError("This frequency is already occupied. (Account exists)");
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      // Check if user identity exists (sometimes Supabase returns no error but no user for duplicates depending on config)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
         setError("This frequency is already occupied. (Account exists)");
         setLoading(false);
         return;
      }

      // Create profile (Safe due to SQL trigger, but kept for redundancy)
      if (data.user) {
        const safeName = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
        await supabase.from("profiles").insert({
          id: data.user.id,
          username: safeName,
          avatar: "default",
          entrobucks: 0,
          xp: 0,
          level: 1,
        }).select();
      }
      
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6 bg-[#008080] text-white text-center p-4">
        <div className="bg-black/50 p-8 rounded-lg border-2 border-white shadow-[4px_4px_0_black]">
          <h1 className="text-3xl font-bold mb-4 font-mono text-[#00FF99]">SIGNAL RECEIVED</h1>
          <p className="text-lg mb-6">A verification link has been sent to <strong>{email}</strong>.</p>
          <a href="/login" className="inline-block bg-white text-black px-6 py-2 rounded font-bold hover:bg-gray-200 transition-colors">Return to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 bg-[#008080]">
      <h1 className="text-3xl font-bold text-white font-mono">Create Account</h1>
      <div className="flex flex-col gap-4">
        <input className="border p-2 rounded w-72 text-black" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="border p-2 rounded w-72 text-black" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      
      {error && (
        <div className="bg-black p-3 border border-red-500 rounded max-w-xs text-center">
          <p className="text-red-500 font-bold text-sm">{error}</p>
          {error.includes("occupied") && (
             <a href="/login" className="text-white underline text-xs mt-2 block hover:text-[#00FF99]">Log in here instead</a>
          )}
        </div>
      )}

      <button onClick={handleSignup} disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded border-2 border-white shadow-[4px_4px_0_black] font-bold active:translate-y-1 active:shadow-none transition-all disabled:opacity-50">
        {loading ? "Registering..." : "Sign Up"}
      </button>

      <a href="/login" className="text-white underline text-sm mt-2 hover:text-[#00FF99]">Already have an account? Login</a>
    </div>
  );
}
