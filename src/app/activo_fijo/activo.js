"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./activo.module.css";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { FaHome, FaSignOutAlt, FaEye, FaDownload } from "react-icons/fa";

const API_BASE = "https://pruebas-sap.onrender.com";

async function safeFetchJSON(url, opts) {
  try {
    const res = await fetch(url, { ...opts, cache: "no-store" });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}`, data: null };
    if (!ct.includes("application/json")) return { ok: false, error: "No-JSON", data: null };
    const data = await res.json();
    return { ok: true, error: null, data };
  } catch (e) {
    return { ok: false, error: e.message || "Network error", data: null };
  }
}

export default function ActivoFijoPage() {
  const router = useRouter();
  const [activos, setActivos] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [status, setStatus] = useState("Cargando datos…");
  const [errorMsg, setErrorMsg] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const [activoSeleccionado, setActivoSeleccionado] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // ---- Barcode UI state ----
  const [symbology, setSymbology] = useState("CODE128"); // CODE128 | EAN13
  const [eanPrefix, setEanPrefix] = useState("");        // sólo EAN13
  const [codeLength, setCodeLength] = useState(8);       // sólo CODE128
  const [isGenerating, setIsGenerating] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState("");   // texto del código
  const [barcodeImgUrl, setBarcodeImgUrl] = useState(""); // objectURL del PNG

  const [formData, setFormData] = useState({
    AssetSerialNumber: "",
    U_LS_BODEGA: "",
    U_SYP_CCLIENTE: "",
    BarCode: ""
  });

  // ================= CARGA INICIAL =================
  useEffect(() => {
    (async () => {
      setStatus("Cargando datos…");
      setErrorMsg("");

      const r1 = await safeFetchJSON(`${API_BASE}/activos-fijos-vista`);
      let lista = [];
      if (r1.ok) {
        const d = r1.data;
        lista = Array.isArray(d) ? d : (Array.isArray(d?.items) ? d.items : []);
        if (!Array.isArray(lista)) lista = [];
      } else {
        setErrorMsg(`Activos: ${r1.error}`);
      }
      setActivos(lista);

      const r2 = await safeFetchJSON(`${API_BASE}/warehouses`);
      const wh = Array.isArray(r2.data?.warehouses) ? r2.data.warehouses : [];
      if (!r2.ok && !errorMsg) setErrorMsg(`Bodegas: ${r2.error}`);
      setWarehouses(wh);

      setStatus(`Listo. Activos: ${lista.length}  •  Bodegas: ${wh.length}`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ================= SELECCIONAR ACTIVO =================
  const handleSeleccionar = (item) => {
    setActivoSeleccionado(item);
    setFormData({
      AssetSerialNumber: item?.Lote ?? "",
      U_LS_BODEGA: item?.CodigoBodega ?? "",
      U_SYP_CCLIENTE: item?.CodigoAF ?? "",
      BarCode: item?.CodigoBarras ?? ""
    });
    // limpia vista de barcode previo
    setBarcodeValue("");
    if (barcodeImgUrl) URL.revokeObjectURL(barcodeImgUrl);
    setBarcodeImgUrl("");
    setModalVisible(false);
  };

  // ================= ACTUALIZAR ACTIVO EN SAP =================
  const handleActualizar = async () => {
    if (!activoSeleccionado?.CodigoItem) return;
    setIsUpdating(true);
    try {
      const res = await fetch(
        `${API_BASE}/activos-fijos/${encodeURIComponent(activoSeleccionado.CodigoItem)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        alert("Activo actualizado correctamente");
      } else {
        alert("Error al actualizar: " + (result?.error || res.status));
      }
    } catch (error) {
      alert("Error en la solicitud: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // ================= DESCARGAR INVENTARIO EXCEL =================
  const descargarExcel = () => {
    const rows = Array.isArray(activos) ? activos : [];
    if (!rows.length) {
      alert("No hay datos para descargar.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ActivosFijos");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "Inventario_Activos_Fijos.xlsx");
  };

  // ================= FILTRO DE LISTA =================
  const activosFiltrados = useMemo(() => {
    const q = (busqueda || "").toLowerCase().trim();
    const base = Array.isArray(activos) ? activos : [];
    if (!q) return base;
    return base.filter((it) => {
      const cod = (it?.CodigoItem ?? "").toLowerCase();
      const nom = (it?.NombreItem ?? "").toLowerCase();
      return cod.includes(q) || nom.includes(q);
    });
  }, [activos, busqueda]);

  // ================= GENERAR / TRAER CÓDIGO BARRAS =================
  const generarCodigoBarras = async (force = false) => {
    if (!activoSeleccionado?.CodigoItem) {
      alert("Selecciona un activo primero.");
      return;
    }
    setIsGenerating(true);
    try {
      const body = {
        item_code: activoSeleccionado.CodigoItem,
        symbology,
        force,
        return_png: true,
      };
      if (symbology === "EAN13" && eanPrefix) body.prefix = eanPrefix;
      if (symbology === "CODE128") body.length = Number(codeLength) || 8;

      const r = await fetch(`${API_BASE}/barcodes/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        alert("No se pudo generar el código: " + (data?.error || r.status));
        return;
      }

      // texto
      if (data?.barcode) {
        setBarcodeValue(data.barcode);
        setFormData((f) => ({ ...f, BarCode: data.barcode }));
      }

      // imagen
      if (data?.png_base64) {
        if (barcodeImgUrl) URL.revokeObjectURL(barcodeImgUrl);
        const bin = Uint8Array.from(atob(data.png_base64), (c) => c.charCodeAt(0));
        const blob = new Blob([bin], { type: "image/png" });
        const url = URL.createObjectURL(blob);
        setBarcodeImgUrl(url);
      } else {
        setBarcodeImgUrl("");
      }
    } catch (e) {
      alert("Error generando código: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const descargarPNG = () => {
    if (!barcodeImgUrl || !barcodeValue) return;
    saveAs(
      barcodeImgUrl,
      `${activoSeleccionado?.CodigoItem || "item"}_${barcodeValue}.png`
    );
  };

  const copiarCodigo = async () => {
    try {
      await navigator.clipboard.writeText(barcodeValue);
      alert("Código copiado al portapapeles");
    } catch {
      alert("No se pudo copiar");
    }
  };

  const guardarCodigoManual = async () => {
    if (!activoSeleccionado?.CodigoItem) {
      alert("Selecciona un activo primero.");
      return;
    }
    const valor = (formData.BarCode || "").trim();
    if (!valor) {
      alert("Escribe un código en el campo de texto.");
      return;
    }
    setIsGenerating(true);
    try {
      const body = {
        item_code: activoSeleccionado.CodigoItem,
        barcode: valor,
        // symbology: symbology,  // si quieres forzarla, descomenta
      };
      const r = await fetch(`${API_BASE}/barcodes/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        alert("No se pudo guardar: " + (data?.error || r.status));
        return;
      }
      // reflejamos texto
      setBarcodeValue(data.barcode);

      // traemos PNG para mostrar
      const pngRes = await fetch(
        `${API_BASE}/barcodes/${encodeURIComponent(activoSeleccionado.CodigoItem)}/png`
      );
      if (pngRes.ok) {
        const blob = await pngRes.blob();
        if (barcodeImgUrl) URL.revokeObjectURL(barcodeImgUrl);
        setBarcodeImgUrl(URL.createObjectURL(blob));
      }
      alert("Código guardado como activo.");
    } catch (e) {
      alert("Error guardando: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // ================= RENDER =================
  return (
    <div className={styles.container}>
      {/* barra superior */}
      <div className={styles.headerBar}>
        <button
          className={styles.iconButton}
          onClick={() => router.push("/dashboard")}
          title="Ir al menú principal"
          aria-label="Ir al menú principal"
        >
          <FaHome size={18} />
          <span className={styles.btnText}>Inicio</span>
        </button>

        <h2 className={styles.titleCentered}>Gestión Activos Fijos</h2>

        <button
          className={styles.iconButton}
          onClick={() => {
            try {
              localStorage.removeItem("usuario");
            } catch {}
            router.push("/login");
          }}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <FaSignOutAlt size={18} />
          <span className={styles.btnText}>Salir</span>
        </button>
      </div>

      {/* estado */}
      <div className={styles.statusBar}>
        <span>{status}</span>
        {errorMsg ? <span className={styles.statusError}> • {errorMsg}</span> : null}
      </div>

      {/* acciones */}
      <div className={styles.buttonGroup}>
        <button className={styles.iconAction} onClick={() => setModalVisible(true)}>
          <FaEye /> Ver Activos Fijos
        </button>
        <button className={styles.iconAction} onClick={descargarExcel}>
          <FaDownload /> Descargar Inventario
        </button>
      </div>

      {/* modal listado */}
      {modalVisible && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Lista de Activos Fijos</h3>
              <button onClick={() => setModalVisible(false)} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className={styles.searchRow}>
              <input
                className={styles.input}
                placeholder="Buscar por código o nombre"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <button
                  className={styles.clearBtn}
                  onClick={() => setBusqueda("")}
                  title="Borrar filtro"
                >
                  Limpiar
                </button>
              )}
            </div>

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
                  {activosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={5}>Sin resultados</td>
                    </tr>
                  ) : (
                    activosFiltrados.map((item) => (
                      <tr
                        key={`${item.CodigoItem}-${item.CodigoBodega || ""}`}
                        onClick={() => handleSeleccionar(item)}
                      >
                        <td>{item.CodigoItem}</td>
                        <td>{item.NombreItem}</td>
                        <td>{item.NombreGrupo}</td>
                        <td>{item.NombreBodega}</td>
                        <td>{item.Cantidad}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* formulario edición + barcode */}
      {activoSeleccionado && (
        <div className={styles.formulario}>
          <h2 className={styles.formularioTitulo}>
            Editar Activo: {activoSeleccionado.CodigoItem} — {activoSeleccionado.NombreItem}
          </h2>

          <label>
            Lote:
            <input
              className={styles.input}
              type="text"
              value={formData.AssetSerialNumber}
              disabled={isUpdating}
              onChange={(e) =>
                setFormData({ ...formData, AssetSerialNumber: e.target.value })
              }
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
              {(Array.isArray(warehouses) ? warehouses : []).map((wh) => (
                <option key={wh.CodigoBodega} value={wh.CodigoBodega}>
                  {wh.CodigoBodega} — {wh.NombreBodega}
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
              onChange={(e) =>
                setFormData({ ...formData, U_SYP_CCLIENTE: e.target.value })
              }
            />
          </label>

          <label>
            Código de Barras (texto):
            <input
              className={styles.input}
              type="text"
              value={formData.BarCode}
              disabled={isUpdating}
              onChange={(e) => setFormData({ ...formData, BarCode: e.target.value })}
            />
          </label>

          {/* Configurador de barcode */}
          <div className={styles.toolbarRow}>
            <div className={styles.badge}>Código de barras</div>

            {(formData.BarCode || "").trim() ? (
              <>
                <button
                  className={styles.buttonSecondary}
                  onClick={guardarCodigoManual}
                  disabled={isGenerating}
                  title="Guarda el valor del campo como activo (sin generar)"
                >
                  {isGenerating ? "Guardando..." : "Guardar este código"}
                </button>

                <button
                  className={styles.buttonGhost}
                  onClick={() => generarCodigoBarras(false)}
                  disabled={isGenerating}
                  title="Traer el código activo (si ya existía en la tabla)"
                >
                  Ver/traer activo
                </button>
              </>
            ) : (
              <>
                <select
                  className={styles.inputSm}
                  value={symbology}
                  onChange={(e) => setSymbology(e.target.value)}
                  title="Simbología"
                >
                  <option value="CODE128">CODE128</option>
                  <option value="EAN13">EAN-13</option>
                </select>

                {symbology === "EAN13" ? (
                  <input
                    className={styles.inputSm}
                    placeholder="Prefijo (opcional)"
                    value={eanPrefix}
                    onChange={(e) => setEanPrefix(e.target.value)}
                  />
                ) : (
                  <input
                    type="number"
                    className={styles.inputSm}
                    min={6}
                    max={20}
                    value={codeLength}
                    onChange={(e) => setCodeLength(e.target.value)}
                    title="Largo (sólo CODE128)"
                  />
                )}

                <button
                  className={styles.buttonSecondary}
                  onClick={() => generarCodigoBarras(false)}
                  disabled={isGenerating}
                  title="Genera (o recupera) el código desde la tabla"
                >
                  {isGenerating ? "Generando..." : "Generar código"}
                </button>

                <button
                  className={styles.buttonGhost}
                  onClick={() => generarCodigoBarras(true)}
                  disabled={isGenerating}
                  title="Forzar uno nuevo y desactivar anteriores"
                >
                  Forzar nuevo
                </button>
              </>
            )}
          </div>

          {/* Tarjeta del código */}
          {(barcodeValue || barcodeImgUrl) && (
            <div className={styles.barcodeCard}>
              <div className={styles.codeText}>
                <div>
                  <strong>Código:</strong> {barcodeValue}
                </div>
                <div className={styles.actionsRow}>
                  <button className={styles.smallButton} onClick={copiarCodigo}>
                    Copiar
                  </button>
                  <button
                    className={styles.smallButton}
                    onClick={descargarPNG}
                    disabled={!barcodeImgUrl}
                  >
                    Descargar PNG
                  </button>
                </div>
              </div>
              {barcodeImgUrl && (
                <div className={styles.previewBox}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={barcodeImgUrl} alt={`barcode ${barcodeValue}`} />
                </div>
              )}
            </div>
          )}

          <div className={styles.centerButton}>
            <button
              className={styles.button}
              onClick={handleActualizar}
              disabled={isUpdating}
            >
              {isUpdating ? "Actualizando..." : "Actualizar"}
            </button>
            {(isUpdating || isGenerating) && <div className={styles.spinner} />}
          </div>
        </div>
      )}
    </div>
  );
}
