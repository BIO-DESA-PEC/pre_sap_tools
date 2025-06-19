"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./dashboard.module.css";
import { FaBox, FaFileUpload, FaExchangeAlt, FaSignOutAlt, FaFileAlt, FaFolderOpen } from "react-icons/fa";

export default function Dashboard() {
  const [usuario, setUsuario] = useState("");
  const [showSubmenu, setShowSubmenu] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("usuario");
    if (!user) {
      router.push("/login");
    } else {
      setUsuario(user);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    router.push("/login");
  };

  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>SAP MENU</div>
        <ul className={styles.navList}>
          <li><Link href="/transferStocks"><FaExchangeAlt /> Transferencia</Link></li>
          <li><Link href="/reportes"><FaFileAlt /> Reportes</Link></li>
          <li><Link href="/archivo"><FaFileUpload /> Subir Archivo</Link></li>
          <li><Link href="/solicitudes"><FaFolderOpen /> Solicitudes</Link></li>
          <li onClick={() => setShowSubmenu(!showSubmenu)} className={styles.hasSubmenu}>
            <FaBox /> Cajas ▾
          </li>
          {showSubmenu && (
            <ul className={styles.submenu}>
              <li><Link href="/caja">Cajas</Link></li>
              <li><Link href="/archivo_caja">Carga Masiva</Link></li>
            </ul>
          )}
        </ul>

        <div className={styles.footer}>
          <span>👤 {usuario}</span>
          <button onClick={handleLogout} className={styles.logout}>
            <FaSignOutAlt /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className={styles.content}>
  <div className={styles.welcomeCard}>
    <h1>👋 ¡Hola, {usuario}!</h1>
    <p>Bienvenido al sistema de gestión <strong>SAP Business One</strong>.</p>
    <p>Selecciona una opción del menú lateral para comenzar a trabajar.</p>
  </div>
</main>

    </div>
  );
}
