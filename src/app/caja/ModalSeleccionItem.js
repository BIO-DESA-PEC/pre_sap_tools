// ModalSeleccionItem.js
"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./Caja.module.css";

export default function ModalSeleccionItem({ onClose, onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 30;

  // ✅ Cerrar con ESC
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(
          "https://pruebas-sap.onrender.com/inventario-af-cajas"
        );
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error al obtener ítems:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // ✅ Filtrado (código o descripción)
  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const cod = (item["Código"] || "").toString().toLowerCase();
      const des = (item["Descripción"] || "").toString().toLowerCase();
      return cod.includes(q) || des.includes(q);
    });
  }, [items, searchTerm]);

  // ✅ Reset página al buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));

  // Asegura que currentPage no se salga si cambia totalPages
  useEffect(() => {
    setCurrentPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const handleSelect = (item) => {
    onSelect?.(item);
    onClose?.();
  };

  // ✅ Cerrar clic fuera
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div className={styles.modalOverlay} onMouseDown={handleOverlayClick}>
      <div className={styles.modalPro}>
        {/* HEADER */}
        <div className={styles.modalProHeader}>
          <div>
            <div className={styles.modalProTitle}>
              Datos Maestros de Artículos y Activos Fijos
            </div>
            <div className={styles.modalProSubtitle}>
              {loading ? "Cargando..." : `${filteredItems.length} resultados`}
            </div>
          </div>

          <button
            className={styles.modalProClose}
            onClick={onClose}
            title="Cerrar"
            aria-label="Cerrar"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* TOOLBAR */}
        <div className={styles.modalProToolbar}>
          <input
            type="text"
            placeholder="Buscar por código o descripción…"
            className={styles.modalProSearch}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />

          <div className={styles.modalProHint}>
            Enter no selecciona (solo botón). ESC cierra.
          </div>
        </div>

        {/* BODY */}
        <div className={styles.modalProBody}>
          {loading ? (
            <div className={styles.modalProEmpty}>Cargando información…</div>
          ) : paginatedItems.length === 0 ? (
            <div className={styles.modalProEmpty}>
              No se encontraron resultados con “{searchTerm}”
            </div>
          ) : (
            <table className={styles.modalProTable}>
              <thead>
  <tr>
    <th>Código</th>
    <th>Descripción</th>
    <th>Grupo</th>
    <th>Tipo</th>
    <th>Estado</th>
    <th>Cód. Prod. Cliente</th>
    <th>Lote</th>
    <th>Serie</th>
    <th>Costo</th>
    <th style={{ width: 140 }}>Acción</th>
  </tr>
</thead>
  <tbody>
  {paginatedItems.map((item, idx) => (
    <tr key={`${item["Código"] || "x"}-${idx}`}>
      <td className={styles.mono}>{item["Código"]}</td>
      <td title={item["Descripción"] || ""}>{item["Descripción"]}</td>
      <td>{item["Grupo de Artículos"]}</td>
      <td>{item["Tipo"]}</td>
      <td>{item["Estado"]}</td>
      <td>{item["Codigo Producto Cliente"]}</td>
      <td>{item["Lote"]}</td>
      <td>{item["Serie"]}</td>
      <td>{item["Costo"]}</td>
      <td>
        <button
          className={styles.botonAzul}
          onClick={() => handleSelect(item)}
          type="button"
        >
          Seleccionar
        </button>
      </td>
    </tr>
  ))}
</tbody>

            </table>
          )}
        </div>

        {/* FOOTER */}
        <div className={styles.modalProFooter}>
          <button
            className={styles.paginationButton}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1 || loading}
            type="button"
          >
            Anterior
          </button>

          <div className={styles.paginationText}>
            Página <b>{currentPage}</b> de <b>{totalPages}</b>
          </div>

          <button
            className={styles.paginationButton}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages || loading}
            type="button"
          >
            Siguiente
          </button>

          <button
            className={styles.modalProCloseBtn}
            onClick={onClose}
            type="button"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
