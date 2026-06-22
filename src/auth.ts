import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    // Por defecto Auth.js solo expone name/email/image en la sesión. Copiamos
    // el id del usuario (lo lleva `token.sub`, fijado por el flujo JWT con el
    // valor que devuelve `authorize`) para poder registrar quién cobró un pago.
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = creds?.email as string;
        const password = creds?.password as string;
        if (!email || !password) return null;
        const [u] = await db.select().from(users).where(eq(users.email, email));
        if (!u) return null;
        const ok = await bcrypt.compare(password, u.passwordHash);
        if (!ok) return null;
        return { id: u.id, email: u.email, name: u.name };
      },
    }),
  ],
});
