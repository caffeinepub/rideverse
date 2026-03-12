import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bike, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveProfile } from "../hooks/useQueries";

interface ProfileSetupProps {
  onComplete: () => void;
}

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [username, setUsername] = useState("");
  const [bikeModel, setBikeModel] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const { mutateAsync, isPending } = useSaveProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !bikeModel.trim() || !city.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await mutateAsync({
        username: username.trim(),
        bikeModel: bikeModel.trim(),
        city: city.trim(),
        bio: bio.trim(),
      });
      toast.success("Welcome to RideVerse!");
      onComplete();
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-auth p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 glow-orange"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.22 25))",
            }}
          >
            <Bike size={32} className="text-black" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Set Up Your Profile
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Let the rider community know you
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-sm text-muted-foreground">
              Username *
            </Label>
            <Input
              id="username"
              placeholder="@speed_demon"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-secondary border-border text-foreground h-11"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bike" className="text-sm text-muted-foreground">
              Bike Model *
            </Label>
            <Input
              id="bike"
              placeholder="Ducati Panigale V4"
              value={bikeModel}
              onChange={(e) => setBikeModel(e.target.value)}
              className="bg-secondary border-border text-foreground h-11"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-sm text-muted-foreground">
              City *
            </Label>
            <Input
              id="city"
              placeholder="Los Angeles, CA"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-secondary border-border text-foreground h-11"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio" className="text-sm text-muted-foreground">
              Bio
            </Label>
            <Textarea
              id="bio"
              placeholder="Born to ride, forced to work..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-secondary border-border text-foreground resize-none"
              rows={3}
            />
          </div>
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 font-heading font-semibold text-base glow-orange-sm"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.22 25))",
              color: "black",
            }}
          >
            {isPending ? (
              <Loader2 size={18} className="mr-2 animate-spin" />
            ) : null}
            {isPending ? "Saving..." : "Join RideVerse"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
