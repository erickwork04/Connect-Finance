import { auth as clerkAuth, clerkClient as clerkClientServer } from "@clerk/nextjs/server";

export const isClerkConfigured = (): boolean => {
  return Boolean(
    (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY) &&
    process.env.CLERK_SECRET_KEY
  );
};

export const getAuthUserId = async (): Promise<string | null> => {
  if (!isClerkConfigured()) {
    return "demo_user";
  }
  try {
    const { userId } = await clerkAuth();
    return userId;
  } catch (error) {
    console.warn("[AI Studio] Clerk auth() fallback to demo_user:", error);
    return "demo_user";
  }
};

export const getClerkUser = async (userId: string) => {
  if (!isClerkConfigured()) {
    return {
      id: userId,
      firstName: "Demo",
      lastName: "User",
      emailAddresses: [{ emailAddress: "demo@finance.ai" }],
      publicMetadata: {
        subscriptionPlan: "premium",
      },
    };
  }
  return clerkClientServer().users.getUser(userId);
};
