"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./archivo.module.css";
import { FaFileExcel, FaHome, FaSignOutAlt, FaDownload } from "react-icons/fa";

/* ========= HELPERS ========= */
const safeParse = (t) => { try { return JSON.parse(t); } catch { return null; } };

// Prioriza DETAILS (que trae el JSON de SAP), luego message.value / value / error
const extractSapMessage = (rawText) => {
  // 1) Intentar parsear el body completo
  const top = safeParse(rawText);

  // Función para extraer mensaje de un objeto SAP-like
  const getMsgFromObj = (obj) => {
    if (!obj || typeof obj !== "object") return null;

    // Si trae details primero (puede ser string con JSON)
    if (obj.details) {
      if (typeof obj.details === "string") {
        const inner = safeParse(obj.details);
        // inner típico: { error: { message: { value: "..." } } }
        if (inner?.error?.message?.value) return String(inner.error.message.value);
        if (inner?.message?.value) return String(inner.message.value);
        if (inner?.value) return String(inner.value);
        // último intento con regex sobre el string raw
        const m = obj.details.match(/"value"\s*:\s*"([^"]+)"/) || obj.details.match(/'value'\s*:\s*'([^']+)'/);
        if (m) return m[1];
        // si no, devolver details tal cual
        return String(obj.details);
      }
      // details es objeto
      const d = obj.details;
      if (d?.error?.message?.value) return String(d.error.message.value);
      if (d?.message?.value) return String(d.message.value);
      if (d?.value) return String(d.value);
    }

    // Sin details o no trajo, probar otras rutas comunes
    if (obj?.error?.message?.value) return String(obj.error.message.value);
    if (obj?.message?.value) return String(obj.message.value);
    if (obj?.value) return String(obj.value);
    if (obj?.error?.message) return String(obj.error.message);
    if (obj?.error) return String(obj.error);

    return null;
  };

  // 2) Si es JSON, intentamos extraer priorizando details
  const fromTop = getMsgFromObj(top);
  if (fromTop) return fromTop;

  // 3) Regex directa sobre texto crudo (por si viene escapado)
  const m = rawText.match(/"value"\s*:\s*"([^"]+)"/) || rawText.match(/'value'\s*:\s*'([^']+)'/);
  if (m) return m[1];

  // 4) Último recurso: el texto completo
  return rawText;
};
/* =========================== */

export default function UploadFile() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") return null;
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handleFileChange = (e) => setFile(e.target.files[0] || null);

  const handleUpload = async () => {
    if (!file) {
      toast.warn("⚠️ Selecciona un archivo");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);

    try {
      const response = await fetch("https://pruebas-sap-back.onrender.com/stock-transfer-archivo", {
        method: "POST",
        body: formData,
      });

      // leemos como TEXTO para poder inspeccionar details aunque venga como string JSON
      const raw = await response.text();

      if (!response.ok) {
        const msg = extractSapMessage(raw);
        toast.error(`❌ ${msg}`);
        return;
      }

      toast.success("✅ ¡Transferencia exitosa!");
      setFile(null);
    } catch (err) {
      toast.error(`❌ Error al subir el archivo: ${err?.message || String(err)}`);
    } finally {
      setIsUploading(false);
    }
  };

  const goToDashboard = () => router.push("/dashboard");

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button onClick={goToDashboard} className={styles.topButton} title="Inicio">
          <FaHome />
        </button>
        <h2 className={styles.titleCentered}>Reporte de Inventario</h2>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className={styles.topButton} title="Cerrar sesión">
          <FaSignOutAlt />
        </button>
      </div>

      <div className={styles.container}>
        <h2 className={styles.title}>Subir Archivo Excel</h2>
        <p className={styles.description}>
          Para realizar la carga masiva, descarga el template y luego súbelo usando el botón inferior.
        </p>

        <a href="/template.xlsx" download className={styles.downloadLink}>
          <FaDownload /> Descargar plantilla de Excel
        </a>

        <label className={styles.inputFile}>
          <FaFileExcel className={styles.icon} />
          Seleccionar Archivo Excel
          <input type="file" onChange={handleFileChange} hidden />
        </label>

        {file && <p className={styles.fileName}>Archivo seleccionado: {file.name}</p>}

        <button onClick={handleUpload} className={styles.button} disabled={!file || isUploading}>
          {isUploading ? "Subiendo archivo..." : "Subir"}
        </button>

        {isUploading && <div className={styles.spinner}></div>}
      </div>

      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}
