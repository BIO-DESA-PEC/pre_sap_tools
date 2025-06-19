"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import styles from "./dashboard.module.css";
import {
  FaBox,
  FaFileUpload,
  FaExchangeAlt,
  FaSignOutAlt,
  FaFileAlt,
  FaFolderOpen,
} from "react-icons/fa";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showSubmenu, setShowSubmenu] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className={styles.loading}>Cargando…</div>;
  }

  const usuario = session?.user?.name || "Usuario";
  const rol = session?.user?.role || "user";

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>SAP MENU</div>

        <ul className={styles.navList}>
          {/* Transferencia solo para Administrador y Tejidos */}
          {(rol === "Administrador" || rol === "Tejidos") && (
            <li>
              <Link href="/transferStocks">
                <FaExchangeAlt /> Transferencia
              </Link>
            </li>
          )}

          {/* Reportes y Solicitudes solo para Administrador y Tejidos */}
          {(rol === "Administrador" || rol === "Tejidos") && (
            <>
              <li>
                <Link href="/reportes">
                  <FaFileAlt /> Reporte de Inventario
                </Link>
              </li>
              <li>
                <Link href="/solicitudes">
                  <FaFolderOpen /> Solicitud-Transferencia
                </Link>
              </li>
            </>
          )}

          {/* Subir archivo y cajas solo para Administrador y Logística */}
          {(rol === "Administrador" || rol === "Logística") && (
            <>
              <li>
                <Link href="/archivo">
                  <FaFileUpload /> Transferencias Masivas
                </Link>
              </li>
              <li
                onClick={() => setShowSubmenu(!showSubmenu)}
                className={styles.hasSubmenu}
              >
                <FaBox /> Cajas ▾
              </li>
              {showSubmenu && (
                <ul className={styles.submenu}>
                  <li><Link href="/caja">UDO Cajas</Link></li>
                  <li><Link href="/archivo_caja">Carga Cajas Masiva</Link></li>
                </ul>
              )}
            </>
          )}
        </ul>

        <div className={styles.footer}>
          <span>👤 {usuario} — <em>{rol}</em></span>

          <button onClick={handleLogout} className={styles.logout}>
            <FaSignOutAlt /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className={styles.content}>
        <div className={styles.welcomeCard}>
          <h1>👋 ¡Hola, {usuario}!</h1>
          <p>
            Bienvenido al sistema de gestión <strong>SAP Business One</strong>.
          </p>
          <p>Selecciona una opción del menú lateral para comenzar a trabajar.</p>
        </div>
      </main>
    </div>
  );
}
