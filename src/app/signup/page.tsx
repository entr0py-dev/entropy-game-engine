"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/context/ToastContext";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function handleSignup() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signUp({
  email,
  password,
});

if (!error && data.user) {
  // Create a profile record
  await supabase.from("profiles").insert({
    id: data.user.id,
    username: email.split("@")[0], // temporary username
  });
}


    if (error) {
      setError(error.message);
    } else {
      showToast("Check your email to confirm your account!", "info");
      window.location.href = "/login";
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-3xl font-bold">Create Account</h1>

      <input
        className="border p-2 rounded w-72"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="border p-2 rounded w-72"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="text-red-500">{error}</p>}

      <button
        onClick={handleSignup}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Creating..." : "Sign Up"}
      </button>

      <a href="/login" className="text-blue-500 underline">
        Already have an account?
      </a>
    </div>
  );
}
