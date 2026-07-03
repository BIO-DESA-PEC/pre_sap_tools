"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./CajasReporte.module.css";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

const API_BASE = "https://pruebas-sap.onrender.com";

export default function CajasReportePage() {
  const router = useRouter();

  const [rawRows, setRawRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [textoBusqueda, setTextoBusqueda] = useState("");

  const [selectedCaja, setSelectedCaja] = useState(null);
  const [activeTab, setActiveTab] = useState("list");

  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(10);

  const [detailPage, setDetailPage] = useState(1);
  const [detailPageSize, setDetailPageSize] = useState(20);

  async function fetchCajas() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/cajas-instrumental`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      setRawRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRawRows([]);
      setError(`No se pudieron cargar las cajas: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCajas();
  }, []);

  function parseISODate(d) {
    if (!d) return null;
    try {
      const asDate = new Date(d);
      return isNaN(asDate.getTime()) ? null : asDate;
    } catch {
      return null;
    }
  }

  function fmtFecha(f) {
    const d = parseISODate(f);
    if (!d) return "";
    return d.toISOString().slice(0, 10);
  }

  function hoy() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  }

  const grouped = useMemo(() => {
    const map = new Map();

    for (const r of rawRows) {
      const key = r.CodigoCaja;
      if (!key) continue;

      if (!map.has(key)) {
        map.set(key, {
          cab: {
            CodigoCaja: r.CodigoCaja,
            FechaCaja: r.FechaCaja,
            Almacen: r.Almacen,
            ClaseCaja: r.ClaseCaja,
          },
          lineas: [],
        });
      }

      map.get(key).lineas.push({
        Linea: r.Linea ?? "",
        CodigoItem: r.CodigoItem ?? "",
        Descripcion: r.Descripcion ?? "",
        CantidadItem: r.CantidadItem ?? "",
        TipoItem: r.TipoItem ?? "",
        LoteItem: r.LoteItem ?? "",
        CategoriaDetalleCaja: r.CategoriaDetalleCaja ?? "",
        CodigoItemUnico: r.CodigoItemUnico ?? "",
        SerieCaja: r.SerieCaja ?? "",
        SerieAF: r.SerieAF ?? "",
        GrupoAF: r.GrupoAF ?? "",
        EstadoAF: r.EstadoAF ?? "",
        CostoAF: r.CostoAF ?? "",
      });
    }

    return map;
  }, [rawRows]);

  const filteredKeys = useMemo(() => {
    const from = fechaDesde ? new Date(fechaDesde + "T00:00:00") : null;
    const to = fechaHasta ? new Date(fechaHasta + "T23:59:59") : null;
    const txt = (textoBusqueda || "").trim().toLowerCase();

    return Array.from(grouped.keys()).filter((k) => {
      const g = grouped.get(k);
      const f = parseISODate(g?.cab?.FechaCaja);

      if (from && (!f || f < from)) return false;
      if (to && (!f || f > to)) return false;

      if (!txt) return true;

      const searchable = [
        g.cab.CodigoCaja,
        g.cab.Almacen,
        g.cab.ClaseCaja,
        ...g.lineas.map((l) =>
          [
            l.CodigoItem,
            l.Descripcion,
            l.LoteItem,
            l.CodigoItemUnico,
            l.SerieAF,
            l.GrupoAF,
            l.EstadoAF,
          ].join(" ")
        ),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(txt);
    });
  }, [grouped, fechaDesde, fechaHasta, textoBusqueda]);

  useEffect(() => {
    setListPage(1);
  }, [fechaDesde, fechaHasta, textoBusqueda]);

  useEffect(() => {
    setDetailPage(1);
  }, [selectedCaja]);

  const totalCajas = filteredKeys.length;
  const totalLineas = useMemo(() => {
    return filteredKeys.reduce((acc, k) => acc + (grouped.get(k)?.lineas?.length || 0), 0);
  }, [filteredKeys, grouped]);

  const listTotalPages = Math.max(1, Math.ceil(totalCajas / listPageSize));
  const listStart = (listPage - 1) * listPageSize;
  const listEnd = listStart + listPageSize;
  const paginatedKeys = filteredKeys.slice(listStart, listEnd);

  const selectedGroup = selectedCaja ? grouped.get(selectedCaja) : null;
  const detailTotal = selectedGroup ? selectedGroup.lineas.length : 0;
  const detailTotalPages = Math.max(1, Math.ceil(detailTotal / detailPageSize));
  const detailStart = (detailPage - 1) * detailPageSize;
  const detailEnd = detailStart + detailPageSize;
  const paginatedLines = selectedGroup ? selectedGroup.lineas.slice(detailStart, detailEnd) : [];

  function exportXLSX() {
    const wb = XLSX.utils.book_new();
    const keys = selectedCaja && grouped.has(selectedCaja) ? [selectedCaja] : filteredKeys;

    const rows = [];
    keys.forEach((k) => {
      const g = grouped.get(k);
      g.lineas.forEach((l, idx) => {
        rows.push({
          CodigoCaja: g.cab.CodigoCaja,
          FechaCaja: fmtFecha(g.cab.FechaCaja),
          Almacen: g.cab.Almacen,
          ClaseCaja: g.cab.ClaseCaja,
          NroLinea: idx + 1,
          CodigoItem: l.CodigoItem,
          Descripcion: l.Descripcion,
          Cantidad: l.CantidadItem,
          Tipo: l.TipoItem,
          Lote: l.LoteItem,
          CategoriaDetalle: l.CategoriaDetalleCaja,
          CodigoItemUnico: l.CodigoItemUnico,
          SerieCaja: l.SerieCaja,
          SerieAF: l.SerieAF,
          Grupo: l.GrupoAF,
          Estado: l.EstadoAF,
          Costo: l.CostoAF,
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Cajas");
    const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });

    const name =
      selectedCaja && grouped.has(selectedCaja)
        ? `Caja_${selectedCaja}_${hoy()}.xlsx`
        : `Cajas_${hoy()}.xlsx`;

    saveAs(new Blob([out], { type: "application/octet-stream" }), name);
  }

  async function exportPDF() {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });

    const keys = selectedCaja && grouped.has(selectedCaja) ? [selectedCaja] : filteredKeys;
    const title = keys.length === 1 ? `Caja ${keys[0]}` : "Reporte de Cajas";

    doc.setFontSize(14);
    doc.text(title, 14, 14);

    const body = [];
    keys.forEach((k) => {
      const g = grouped.get(k);
      g.lineas.forEach((l, idx) => {
        body.push([
          g.cab.CodigoCaja,
          fmtFecha(g.cab.FechaCaja),
          g.cab.Almacen,
          g.cab.ClaseCaja,
          idx + 1,
          l.CodigoItem,
          l.Descripcion || "",
          l.CantidadItem,
          l.TipoItem,
          l.LoteItem || "",
          l.CategoriaDetalleCaja || "",
          l.CodigoItemUnico || "",
          l.SerieCaja || "",
          l.SerieAF || "",
          l.GrupoAF || "",
          l.EstadoAF || "",
          l.CostoAF || "",
        ]);
      });
    });

    autoTable(doc, {
      startY: 20,
      head: [[
        "Código Caja",
        "Fecha",
        "Almacén",
        "Clase",
        "#",
        "Código Ítem",
        "Descripción",
        "Cant.",
        "Tipo",
        "Lote",
        "Categoría Detalle",
        "Código Ítem Único",
        "Serie Caja",
        "Serie AF",
        "Grupo",
        "Estado",
        "Costo",
      ]],
      body,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [0, 86, 179] },
    });

    const name =
      keys.length === 1 ? `Caja_${keys[0]}_${hoy()}.pdf` : `Cajas_${hoy()}.pdf`;

    doc.save(name);
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button
          className={styles.iconButton}
          title="Ir al menú principal"
          aria-label="Inicio"
          onClick={() => router.push("/dashboard")}
        >
          <svg viewBox="0 0 576 512" width="18" height="18" fill="currentColor">
            <path d="M570.69 236.27 512 184.44V44.05a12 12 0 0 0-12-12h-52a12 12 0 0 0-12 12v72.61L318.47 43a35.39 35.39 0 0 0-60.94 0L5.34 236.27a12 12 0 0 0-1.6 16.9l21.4 25.72a12 12 0 0 0 16.9 1.6L64 260.13v211.9a12 12 0 0 0 12 12h104a12 12 0 0 0 12-12V368a24 24 0 0 1 24-24h104a24 24 0 0 1 24 24v104a12 12 0 0 0 12 12h104a12 12 0 0 0 12-12v-211.9l21 19.36a12 12 0 0 0 16.9-1.6l21.4-25.72a12 12 0 0 0-1.61-16.9z" />
          </svg>
        </button>

        <h2 className={styles.titleCentered}>Reporte de Cajas</h2>

        <div className={styles.actionsRight}>
          <button className={styles.btn} onClick={fetchCajas} disabled={loading}>
            {loading ? "Cargando..." : "Recargar"}
          </button>
          <button className={styles.btn} onClick={exportPDF} disabled={loading || filteredKeys.length === 0}>
            PDF
          </button>
          <button className={styles.btn} onClick={exportXLSX} disabled={loading || filteredKeys.length === 0}>
            Excel
          </button>
          <button
            className={styles.iconButton}
            title="Cerrar sesión"
            aria-label="Salir"
            onClick={() => {
              localStorage.removeItem("usuario");
              router.push("/login");
            }}
          >
            <svg viewBox="0 0 512 512" width="18" height="18" fill="currentColor">
              <path d="M497 273 329 441a24 24 0 0 1-41-17V352H192a32 32 0 0 1-32-32V192a32 32 0 0 1 32-32h96V88a24 24 0 0 1 41-17l168 168a24 24 0 0 1 0 34zM160 448H96a64 64 0 0 1-64-64V128a64 64 0 0 1 64-64h64a32 32 0 0 1 0 64H96v256h64a32 32 0 0 1 0 64z" />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterItem}>
          <label>Desde</label>
          <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
        </div>

        <div className={styles.filterItem}>
          <label>Hasta</label>
          <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
        </div>

        <div className={`${styles.filterItem} ${styles.flexGrow}`}>
          <label>Búsqueda</label>
          <input
            placeholder="Código caja, ítem, lote, almacén..."
            value={textoBusqueda}
            onChange={(e) => setTextoBusqueda(e.target.value)}
          />
        </div>

        <div className={styles.summary}>
          <span>{totalCajas} cajas</span>
          <span>{totalLineas} líneas</span>
        </div>
      </div>

      {error ? <div className={styles.errorBox}>{error}</div> : null}

      <div className={styles.tabs}>
        <button
          className={activeTab === "list" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("list")}
        >
          Listado
        </button>

        <button
          className={activeTab === "detail" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("detail")}
          disabled={!selectedCaja}
        >
          Detalle de caja
        </button>
      </div>

      {activeTab === "list" && (
        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código Caja</th>
                <th>Fecha</th>
                <th>Almacén</th>
                <th>Clase</th>
                <th>Líneas</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {paginatedKeys.map((k) => {
                const g = grouped.get(k);
                return (
                  <tr key={k} className={selectedCaja === k ? styles.trSelected : ""}>
                    <td>{g.cab.CodigoCaja}</td>
                    <td>{fmtFecha(g.cab.FechaCaja)}</td>
                    <td>{g.cab.Almacen}</td>
                    <td>{g.cab.ClaseCaja}</td>
                    <td>{g.lineas.length}</td>
                    <td>
                      <button
                        className={styles.btnSm}
                        onClick={() => {
                          setSelectedCaja(k);
                          setActiveTab("detail");
                        }}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                );
              })}

              {paginatedKeys.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    {loading ? "Cargando..." : "Sin resultados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className={styles.pagination}>
            <div className={styles.paginationLeft}>
              <span>Página {listPage} de {listTotalPages}</span>
            </div>

            <div className={styles.paginationRight}>
              <select
                className={styles.pageSize}
                value={listPageSize}
                onChange={(e) => {
                  setListPageSize(Number(e.target.value));
                  setListPage(1);
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} por página
                  </option>
                ))}
              </select>

              <button
                className={styles.btnSm}
                disabled={listPage === 1}
                onClick={() => setListPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>

              <button
                className={styles.btnSm}
                disabled={listPage === listTotalPages}
                onClick={() => setListPage((p) => Math.min(listTotalPages, p + 1))}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "detail" && selectedGroup && (
        <div className={styles.split}>
          <div className={styles.card}>
            <div className={styles.sectionTitle}>Cabecera</div>
            <div className={styles.grid2}>
              <div>
                <label>Código</label>
                <div className={styles.readonly}>{selectedGroup.cab.CodigoCaja}</div>
              </div>
              <div>
                <label>Fecha</label>
                <div className={styles.readonly}>{fmtFecha(selectedGroup.cab.FechaCaja)}</div>
              </div>
              <div>
                <label>Almacén</label>
                <div className={styles.readonly}>{selectedGroup.cab.Almacen}</div>
              </div>
              <div>
                <label>Clase</label>
                <div className={styles.readonly}>{selectedGroup.cab.ClaseCaja}</div>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.sectionTitle}>Detalle</div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Código Ítem</th>
                  <th>Descripción</th>
                  <th>Cant.</th>
                  <th>Tipo</th>
                  <th>Lote</th>
                  <th>Categoría Detalle</th>
                  <th>Código Ítem Único</th>
                  <th>Serie Caja</th>
                  <th>Serie AF</th>
                  <th>Grupo</th>
                  <th>Estado</th>
                  <th>Costo</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLines.map((l, i) => (
                  <tr key={`${selectedCaja}-${detailStart + i}`}>
                    <td>{detailStart + i + 1}</td>
                    <td>{l.CodigoItem}</td>
                    <td className={styles.wrap}>{l.Descripcion || ""}</td>
                    <td className={styles.num}>{l.CantidadItem}</td>
                    <td>{l.TipoItem}</td>
                    <td>{l.LoteItem || ""}</td>
                    <td>{l.CategoriaDetalleCaja || ""}</td>
                    <td>{l.CodigoItemUnico || ""}</td>
                    <td>{l.SerieCaja || ""}</td>
                    <td>{l.SerieAF || ""}</td>
                    <td>{l.GrupoAF || ""}</td>
                    <td>{l.EstadoAF || ""}</td>
                    <td>{l.CostoAF || ""}</td>
                  </tr>
                ))}

                {paginatedLines.length === 0 && (
                  <tr>
                    <td colSpan={13} className={styles.empty}>
                      Sin líneas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className={styles.pagination}>
              <div className={styles.paginationLeft}>
                <span>Página {detailPage} de {detailTotalPages}</span>
              </div>

              <div className={styles.paginationRight}>
                <select
                  className={styles.pageSize}
                  value={detailPageSize}
                  onChange={(e) => {
                    setDetailPageSize(Number(e.target.value));
                    setDetailPage(1);
                  }}
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n} por página
                    </option>
                  ))}
                </select>

                <button
                  className={styles.btnSm}
                  disabled={detailPage === 1}
                  onClick={() => setDetailPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>

                <button
                  className={styles.btnSm}
                  disabled={detailPage === detailTotalPages}
                  onClick={() => setDetailPage((p) => Math.min(detailTotalPages, p + 1))}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}