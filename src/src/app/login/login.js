"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "./login.module.css";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false); // Estado para controlar la carga
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // Activar spinner

    try {
      const response = await axios.post("https://pruebas-sap-back.onrender.com/login", {
        usuario,
        password,
      });

      localStorage.setItem("usuario", usuario); // Guardamos el usuario
      router.push("/dashboard"); // Redirige al dashboard
    } catch (error) {
      setMensaje(error.response?.data?.error || "Error en el login");
    } finally {
      setLoading(false); // Desactivar spinner
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Iniciar Sesión</h2>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Usuario"
            className={styles.input}
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? <div className={styles.spinner}></div> : "Ingresar"}
          </button>
        </form>

        {mensaje && <p className={styles.message}>{mensaje}</p>}
      </div>
    </div>
  );
}
