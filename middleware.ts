import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);
const isPublicApiRoute = createRouteMatcher(["/api/webhooks(.*)"]);
const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Skip auth for public API routes (webhooks)
  if (isPublicApiRoute(req)) {
    return;
  }
  const { userId, orgId } = await auth();

  // If user is already authenticated and tries to access sign-in/sign-up pages,
  // redirect them to dashboard or onboarding (prevents "Session already exists" error)
  if (isAuthRoute(req) && userId) {
    if (orgId) {
      // User has an organization, redirect to dashboard
      const dashboardUrl = new URL("/dashboard", req.url);
      return NextResponse.redirect(dashboardUrl);
    } else {
      // User is logged in but has no organization, redirect to create one
      const onboardingUrl = new URL("/onboarding/create-organization", req.url);
      return NextResponse.redirect(onboardingUrl);
    }
  }

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
};
