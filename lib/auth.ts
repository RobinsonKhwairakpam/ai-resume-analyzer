// Clerk authentication is handled via middleware and environment variables
// No additional configuration needed here - Clerk handles everything via @clerk/nextjs

export { auth, currentUser } from "@clerk/nextjs/server";
