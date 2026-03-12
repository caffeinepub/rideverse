import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import BottomNav, { type TabId } from "./components/BottomNav";
import ProfileSetup from "./components/ProfileSetup";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import AuthScreen from "./pages/AuthScreen";
import Community from "./pages/Community";
import Explore from "./pages/Explore";
import HomeFeed from "./pages/HomeFeed";
import Profile from "./pages/Profile";
import Upload from "./pages/Upload";

const queryClient = new QueryClient();

function AppInner() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const [activeTab, setActiveTab] = useState<TabId>("feed");

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/assets/uploads/23c61684-da61-4fde-b9a5-98d6c83942c0-1.png"
            alt="RideVerse"
            className="w-48 animate-pulse"
          />
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: "oklch(0.72 0.19 50)" }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{
                  duration: 1.2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const showProfileSetup =
    isAuthenticated &&
    !profileLoading &&
    profileFetched &&
    userProfile === null;

  if (showProfileSetup) {
    return <ProfileSetup onComplete={() => {}} />;
  }

  const isFeed = activeTab === "feed";

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.06 0 0)" }}>
      {/* Mobile container */}
      <div
        className="relative mx-auto overflow-hidden"
        style={{
          maxWidth: "430px",
          minHeight: "100svh",
          background: "oklch(0.09 0 0)",
        }}
      >
        {/* Main content area */}
        <main
          className="w-full"
          style={{
            height: "100svh",
            paddingBottom: isFeed ? 0 : "68px",
            overflow: isFeed ? "hidden" : "auto",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: isFeed ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              {activeTab === "feed" && <HomeFeed />}
              {activeTab === "explore" && <Explore />}
              {activeTab === "upload" && <Upload />}
              {activeTab === "community" && <Community />}
              {activeTab === "profile" && <Profile />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom navigation — overlay on feed, normal on other tabs */}
        {isFeed ? (
          <div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full z-50"
            style={{
              maxWidth: "430px",
              background:
                "linear-gradient(to top, oklch(0.04 0 0 / 0.88) 60%, transparent)",
              pointerEvents: "auto",
            }}
          >
            <BottomNav
              active={activeTab}
              onTabChange={setActiveTab}
              transparent
            />
          </div>
        ) : (
          <BottomNav active={activeTab} onTabChange={setActiveTab} />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "oklch(0.14 0 0)",
            border: "1px solid oklch(0.22 0.01 50)",
            color: "oklch(0.97 0 0)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
