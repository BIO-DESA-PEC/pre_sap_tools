"use client";

import { useRef, useState } from "react";
import AppLayout from "@/components/AppLayout";
import styles from "./CargaMasivaTorres.module.css";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://pruebas-sap.onrender.com";

export default function CargaMasivaTorresPage() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [errores, setErrores] = useState([]);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setResultado(null);
    setErrores([]);

    if (!selected) {
      setFile(null);
      return;
    }

    const validExt = selected.name.toLowerCase().endsWith(".xlsx") || selected.name.toLowerCase().endsWith(".xls");

    if (!validExt) {
      setFile(null);
      setErrores(["Solo se permiten archivos Excel .xlsx o .xls."]);
      return;
    }

    setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setErrores(["Debe seleccionar un archivo Excel."]);
      return;
    }

    setLoading(true);
    setResultado(null);
    setErrores([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/torres/carga-masiva`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.ok === false) {
        setErrores(data.errores || [data.error || "Error al cargar archivo."]);
        return;
      }

      setResultado(data);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      setErrores([error.message || "Error inesperado."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <span className={styles.badge}>Módulo Torres</span>
            <h1>Carga Masiva de Torres</h1>
            <p>
              Importa y actualiza torres desde Excel usando las hojas
              <strong> Cabecera</strong> y <strong>Detalle</strong>.
            </p>
          </div>
        </div>

        <div className={styles.content}>
          <section className={styles.card}>
            <div className={styles.cardTitle}>
              <h2>Subir archivo</h2>
              <p>Selecciona el archivo Excel para procesar la carga masiva.</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <label className={styles.dropZone}>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className={styles.hiddenInput}
                />

                <div className={styles.uploadIcon}>📄</div>
                <h3>{file ? file.name : "Seleccionar archivo Excel"}</h3>
                <p>
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : "Formatos permitidos: .xlsx, .xls"}
                </p>
              </label>

              <button className={styles.button} type="submit" disabled={loading}>
                {loading ? "Procesando..." : "Subir y procesar"}
              </button>
            </form>
          </section>

        </div>

        {errores.length > 0 && (
          <div className={styles.errorBox}>
            <h3>Errores encontrados</h3>
            <ul>
              {errores.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {resultado && (
          <div className={styles.successBox}>
            <div className={styles.successHeader}>
              <div>
                <h3>{resultado.mensaje}</h3>
                <p>Total procesadas: {resultado.TotalProcesadas}</p>
              </div>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>DocEntry</th>
                  <th>Código Torre</th>
                  <th>Acción</th>
                  <th>Total Detalle</th>
                </tr>
              </thead>
              <tbody>
                {resultado.Torres?.map((t) => (
                  <tr key={t.DocEntry}>
                    <td>{t.DocEntry}</td>
                    <td>{t.CodigoTorre}</td>
                    <td>
                      <span className={styles.status}>{t.Accion}</span>
                    </td>
                    <td>{t.TotalDetalle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}