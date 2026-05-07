import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 1. CONFIGURACIÓN DEL VIGILANTE (Upstash)
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 peticiones cada 10 segundos
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 2. ESCUDO ANTIAQUETES (Rate Limiting)
  // Lo aplicamos a todas las rutas de API para proteger la base de datos
  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-real-ip") ?? "127.0.0.1";
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: "Demasiadas peticiones. Por favor, espera 10 segundos." },
        { status: 429 }
      );
    }
  }

  // 3. EXCEPCIONES: Archivos estáticos, Login y NextAuth
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 4. OBTENER SESIÓN
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 5. SI NO HAY SESIÓN ACTIVA (No Autorizado)
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión." },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 6. SI HAY SESIÓN: Pase libre
  return NextResponse.next();
}

// 7. MATCHERS
export const config = {
  matcher: [
    "/home/:path*",      
    "/api/:path*"        // Ahora vigilamos TODA la API para el rate limit
  ],
};