import { auth } from "@/auth";

// Next 16: "middleware" se renombró a "proxy" (corre en Node.js runtime).
export default auth((req) => {
  const isLogin = req.nextUrl.pathname.startsWith("/login");
  if (!req.auth && !isLogin) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico).*)"],
};
