import { Compass, Home, Upload, User, Users } from "lucide-react";
import { motion } from "motion/react";

export type TabId = "feed" | "explore" | "upload" | "community" | "profile";

const TABS: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: "feed", label: "Home", icon: Home },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "upload", label: "Upload", icon: Upload },
  { id: "community", label: "Rides", icon: Users },
  { id: "profile", label: "Profile", icon: User },
];

interface BottomNavProps {
  active: TabId;
  onTabChange: (tab: TabId) => void;
  transparent?: boolean;
}

export default function BottomNav({
  active,
  onTabChange,
  transparent,
}: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50"
      style={{
        background: transparent
          ? "transparent"
          : "linear-gradient(to top, oklch(0.07 0 0), oklch(0.09 0 0 / 0.97))",
        borderTop: transparent ? "none" : "1px solid oklch(0.22 0.01 50)",
        backdropFilter: transparent ? undefined : "blur(20px)",
      }}
    >
      <div className="flex items-center justify-around px-2 pb-safe">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          const isUpload = tab.id === "upload";
          return (
            <button
              type="button"
              key={tab.id}
              data-ocid={`nav.${tab.id === "feed" ? "home" : tab.id}_tab`}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center justify-center gap-0.5 py-3 px-4 min-w-[48px] transition-all duration-200"
            >
              {isUpload ? (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center justify-center w-12 h-12 rounded-full glow-orange-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.22 25))",
                  }}
                >
                  <Icon size={22} className="text-black" strokeWidth={2.5} />
                </motion.div>
              ) : (
                <>
                  <motion.div
                    animate={{ scale: isActive ? 1.1 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.2 : 1.8}
                      style={{
                        color: isActive
                          ? "oklch(0.72 0.19 50)"
                          : transparent
                            ? "oklch(0.80 0 0)"
                            : "oklch(0.55 0 0)",
                      }}
                    />
                  </motion.div>
                  {isActive && (
                    <motion.div
                      layoutId="nav-dot"
                      className="w-1 h-1 rounded-full"
                      style={{ background: "oklch(0.72 0.19 50)" }}
                    />
                  )}
                  <span
                    className="text-[10px] font-medium"
                    style={{
                      color: isActive
                        ? "oklch(0.72 0.19 50)"
                        : transparent
                          ? "oklch(0.75 0 0)"
                          : "oklch(0.45 0 0)",
                    }}
                  >
                    {tab.label}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
