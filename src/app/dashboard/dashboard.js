"use client";

import { useSession } from "next-auth/react";
import AppLayout from "@/components/AppLayout";
import styles from "./dashboard.module.css";

export default function Dashboard() {
  const { data: session } = useSession();
  const usuario = session?.user?.name ?? "Usuario";

  return (
    <AppLayout>
      <div className={styles.content}>
        <div className={styles.welcomeCard}>
          <h1>👋 ¡Hola, {usuario}!</h1>
          <p>
            Bienvenido al sistema de gestión <strong>SAP Business One</strong>.
          </p>
          <p>Selecciona una opción del menú lateral para comenzar a trabajar.</p>
        </div>
      </div>
    </AppLayout>
  );
}