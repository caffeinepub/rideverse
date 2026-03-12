import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, LogIn } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isLoggingIn = loginStatus === "logging-in";
  const isAuthenticated = !!identity;

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error("Login error:", error);
        if (error?.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-auth flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 100% 60% at 50% -10%, oklch(0.70 0.19 50 / 0.12) 0%, transparent 70%),
            radial-gradient(ellipse 80% 50% at 80% 90%, oklch(0.60 0.22 25 / 0.10) 0%, transparent 60%)
          `,
        }}
      />

      {/* Decorative tire track lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
        {["t1", "t2", "t3", "t4", "t5", "t6"].map((k, i) => (
          <div
            key={k}
            className="absolute w-full h-px"
            style={{
              top: `${15 + i * 14}%`,
              background:
                "linear-gradient(90deg, transparent, oklch(0.70 0.19 50), transparent)",
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          >
            <img
              src="/assets/uploads/23c61684-da61-4fde-b9a5-98d6c83942c0-1.png"
              alt="RideVerse"
              className="w-64 mx-auto mb-4"
            />
          </motion.div>
          <p className="text-muted-foreground text-sm tracking-widest uppercase font-medium">
            The Rider's Community
          </p>
        </div>

        {/* Tab toggle */}
        <div
          className="flex rounded-xl p-1 mb-6"
          style={{ background: "oklch(0.14 0 0)" }}
        >
          {(["login", "register"] as const).map((tab) => (
            <button
              type="button"
              key={tab}
              data-ocid={`auth.${tab}_tab`}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                background:
                  activeTab === tab
                    ? "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.22 25))"
                    : "transparent",
                color: activeTab === tab ? "black" : "oklch(0.55 0 0)",
              }}
            >
              {tab === "login" ? "Sign In" : "Join Now"}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === "login" ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === "login" ? 10 : -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl p-6 space-y-4"
            style={{
              background: "oklch(0.12 0 0)",
              border: "1px solid oklch(0.22 0.01 50)",
            }}
          >
            <div className="text-center space-y-2">
              <h2 className="font-heading text-xl font-bold text-foreground">
                {activeTab === "login"
                  ? "Welcome back, Rider"
                  : "Start Your Journey"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {activeTab === "login"
                  ? "Sign in with Internet Identity to continue"
                  : "Create your account and join thousands of riders"}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                data-ocid="auth.submit_button"
                onClick={handleAuth}
                disabled={isLoggingIn}
                className="w-full h-12 font-heading font-semibold text-base glow-orange-sm"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.22 25))",
                  color: "black",
                }}
              >
                {isLoggingIn ? (
                  <Loader2 size={18} className="mr-2 animate-spin" />
                ) : (
                  <LogIn size={18} className="mr-2" />
                )}
                {isLoggingIn
                  ? "Connecting..."
                  : activeTab === "login"
                    ? "Sign In"
                    : "Create Account"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Secured by{" "}
                <span style={{ color: "oklch(0.72 0.19 50)" }}>
                  Internet Identity
                </span>
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-2 gap-3"
        >
          {[
            { emoji: "🏍️", label: "POV Ride Videos" },
            { emoji: "📍", label: "Best Riding Spots" },
            { emoji: "👥", label: "Group Rides" },
            { emoji: "🔥", label: "Rider Community" },
          ].map(({ emoji, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{
                background: "oklch(0.12 0 0)",
                border: "1px solid oklch(0.18 0 0)",
              }}
            >
              <span className="text-lg">{emoji}</span>
              <span className="text-xs text-muted-foreground font-medium">
                {label}
              </span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
