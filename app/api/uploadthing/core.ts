// import { createUploadthing, type FileRouter } from "uploadthing/next";

// const f = createUploadthing();

// export const ourFileRouter = {
//   resumeUploader: f({ pdf: { maxFileSize: "4MB" }, "application/msword": { maxFileSize: "4MB" }, "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "4MB" } })
//     .onUploadComplete(async ({ metadata, file }) => {
//       console.log("Upload complete for userId:", metadata?.userId);
//       console.log("file url", file.url);
//       return { uploadedBy: metadata?.userId };
//     }),
// } satisfies FileRouter;

// export type OurFileRouter = typeof ourFileRouter;


import { createUploadthing, type FileRouter } from "uploadthing/next";

// 1. Initialize the helper with the expected metadata type: { userId: string }
const f = createUploadthing<{ userId: string }>();

// NOTE: This is a placeholder for your actual authentication function
// In a real app, this function would read the request headers (req)
// to verify the user's session and retrieve their ID.
const getUserAuthId = async (req: Request) => {
  // Replace this with your actual auth logic (e.g., from NextAuth, Clerk, etc.)
  // For example, reading a session cookie or token:
  const DUMMY_USER_ID = "auth_user_123";
  return { userId: DUMMY_USER_ID };
};

export const ourFileRouter = {
  resumeUploader: f({
    pdf: { maxFileSize: "4MB" },
    "application/msword": { maxFileSize: "4MB" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "4MB",
    },
  })
    // 2. Add the .middleware() step to populate the metadata
    .middleware(async ({ req }) => {
      // Get the user's ID from the request
      const auth = await getUserAuthId(req);

      // IMPORTANT: If the user is not authenticated, throw an error
      if (!auth.userId) throw new Error("Unauthorized: Must be logged in to upload.");

      // Return the object that will become the 'metadata' in onUploadComplete
      return { userId: auth.userId }; // <-- This populates the 'metadata' object
    })

    // 3. onUploadComplete now correctly uses 'metadata.userId'
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);

      // Note: We use metadata.userId now, without the optional chain '?'
      // because the middleware guarantees it exists.
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

