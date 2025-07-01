"use client";
import { useState } from "react";
import styles from "./Caja.module.css";

export default function ModalCajas({ cajas, onSelect, onClose }) {
  const [filtro, setFiltro] = useState("");

  // Filtrar cajas únicas por CodigoCaja
  const cajasUnicas = Array.from(
    new Map(cajas.map((c) => [c.CodigoCaja, c])).values()
  );

  const cajasFiltradas = cajasUnicas.filter((caja) =>
    caja.CodigoCaja.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContenido}>
        <div className={styles.modalHeader}>
          <h3>Seleccione una Caja</h3>
          <button className={styles.modalCloseButton} onClick={onClose}>
            &times;
          </button>
        </div>

        <input
          type="text"
          placeholder="Buscar por código..."
          className={styles.inputControl}
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{ marginBottom: "10px", width: "100%" }}
        />

        <table className={styles.tablaModal}>
          <thead>
            <tr>
              <th>Código Caja</th>
              <th>Fecha</th>
              <th>Almacén</th>
              <th>Clase</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {cajasFiltradas.map((caja, index) => (
              <tr key={index}>
                <td>{caja.CodigoCaja}</td>
                <td>{new Date(caja.FechaCaja).toLocaleDateString()}</td>
                <td>{caja.Almacen}</td>
                <td>{caja.ClaseCaja}</td>
                <td>
                  <button
                    className={styles.botonSeleccionar}
                    onClick={() => onSelect(caja)}
                  >
                    Seleccionar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
