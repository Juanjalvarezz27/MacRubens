import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

const handler = NextAuth({
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

        // 2. Si no existe o está inactivo
        if (!user) {
          throw new Error("Este usuario no existe en el sistema.");
        }
        if (!user.activo) {
          throw new Error("Este usuario ha sido desactivado.");
        }

        // 3. Comparamos la contraseña encriptada
        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error("Contraseña incorrecta. Intenta de nuevo.");
        }

        // 4. Si todo está bien, retornamos los datos básicos para la sesión
        return {
          id: user.id,
          name: user.nombre,
          username: user.username,
        };
      }
    })
  ],
  pages: {
    signIn: "/", // Le decimos a NextAuth que nuestra vista de login es la raíz
  },
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60, // La sesión durará 12 horas (un turno completo)
  },
  callbacks: {
    // Aquí guardamos el ID en el token para poder usarlo luego en las ventas
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };