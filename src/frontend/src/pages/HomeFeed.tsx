import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bike,
  Heart,
  MapPin,
  MessageCircle,
  Pause,
  Play,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { Post } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddComment,
  useGetAllPosts,
  useGetCommentsForPost,
  useGetLikeCount,
  useLikePost,
} from "../hooks/useQueries";

const DEMO_IDS = new Set([1, 2, 3, 4, 5]);

const DEMO_LIKE_COUNTS: Record<number, number> = {
  1: 847,
  2: 1243,
  3: 612,
  4: 2103,
  5: 489,
};

const DEMO_COMMENT_COUNTS: Record<number, number> = {
  1: 43,
  2: 127,
  3: 28,
  4: 89,
  5: 34,
};

const DEMO_POSTS: Post[] = [
  {
    id: BigInt(1),
    author: {
      toString: () => "demo-1",
      toText: () => "demo-1",
      toUint8Array: () => new Uint8Array(),
    } as any,
    caption:
      "Epic canyon run at sunrise 🔥 Nothing beats the roar of a V-Twin echoing off these walls",
    videoUrl: ExternalBlob.fromURL(
      "https://videos.pexels.com/video-files/3571264/3571264-hd_1080_1920_25fps.mp4",
    ),
    location: "Malibu Canyon, CA",
    bikeModel: "Harley-Davidson Fat Bob",
    timestamp: BigInt(Date.now()),
  },
  {
    id: BigInt(2),
    author: {
      toString: () => "demo-2",
      toText: () => "demo-2",
      toUint8Array: () => new Uint8Array(),
    } as any,
    caption:
      "Twisted Sisters loop completed! 100 miles of pure adrenaline through Texas hill country",
    videoUrl: ExternalBlob.fromURL(
      "https://videos.pexels.com/video-files/2795405/2795405-hd_1080_1920_25fps.mp4",
    ),
    location: "Medina, TX",
    bikeModel: "Ducati Panigale V4",
    timestamp: BigInt(Date.now()),
  },
  {
    id: BigInt(3),
    author: {
      toString: () => "demo-3",
      toText: () => "demo-3",
      toUint8Array: () => new Uint8Array(),
    } as any,
    caption:
      "Morning fog on the Pacific Coast Highway. These moments are why we ride 🌊",
    videoUrl: ExternalBlob.fromURL(
      "https://videos.pexels.com/video-files/856975/856975-hd_1920_1080_25fps.mp4",
    ),
    location: "PCH, California",
    bikeModel: "Honda CB1000R",
    timestamp: BigInt(Date.now()),
  },
  {
    id: BigInt(4),
    author: {
      toString: () => "demo-4",
      toText: () => "demo-4",
      toUint8Array: () => new Uint8Array(),
    } as any,
    caption:
      "Night ride through the city. Neon lights, empty streets, just me and the engine 🌃",
    videoUrl: ExternalBlob.fromURL(
      "https://videos.pexels.com/video-files/4253802/4253802-hd_1080_1920_25fps.mp4",
    ),
    location: "Los Angeles, CA",
    bikeModel: "Kawasaki Ninja ZX-10R",
    timestamp: BigInt(Date.now()),
  },
  {
    id: BigInt(5),
    author: {
      toString: () => "demo-5",
      toText: () => "demo-5",
      toUint8Array: () => new Uint8Array(),
    } as any,
    caption:
      "Blue Ridge Parkway fall colors 🍂 Best road trip I've done in years. Highly recommend.",
    videoUrl: ExternalBlob.fromURL(
      "https://videos.pexels.com/video-files/2519660/2519660-hd_1080_1920_25fps.mp4",
    ),
    location: "Blue Ridge Parkway, NC",
    bikeModel: "BMW R 1250 GS",
    timestamp: BigInt(Date.now()),
  },
];

const DEMO_USERNAMES: Record<string, string> = {
  "demo-1": "canyon_rider",
  "demo-2": "txspeedfreak",
  "demo-3": "pch_ghost",
  "demo-4": "neon_throttle",
  "demo-5": "ridge_runner",
};

interface PostCardProps {
  post: Post;
  index: number;
  username: string;
  globalMuted: boolean;
  onToggleMute: () => void;
}

function PostCard({
  post,
  index,
  username,
  globalMuted,
  onToggleMute,
}: PostCardProps) {
  const { identity } = useInternetIdentity();
  const isDemo = DEMO_IDS.has(Number(post.id));
  const demoId = Number(post.id);

  const [liked, setLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(
    isDemo ? (DEMO_LIKE_COUNTS[demoId] ?? 0) : 0,
  );
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showPlayIcon, setShowPlayIcon] = useState<"play" | "pause" | null>(
    null,
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const playIconTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Only query backend for real posts
  const { data: backendLikeCount = BigInt(0) } = useGetLikeCount(
    isDemo ? undefined : post.id,
  );
  const { data: backendComments = [] } = useGetCommentsForPost(
    !isDemo && commentOpen ? post.id : undefined,
  );
  const likeMutation = useLikePost();
  const addComment = useAddComment();

  const requireAuth = () => {
    if (!identity) {
      toast.error("Login to interact with riders");
      return false;
    }
    return true;
  };

  const handleLike = () => {
    if (isDemo) {
      // Local-only toggle for demo posts
      setLiked((prev) => {
        const nowLiked = !prev;
        setLocalLikeCount((c) => (nowLiked ? c + 1 : c - 1));
        return nowLiked;
      });
      return;
    }
    if (!requireAuth()) return;
    const nowLiked = !liked;
    setLiked(nowLiked);
    likeMutation.mutate({ postId: post.id, liked: !nowLiked });
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    if (!requireAuth()) return;
    if (isDemo) {
      toast.error("Login to see and post comments");
      return;
    }
    await addComment.mutateAsync({ postId: post.id, text: commentText.trim() });
    setCommentText("");
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `${post.caption} — ${post.location}`;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "RideVerse", text: shareText, url });
      } catch (_) {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied!");
      } catch (_) {
        toast.error("Could not copy link");
      }
    }
  };

  const showIcon = useCallback((type: "play" | "pause") => {
    setShowPlayIcon(type);
    if (playIconTimeoutRef.current) clearTimeout(playIconTimeoutRef.current);
    playIconTimeoutRef.current = setTimeout(() => setShowPlayIcon(null), 700);
  }, []);

  const handleTap = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      showIcon("play");
    } else {
      video.pause();
      showIcon("pause");
    }
  };

  // IntersectionObserver for auto play/pause
  useEffect(() => {
    const card = cardRef.current;
    const video = videoRef.current;
    if (!card || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
          video.currentTime = 0;
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const videoSrc = post.videoUrl.getDirectURL();

  const displayLikeCount = isDemo
    ? localLikeCount
    : Number(backendLikeCount) + (liked ? 1 : 0);

  const displayCommentCount = isDemo
    ? (DEMO_COMMENT_COUNTS[demoId] ?? 0)
    : backendComments.length;

  return (
    <>
      <div
        ref={cardRef}
        data-ocid={`feed.item.${index + 1}`}
        className="relative w-full flex-shrink-0 overflow-hidden"
        style={{
          height: "100svh",
          scrollSnapAlign: "start",
          scrollSnapStop: "always",
        }}
      >
        {/* Video — full screen */}
        <video
          ref={videoRef}
          src={videoSrc}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          muted={globalMuted}
          playsInline
          crossOrigin="anonymous"
        />

        {/* Tap to play/pause overlay */}
        <div
          role="button"
          tabIndex={0}
          className="absolute inset-0 z-10"
          onClick={handleTap}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleTap()}
          style={{ cursor: "pointer" }}
          aria-label="Toggle play/pause"
        />

        {/* Play/pause icon flash */}
        <AnimatePresence>
          {showPlayIcon && (
            <motion.div
              key={showPlayIcon}
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "oklch(0.05 0 0 / 0.6)" }}
              >
                {showPlayIcon === "play" ? (
                  <Play size={36} className="text-white" fill="white" />
                ) : (
                  <Pause size={36} className="text-white" fill="white" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top gradient */}
        <div
          className="absolute top-0 left-0 right-0 h-28 z-30 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0.04 0 0 / 0.85), transparent)",
          }}
        />

        {/* Bottom gradient */}
        <div
          className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none"
          style={{
            height: "260px",
            background:
              "linear-gradient(to top, oklch(0.04 0 0 / 0.92), transparent)",
          }}
        />

        {/* Mute button — top right */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-40"
          style={{
            background: "oklch(0.10 0 0 / 0.7)",
            backdropFilter: "blur(8px)",
          }}
        >
          {globalMuted ? (
            <VolumeX size={17} className="text-white" />
          ) : (
            <Volume2 size={17} className="text-white" />
          )}
        </button>

        {/* Bottom-left info — sits above bottom nav */}
        <div
          className="absolute left-0 right-14 z-40"
          style={{ bottom: "80px", padding: "0 16px" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Avatar
              className="w-9 h-9 border-2"
              style={{ borderColor: "oklch(0.72 0.19 50)" }}
            >
              <AvatarFallback
                style={{ background: "oklch(0.20 0 0)" }}
                className="text-foreground text-xs font-bold"
              >
                {username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-bold text-sm text-white drop-shadow">
              @{username}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Bike size={13} style={{ color: "oklch(0.72 0.19 50)" }} />
            <span
              className="text-xs font-semibold"
              style={{ color: "oklch(0.72 0.19 50)" }}
            >
              {post.bikeModel}
            </span>
          </div>
          <p className="text-white text-sm leading-snug line-clamp-2 mb-1.5 drop-shadow">
            {post.caption}
          </p>
          <div className="flex items-center gap-1">
            <MapPin size={12} className="text-white/60" />
            <span className="text-xs text-white/60">{post.location}</span>
          </div>
        </div>

        {/* Right sidebar action buttons */}
        <div
          className="absolute right-3 flex flex-col items-center gap-5 z-40"
          style={{ bottom: "88px" }}
        >
          <motion.button
            type="button"
            data-ocid={`feed.like_button.${index + 1}`}
            whileTap={{ scale: 1.3 }}
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className="flex flex-col items-center gap-1"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: "oklch(0.10 0 0 / 0.55)",
                backdropFilter: "blur(10px)",
                border: "1px solid oklch(1 0 0 / 0.1)",
              }}
            >
              <Heart
                size={23}
                fill={liked ? "oklch(0.60 0.22 25)" : "none"}
                style={{ color: liked ? "oklch(0.60 0.22 25)" : "white" }}
              />
            </div>
            <span className="text-white text-xs font-semibold drop-shadow">
              {displayLikeCount.toString()}
            </span>
          </motion.button>

          <button
            type="button"
            data-ocid={`feed.comment_button.${index + 1}`}
            onClick={(e) => {
              e.stopPropagation();
              setCommentOpen(true);
            }}
            className="flex flex-col items-center gap-1"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: "oklch(0.10 0 0 / 0.55)",
                backdropFilter: "blur(10px)",
                border: "1px solid oklch(1 0 0 / 0.1)",
              }}
            >
              <MessageCircle size={23} className="text-white" />
            </div>
            <span className="text-white text-xs font-semibold drop-shadow">
              {displayCommentCount}
            </span>
          </button>

          <button
            type="button"
            data-ocid={`feed.share_button.${index + 1}`}
            onClick={handleShare}
            className="flex flex-col items-center gap-1"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: "oklch(0.10 0 0 / 0.55)",
                backdropFilter: "blur(10px)",
                border: "1px solid oklch(1 0 0 / 0.1)",
              }}
            >
              <Share2 size={23} className="text-white" />
            </div>
            <span className="text-white text-xs font-semibold drop-shadow">
              Share
            </span>
          </button>
        </div>
      </div>

      {/* Comments Sheet */}
      <Sheet open={commentOpen} onOpenChange={setCommentOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl max-h-[70vh]"
          style={{
            background: "oklch(0.11 0 0)",
            borderColor: "oklch(0.22 0.01 50)",
          }}
        >
          <SheetHeader>
            <SheetTitle className="text-foreground">Comments</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3 overflow-y-auto max-h-[45vh]">
            {isDemo ? (
              <p className="text-center text-muted-foreground text-sm py-6">
                Login to see and post comments
              </p>
            ) : backendComments.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-6">
                No comments yet. Be the first!
              </p>
            ) : (
              backendComments.map((c, i) => (
                <div
                  key={`${c.postId?.toString()}-${c.timestamp?.toString() ?? i}`}
                  className="flex gap-3"
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback
                      style={{ background: "oklch(0.20 0 0)" }}
                      className="text-xs"
                    >
                      R
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-muted-foreground">Rider</p>
                    <p className="text-sm text-foreground">{c.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {!isDemo && (
            <div className="flex gap-2 mt-4">
              <Input
                data-ocid={`feed.comment_input.${index + 1}`}
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                className="flex-1 bg-secondary border-border text-foreground"
              />
              <Button
                data-ocid={`feed.comment_submit_button.${index + 1}`}
                onClick={handleComment}
                disabled={addComment.isPending}
                size="sm"
                style={{ background: "oklch(0.72 0.19 50)", color: "black" }}
              >
                Post
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export default function HomeFeed() {
  const { data: posts, isLoading } = useGetAllPosts();
  const [globalMuted, setGlobalMuted] = useState(true);
  const displayPosts = posts && posts.length > 0 ? posts : DEMO_POSTS;

  if (isLoading) {
    return (
      <div
        className="w-full flex items-center justify-center"
        style={{ height: "100svh" }}
        data-ocid="feed.loading_state"
      >
        <Skeleton
          className="w-full rounded-none"
          style={{ height: "100svh" }}
        />
      </div>
    );
  }

  return (
    <div
      className="w-full"
      style={{
        height: "100svh",
        overflowY: "scroll",
        scrollSnapType: "y mandatory",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {/* Top logo overlay */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full z-50 flex items-center px-4 pt-2"
        style={{
          maxWidth: "430px",
          height: "60px",
          pointerEvents: "none",
        }}
      >
        <img
          src="/assets/uploads/23c61684-da61-4fde-b9a5-98d6c83942c0-1.png"
          alt="RideVerse"
          className="h-7"
        />
      </div>

      {displayPosts.map((post, index) => {
        const authorStr = post.author.toString();
        const username =
          DEMO_USERNAMES[authorStr] ?? `rider_${authorStr.slice(0, 6)}`;
        return (
          <PostCard
            key={post.id.toString()}
            post={post}
            index={index}
            username={username}
            globalMuted={globalMuted}
            onToggleMute={() => setGlobalMuted((m) => !m)}
          />
        );
      })}
    </div>
  );
}
