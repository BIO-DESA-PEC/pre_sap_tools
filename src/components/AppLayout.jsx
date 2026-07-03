"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import styles from "./AppLayout.module.css";
import {
  FaBox,
  FaFileUpload,
  FaExchangeAlt,
  FaSignOutAlt,
  FaFileAlt,
  FaFolderOpen,
  FaBoxOpen,
  FaVideo,
  FaHome,
} from "react-icons/fa";

export default function AppLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [showSubmenu, setShowSubmenu] = useState(false);
  const [showTransferSubmenu, setShowTransferSubmenu] = useState(false);
  const [showTorresSubmenu, setShowTorresSubmenu] = useState(false);
  const [rol, setRol] = useState(null);

  useEffect(() => {
    if (status !== "loading" && !session) router.push("/login");
  }, [status, session, router]);

  useEffect(() => {
    const fetchRol = async () => {
      try {
        const res = await fetch(
          "https://pruebas-sap.onrender.com/verificar-usuario",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              correo: session?.user?.email,
            }),
          }
        );

        const data = await res.json();
        setRol(res.ok ? data.rol : "user");
      } catch {
        setRol("user");
      }
    };

    if (session?.user?.email && !rol) {
      fetchRol();
    }
  }, [session?.user?.email, rol]);

  if (status === "loading" || !rol) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  const usuario = session?.user?.name ?? "Usuario";

  const isActive = (path) => pathname === path;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>SAP MENU</div>

        <ul className={styles.navList}>
          {/* Inicio */}
          <li className={isActive("/dashboard") ? styles.active : ""}>
            <Link href="/dashboard">
              <FaHome /> Inicio
            </Link>
          </li>

          {/* =========================
              TEJIDOS + ADMINISTRADOR
          ========================== */}
          {(rol === "Administrador" || rol === "Tejidos") && (
            <>
              <li
                onClick={() =>
                  setShowTransferSubmenu(!showTransferSubmenu)
                }
                className={styles.hasSubmenu}
              >
                <FaExchangeAlt /> Transferencias ▾
              </li>

              {showTransferSubmenu && (
                <ul className={styles.submenu}>
                  <li
                    className={
                      isActive("/transferStocks")
                        ? styles.active
                        : ""
                    }
                  >
                    <Link href="/transferStocks">
                      Realizar Transferencia
                    </Link>
                  </li>

                  <li
                    className={
                      isActive("/transfer")
                        ? styles.active
                        : ""
                    }
                  >
                    <Link href="/transfer">
                      Ver Transferencias
                    </Link>
                  </li>
                </ul>
              )}

              <li
                className={
                  isActive("/reportes")
                    ? styles.active
                    : ""
                }
              >
                <Link href="/reportes">
                  <FaFileAlt /> Reporte de Inventario
                </Link>
              </li>

              <li
                className={
                  isActive("/solicitudes")
                    ? styles.active
                    : ""
                }
              >
                <Link href="/solicitudes">
                  <FaFolderOpen /> Solicitud-Transferencia
                </Link>
              </li>
            </>
          )}

          {/* =========================
                SOLO ADMINISTRADOR
          ========================== */}
          {rol === "Administrador" && (
            <>
              <li
                className={
                  isActive("/archivo")
                    ? styles.active
                    : ""
                }
              >
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
                  <li
                    className={
                      isActive("/caja")
                        ? styles.active
                        : ""
                    }
                  >
                    <Link href="/caja">
                      UDO Cajas
                    </Link>
                  </li>

                  <li
                    className={
                      isActive("/archivo_caja")
                        ? styles.active
                        : ""
                    }
                  >
                    <Link href="/archivo_caja">
                      Carga Cajas Masiva
                    </Link>
                  </li>

                  <li
                    className={
                      isActive("/reporte_caja")
                        ? styles.active
                        : ""
                    }
                  >
                    <Link href="/reporte_caja">
                      Reporte Cajas Instrumental
                    </Link>
                  </li>

                  <li
                    className={
                      isActive("/logs")
                        ? styles.active
                        : ""
                    }
                  >
                    <Link href="/logs">
                      Logs Cajas
                    </Link>
                  </li>
                </ul>
              )}

              <li
                className={
                  isActive("/activo_fijo")
                    ? styles.active
                    : ""
                }
              >
                <Link href="/activo_fijo">
                  <FaBoxOpen /> Activo Fijo
                </Link>
              </li>
            </>
          )}

          {/* =========================
             ADMINISTRADOR + LOGÍSTICA
          ========================== */}
          {(rol === "Administrador" || rol === "Logística") && (
            <>
              <li
                onClick={() =>
                  setShowTorresSubmenu(!showTorresSubmenu)
                }
                className={styles.hasSubmenu}
              >
                <FaVideo /> Torres ▾
              </li>

              {showTorresSubmenu && (
                <ul className={styles.submenu}>
                  <li
                    className={
                      isActive("/torres")
                        ? styles.active
                        : ""
                    }
                  >
                    <Link href="/torres">
                      Gestión de Torres
                    </Link>
                  </li>

                  <li
                    className={
                      isActive("/torres/carga-masiva")
                        ? styles.active
                        : ""
                    }
                  >
                    <Link href="/torres/carga-masiva">
                      Carga Masiva Torres
                    </Link>
                  </li>
                </ul>
              )}
            </>
          )}
        </ul>

        <div className={styles.footer}>
          <span>
            👤 {usuario} — <em>{rol}</em>
          </span>

          <button
            onClick={() =>
              signOut({
                callbackUrl: "/login",
              })
            }
            className={styles.logout}
          >
            <FaSignOutAlt /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}