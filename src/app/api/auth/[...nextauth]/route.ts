import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Instanciación directa y limpia, tal como en tu sistema de ejemplo
const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Por favor ingresa usuario y contraseña.");
        }

        // 1. Buscamos el usuario en la BD
        const user = await prisma.usuario.findUnique({
          where: { username: credentials.username }
        });

        // 2. Validaciones de existencia y borrado lógico
        if (!user) {
          throw new Error("Este usuario no existe en el sistema.");
        }
        
        if (user.activo === false) {
          throw new Error("Este usuario ha sido desactivado.");
        }

        // 3. Comparamos la contraseña encriptada
        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error("Contraseña incorrecta. Intenta de nuevo.");
        }

        // 4. Retornamos la data
        return {
          id: user.id,
          name: user.nombre,
          username: user.username,
        };
      }
    })
  ],
  pages: {
    signIn: "/", // La raíz es el login
  },
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60, // Turno completo de 12 horas
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };