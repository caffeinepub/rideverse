import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface RidePlaceInput {
    name: string;
    description: string;
    photo: ExternalBlob;
    location: string;
}
export interface RidePlace {
    id: PlaceId;
    ratingCount: bigint;
    name: string;
    submittedBy: UserId;
    description: string;
    averageRating: number;
    photo: ExternalBlob;
    location: string;
}
export type Time = bigint;
export type EventId = bigint;
export interface Comment {
    text: string;
    author: UserId;
    timestamp: Time;
    postId: PostId;
}
export type PostId = bigint;
export interface RideEvent {
    id: EventId;
    organizer: UserId;
    title: string;
    description: string;
    participantCount: bigint;
    timestamp: Time;
    meetingLocation: string;
    rideDate: string;
}
export type UserId = Principal;
export interface RideEventInput {
    title: string;
    description: string;
    meetingLocation: string;
    rideDate: string;
}
export interface CommentInput {
    text: string;
    postId: PostId;
}
export interface Post {
    id: PostId;
    author: UserId;
    bikeModel: string;
    timestamp: Time;
    caption: string;
    videoUrl: ExternalBlob;
    location: string;
}
export interface PostInput {
    bikeModel: string;
    caption: string;
    videoUrl: ExternalBlob;
    location: string;
}
export type PlaceId = bigint;
export interface UserProfileInput {
    bio: string;
    username: string;
    city: string;
    profilePhoto?: ExternalBlob;
    bikeModel: string;
}
export interface UserProfile {
    bio: string;
    username: string;
    city: string;
    profilePhoto?: ExternalBlob;
    bikeModel: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(input: CommentInput): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelRsvp(eventId: EventId): Promise<void>;
    createPost(input: PostInput): Promise<PostId>;
    createRideEvent(input: RideEventInput): Promise<EventId>;
    createRidePlace(input: RidePlaceInput): Promise<PlaceId>;
    followUser(targetUser: UserId): Promise<void>;
    getAllEvents(): Promise<Array<RideEvent>>;
    getAllPosts(): Promise<Array<Post>>;
    getAllProfiles(): Promise<Array<UserProfile>>;
    getAllRidePlaces(): Promise<Array<RidePlace>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommentsForPost(postId: PostId): Promise<Array<Comment>>;
    getEvent(eventId: EventId): Promise<RideEvent | null>;
    getEventParticipants(eventId: EventId): Promise<Array<UserId>>;
    getEventsByOrganizer(organizer: UserId): Promise<Array<RideEvent>>;
    getFollowerCount(userId: UserId): Promise<bigint>;
    getFollowers(userId: UserId): Promise<Array<UserId>>;
    getFollowing(userId: UserId): Promise<Array<UserId>>;
    getFollowingCount(userId: UserId): Promise<bigint>;
    getLikeCount(postId: PostId): Promise<bigint>;
    getParticipantCount(eventId: EventId): Promise<bigint>;
    getPlace(placeId: PlaceId): Promise<RidePlace | null>;
    getPost(postId: PostId): Promise<Post | null>;
    getPostsByBikeModel(bikeModel: string): Promise<Array<Post>>;
    getPostsByUser(userId: UserId): Promise<Array<Post>>;
    getProfile(user: UserId): Promise<UserProfile | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    likePost(postId: PostId): Promise<void>;
    ratePlace(placeId: PlaceId, rating: bigint): Promise<void>;
    rsvpToEvent(eventId: EventId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    unfollowUser(targetUser: UserId): Promise<void>;
    unlikePost(postId: PostId): Promise<void>;
    updateProfile(profile: UserProfileInput): Promise<void>;
    uploadBlobInternal(blob: ExternalBlob): Promise<ExternalBlob>;
    uploadPlacePhoto(blob: ExternalBlob): Promise<ExternalBlob>;
    uploadPostVideo(blob: ExternalBlob): Promise<ExternalBlob>;
    uploadProfilePhoto(blob: ExternalBlob): Promise<ExternalBlob>;
}
