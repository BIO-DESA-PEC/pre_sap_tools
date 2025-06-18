import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // 🔐 Proveedor Microsoft Entra ID
  providers: [
    MicrosoftEntraID({
      clientId:     process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer:       process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
      authorization: {
        params: {
          scope:  "openid profile email offline_access User.Read",
          prompt: "login",
        },
      },
    }),
  ],

  // 🔑 Sesiones JWT
  session: { strategy: "jwt" },
  secret:  process.env.NEXTAUTH_SECRET,

  // ⚙️ Callbacks mínimos: solo copiamos los datos básicos
  callbacks: {
    async jwt({ token, account, profile }) {
  if (account && profile) {
    token.accessToken = account.access_token;
    token.email       = profile.email || profile.preferred_username;
    token.name        = profile.name;

    // 🔍 Llamar al backend Flask para obtener el rol
    try {
      const res = await fetch("https://pruebas-sap-back.onrender.com/verificar-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: token.email }),
      });

      if (res.ok) {
        const data = await res.json();
        token.role = data.rol; // ← el rol real desde Flask
      } else {
        token.role = "user"; // rol por defecto si falla
      }
    } catch (error) {
      console.error("Error al consultar rol:", error);
      token.role = "user";
    }
  }

  return token;
},
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.email  = token.email;
      session.user.name   = token.name;
      session.user.role   = token.role;                              // Si lo necesitas en el front
      return session;
    },

    async redirect() {
      return "/dashboard";                                           // Ruta post-login
    },
  },
});
