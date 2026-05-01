import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// 1. Definición de accesos para la Pizzería
// Nota: Aunque tu esquema actual no tiene "rol", lo dejo estructurado 
// para que cuando lo agregues (ej. Administrador vs Personal) no rompa nada.
const routePermissions: Record<string, string[]> = {
  "/home/configuracion": ["Administrador"],
  "/home/estadisticas": ["Administrador"],
  "/home/usuarios": ["Administrador"],
  // Rutas generales
  "/home": ["Administrador"],
};

const apiPermissions: Record<string, string[]> = {
  "/api/menu": ["Administrador"], // Solo admin cambia precios
  "/api/usuarios": ["Administrador"],
  "/api/pedidos": ["Administrador"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // A. EXCEPCIONES: Archivos estáticos y Auth
  if (
    pathname.startsWith("/_next") || 
    pathname.startsWith("/api/auth") ||
    pathname === "/" || 
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // B. OBTENER SESIÓN (JWT)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // C. PROTECCIÓN: SI NO HAY TOKEN
  if (!token) {
    // Si intenta acceder a la API sin sesión, devolvemos JSON 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión." }, 
        { status: 401 }
      );
    }
    // Si es una vista, redirigimos al Login (página raíz)
    return NextResponse.redirect(new URL("/", request.url));
  }

  // D. PROTECCIÓN DE ROLES (Opcional pero robusto)
  // Extraemos el rol del token (por defecto si no tienes roles, puedes saltar esto o usar "Administrador")
  const userRole = (token.rol as string) || "Administrador"; 

  // Verificar APIs
  if (pathname.startsWith("/api/")) {
    for (const [route, roles] of Object.entries(apiPermissions)) {
      if (pathname.startsWith(route) && !roles.includes(userRole)) {
        return NextResponse.json(
          { error: "Permisos insuficientes para esta acción técnica." }, 
          { status: 403 }
        );
      }
    }
  }

  // Verificar Vistas (Frontend)
  for (const [route, roles] of Object.entries(routePermissions)) {
    if (pathname.startsWith(route) && !roles.includes(userRole)) {
      // Si no tiene permiso para una vista específica, lo mandamos al inicio del home
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  return NextResponse.next();
}

// 2. MATCHER: Filtro de rutas que disparan este middleware
export const config = {
  matcher: [

    "/home/:path*",
    "/api/((?!auth).*)",
  ],
};