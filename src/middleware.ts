export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    // 1. Protege todas las vistas de la aplicación (Frontend)
    "/home/:path*",
    
    // 2. Protege todos los endpoints de la base de datos (Backend)
    "/api/((?!auth).*)"
  ],
};