"use client";

import { useEffect, useState } from "react";
import styles from "./activo.module.css";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { FaHome, FaSignOutAlt, FaEye, FaDownload } from "react-icons/fa";

export default function ActivoFijoPage() {
  const router = useRouter();
  const [activos, setActivos] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [activoSeleccionado, setActivoSeleccionado] = useState(null);
  const [formData, setFormData] = useState({
    AssetSerialNumber: "",
    U_LS_BODEGA: "",
    U_SYP_CCLIENTE: "",
    BarCode: ""
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetch("https://pruebas-sap-back.onrender.com/activos-fijos-vista")
      .then(res => res.json())
      .then(data => setActivos(data));

    fetch("https://pruebas-sap-back.onrender.com/warehouses")
      .then(res => res.json())
      .then(data => setWarehouses(data.warehouses));
  }, []);

  const handleSeleccionar = (item) => {
    setActivoSeleccionado(item);
    setFormData({
      AssetSerialNumber: item.Lote || "",
      U_LS_BODEGA: item.CodigoBodega || "",
      U_SYP_CCLIENTE: item.CodigoAF || "",
      BarCode: item.CodigoBarras || ""
    });
    setModalVisible(false);
  };

  const handleActualizar = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`https://pruebas-sap-back.onrender.com/activos-fijos/${activoSeleccionado.CodigoItem}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (res.ok) {
        alert("Activo actualizado correctamente");
      } else {
        alert("Error al actualizar: " + result.error);
      }
    } catch (error) {
      alert("Error en la solicitud: " + error.message);
    }
    setIsUpdating(false);
  };

  const descargarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(activos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ActivosFijos");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "Inventario_Activos_Fijos.xlsx");
  };

  const activosFiltrados = activos.filter(item =>
    item.CodigoItem.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.NombreItem.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.headerBar}>
        <button
          className={styles.iconButton}
          onClick={() => router.push("/dashboard")}
          title="Ir al menú principal"
        >
          <FaHome size={20} />
        </button>

        <h2 className={styles.titleCentered}>Gestión Activos Fijos</h2>

        <button
          className={styles.iconButton}
          onClick={() => {
            localStorage.removeItem("usuario");
            router.push("/login");
          }}
          title="Cerrar sesión"
        >
          <FaSignOutAlt size={20} />
        </button>
      </div>

      <div className={styles.buttonGroup}>
        <button className={styles.iconAction} onClick={() => setModalVisible(true)}>
          <FaEye /> Ver Activos Fijos
        </button>

        <button className={styles.iconAction} onClick={descargarExcel}>
          <FaDownload /> Descargar Inventario Activos Fijos
        </button>
      </div>

      {modalVisible && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Lista de Activos Fijos</h2>
              <button onClick={() => setModalVisible(false)}>✕</button>
            </div>

            <input
              className={styles.input}
              placeholder="Buscar por código o nombre"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            <div className={styles.scrollContainer}>
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Grupo</th>
                    <th>Bodega</th>
                    <th>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {activosFiltrados.map((item) => (
                    <tr key={item.CodigoItem} onClick={() => handleSeleccionar(item)}>
                      <td>{item.CodigoItem}</td>
                      <td>{item.NombreItem}</td>
                      <td>{item.NombreGrupo}</td>
                      <td>{item.NombreBodega}</td>
                      <td>{item.Cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activoSeleccionado && (
        <div className={styles.formulario}>
          <h2 className={styles.formularioTitulo}>Editar Activo: {activoSeleccionado.CodigoItem}</h2>
          <p><strong>Nombre del Ítem:</strong> {activoSeleccionado.NombreItem}</p>

          <label>
            Lote:
            <input
              className={styles.input}
              type="text"
              value={formData.AssetSerialNumber}
              disabled={isUpdating}
              onChange={(e) => setFormData({ ...formData, AssetSerialNumber: e.target.value })}
            />
          </label>

          <label>
            Bodega:
            <select
              className={styles.input}
              value={formData.U_LS_BODEGA}
              disabled={isUpdating}
              onChange={(e) => setFormData({ ...formData, U_LS_BODEGA: e.target.value })}
            >
              <option value="">Seleccione una bodega</option>
              {warehouses.map((wh) => (
                <option key={wh.CodigoBodega} value={wh.CodigoBodega}>
                  {wh.CodigoBodega} - {wh.NombreBodega}
                </option>
              ))}
            </select>
          </label>

          <label>
            Código Producto Cliente:
            <input
              className={styles.input}
              type="text"
              value={formData.U_SYP_CCLIENTE}
              disabled={isUpdating}
              onChange={(e) => setFormData({ ...formData, U_SYP_CCLIENTE: e.target.value })}
            />
          </label>

          <label>
            Código de Barras:
            <input
              className={styles.input}
              type="text"
              value={formData.BarCode}
              disabled={isUpdating}
              onChange={(e) => setFormData({ ...formData, BarCode: e.target.value })}
            />
          </label>

          <div className={styles.centerButton}>
            <button
              className={styles.button}
              onClick={handleActualizar}
              disabled={isUpdating}
            >
              {isUpdating ? "Actualizando..." : "Actualizar"}
            </button>
            {isUpdating && <div className={styles.spinner}></div>}
          </div>
        </div>
      )}
    </div>
  );
}
