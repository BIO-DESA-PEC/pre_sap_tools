'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaFileExcel, FaHome, FaSignOutAlt, FaDownload } from 'react-icons/fa';
import styles from './archivo_caja.module.css';

export default function ArchivoCaja() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [usuario, setUsuario] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errores, setErrores] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('usuario');
    if (!user) {
      router.push('/login');
    } else {
      setUsuario(user);
    }
  }, [router]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
    setErrores([]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Selecciona un archivo');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setMessage('');

    try {
      const response = await fetch('https://pruebas-sap-back.onrender.com/cajas-instrumental-archivo', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (response.status !== 200 || data.error || (data.errores && data.errores.length > 0)) {
        setMessage(`❌ Error al procesar el archivo`);
        setErrores(data.errores || [data.error || 'Error desconocido']);
      } else {
        setMessage('✅ ¡Carga masiva exitosa!');
        setFile(null);
        setErrores([]);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('❌ Error al subir el archivo');
      setErrores([error.message]);
    } finally {
      setIsUploading(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('usuario');
    router.push('/login');
  };

  if (!usuario) return null;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button onClick={() => router.push('/dashboard')} className={styles.topButton}>
          <FaHome />
        </button>
        <h2 className={styles.titleCentered}>Carga Masiva de Cajas</h2>
        <button onClick={cerrarSesion} className={styles.topButton} title="Cerrar sesión">
          <FaSignOutAlt />
        </button>
      </div>

      <div className={styles.container}>
        <h2 className={styles.title}>Subir Archivo Excel</h2>
        <p className={styles.description}>
          Para realizar la carga masiva, descarga el template y luego súbelo usando el botón inferior.
        </p>

        <a href="/template_carga_cajas.xlsx" download className={styles.downloadLink}>
          <FaDownload /> Descargar plantilla de Excel
        </a>

        <label className={styles.inputFile}>
          <FaFileExcel className={styles.icon} /> Seleccionar Archivo Excel
          <input type="file" accept=".xlsx" onChange={handleFileChange} hidden />
        </label>

        {file && <p className={styles.fileName}>Archivo seleccionado: {file.name}</p>}

        <button onClick={handleUpload} className={styles.button} disabled={!file || isUploading}>
          {isUploading ? 'Subiendo archivo...' : 'Subir'}
        </button>

        {isUploading && <div className={styles.spinner}></div>}
        <p className={styles.message}>{message}</p>

        {errores.length > 0 && (
          <div className={styles.errorBox}>
            <p>Errores encontrados:</p>
            <ul>
              {errores.map((err, index) => (
                <li key={index}>🔴 {err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
