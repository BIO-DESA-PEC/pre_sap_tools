"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Caja.module.css";

export default function ModalImagenesCaja({ open, onClose, codigoCaja, apiBase }) {
  const inputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [imagenes, setImagenes] = useState([]);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const copiarLink = async (url) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setOkMsg("Link copiado ✅");
      setTimeout(() => setOkMsg(""), 2000);
    } catch (e) {
      setError("No se pudo copiar el link (permiso del navegador).");
      setTimeout(() => setError(""), 2500);
    }
  };

  const cargarImagenes = async () => {
    if (!codigoCaja) return;

    setLoading(true);
    setError("");
    setOkMsg("");

    try {
      const res = await fetch(
        `${apiBase}/cajas-instrumental/${encodeURIComponent(codigoCaja)}/imagenes`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "No se pudo listar imágenes");
      }

      const data = await res.json();
      setImagenes(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Error cargando imágenes");
      setImagenes([]);
    } finally {
      setLoading(false);
    }
  };

  const onUploadFiles = async (files) => {
    if (!files || files.length === 0) return;

    if (!codigoCaja) {
      setError("Primero selecciona/ingresa un Código de Caja.");
      return;
    }

    setSubiendo(true);
    setError("");
    setOkMsg("");

    try {
      // 1 request por archivo (estable)
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);

        const res = await fetch(
          `${apiBase}/cajas-instrumental/${encodeURIComponent(codigoCaja)}/imagenes`,
          { method: "POST", body: fd }
        );

        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.error || `Error subiendo ${f.name}`);
        }
      }

      setOkMsg("Imágenes subidas ✅");
      await cargarImagenes();
    } catch (e) {
      setError(e.message || "Error subiendo imágenes");
    } finally {
      setSubiendo(false);
      // Limpia el input para poder volver a subir el mismo archivo si quiere
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Cargar al abrir
  useEffect(() => {
    if (open) cargarImagenes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, codigoCaja]);

  if (!open) return null;

  return (
    <div
      className={styles.modalOverlay}
      onMouseDown={(e) => {
        // Cerrar clic fuera
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={styles.modalImagenes}>
        {/* HEADER */}
        <div className={styles.modalImagenesHeader}>
          <div className={styles.modalImagenesTitle}>
            <h3>Imágenes de la Caja: {codigoCaja || "—"}</h3>
            <small>Se guardan en SharePoint · Biblioteca: Documentos</small>
          </div>

          <button className={styles.modalCloseX} onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {/* TOOLBAR */}
        <div className={styles.modalImagenesToolbar}>
          <div className={styles.toolbarLeft}>
            <button
              className={styles.botonPrimary}
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={subiendo || !codigoCaja}
              title={!codigoCaja ? "Selecciona un código de caja" : "Subir imágenes"}
            >
              {subiendo ? "Subiendo..." : "Agregar imágenes"}
            </button>

            <button
              className={styles.botonSecondary}
              type="button"
              onClick={cargarImagenes}
              disabled={loading}
            >
              {loading ? "Cargando..." : "Refrescar"}
            </button>
          </div>

          <div className={styles.toolbarRight}>
            {imagenes?.length || 0} archivo(s)
          </div>
        </div>

        {/* INPUT OCULTO */}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => onUploadFiles(Array.from(e.target.files || []))}
        />

        {/* ALERTAS */}
        {error ? <div className={styles.errorBanner}>{error}</div> : null}
        {okMsg ? <div className={styles.okBanner}>{okMsg}</div> : null}

        {/* BODY */}
        <div className={styles.modalImagenesBody}>
          {loading ? (
            <div className={styles.emptyState}>Cargando imágenes…</div>
          ) : !imagenes?.length ? (
            <div className={styles.emptyState}>
              Aún no hay imágenes cargadas para esta caja.
            </div>
          ) : (
            <div className={styles.imagenesGrid}>
              {imagenes.map((img, idx) => {
                const key = img.id || `${img.name || "img"}-${idx}`;
                const src = img.webUrl || img.downloadUrl || "";
                const canOpen = Boolean(img.webUrl);

                return (
                  <div className={styles.imgCard} key={key}>
                    <div className={styles.imgPreview}>
                      {src ? (
                        <img src={src} alt={img.name || "imagen"} />
                      ) : (
                        <div className={styles.imgFallback}>Sin vista previa</div>
                      )}
                    </div>

                    <div className={styles.imgMeta}>
                      <div className={styles.imgName} title={img.name || ""}>
                        {img.name || "—"}
                      </div>

                      <div className={styles.imgActions}>
                        <button
                          className={styles.linkBtn}
                          type="button"
                          disabled={!canOpen}
                          onClick={() => canOpen && window.open(img.webUrl, "_blank")}
                          title={canOpen ? "Abrir en SharePoint" : "No hay link"}
                        >
                          Ver
                        </button>

                        <button
                          className={styles.linkBtn}
                          type="button"
                          disabled={!canOpen}
                          onClick={() => copiarLink(img.webUrl)}
                          title={canOpen ? "Copiar link" : "No hay link"}
                        >
                          Copiar link
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
