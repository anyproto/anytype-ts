/**
 * @fileoverview Contains the enum "SpaceStatus" and related definitions.
 */
export enum SpaceStatus {
        Unknown                                  = 0, // State is unknown
        Loading                                  = 1, // Loading in progress
        Ok                                               = 2, // Operational
        Missing                                  = 3, // Space is missing
        Error                                    = 4, // Error state
        RemoteWaitingDeletion    = 5, // Awaiting remote deletion
        RemoteDeleted                    = 6, // Deleted remotely
        Deleted                                  = 7, // Deleted locally
        Active                                   = 8, // Space is active
        Joining                                  = 9, // Joining in progress
        Removing                                 = 10, // Removal in progress
};

export enum SpaceType {
        Private                                  = 0, // Private to the user
        Personal                                 = 1, // Personal across devices
        Shared                                   = 2, // Shared with others
};

export enum ParticipantPermissions {
        Reader                                   = 0, // Read-only
        Writer                                   = 1, // Can write
        Owner                                    = 2, // Full control
        None                                     = 3, // No access
};

export enum ParticipantStatus {
        Joining                                  = 0, // Joining the space
        Active                                   = 1, // Currently active
        Removed                                  = 2, // Removed from space
        Declined                                 = 3, // Declined invitation
        Removing                                 = 4, // Being removed
        Canceled                                 = 5, // Invitation canceled
};

export enum InviteType {
        WithApprove                      = 0, // Requires approval
        Guest                                    = 1, // Guest access
        WithoutApprove                   = 2, // Automatically approved
};
