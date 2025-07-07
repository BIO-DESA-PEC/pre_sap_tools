"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import styles from "./login.module.css";
import { FaMicrosoft } from "react-icons/fa";

export default function Login() {
  const [loading, setLoading] = useState(false);

  const handleMicrosoftLogin = () => {
    setLoading(true);
    signIn("microsoft-entra-id", { callbackUrl: "/dashboard" });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/images/biocells.png" alt="Logo Biocells" className={styles.logo} />

        <h1 className={styles.title}>BIOCELLS DISCOVERIES INTERNACIONAL</h1>
        <p className={styles.subtitle}>
          Plataforma de gestión integrada con <strong>SAP Business One</strong>
        </p>
        <p className={styles.subtitle}>
          Ambiente de pruebas 
        </p>
        <button
          onClick={handleMicrosoftLogin}
          className={styles.button}
          disabled={loading}
        >
          {loading ? (
            <div className={styles.spinner}></div>
          ) : (
            <>
              <FaMicrosoft size={20} style={{ marginRight: "8px" }} />
              Iniciar sesión con Microsoft
            </>
          )}
        </button>

        <p className={styles.contacto}>
          ¿Problemas para iniciar sesión? <br />
          Contacte a: <a href="mailto:mesadeayuda@biocells.pe">mesadeayuda@biocells.pe</a>
        </p>
      </div>
    </div>
  );
}
