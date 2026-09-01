import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const session = token ? await verifySession(token) : null;

  const isProtected = ["/dashboard", "/pos", "/products", "/contacts", "/businesses", "/returns"].some(
    (path) => req.nextUrl.pathname.startsWith(path)
  );
  const isLogin = req.nextUrl.pathname.startsWith("/login");

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLogin && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/pos/:path*", "/products/:path*", "/contacts/:path*", "/businesses/:path*", "/returns/:path*", "/login"],
};
