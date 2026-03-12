import Array "mo:core/Array";
import List "mo:core/List";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Set "mo:core/Set";
import Time "mo:core/Time";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

actor {
  // Include components
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Types
  type UserId = Principal;
  type PostId = Nat;
  type PlaceId = Nat;
  type EventId = Nat;

  type UserProfile = {
    username : Text;
    bio : Text;
    bikeModel : Text;
    city : Text;
    profilePhoto : ?Storage.ExternalBlob;
  };

  type Post = {
    id : PostId;
    videoUrl : Storage.ExternalBlob;
    caption : Text;
    location : Text;
    bikeModel : Text;
    author : UserId;
    timestamp : Time.Time;
  };

  module Post {
    public func compare(post1 : Post, post2 : Post) : Order.Order {
      Nat.compare(post1.id, post2.id);
    };
  };

  type Comment = {
    text : Text;
    author : UserId;
    postId : PostId;
    timestamp : Time.Time;
  };

  type RidePlace = {
    id : PlaceId;
    name : Text;
    photo : Storage.ExternalBlob;
    location : Text;
    description : Text;
    submittedBy : UserId;
    averageRating : Float;
    ratingCount : Nat;
  };

  type RideEvent = {
    id : EventId;
    title : Text;
    meetingLocation : Text;
    rideDate : Text;
    description : Text;
    organizer : UserId;
    timestamp : Time.Time;
    participantCount : Nat;
  };

  // Storage
  let users = Map.empty<UserId, UserProfile>();
  let posts = Map.empty<PostId, Post>();
  let comments = Map.empty<Nat, Comment>();
  let places = Map.empty<PlaceId, RidePlace>();
  let events = Map.empty<EventId, RideEvent>();

  // Counters
  var postIdCounter = 0;
  var commentIdCounter = 0;
  var placeIdCounter = 0;
  var eventIdCounter = 0;

  // Follows
  let followers = Map.empty<UserId, Set.Set<UserId>>();
  let following = Map.empty<UserId, Set.Set<UserId>>();

  // Post interactions
  let likes = Map.empty<PostId, Set.Set<UserId>>();
  let postComments = Map.empty<PostId, List.List<Nat>>();
  let postAuthorComments = Map.empty<PostId, Principal>();

  // Place ratings
  let placeRatings = Map.empty<PlaceId, Map.Map<UserId, Nat>>();

  // Event participants
  let eventParticipants = Map.empty<EventId, Set.Set<UserId>>();

  // User Profile Management
  public type UserProfileInput = {
    username : Text;
    bio : Text;
    bikeModel : Text;
    city : Text;
    profilePhoto : ?Storage.ExternalBlob;
  };

  public shared ({ caller }) func updateProfile(profile : UserProfileInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };
    if (profile.username.trim(#char ' ').size() == 0) {
      Runtime.trap("Username cannot be empty");
    };
    if (profile.city.trim(#char ' ').size() == 0) {
      Runtime.trap("City cannot be empty");
    };
    let newProfile : UserProfile = {
      username = profile.username;
      bio = profile.bio;
      bikeModel = profile.bikeModel;
      city = profile.city;
      profilePhoto = profile.profilePhoto;
    };
    users.add(caller, newProfile);
  };

  public query ({ caller }) func getProfile(user : UserId) : async ?UserProfile {
    // Public read access - anyone can view profiles
    users.get(user);
  };

  public query ({ caller }) func getAllProfiles() : async [UserProfile] {
    // Public read access - anyone can view all profiles
    users.values().toArray();
  };

  // Post Management
  type PostInput = {
    videoUrl : Storage.ExternalBlob;
    caption : Text;
    location : Text;
    bikeModel : Text;
  };

  public shared ({ caller }) func createPost(input : PostInput) : async PostId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create posts");
    };
    if (input.caption.trim(#char ' ').size() == 0) {
      Runtime.trap("Caption cannot be empty");
    };

    let postId = postIdCounter;
    postIdCounter += 1;

    let newPost : Post = {
      id = postId;
      videoUrl = input.videoUrl;
      caption = input.caption;
      location = input.location;
      bikeModel = input.bikeModel;
      author = caller;
      timestamp = Time.now();
    };
    posts.add(postId, newPost);

    let emptyLikes = Set.empty<UserId>();
    likes.add(postId, emptyLikes);

    let emptyComments = List.empty<Nat>();
    postComments.add(postId, emptyComments);

    newPost.id;
  };

  public query ({ caller }) func getPost(postId : PostId) : async ?Post {
    // Public read access - anyone can view posts
    posts.get(postId);
  };

  public query ({ caller }) func getAllPosts() : async [Post] {
    // Public read access - anyone can view all posts
    posts.values().toArray().sort();
  };

  public query ({ caller }) func getPostsByUser(userId : UserId) : async [Post] {
    // Public read access - anyone can view user's posts
    let filtered = posts.values().toArray().filter(
      func(post) {
        post.author == userId;
      }
    );
    filtered;
  };

  // Like system
  public shared ({ caller }) func likePost(postId : PostId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like posts");
    };
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (_) {
        switch (likes.get(postId)) {
          case (null) {
            let newSet = Set.empty<UserId>();
            newSet.add(caller);
            likes.add(postId, newSet);
          };
          case (?currentSet) {
            if (currentSet.contains(caller)) {
              Runtime.trap("Post already liked");
            };
            currentSet.add(caller);
          };
        };
      };
    };
  };

  public shared ({ caller }) func unlikePost(postId : PostId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unlike posts");
    };
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (_) {
        switch (likes.get(postId)) {
          case (null) { Runtime.trap("No likes for this post yet") };
          case (?currentSet) {
            if (not currentSet.contains(caller)) {
              Runtime.trap("Post not liked by you");
            };
            currentSet.remove(caller);
          };
        };
      };
    };
  };

  public query ({ caller }) func getLikeCount(postId : PostId) : async Nat {
    // Public read access - anyone can view like counts
    switch (likes.get(postId)) {
      case (null) { 0 };
      case (?currentSet) { currentSet.size() };
    };
  };

  // Comments
  public type CommentInput = {
    text : Text;
    postId : PostId;
  };

  public shared ({ caller }) func addComment(input : CommentInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add comments");
    };
    switch (posts.get(input.postId)) {
      case (null) { Runtime.trap("Post does not exist") };
      case (_) {
        let commentId = commentIdCounter;
        commentIdCounter += 1;

        let newComment : Comment = {
          text = input.text;
          author = caller;
          postId = input.postId;
          timestamp = Time.now();
        };

        // Add comment to comments map
        comments.add(commentId, newComment);

        // Update postComments with new commentId
        switch (postComments.get(input.postId)) {
          case (null) {
            let newList = List.empty<Nat>();
            newList.add(commentId);
            postComments.add(input.postId, newList);
          };
          case (?existingList) {
            existingList.add(commentId);
          };
        };

        // Add an entry to postAuthorComments
        postAuthorComments.add(input.postId, caller);
      };
    };
  };

  public query ({ caller }) func getCommentsForPost(postId : PostId) : async [Comment] {
    // Public read access - anyone can view comments
    switch (postComments.get(postId)) {
      case (null) { [] };
      case (?commentIds) {
        let commentIter = commentIds.values();
        let commentsIter = commentIter.map(
          func(commentId) {
            switch (comments.get(commentId)) {
              case (null) { Runtime.trap("Comment data missing") };
              case (?comment) { comment };
            };
          }
        );
        commentsIter.toArray();
      };
    };
  };

  // Follow System
  public query ({ caller }) func getFollowers(userId : UserId) : async [UserId] {
    // Public read access - anyone can view followers
    switch (followers.get(userId)) {
      case (null) { [] };
      case (?userFollowers) { userFollowers.toArray() };
    };
  };

  public query ({ caller }) func getFollowing(userId : UserId) : async [UserId] {
    // Public read access - anyone can view following
    switch (following.get(userId)) {
      case (null) { [] };
      case (?userFollowing) { userFollowing.toArray() };
    };
  };

  public shared ({ caller }) func followUser(targetUser : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can follow others");
    };
    if (caller == targetUser) { Runtime.trap("Cannot follow yourself") };

    // Add to target user's followers
    switch (followers.get(targetUser)) {
      case (null) {
        let newFollowers = Set.empty<UserId>();
        newFollowers.add(caller);
        followers.add(targetUser, newFollowers);
      };
      case (?existingFollowers) {
        existingFollowers.add(caller);
      };
    };

    // Add to caller's following
    switch (following.get(caller)) {
      case (null) {
        let newFollowing = Set.empty<UserId>();
        newFollowing.add(targetUser);
        following.add(caller, newFollowing);
      };
      case (?existingFollowing) {
        existingFollowing.add(targetUser);
      };
    };
  };

  public shared ({ caller }) func unfollowUser(targetUser : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unfollow others");
    };
    if (caller == targetUser) { Runtime.trap("Cannot unfollow yourself") };

    // Remove from target user's followers
    switch (followers.get(targetUser)) {
      case (null) { Runtime.trap("You are not following this user") };
      case (?existingFollowers) {
        existingFollowers.remove(caller);
      };
    };

    // Remove from caller's following
    switch (following.get(caller)) {
      case (null) { Runtime.trap("You are not following this user") };
      case (?existingFollowing) {
        existingFollowing.remove(targetUser);
      };
    };
  };

  public query ({ caller }) func getFollowerCount(userId : UserId) : async Nat {
    // Public read access - anyone can view follower counts
    switch (followers.get(userId)) {
      case (null) { 0 };
      case (?userFollowers) { userFollowers.size() };
    };
  };

  public query ({ caller }) func getFollowingCount(userId : UserId) : async Nat {
    // Public read access - anyone can view following counts
    switch (following.get(userId)) {
      case (null) { 0 };
      case (?userFollowing) { userFollowing.size() };
    };
  };

  // Ride Places
  public type RidePlaceInput = {
    name : Text;
    photo : Storage.ExternalBlob;
    location : Text;
    description : Text;
  };

  public shared ({ caller }) func createRidePlace(input : RidePlaceInput) : async PlaceId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create ride places");
    };
    if (input.name.trim(#char ' ').size() == 0) {
      Runtime.trap("Place name cannot be empty");
    };

    let placeId = placeIdCounter;
    placeIdCounter += 1;

    let newPlace : RidePlace = {
      id = placeId;
      name = input.name;
      photo = input.photo;
      location = input.location;
      description = input.description;
      submittedBy = caller;
      averageRating = 0.0;
      ratingCount = 0;
    };
    places.add(placeId, newPlace);

    let emptyRatings = Map.empty<UserId, Nat>();
    placeRatings.add(placeId, emptyRatings);

    placeId;
  };

  public query ({ caller }) func getPlace(placeId : PlaceId) : async ?RidePlace {
    // Public read access - anyone can view places
    places.get(placeId);
  };

  public query ({ caller }) func getAllRidePlaces() : async [RidePlace] {
    // Public read access - anyone can view all places
    places.values().toArray();
  };

  public shared ({ caller }) func ratePlace(placeId : PlaceId, rating : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can rate places");
    };
    if (rating < 1 or rating > 5) {
      Runtime.trap("Rating must be between 1 and 5");
    };

    let currentRatings = switch (placeRatings.get(placeId)) {
      case (null) {
        let newMap = Map.empty<UserId, Nat>();
        placeRatings.add(placeId, newMap);
        newMap;
      };
      case (?existingMap) { existingMap };
    };

    currentRatings.add(caller, rating);

    let totalRatings = currentRatings.values().toArray().foldLeft(0, func(acc, r) { acc + r });
    let ratingCount = currentRatings.size();
    let avgRating = if (ratingCount > 0) {
      totalRatings.toFloat() / ratingCount.toFloat();
    } else { 0.0 };

    // Update RidePlace
    switch (places.get(placeId)) {
      case (null) { Runtime.trap("Place not found") };
      case (?place) {
        places.add(
          placeId,
          {
            place with
            averageRating = avgRating;
            ratingCount;
          },
        );
      };
    };
  };

  // Ride Events
  public type RideEventInput = {
    title : Text;
    meetingLocation : Text;
    rideDate : Text;
    description : Text;
  };

  public shared ({ caller }) func createRideEvent(input : RideEventInput) : async EventId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create events");
    };
    if (input.title.trim(#char ' ').size() == 0) {
      Runtime.trap("Event title cannot be empty");
    };

    let eventId = eventIdCounter;
    eventIdCounter += 1;

    let newEvent : RideEvent = {
      id = eventId;
      title = input.title;
      meetingLocation = input.meetingLocation;
      rideDate = input.rideDate;
      description = input.description;
      organizer = caller;
      timestamp = Time.now();
      participantCount = 0;
    };
    events.add(eventId, newEvent);

    let emptyParticipants = Set.empty<UserId>();
    eventParticipants.add(eventId, emptyParticipants);

    eventId;
  };

  public query ({ caller }) func getEvent(eventId : EventId) : async ?RideEvent {
    // Public read access - anyone can view events
    events.get(eventId);
  };

  public query ({ caller }) func getAllEvents() : async [RideEvent] {
    // Public read access - anyone can view all events
    events.values().toArray();
  };

  public query ({ caller }) func getEventsByOrganizer(organizer : UserId) : async [RideEvent] {
    // Public read access - anyone can view events by organizer
    let filtered = events.values().toArray().filter(
      func(event) {
        event.organizer == organizer;
      }
    );
    filtered;
  };

  public shared ({ caller }) func rsvpToEvent(eventId : EventId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can RSVP to events");
    };
    switch (events.get(eventId)) {
      case (null) { Runtime.trap("Event does not exist") };
      case (_) {
        switch (eventParticipants.get(eventId)) {
          case (null) {
            let newSet = Set.empty<UserId>();
            newSet.add(caller);
            eventParticipants.add(eventId, newSet);
          };
          case (?currentSet) {
            if (currentSet.contains(caller)) {
              Runtime.trap("Already RSVPed to this event");
            };
            currentSet.add(caller);
          };
        };
      };
    };
  };

  public shared ({ caller }) func cancelRsvp(eventId : EventId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can cancel RSVP");
    };
    switch (events.get(eventId)) {
      case (null) { Runtime.trap("Event does not exist") };
      case (_) {
        switch (eventParticipants.get(eventId)) {
          case (null) { Runtime.trap("You have not RSVPed to this event") };
          case (?currentSet) {
            if (not currentSet.contains(caller)) {
              Runtime.trap("You have not RSVPed to this event");
            };
            currentSet.remove(caller);
          };
        };
      };
    };
  };

  public query ({ caller }) func getParticipantCount(eventId : EventId) : async Nat {
    // Public read access - anyone can view participant counts
    switch (eventParticipants.get(eventId)) {
      case (null) { 0 };
      case (?currentSet) { currentSet.size() };
    };
  };

  // Filtering Helper Function
  func filterPosts(predicate : Post -> Bool) : [Post] {
    let filteredIter = posts.values().toArray().values().filter(predicate);
    filteredIter.toArray();
  };

  // Public Function to Get Posts by Bike Model
  public query ({ caller }) func getPostsByBikeModel(bikeModel : Text) : async [Post] {
    // Public read access - anyone can filter posts by bike model
    filterPosts(
      func(post) {
        post.bikeModel == bikeModel;
      }
    );
  };

  // Function to get event participants
  public query ({ caller }) func getEventParticipants(eventId : EventId) : async [UserId] {
    // Public read access - anyone can view event participants
    switch (eventParticipants.get(eventId)) {
      case (null) { [] };
      case (?participants) { participants.toArray() };
    };
  };

  // Duplicate Upload function
  public shared ({ caller }) func uploadBlobInternal(blob : Storage.ExternalBlob) : async Storage.ExternalBlob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload blobs");
    };
    blob;
  };

  // Upload profile photo and return URL
  public shared ({ caller }) func uploadProfilePhoto(blob : Storage.ExternalBlob) : async Storage.ExternalBlob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload profile photos");
    };
    let uploadedBlob = await uploadBlobInternal(blob);
    uploadedBlob;
  };

  // Upload post video and return URL
  public shared ({ caller }) func uploadPostVideo(blob : Storage.ExternalBlob) : async Storage.ExternalBlob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload post videos");
    };
    let uploadedBlob = await uploadBlobInternal(blob);
    uploadedBlob;
  };

  // Upload place photo and return URL
  public shared ({ caller }) func uploadPlacePhoto(blob : Storage.ExternalBlob) : async Storage.ExternalBlob {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload place photos");
    };
    let uploadedBlob = await uploadBlobInternal(blob);
    uploadedBlob;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    users.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    users.add(caller, profile);
  };
};
