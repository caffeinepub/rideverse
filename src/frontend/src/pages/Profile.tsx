import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Film, Grid3X3, Settings, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useGetFollowerCount,
  useGetFollowingCount,
  useGetPostsByUser,
  useUpdateProfile,
  useUploadProfilePhoto,
} from "../hooks/useQueries";

export default function Profile() {
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const userId = identity?.getPrincipal().toString();

  const { data: profile, isLoading: profileLoading } =
    useGetCallerUserProfile();
  const { data: posts = [], isLoading: postsLoading } =
    useGetPostsByUser(userId);
  const { data: followerCount = BigInt(0) } = useGetFollowerCount(userId);
  const { data: followingCount = BigInt(0) } = useGetFollowingCount(userId);

  const updateProfile = useUpdateProfile();
  const uploadPhoto = useUploadProfilePhoto();

  const [editOpen, setEditOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBike, setEditBike] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editBio, setEditBio] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const openEdit = () => {
    if (profile) {
      setEditUsername(profile.username);
      setEditBike(profile.bikeModel);
      setEditCity(profile.city);
      setEditBio(profile.bio);
    }
    setEditOpen(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let profilePhoto = profile?.profilePhoto;
      if (photoFile) {
        const bytes = new Uint8Array(await photoFile.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes);
        profilePhoto = await uploadPhoto.mutateAsync(blob);
      }
      await updateProfile.mutateAsync({
        username: editUsername.trim(),
        bikeModel: editBike.trim(),
        city: editCity.trim(),
        bio: editBio.trim(),
        profilePhoto,
      });
      toast.success("Profile updated!");
      setEditOpen(false);
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const avatarUrl = photoPreview ?? profile?.profilePhoto?.getDirectURL();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-24">
        {/* Profile header */}
        <div
          className="relative px-4 pt-8 pb-6"
          style={{
            background:
              "radial-gradient(ellipse 100% 80% at 50% -20%, oklch(0.70 0.19 50 / 0.08) 0%, transparent 70%)",
          }}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              {profileLoading ? (
                <Skeleton className="w-20 h-20 rounded-full" />
              ) : (
                <Avatar
                  className="w-20 h-20 border-2"
                  style={{ borderColor: "oklch(0.72 0.19 50)" }}
                >
                  {avatarUrl && <AvatarImage src={avatarUrl} />}
                  <AvatarFallback
                    className="font-heading font-bold text-2xl"
                    style={{
                      background: "oklch(0.20 0 0)",
                      color: "oklch(0.72 0.19 50)",
                    }}
                  >
                    {(profile?.username ?? "R").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            <div className="flex-1">
              {profileLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <h2 className="font-heading font-bold text-xl text-foreground">
                    @{profile?.username ?? "rider"}
                  </h2>
                  <p
                    className="text-sm"
                    style={{ color: "oklch(0.72 0.19 50)" }}
                  >
                    {profile?.bikeModel}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {profile?.city}
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                data-ocid="profile.edit_button"
                size="sm"
                variant="outline"
                onClick={openEdit}
                className="text-xs h-8 px-3"
                style={{
                  borderColor: "oklch(0.30 0 0)",
                  color: "oklch(0.72 0.19 50)",
                }}
              >
                <Settings size={13} className="mr-1" /> Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLogout}
                className="text-xs h-8 px-3 text-muted-foreground hover:text-foreground"
              >
                Sign Out
              </Button>
            </div>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Stats */}
          <div
            className="flex items-center justify-around mt-4 py-3 rounded-xl"
            style={{
              background: "oklch(0.13 0 0)",
              border: "1px solid oklch(0.20 0 0)",
            }}
          >
            <div className="text-center">
              <p className="font-heading font-bold text-lg text-foreground">
                {posts.length}
              </p>
              <p className="text-xs text-muted-foreground">Rides</p>
            </div>
            <div
              className="w-px h-8"
              style={{ background: "oklch(0.22 0 0)" }}
            />
            <div className="text-center">
              <p className="font-heading font-bold text-lg text-foreground">
                {Number(followerCount)}
              </p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div
              className="w-px h-8"
              style={{ background: "oklch(0.22 0 0)" }}
            />
            <div className="text-center">
              <p className="font-heading font-bold text-lg text-foreground">
                {Number(followingCount)}
              </p>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="px-4">
          <div className="flex items-center gap-2 mb-3">
            <Grid3X3 size={16} style={{ color: "oklch(0.72 0.19 50)" }} />
            <span className="text-sm font-semibold text-foreground">
              My Rides
            </span>
          </div>

          {postsLoading ? (
            <div
              className="grid grid-cols-3 gap-1"
              data-ocid="profile.loading_state"
            >
              {["a", "b", "c", "d", "e", "f"].map((k) => (
                <Skeleton key={k} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div data-ocid="profile.empty_state" className="text-center py-12">
              <Film size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="font-heading font-semibold text-foreground">
                No rides yet
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Upload your first POV ride!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post, i) => (
                <motion.div
                  key={post.id.toString()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="aspect-square rounded-lg overflow-hidden relative"
                  style={{ background: "oklch(0.16 0 0)" }}
                >
                  <video
                    src={post.videoUrl.getDirectURL()}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: "oklch(0.05 0 0 / 0.3)" }}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          data-ocid="profile.dialog"
          className="max-w-sm mx-auto rounded-2xl"
          style={{
            background: "oklch(0.11 0 0)",
            borderColor: "oklch(0.22 0.01 50)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">
              Edit Profile
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            {/* Photo upload */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar
                  className="w-16 h-16 border-2"
                  style={{ borderColor: "oklch(0.72 0.19 50)" }}
                >
                  {(photoPreview ?? avatarUrl) && (
                    <AvatarImage src={photoPreview ?? avatarUrl ?? ""} />
                  )}
                  <AvatarFallback
                    style={{ background: "oklch(0.20 0 0)" }}
                    className="font-heading font-bold text-foreground"
                  >
                    {editUsername.slice(0, 1).toUpperCase() || "R"}
                  </AvatarFallback>
                </Avatar>
                <label
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                  style={{ background: "oklch(0.72 0.19 50)" }}
                >
                  <Camera size={12} className="text-black" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Tap the camera to change your profile photo
              </p>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Username</Label>
              <Input
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="bg-secondary border-border text-foreground mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">
                Bike Model
              </Label>
              <Input
                value={editBike}
                onChange={(e) => setEditBike(e.target.value)}
                className="bg-secondary border-border text-foreground mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">City</Label>
              <Input
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                className="bg-secondary border-border text-foreground mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Bio</Label>
              <Textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="bg-secondary border-border text-foreground mt-1 resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="flex-1"
                data-ocid="profile.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateProfile.isPending || uploadPhoto.isPending}
                data-ocid="profile.save_button"
                className="flex-1 font-semibold"
                style={{ background: "oklch(0.72 0.19 50)", color: "black" }}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
