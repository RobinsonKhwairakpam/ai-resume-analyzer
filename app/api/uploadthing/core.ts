import { createUploadthing, type FileRouter } from "uploadthing/next";
 
const f = createUploadthing();
 
export const ourFileRouter = {
  resumeUploader: f({ pdf: { maxFileSize: "4MB" }, "application/msword": { maxFileSize: "4MB" }, "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "4MB" } })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata?.userId);
      console.log("file url", file.url);
      return { uploadedBy: metadata?.userId };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;

