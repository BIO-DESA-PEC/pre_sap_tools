"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import styles from "./archivo.module.css";
import { FaFileExcel, FaHome, FaSignOutAlt, FaDownload } from "react-icons/fa";

export default function UploadFile() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirección si no hay sesión
  if (status === "loading") return null;
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setMessage("");
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Selecciona un archivo");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    setMessage("");

    try {
      const response = await fetch("https://pruebas-sap-back.onrender.com/stock-transfer-archivo", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setMessage(data.error ? `❌ Error: ${data.details}` : "✅ ¡Transferencia exitosa!");

      if (!data.error) {
        setFile(null);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setMessage("❌ Error al subir el archivo");
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
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
}
