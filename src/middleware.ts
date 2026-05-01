import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. EXCEPCIONES: Archivos estáticos, Login y NextAuth
  if (
    pathname.startsWith("/_next") || 
    pathname.startsWith("/api/auth") ||
    pathname === "/" || 
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. OBTENER SESIÓN
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 3. SI NO HAY SESIÓN ACTIVA (No Autorizado)
  if (!token) {
    // Si un componente intenta hacer fetch a la API sin estar logueado
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión." }, 
        { status: 401 }
      );
    }
    // Si intenta entrar a una vista como /home/configuracion
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 4. SI HAY SESIÓN: Pase libre a todo el sistema
  return NextResponse.next();
}

// 5. MATCHERS: ¿Qué rutas vigila este middleware?
export const config = {
  matcher: [
    "/home/:path*",      // Protege todo el panel administrativo
    "/api/((?!auth).*)"  // Protege toda la API excepto el login
  ],
};