import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId } = await auth();

  // If accessing protected routes, require authentication
  if (isProtectedRoute(req)) {
    if (!userId) {
      return (await auth()).redirectToSignIn();
    }

    // If user is authenticated but has no organization, redirect to create one
    if (!orgId) {
      const onboardingUrl = new URL("/onboarding/create-organization", req.url);
      return NextResponse.redirect(onboardingUrl);
    }
  }

  // If user has an org and tries to access onboarding, redirect to dashboard
  if (isOnboardingRoute(req) && userId && orgId) {
    const dashboardUrl = new URL("/dashboard", req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Protect onboarding routes (must be logged in)
  if (isOnboardingRoute(req) && !userId) {
    return (await auth()).redirectToSignIn();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
  runtime: "nodejs",
};
