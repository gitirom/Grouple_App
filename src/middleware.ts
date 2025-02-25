import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// Define a route matcher for protected routes
const isProtectedRoute = createRouteMatcher(["/group(.*)"])

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) auth().protect()
})

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
