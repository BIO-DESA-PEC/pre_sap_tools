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
  FaBoxOpen,
} from "react-icons/fa";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [showTransferSubmenu, setShowTransferSubmenu] = useState(false);
  const [rol, setRol] = useState(null);

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.push("/login");
    }
  }, [status, session, router]);

  // Obtener el rol desde Flask al cargar el dashboard
  useEffect(() => {
    const fetchRol = async () => {
      try {
        const res = await fetch("https://pruebas-sap-back.onrender.com/verificar-usuario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo: session?.user?.email }),
        });

        if (res.ok) {
          const data = await res.json();
          setRol(data.rol);
        } else {
          setRol("user");
        }
      } catch (error) {
        console.error("Error al obtener rol:", error);
        setRol("user");
      }
    };

    if (session?.user?.email && !rol) {
      fetchRol();
    }
  }, [session?.user?.email, rol]);

  if (status === "loading" || !rol) {
    return <div className={styles.loading}>Cargando…</div>;
  }

  const usuario = session?.user?.name ?? "Usuario";

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>SAP MENU</div>

        <ul className={styles.navList}>
          {(rol === "Administrador" || rol === "Tejidos") && (
            <>
              <li
                onClick={() => setShowTransferSubmenu(!showTransferSubmenu)}
                className={styles.hasSubmenu}
              >
                <FaExchangeAlt /> Transferencias ▾
              </li>
              {showTransferSubmenu && (
                <ul className={styles.submenu}>
                  <li><Link href="/transferStocks">Realizar Transferencia</Link></li>
                  <li><Link href="/transfer">Ver Transferencias</Link></li>
                </ul>
              )}
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
                   <li><Link href="/logs">Logs Cajas</Link></li>
                </ul>
              )}
              <li>
                <Link href="/activo_fijo">
                  <FaBoxOpen /> Activo Fijo
                </Link>
              </li>
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
