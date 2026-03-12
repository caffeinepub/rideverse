import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Film, Upload as UploadIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useCreatePost, useUploadPostVideo } from "../hooks/useQueries";

export default function Upload() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [bikeModel, setBikeModel] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadVideo = useUploadPostVideo();
  const createPost = useCreatePost();

  const handleFile = (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !videoFile ||
      !caption.trim() ||
      !location.trim() ||
      !bikeModel.trim()
    ) {
      toast.error("Please fill in all fields and select a video");
      return;
    }
    try {
      setUploadProgress(0);
      const bytes = new Uint8Array(await videoFile.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((p) =>
        setUploadProgress(p),
      );
      const uploadedVideo = await uploadVideo.mutateAsync(blob);
      await createPost.mutateAsync({
        caption: caption.trim(),
        location: location.trim(),
        bikeModel: bikeModel.trim(),
        videoUrl: uploadedVideo,
      });
      setDone(true);
      toast.success("Ride video posted!");
      setTimeout(() => {
        setDone(false);
        setVideoFile(null);
        setVideoPreview(null);
        setCaption("");
        setLocation("");
        setBikeModel("");
        setUploadProgress(0);
      }, 2500);
    } catch {
      toast.error("Failed to upload. Please try again.");
      setUploadProgress(0);
    }
  };

  const isUploading = uploadVideo.isPending || createPost.isPending;

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pb-24">
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Upload Ride
        </h1>
        <p className="text-muted-foreground text-sm">
          Share your POV with the community
        </p>
      </div>

      <div className="px-4 space-y-4">
        {/* Dropzone */}
        <button
          type="button"
          data-ocid="upload.dropzone"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 w-full text-left"
          style={{
            height: "200px",
            background: isDragging ? "oklch(0.18 0.04 50)" : "oklch(0.14 0 0)",
            border: `2px dashed ${isDragging ? "oklch(0.72 0.19 50)" : "oklch(0.26 0 0)"}`,
          }}
        >
          {videoPreview ? (
            <video
              src={videoPreview}
              className="w-full h-full object-cover"
              muted
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "oklch(0.72 0.19 50 / 0.15)" }}
              >
                <Film size={28} style={{ color: "oklch(0.72 0.19 50)" }} />
              </div>
              <div className="text-center">
                <p className="text-foreground text-sm font-semibold">
                  Drop your ride video
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  or tap to browse
                </p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Caption *</Label>
            <Textarea
              data-ocid="upload.caption_input"
              placeholder="Describe your ride experience..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="bg-secondary border-border text-foreground resize-none"
              rows={3}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Location *</Label>
            <Input
              data-ocid="upload.location_input"
              placeholder="Where did you ride?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-secondary border-border text-foreground h-11"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">
              Bike Model *
            </Label>
            <Input
              placeholder="e.g. Kawasaki Ninja ZX-10R"
              value={bikeModel}
              onChange={(e) => setBikeModel(e.target.value)}
              className="bg-secondary border-border text-foreground h-11"
              required
            />
          </div>

          <AnimatePresence>
            {isUploading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5"
              >
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            data-ocid="upload.submit_button"
            type="submit"
            disabled={isUploading || !videoFile}
            className="w-full h-12 font-heading font-semibold text-base"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.22 25))",
              color: "black",
            }}
          >
            {done ? (
              <>
                <CheckCircle size={18} className="mr-2" /> Posted!
              </>
            ) : isUploading ? (
              <>
                <UploadIcon size={18} className="mr-2 animate-bounce" />{" "}
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon size={18} className="mr-2" /> Post Ride
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
