"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'; // estilos del toast
import styles from "./archivo.module.css";
import { FaFileExcel, FaHome, FaSignOutAlt, FaDownload } from "react-icons/fa";

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

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

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

    // 👇 siempre leemos como texto para poder mostrar exactamente lo que ves en "Respuesta"
    const raw = await response.text();

    // Intentamos JSON, si no es JSON queda como {}
    let data = {};
    try { data = JSON.parse(raw); } catch { /* no es JSON */ }

    // 👇 sacar el mensaje “mejor posible” de varias formas (SAP y variantes)
    const pickMsg =
      data?.error?.message?.value ||
      data?.message?.value ||
      data?.error?.message ||
      data?.error ||
      data?.details ||
      data?.value ||        // <-- tu caso de la captura
      raw;                   // si no hay nada, muestra el texto tal cual

    if (!response.ok || data?.success === false) {
      const cliente = data?.cliente ? ` | Cliente: ${data.cliente}` : "";
      toast.error(`❌ ${pickMsg}${cliente}`);
    } else {
      toast.success("✅ ¡Transferencia exitosa!");
      setFile(null);
    }
  } catch (err) {
    // Error de red / fetch
    toast.error(`❌ Error al subir el archivo: ${err?.message || String(err)}`);
  } finally {
    setIsUploading(false);
  }
};


  const goToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button onClick={goToDashboard} className={styles.topButton}>
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

      {/* Contenedor de los toasts */}
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} />
    </div>
  );
}
