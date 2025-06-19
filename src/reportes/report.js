"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import axios from "axios";
import * as XLSX from "xlsx";
import styles from "./report.module.css";
import { FaHome, FaSignOutAlt } from "react-icons/fa";

const Report = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [fecha, setFecha] = useState("");
  const [codigoItem, setCodigoItem] = useState("");
  const [bodega, setBodega] = useState("");
  const [reportes, setReportes] = useState([]);
  const [error, setError] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const reportesPorPagina = 10;
  const [items, setItems] = useState([]);
  const [bodegasList, setBodegasList] = useState([]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchItems();
      fetchBodegas();
    }
  }, [status]);

  if (status === "loading") return null;
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const fetchItems = async () => {
    try {
      const response = await axios.get("https://pruebas-sap-back.onrender.com/items");
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error al obtener los ítems:", error);
    }
  };

  const fetchBodegas = async () => {
    try {
      const response = await axios.get("https://pruebas-sap-back.onrender.com/get-warehouses");
      setBodegasList(response.data.warehouses || []);
    } catch (error) {
      console.error("Error al obtener las bodegas:", error);
    }
  };

  const obtenerReportes = async () => {
    if (!fecha) {
      setError("Seleccione una fecha.");
      return;
    }
    setError(null);
    try {
      const response = await axios.get("https://pruebas-sap-back.onrender.com/reportinventario", {
        params: {
          fecha_actualizacion: fecha,
          codigo_item: codigoItem || undefined,
          bodega: bodega || undefined,
        },
      });
      setReportes(response.data);
      setPaginaActual(1);
    } catch (err) {
      setError("Error al obtener los reportes.");
    }
  };

  const cerrarSesion = () => {
    signOut({ callbackUrl: "/login" });
  };

  const indiceUltimoReporte = paginaActual * reportesPorPagina;
  const indicePrimerReporte = indiceUltimoReporte - reportesPorPagina;
  const reportesActuales = reportes.slice(indicePrimerReporte, indiceUltimoReporte);

  const downloadXLS = () => {
    const headers = [
      "Código Item", "Nombre Item", "Costo", "Costo Total", "Partida Arancelaria",
      "Código Almacén", "Nombre Almacén", "Cantidad", "Cantidad Comprometida", "Stock Final",
      "Código Barras", "Lote", "Fecha de Creación", "Fecha de Actualización", "Fecha Vencimiento",
      "Grupo", "Subgrupo"
    ];

    const rows = reportes.map(reporte => [
      reporte["Código Item"],
      reporte["Nombre Item"],
      reporte["Costo"],
      reporte["Costo Total"],
      reporte["Partida Arancelaria"],
      reporte["Código Almacen"],
      reporte["Nombre Almacen"],
      reporte["Cantidad"],
      reporte["Cantidad Comprometida"],
      reporte["Stock Final"],
      reporte["Cod Barras"],
      reporte["Lote"],
      reporte["Fecha de Creación"],
      reporte["Fecha de Actualización"],
      reporte["Fecha Vencimiento"],
      reporte["Grupo"],
      reporte["Subgrupo"]
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reportes");
    XLSX.writeFile(wb, "reportes.xlsx");
  };

  return (
    <div className={styles.reportContainer}>
      {/* Encabezado */}
      <div className={styles.topBar}>
        <button onClick={() => router.push("/dashboard")} className={styles.topButton}>
          <FaHome />
        </button>
        <h2 className={styles.titleCentered}>Reporte de Inventario</h2>
        <button onClick={cerrarSesion} className={styles.topButton} title="Cerrar sesión">
          <FaSignOutAlt />
        </button>
      </div>

      {/* Filtros */}
      <div className={styles.filterSection}>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className={styles.dateInput}
        />
        <select
          value={codigoItem}
          onChange={(e) => setCodigoItem(e.target.value)}
          className={styles.searchInput}
        >
          <option value="">-- Selecciona un ítem --</option>
          {items.map((item, index) => (
            <option key={index} value={item.ItemCode}>
              {item.ItemCode}
            </option>
          ))}
        </select>
        <select
          value={bodega}
          onChange={(e) => setBodega(e.target.value)}
          className={styles.searchInput}
        >
          <option value="">-- Selecciona una bodega --</option>
          {bodegasList.map((b, index) => (
            <option key={index} value={b.WarehouseCode}>
              {b.WarehouseName}
            </option>
          ))}
        </select>
        <button onClick={obtenerReportes} className={styles.filterButton}>
          Filtrar
        </button>
        <button onClick={downloadXLS} className={styles.filterButton}>
          Descargar XLS
        </button>
      </div>

      {/* Error */}
      {error && <p className={styles.errorMessage}>{error}</p>}

      {/* Tabla */}
      <table className={styles.reportTable}>
        <thead>
          <tr>
            <th>Código Item</th>
            <th>Nombre Item</th>
            <th>Costo</th>
            <th>Costo Total</th>
            <th>Partida Arancelaria</th>
            <th>Código Almacén</th>
            <th>Nombre Almacén</th>
            <th>Cantidad</th>
            <th>Cantidad Comprometida</th>
            <th>Stock Final</th>
            <th>Código Barras</th>
            <th>Lote</th>
            <th>Fecha de Creación</th>
            <th>Fecha de Actualización</th>
            <th>Fecha Vencimiento</th>
            <th>Grupo</th>
            <th>Subgrupo</th>
          </tr>
        </thead>
        <tbody>
          {reportesActuales.map((reporte, index) => (
            <tr key={index}>
              <td>{reporte["Código Item"]}</td>
              <td>{reporte["Nombre Item"]}</td>
              <td>{reporte["Costo"]}</td>
              <td>{reporte["Costo Total"]}</td>
              <td>{reporte["Partida Arancelaria"]}</td>
              <td>{reporte["Código Almacen"]}</td>
              <td>{reporte["Nombre Almacen"]}</td>
              <td>{reporte["Cantidad"]}</td>
              <td>{reporte["Cantidad Comprometida"]}</td>
              <td>{reporte["Stock Final"]}</td>
              <td>{reporte["Cod Barras"]}</td>
              <td>{reporte["Lote"]}</td>
              <td>{reporte["Fecha de Creación"]}</td>
              <td>{reporte["Fecha de Actualización"]}</td>
              <td>{reporte["Fecha Vencimiento"]}</td>
              <td>{reporte["Grupo"]}</td>
              <td>{reporte["Subgrupo"]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginación */}
      {reportes.length > reportesPorPagina && (
        <div className={styles.pagination}>
          <button
            className={styles.pageButton}
            onClick={() => setPaginaActual(paginaActual - 1)}
            disabled={paginaActual === 1}
          >
            Anterior
          </button>
          <span>
            Página {paginaActual} de {Math.ceil(reportes.length / reportesPorPagina)}
          </span>
          <button
            className={styles.pageButton}
            onClick={() => setPaginaActual(paginaActual + 1)}
            disabled={paginaActual === Math.ceil(reportes.length / reportesPorPagina)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default Report;
