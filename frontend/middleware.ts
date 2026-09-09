import { NextRequest, NextResponse } from "next/server";

// Protects /admin with HTTP Basic Auth. Set ADMIN_USER and ADMIN_PASSWORD
// as environment variables in your deployment (Vercel project settings).
// This is a lightweight gate suitable for a single kitchen operator -
// swap for proper auth (NextAuth, etc.) if you add multiple admin staff.
export function middleware(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expectedUser = process.env.ADMIN_USER || "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    // Fail closed: if no password is configured, block access rather than
    // silently leaving the admin panel open.
    return new NextResponse("Admin panel not configured. Set ADMIN_PASSWORD.", { status: 503 });
  }

  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      const [user, password] = decoded.split(":");
      if (user === expectedUser && password === expectedPassword) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
}

export const config = {
  matcher: "/admin/:path*",
};
