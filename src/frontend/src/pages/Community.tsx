import { Badge } from "@/components/ui/badge";
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
import { Calendar, MapPin, Plus, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { RideEvent } from "../backend";
import {
  useCreateRideEvent,
  useGetAllEvents,
  useRsvpEvent,
} from "../hooks/useQueries";

const DEMO_EVENTS: RideEvent[] = [
  {
    id: BigInt(1),
    title: "Sunrise Angeles Crest Run",
    meetingLocation: "Crystal Lake Cafe, Chilao, CA",
    rideDate: "2026-03-20",
    description:
      "Join us for an epic early morning blast up the Angeles Crest Highway. Sport bikes and adventure riders welcome. Pace will be spirited but safe.",
    participantCount: BigInt(24),
    organizer: { toString: () => "demo" } as any,
    timestamp: BigInt(Date.now()),
  },
  {
    id: BigInt(2),
    title: "SoCal Coastal Cruise",
    meetingLocation: "Neptune's Net, Malibu, CA",
    rideDate: "2026-03-27",
    description:
      "Relaxed coastal ride down PCH from Malibu to Oxnard. All bikes welcome. Coffee stop at Neptune's before heading out.",
    participantCount: BigInt(41),
    organizer: { toString: () => "demo" } as any,
    timestamp: BigInt(Date.now()),
  },
  {
    id: BigInt(3),
    title: "Texas Hill Country Blast",
    meetingLocation: "Lone Star Rally HQ, Fredericksburg, TX",
    rideDate: "2026-04-05",
    description:
      "The legendary Twisted Sisters loop — FM 335, 336, 337. Three of the best riding roads in America back to back. Not for the faint-hearted.",
    participantCount: BigInt(16),
    organizer: { toString: () => "demo" } as any,
    timestamp: BigInt(Date.now()),
  },
];

function EventCard({ event, index }: { event: RideEvent; index: number }) {
  const [rsvped, setRsvped] = useState(false);
  const rsvpMutation = useRsvpEvent();

  const handleRsvp = () => {
    setRsvped((p) => !p);
    rsvpMutation.mutate({ eventId: event.id, isRsvped: rsvped });
  };

  const formattedDate = (() => {
    try {
      return new Date(event.rideDate).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return event.rideDate;
    }
  })();

  return (
    <motion.div
      data-ocid={`community.item.${index + 1}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: "oklch(0.13 0 0)",
        border: "1px solid oklch(0.20 0 0)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading font-bold text-base text-foreground leading-tight flex-1">
          {event.title}
        </h3>
        <Badge
          className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            background: "oklch(0.72 0.19 50 / 0.15)",
            color: "oklch(0.72 0.19 50)",
            border: "none",
          }}
        >
          {formattedDate}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
        {event.description}
      </p>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <MapPin size={13} style={{ color: "oklch(0.60 0.22 25)" }} />
          <span className="text-xs text-muted-foreground truncate">
            {event.meetingLocation}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={13} style={{ color: "oklch(0.60 0.22 25)" }} />
          <span className="text-xs text-muted-foreground">
            {Number(event.participantCount) + (rsvped ? 1 : 0)} riders going
          </span>
        </div>
      </div>

      <Button
        data-ocid={`community.rsvp_button.${index + 1}`}
        onClick={handleRsvp}
        className="w-full h-9 text-sm font-semibold transition-all"
        style={{
          background: rsvped
            ? "oklch(0.60 0.22 25 / 0.15)"
            : "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.22 25))",
          color: rsvped ? "oklch(0.60 0.22 25)" : "black",
          border: rsvped ? "1px solid oklch(0.60 0.22 25 / 0.3)" : "none",
        }}
      >
        {rsvped ? "✓ You're In" : "Join Ride"}
      </Button>
    </motion.div>
  );
}

export default function Community() {
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [rideDate, setRideDate] = useState("");
  const [description, setDescription] = useState("");

  const { data: events, isLoading } = useGetAllEvents();
  const createEvent = useCreateRideEvent();

  const displayEvents = events && events.length > 0 ? events : DEMO_EVENTS;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !meetingLocation.trim() || !rideDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await createEvent.mutateAsync({
        title: title.trim(),
        meetingLocation: meetingLocation.trim(),
        rideDate,
        description: description.trim(),
      });
      toast.success("Group ride created!");
      setCreateOpen(false);
      setTitle("");
      setMeetingLocation("");
      setRideDate("");
      setDescription("");
    } catch {
      toast.error("Failed to create event");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Group Rides
        </h1>
        <p className="text-muted-foreground text-sm">
          Find your next adventure
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-3 scrollbar-hide">
        {isLoading ? (
          <div data-ocid="community.loading_state" className="space-y-3">
            {["a", "b", "c"].map((k) => (
              <Skeleton key={k} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : (
          displayEvents.map((event, i) => (
            <EventCard key={event.id.toString()} event={event} index={i} />
          ))
        )}

        {!isLoading && displayEvents.length === 0 && (
          <div
            data-ocid="community.empty_state"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <p className="text-4xl mb-3">🏍️</p>
            <p className="font-heading font-bold text-foreground">
              No rides planned yet
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Be the first to organize a group ride!
            </p>
          </div>
        )}
      </div>

      <motion.button
        data-ocid="community.add_button"
        whileTap={{ scale: 0.92 }}
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center glow-orange z-30"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.72 0.19 50), oklch(0.60 0.22 25))",
        }}
      >
        <Plus size={24} className="text-black" strokeWidth={2.5} />
      </motion.button>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent
          data-ocid="community.dialog"
          className="max-w-sm mx-auto rounded-2xl"
          style={{
            background: "oklch(0.11 0 0)",
            borderColor: "oklch(0.22 0.01 50)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">
              Create Group Ride
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <Label className="text-sm text-muted-foreground">
                Event Title *
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Weekend Canyon Run"
                className="bg-secondary border-border text-foreground mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">
                Meeting Point *
              </Label>
              <Input
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                placeholder="Starbucks on Main St"
                className="bg-secondary border-border text-foreground mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">
                Ride Date *
              </Label>
              <Input
                type="date"
                value={rideDate}
                onChange={(e) => setRideDate(e.target.value)}
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
                placeholder="Tell riders about the route..."
                className="bg-secondary border-border text-foreground mt-1 resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="flex-1"
                data-ocid="community.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createEvent.isPending}
                className="flex-1 font-semibold"
                style={{ background: "oklch(0.72 0.19 50)", color: "black" }}
                data-ocid="community.confirm_button"
              >
                Create Ride
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
