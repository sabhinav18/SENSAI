// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
// import { NextResponse } from 'next/server';

//  const isProtectedRoute = createRouteMatcher([
//     "/dashboard(.*)",
//     "/resume(.*)",
//     "/interview(.*)",
//     "/ai-cover-letter(.*)",
//     "/onboarding(.*)",
//  ]);

//  export default clerkMiddleware(async (auth,req) => {
//     const {userId} = await auth() 

//     if(!userId && isProtectedRoute(req)){
//         const {redirectToSignIn} = await auth()
//         return redirectToSignIn();
//     }

//     return NextResponse.next();
//  });




// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//     // Always run for API routes
//     '/(api|trpc)(.*)',
//   ],
// };

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/resume(.*)",
  "/interview(.*)",
  "/ai-cover-letter(.*)",
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();

  // If route is protected and user not signed in → redirect to Clerk sign-in
  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn({
      returnBackUrl: req.url, // after sign-in, redirect back to requested page
    });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
