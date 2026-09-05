# Security Specification: Video Downloader Firebase & Firestore ABAC

## 1. Data Invariants
1. **User Isolation**: A user's profile and download history subcollection `/users/{userId}/downloads/{downloadId}` can only be accessed, created, updated, or deleted by that specific authenticated user (`request.auth.uid == userId`).
2. **Immutable Keys**: The user's UID (`id`, `userId`), creation timestamp (`createdAt`), and platform cannot be modified once set.
3. **No Cross-User Poisoning**: An attacker cannot read, write, or list download records of another user.
4. **Strict Schema and Bounds**: Every string field has bounded length (`<= 128`, `<= 500`, `<= 2048`) to prevent wallet-draining injection attacks.
5. **Path ID Validation**: Document IDs must pass character regex validation and length bounds (`isValidId`).

## 2. The Dirty Dozen Payloads (Rejection Matrix)
1. **Unauthenticated Read**: Anonymous/unauthenticated `GET /users/{userId}` -> PERMISSION_DENIED.
2. **Unauthenticated Write**: Anonymous `SET /users/{userId}` -> PERMISSION_DENIED.
3. **Cross-User Snooping**: User A `GET /users/{userB}` -> PERMISSION_DENIED.
4. **Cross-User Download Stealing**: User A `LIST /users/{userB}/downloads` -> PERMISSION_DENIED.
5. **Cross-User Download Injection**: User A writes to `/users/{userB}/downloads/{dlId}` -> PERMISSION_DENIED.
6. **UID Spoofing**: User A writes to `/users/{userA}` with payload `id: "userB"` -> PERMISSION_DENIED.
7. **Junk / Oversized ID Attack**: Writing to `/users/{userA}/downloads/bad#id!%` or >128 char ID -> PERMISSION_DENIED.
8. **Shadow Field Injection**: Writing to `/users/{userId}` with extra arbitrary fields (`isAdmin: true`, `hacked: 1`) -> PERMISSION_DENIED.
9. **Invalid Platform Enum**: Writing to `/users/{userId}/downloads/{id}` with `platform: "malicious_site"` -> PERMISSION_DENIED.
10. **Oversized String Payload**: Writing a title >500 characters or URL >2048 characters -> PERMISSION_DENIED.
11. **Immutable Key Mutation**: Attempting to alter `createdAt` or `userId` in existing download item -> PERMISSION_DENIED.
12. **Catch-All Default Deny**: Accessing `/randomCollection/randomDoc` -> PERMISSION_DENIED.
