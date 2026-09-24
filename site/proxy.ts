import { NextResponse, type NextRequest } from "next/server";

const canonicalHost = "factory.olegkoval.com";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  if (request.nextUrl.hostname !== canonicalHost) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: "/:path*",
};
