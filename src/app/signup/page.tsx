"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// The destination after clicking the email link
const FRAMER_HOME = "https://www.entropyofficial.com";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); // New state for success message

  async function handleSignup() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Critical: Redirects user to Framer after they click the email link
        emailRedirectTo: FRAMER_HOME,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Create profile immediately (redundant if you have the SQL trigger, but safe)
      if (data.user) {
        const safeName = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
        await supabase.from("profiles").insert({
          id: data.user.id,
          username: safeName,
          avatar: "default",
          entrobucks: 0,
          xp: 0,
          level: 1,
        }).select(); // .select() prevents some silent errors
      }
      
      setSuccess(true);
      setLoading(false);
    }
  }

  // --- RENDER SUCCESS MESSAGE ---
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6 bg-[#008080] text-white text-center p-4">
        <div className="bg-black/50 p-8 rounded-lg border-2 border-white shadow-[4px_4px_0_black]">
          <h1 className="text-3xl font-bold mb-4 font-mono text-[#00FF99]">SIGNAL RECEIVED</h1>
          <p className="text-lg mb-6">
            A verification link has been sent to <strong>{email}</strong>.
          </p>
          <p className="text-sm opacity-80 mb-6">
            Please check your inbox (and spam folder) to activate your account.
            <br />
            You will be redirected to the ENTROVERSE upon verification.
          </p>
          <a 
            href="/login" 
            className="inline-block bg-white text-black px-6 py-2 rounded font-bold hover:bg-gray-200 transition-colors"
          >
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  // --- RENDER SIGNUP FORM ---
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 bg-[#008080]">
      <h1 className="text-3xl font-bold text-white font-mono">Create Account</h1>

      <div className="flex flex-col gap-4">
        <input
          className="border p-2 rounded w-72 text-black"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border p-2 rounded w-72 text-black"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-red-500 bg-black p-2 border border-red-500 rounded max-w-xs text-center">
          {error}
        </p>
      )}

      <button
        onClick={handleSignup}
        disabled={loading}
        className="bg-green-600 text-white px-6 py-2 rounded border-2 border-white shadow-[4px_4px_0_black] font-bold active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Registering..." : "Sign Up"}
      </button>

      <a href="/login" className="text-white underline text-sm mt-2 hover:text-[#00FF99]">
        Already have an account? Login
      </a>
    </div>
  );
}
