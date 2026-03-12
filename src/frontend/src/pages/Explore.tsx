import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Plus, Star, Upload, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { RidePlace } from "../backend";
import {
  useCreateRidePlace,
  useGetAllRidePlaces,
  useUploadPlacePhoto,
} from "../hooks/useQueries";

const PLACE_IMAGES = [
  "/assets/generated/place-canyon-road.dim_400x300.jpg",
  "/assets/generated/place-coastal-hwy.dim_400x300.jpg",
  "/assets/generated/place-forest-pass.dim_400x300.jpg",
  "/assets/generated/place-desert-hwy.dim_400x300.jpg",
];

const DEMO_PLACES: RidePlace[] = [
  {
    id: BigInt(1),
    name: "Malibu Canyon Road",
    photo: ExternalBlob.fromURL(PLACE_IMAGES[0]),
    location: "Malibu, California",
    averageRating: 4.9,
    description:
      "Twisty canyon roads with ocean views. A legendary SoCal ride favored by sport bike riders.",
    submittedBy: { toString: () => "demo" } as any,
    ratingCount: BigInt(127),
  },
  {
    id: BigInt(2),
    name: "Pacific Coast Highway",
    photo: ExternalBlob.fromURL(PLACE_IMAGES[1]),
    location: "Big Sur, California",
    averageRating: 4.8,
    description:
      "The iconic PCH with dramatic cliffs, ocean views, and endless curves along the California coast.",
    submittedBy: { toString: () => "demo" } as any,
    ratingCount: BigInt(203),
  },
  {
    id: BigInt(3),
    name: "Cascade Loop",
    photo: ExternalBlob.fromURL(PLACE_IMAGES[2]),
    location: "Washington State",
    averageRating: 4.7,
    description:
      "400 miles of forested mountain passes, river valleys, and stunning Pacific Northwest scenery.",
    submittedBy: { toString: () => "demo" } as any,
    ratingCount: BigInt(89),
  },
  {
    id: BigInt(4),
    name: "Death Valley Crossing",
    photo: ExternalBlob.fromURL(PLACE_IMAGES[3]),
    location: "Death Valley, Nevada",
    averageRating: 4.6,
    description:
      "Extreme desert riding through the lowest point in North America. Epic and otherworldly landscape.",
    submittedBy: { toString: () => "demo" } as any,
    ratingCount: BigInt(64),
  },
];

function RatingStars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          fill={s <= Math.round(rating) ? "oklch(0.72 0.19 50)" : "none"}
          style={{
            color:
              s <= Math.round(rating)
                ? "oklch(0.72 0.19 50)"
                : "oklch(0.35 0 0)",
          }}
        />
      ))}
      <span
        className="ml-1 font-semibold"
        style={{ color: "oklch(0.65 0 0)", fontSize: size }}
      >
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function PlaceCard({
  place,
  index,
  onClick,
}: {
  place: RidePlace;
  index: number;
  onClick: () => void;
}) {
  const photoUrl = place.photo.getDirectURL();
  return (
    <motion.div
      data-ocid={`explore.item.${index + 1}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="rounded-xl overflow-hidden cursor-pointer"
      style={{
        background: "oklch(0.13 0 0)",
        border: "1px solid oklch(0.20 0 0)",
      }}
    >
      <div className="relative h-32">
        <img
          src={photoUrl}
          alt={place.name}
          className="w-full h-full object-cover transition-transform duration-300"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, oklch(0.13 0 0), transparent 60%)",
          }}
        />
      </div>
      <div className="p-3">
        <h3 className="font-heading font-bold text-sm text-foreground truncate">
          {place.name}
        </h3>
        <div className="flex items-center gap-1 mt-1 mb-2">
          <MapPin size={11} className="text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground truncate">
            {place.location}
          </span>
        </div>
        <RatingStars rating={place.averageRating} />
      </div>
    </motion.div>
  );
}

function PlaceDetailSheet({
  place,
  open,
  onClose,
}: {
  place: RidePlace | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!place) return null;
  const photoUrl = place.photo.getDirectURL();
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        data-ocid="explore.sheet"
        side="bottom"
        className="rounded-t-2xl p-0 overflow-hidden max-h-[85dvh]"
        style={{
          background: "oklch(0.10 0 0)",
          borderColor: "oklch(0.22 0.01 50)",
        }}
      >
        {/* Hero photo */}
        <div className="relative w-full h-52 flex-shrink-0">
          <img
            src={photoUrl}
            alt={place.name}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, oklch(0.10 0 0) 15%, transparent 60%)",
            }}
          />
          <button
            type="button"
            data-ocid="explore.close_button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.08 0 0 / 0.75)" }}
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Details */}
        <div className="px-5 pt-4 pb-8 overflow-y-auto">
          <SheetHeader className="text-left mb-3">
            <SheetTitle
              className="font-heading text-xl font-bold"
              style={{ color: "oklch(0.96 0 0)" }}
            >
              {place.name}
            </SheetTitle>
          </SheetHeader>

          <div className="flex items-center gap-1.5 mb-3">
            <MapPin size={14} style={{ color: "oklch(0.72 0.19 50)" }} />
            <span className="text-sm" style={{ color: "oklch(0.65 0 0)" }}>
              {place.location}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <RatingStars rating={place.averageRating} size={16} />
            <span className="text-xs" style={{ color: "oklch(0.50 0 0)" }}>
              ({Number(place.ratingCount)} ratings)
            </span>
          </div>

          {place.description && (
            <p
              className="text-sm leading-relaxed"
              style={{ color: "oklch(0.72 0 0)" }}
            >
              {place.description}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Explore() {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<RidePlace | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: places, isLoading } = useGetAllRidePlaces();
  const createPlace = useCreateRidePlace();
  const uploadPhoto = useUploadPlacePhoto();

  const displayPlaces = places && places.length > 0 ? places : DEMO_PLACES;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim() || !photoFile) {
      toast.error("Please fill in all required fields and add a photo");
      return;
    }
    try {
      const bytes = new Uint8Array(await photoFile.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((p) =>
        setUploadProgress(p),
      );
      const uploadedPhoto = await uploadPhoto.mutateAsync(blob);
      await createPlace.mutateAsync({
        name: name.trim(),
        location: location.trim(),
        description: description.trim(),
        photo: uploadedPhoto,
      });
      toast.success("Ride spot added!");
      setAddOpen(false);
      setName("");
      setLocation("");
      setDescription("");
      setPhotoFile(null);
      setPhotoPreview(null);
      setUploadProgress(0);
    } catch {
      toast.error("Failed to add ride spot");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Explore
        </h1>
        <p className="text-muted-foreground text-sm">
          Discover legendary riding routes
        </p>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-20 scrollbar-hide">
        {isLoading ? (
          <div
            data-ocid="explore.loading_state"
            className="grid grid-cols-2 gap-3 mt-2"
          >
            {["a", "b", "c", "d"].map((k) => (
              <Skeleton key={k} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {displayPlaces.map((place, i) => (
              <PlaceCard
                key={place.id.toString()}
                place={place}
                index={i}
                onClick={() => setSelectedPlace(place)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Place Detail Sheet */}
      <PlaceDetailSheet
        place={selectedPlace}
        open={selectedPlace !== null}
        onClose={() => setSelectedPlace(null)}
      />

      {/* FAB */}
      <motion.button
        data-ocid="explore.add_button"
        whileTap={{ scale: 0.92 }}
        onClick={() => setAddOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center glow-orange z-30"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.22 25))",
        }}
      >
        <Plus size={24} className="text-black" strokeWidth={2.5} />
      </motion.button>

      {/* Add Place Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          data-ocid="explore.dialog"
          className="max-w-sm mx-auto rounded-2xl"
          style={{
            background: "oklch(0.11 0 0)",
            borderColor: "oklch(0.22 0.01 50)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">
              Add Ride Spot
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label className="text-sm text-muted-foreground">Name *</Label>
              <Input
                data-ocid="explore.input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Twisted Sisters Loop"
                className="bg-secondary border-border text-foreground mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">
                Location *
              </Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Medina, Texas"
                className="bg-secondary border-border text-foreground mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">
                Description
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this amazing route..."
                className="bg-secondary border-border text-foreground mt-1 resize-none"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Photo *</Label>
              <label
                className="mt-1 flex flex-col items-center justify-center h-28 rounded-xl cursor-pointer transition-colors"
                style={{
                  background: "oklch(0.16 0 0)",
                  border: "2px dashed oklch(0.28 0 0)",
                }}
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload size={24} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Upload photo
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "oklch(0.20 0 0)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${uploadProgress}%`,
                    background: "oklch(0.72 0.19 50)",
                  }}
                />
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
                className="flex-1"
                data-ocid="explore.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createPlace.isPending || uploadPhoto.isPending}
                className="flex-1 font-semibold"
                style={{ background: "oklch(0.72 0.19 50)", color: "black" }}
                data-ocid="explore.submit_button"
              >
                Add Spot
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
