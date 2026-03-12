import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob } from "../backend";
import type {
  CommentInput,
  Post,
  PostInput,
  RideEvent,
  RideEventInput,
  RidePlace,
  RidePlaceInput,
  UserProfile,
} from "../backend";
import { useActor } from "./useActor";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetAllPosts() {
  const { actor, isFetching } = useActor();
  return useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllRidePlaces() {
  const { actor, isFetching } = useActor();
  return useQuery<RidePlace[]>({
    queryKey: ["ridePlaces"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRidePlaces();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllEvents() {
  const { actor, isFetching } = useActor();
  return useQuery<RideEvent[]>({
    queryKey: ["events"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEvents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPostsByUser(userId: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Post[]>({
    queryKey: ["userPosts", userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      const { Principal } = await import("@dfinity/principal");
      return actor.getPostsByUser(Principal.fromText(userId));
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useGetFollowerCount(userId: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["followerCount", userId],
    queryFn: async () => {
      if (!actor || !userId) return BigInt(0);
      const { Principal } = await import("@dfinity/principal");
      return actor.getFollowerCount(Principal.fromText(userId));
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useGetFollowingCount(userId: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["followingCount", userId],
    queryFn: async () => {
      if (!actor || !userId) return BigInt(0);
      const { Principal } = await import("@dfinity/principal");
      return actor.getFollowingCount(Principal.fromText(userId));
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useGetCommentsForPost(postId: bigint | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["comments", postId?.toString()],
    queryFn: async () => {
      if (!actor || postId === undefined) return [];
      return actor.getCommentsForPost(postId);
    },
    enabled: !!actor && !isFetching && postId !== undefined,
  });
}

export function useGetLikeCount(postId: bigint | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["likeCount", postId?.toString()],
    queryFn: async () => {
      if (!actor || postId === undefined) return BigInt(0);
      return actor.getLikeCount(postId);
    },
    enabled: !!actor && !isFetching && postId !== undefined,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("No actor");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["currentUserProfile"] }),
  });
}

export function useUpdateProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("No actor");
      return actor.updateProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["currentUserProfile"] }),
  });
}

export function useLikePost() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      liked,
    }: { postId: bigint; liked: boolean }) => {
      if (!actor) throw new Error("No actor");
      return liked ? actor.unlikePost(postId) : actor.likePost(postId);
    },
    onSuccess: (_d, { postId }) =>
      qc.invalidateQueries({ queryKey: ["likeCount", postId.toString()] }),
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CommentInput) => {
      if (!actor) throw new Error("No actor");
      return actor.addComment(input);
    },
    onSuccess: (_d, input) =>
      qc.invalidateQueries({ queryKey: ["comments", input.postId.toString()] }),
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PostInput) => {
      if (!actor) throw new Error("No actor");
      return actor.createPost(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });
}

export function useCreateRidePlace() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RidePlaceInput) => {
      if (!actor) throw new Error("No actor");
      return actor.createRidePlace(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ridePlaces"] }),
  });
}

export function useCreateRideEvent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RideEventInput) => {
      if (!actor) throw new Error("No actor");
      return actor.createRideEvent(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useRsvpEvent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      isRsvped,
    }: { eventId: bigint; isRsvped: boolean }) => {
      if (!actor) throw new Error("No actor");
      return isRsvped ? actor.cancelRsvp(eventId) : actor.rsvpToEvent(eventId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useUploadProfilePhoto() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (blob: ExternalBlob) => {
      if (!actor) throw new Error("No actor");
      return actor.uploadProfilePhoto(blob);
    },
  });
}

export function useUploadPostVideo() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (blob: ExternalBlob) => {
      if (!actor) throw new Error("No actor");
      return actor.uploadPostVideo(blob);
    },
  });
}

export function useUploadPlacePhoto() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (blob: ExternalBlob) => {
      if (!actor) throw new Error("No actor");
      return actor.uploadPlacePhoto(blob);
    },
  });
}
