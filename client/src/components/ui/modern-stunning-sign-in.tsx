"use client";

import * as React from "react";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";

export interface ModernAuthProps {
  onSignIn?: (credentials: { email: string; password: string }) => void | Promise<void>;
  onSignUp?: (data: { name: string; email: string; password: string }) => void | Promise<boolean | void>;
  onGoogleSignIn?: () => void;
  serverError?: string;
  serverSuccess?: string;
  isSubmitting?: boolean;
  initialMode?: "signin" | "signup";
}

const SignIn1: React.FC<ModernAuthProps> = ({
  onSignIn,
  onSignUp,
  onGoogleSignIn,
  serverError,
  serverSuccess,
  isSubmitting = false,
  initialMode = "signin",
}) => {
  const [mode, setMode] = React.useState<"signin" | "signup">(initialMode);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const isSignUp = mode === "signup";

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const switchMode = (newMode: "signin" | "signup") => {
    setMode(newMode);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignUp && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    if (!validateEmail(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (isSignUp && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (isSignUp) {
      if (onSignUp) {
        const result = await onSignUp({ name: name.trim(), email: email.trim(), password });
        if (result === true) {
          // Switch to sign in mode after successful signup
          setMode("signin");
          setPassword("");
        }
      } else {
        alert("Sign up successful! (Demo)");
      }
    } else {
      if (onSignIn) {
        await onSignIn({ email: email.trim(), password });
      } else {
        alert("Sign in successful! (Demo)");
      }
    }
  };

  const handleGoogleClick = () => {
    if (onGoogleSignIn) {
      onGoogleSignIn();
    } else {
      window.location.href = "http://localhost:5000/auth/google/login";
    }
  };

  const activeError = serverError || error;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#121212] relative overflow-hidden w-full rounded-xl p-4">
      {/* Centered glass card */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-r from-[#ffffff10] to-[#121212] backdrop-blur-sm shadow-2xl p-8 flex flex-col items-center border border-white/10 transition-all duration-300">
        {/* Logo */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-5 shadow-lg text-white">
          <ShieldCheck className="w-6 h-6 text-sky-400" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-white mb-1 text-center">
          {isSignUp ? "Create an account" : "Welcome back"}
        </h2>
        <p className="text-xs text-gray-400 mb-6 text-center">
          {isSignUp
            ? "Enter your details to get started"
            : "Enter your credentials to access your account"}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4">
          <div className="w-full flex flex-col gap-3">
            {isSignUp && (
              <input
                placeholder="Full Name"
                type="text"
                value={name}
                className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 border border-white/5 transition"
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                autoComplete="name"
              />
            )}
            <input
              placeholder="Email"
              type="email"
              value={email}
              className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 border border-white/5 transition"
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              autoComplete="email"
            />
            <input
              placeholder="Password"
              type="password"
              value={password}
              className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 border border-white/5 transition"
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />

            {serverSuccess && (
              <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg text-center">
                {serverSuccess}
              </div>
            )}

            {activeError && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg text-center">
                {activeError}
              </div>
            )}
          </div>

          <hr className="opacity-10" />

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white/10 text-white font-medium px-5 py-3 rounded-full shadow hover:bg-white/20 transition mb-3 text-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting
                ? isSignUp
                  ? "Creating account..."
                  : "Signing in..."
                : isSignUp
                ? "Create account"
                : "Sign in"}
            </button>

            {/* Google Sign In / Sign Up */}
            <button
              type="button"
              onClick={handleGoogleClick}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-b from-[#232526] to-[#2d2e30] rounded-full px-5 py-3 font-medium text-white shadow hover:brightness-110 transition mb-3 text-sm cursor-pointer border border-white/5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Mode Switcher */}
            <div className="w-full text-center mt-2">
              <span className="text-xs text-gray-400">
                {isSignUp ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signin")}
                      className="underline text-white/80 hover:text-white cursor-pointer bg-transparent border-none p-0 inline font-medium"
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signup")}
                      className="underline text-white/80 hover:text-white cursor-pointer bg-transparent border-none p-0 inline font-medium"
                    >
                      Sign up, it&apos;s free!
                    </button>
                  </>
                )}
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export { SignIn1 };

export default SignIn1;
