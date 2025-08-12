// app/logs/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import s from "./logs.module.css";

const API_BASE = "https://pruebas-sap-back.onrender.com";

export default function LogsCajaPage() {
  const [codigoCaja, setCodigoCaja] = useState("");
  const [usuarioFiltro, setUsuarioFiltro] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);
  const [orden, setOrden] = useState({ campo: "fecha", dir: "desc" });

  // opciones selects
  const [cajaOptions, setCajaOptions] = useState([]);
  const [usuarioOptions, setUsuarioOptions] = useState([]);

  // paginado
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // fechas por defecto: hoy
  useEffect(() => {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");
    const hoyStr = `${yyyy}-${mm}-${dd}`;
    setFechaDesde(hoyStr);
    setFechaHasta(hoyStr);
  }, []);

  // cargar selects
  useEffect(() => {
    cargarOpcionesCajas();
    cargarOpcionesUsuariosUltimosDias(90);
  }, []);

  const extraerCodigoCaja = (o) =>
    o?.CodigoCaja ?? o?.Code ?? o?.U_LS_ITEM ?? o?.Codigo ?? o?.Caja ?? null;

  async function cargarOpcionesCajas() {
    try {
      const r = await fetch(`${API_BASE}/cajas-instrumental`);
      if (!r.ok) return;
      const data = await r.json();
      const codigos = Array.from(
        new Set((data || []).map(extraerCodigoCaja).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, "es"));
      setCajaOptions(codigos.map((c) => ({ value: c, label: c })));
    } catch {}
  }

  async function cargarOpcionesUsuariosUltimosDias(dias = 90) {
    try {
      const hasta = new Date();
      const desde = new Date(hasta);
      desde.setDate(hasta.getDate() - dias);
      const d = desde.toISOString().slice(0, 10);
      const h = hasta.toISOString().slice(0, 10);

      const r = await fetch(`${API_BASE}/logs-caja?desde=${d}&hasta=${h}`);
      if (!r.ok) return;
      const data = await r.json();

      const correos = Array.from(new Set((data || []).map((x) => x.usuario).filter(Boolean)));

      const lookups = await Promise.allSettled(
        correos.map(async (correo) => {
          try {
            const rr = await fetch(`${API_BASE}/verificar-usuario`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ correo }),
            });
            if (!rr.ok) return { correo, nombre: null };
            const js = await rr.json();
            return { correo, nombre: js?.nombre || null };
          } catch {
            return { correo, nombre: null };
          }
        })
      );

      const opts = lookups
        .map((res) => (res.status === "fulfilled" ? res.value : null))
        .filter(Boolean)
        .map(({ correo, nombre }) => ({
          value: correo,
          label: nombre ? `${nombre} · ${correo}` : correo,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "es"));

      setUsuarioOptions(opts);
    } catch {}
  }

  const handleBuscar = async () => {
    try {
      setError("");
      setCargando(true);
      setPage(1);

      const params = new URLSearchParams();
      if (codigoCaja?.trim()) params.set("codigo", codigoCaja.trim());
      if (usuarioFiltro?.trim()) params.set("usuario", usuarioFiltro.trim());
      if (fechaDesde) params.set("desde", fechaDesde);
      if (fechaHasta) params.set("hasta", fechaHasta);

      const resp = await fetch(`${API_BASE}/logs-caja?${params.toString()}`);
      if (!resp.ok) throw new Error(`Error ${resp.status}: no se pudo obtener los logs.`);

      const data = await resp.json();
      const normalizados = (data || []).map((r) => ({
        ...r,
        fecha: r.fecha ? new Date(r.fecha) : null,
      }));
      setLogs(normalizados);
    } catch (e) {
      setError(e.message || "Error al consultar logs.");
    } finally {
      setCargando(false);
    }
  };

  const togglearOrden = (campo) => {
    setOrden((prev) =>
      prev.campo === campo ? { campo, dir: prev.dir === "asc" ? "desc" : "asc" } : { campo, dir: "asc" }
    );
    setPage(1);
  };

  const filtrados = useMemo(() => {
    const lista = [...logs];
    const { campo, dir } = orden;
    const mult = dir === "asc" ? 1 : -1;
    lista.sort((a, b) => {
      const va = campo === "fecha" ? (a.fecha ? a.fecha.getTime() : 0) : (a[campo] || "").toString().toLowerCase();
      const vb = campo === "fecha" ? (b.fecha ? b.fecha.getTime() : 0) : (b[campo] || "").toString().toLowerCase();
      if (va < vb) return -1 * mult;
      if (va > vb) return 1 * mult;
      return 0;
    });
    return lista;
  }, [logs, orden]);

  const totalRegistros = filtrados.length;
  const totalPages = Math.max(1, Math.ceil(totalRegistros / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginaDatos = filtrados.slice(startIdx, endIdx);

  const goFirst = () => setPage(1);
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const goLast = () => setPage(totalPages);

  const formatoFecha = (d) => {
    if (!d) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  };

  const exportarExcel = () => {
    if (!filtrados.length) return;
    const datos = filtrados.map((r) => ({
      CodigoCaja: r.codigo_caja || "",
      Accion: r.accion || "",
      Usuario: r.usuario || "",
      FechaHora: r.fecha ? formatoFecha(r.fecha) : "",
      Detalle: r.detalle || "",
      Observacion: r.observacion || "",
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Logs");
    XLSX.writeFile(wb, `Logs_${codigoCaja || "todas"}_${Date.now()}.xlsx`);
  };

  const exportarPDF = () => {
    if (!filtrados.length) return;
    const doc = new jsPDF();
    const columnas = [
      { header: "Código Caja", dataKey: "CodigoCaja" },
      { header: "Acción", dataKey: "Accion" },
      { header: "Usuario", dataKey: "Usuario" },
      { header: "Fecha/Hora", dataKey: "FechaHora" },
      { header: "Detalle", dataKey: "Detalle" },
      { header: "Observación", dataKey: "Observacion" },
    ];
    const body = filtrados.map((r) => ({
      CodigoCaja: r.codigo_caja || "",
      Accion: r.accion || "",
      Usuario: r.usuario || "",
      FechaHora: r.fecha ? formatoFecha(r.fecha) : "",
      Detalle: r.detalle || "",
      Observacion: r.observacion || "",
    }));

    doc.text(`Logs Caja Instrumental${codigoCaja ? ` - ${codigoCaja}` : ""}`, 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [columnas.map((c) => c.header)],
      body: body.map((row) => columnas.map((c) => row[c.dataKey])),
      styles: { fontSize: 8, cellPadding: 2 },
    });
    doc.save(`Logs_${codigoCaja || "todas"}_${Date.now()}.pdf`);
  };

  const imprimir = () => {
    if (!filtrados.length) return;
    const html = `
      <html>
        <head>
          <title>Imprimir Logs</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; }
            h2 { margin: 0 0 12px 0; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #999; padding: 6px; font-size: 12px; }
            th { background: #eee; text-align: left; }
          </style>
        </head>
        <body>
          <h2>Logs Caja Instrumental ${codigoCaja ? `- ${escapeHtml(codigoCaja)}` : ""}</h2>
          <table>
            <thead>
              <tr>
                <th>Código Caja</th>
                <th>Acción</th>
                <th>Usuario</th>
                <th>Fecha/Hora</th>
                <th>Detalle</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              ${filtrados
                .map(
                  (r) => `
                <tr>
                  <td>${escapeHtml(r.codigo_caja || "")}</td>
                  <td>${escapeHtml(r.accion || "")}</td>
                  <td>${escapeHtml(r.usuario || "")}</td>
                  <td>${escapeHtml(r.fecha ? formatoFecha(r.fecha) : "")}</td>
                  <td>${escapeHtml(r.detalle || "")}</td>
                  <td>${escapeHtml(r.observacion || "")}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
          <script>window.onload = function(){ window.print(); }</script>
        </body>
      </html>
    `;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  // --- Header actions ---
  const onSalir = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } finally {
      window.location.href = "/login"; // cambia si tu ruta de salida es otra
    }
  };

  return (
    <div className={s.page}>
      <div className={s.container}>

        {/* ENCABEZADO: casa + título + salir */}
        <div className={s.headerCard}>
          <a href="/dashboard" className={s.iconBtn} title="Inicio" aria-label="Inicio">
            {/* Home icon (SVG) */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 10.75L12 3l9 7.75V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.25Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>

          <div className={s.headerTitle}>Logs Cajas Instrumental</div>

          <a href="/login" className={s.iconBtn} title="Salir" aria-label="Salir">
            {/* Logout icon (SVG) */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M15 7V5a2 2 0 0 0-2-2H6A2 2 0 0 0 4 5v14a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 12h10m0 0-3-3m3 3-3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>

        {/* Filtros */}
        <div className={s.filtersGrid}>
          <div className={s.field}>
            <label className={s.label}>Código de caja</label>
            <select value={codigoCaja} onChange={(e) => setCodigoCaja(e.target.value)} className={s.input}>
              <option value="">Todas</option>
              {cajaOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className={s.field}>
            <label className={s.label}>Usuario</label>
            <select value={usuarioFiltro} onChange={(e) => setUsuarioFiltro(e.target.value)} className={s.input}>
              <option value="">Todos</option>
              {usuarioOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className={s.field}>
            <label className={s.label}>Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className={s.input}/>
          </div>

          <div className={s.field}>
            <label className={s.label}>Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className={s.input}/>
          </div>

          <div className={s.fieldBtn}>
            <button onClick={handleBuscar} disabled={cargando} className={s.btnPrimary}>
              {cargando ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </div>

        {error ? <div className={s.error}>{error}</div> : null}

        {/* Acciones */}
        <div className={s.actions}>
          <button onClick={exportarExcel} disabled={!filtrados.length} className={s.btn}>Exportar Excel</button>
          <button onClick={exportarPDF}  disabled={!filtrados.length} className={s.btn}>Exportar PDF</button>
          <button onClick={imprimir}     disabled={!filtrados.length} className={s.btn}>Imprimir</button>
          <div className={s.counter}>{totalRegistros ? `Registros: ${totalRegistros}` : ""}</div>
        </div>

        {/* Paginado (arriba) */}
        <Paginador
          s={s}
          pageSize={pageSize}
          setPageSize={setPageSize}
          currentPage={currentPage}
          totalPages={totalPages}
          goFirst={goFirst} goPrev={goPrev} goNext={goNext} goLast={goLast}
          setPage={setPage}
        />

        {/* Tabla */}
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead className={s.thead}>
              <tr>
                <Th label="Código Caja" campo="codigo_caja" orden={orden} onSort={togglearOrden} />
                <Th label="Acción" campo="accion" orden={orden} onSort={togglearOrden} />
                <Th label="Usuario" campo="usuario" orden={orden} onSort={togglearOrden} />
                <Th label="Fecha/Hora" campo="fecha" orden={orden} onSort={togglearOrden} />
                <Th label="Detalle" campo="detalle" orden={orden} onSort={togglearOrden} />
                <Th label="Observación" campo="observacion" orden={orden} onSort={togglearOrden} />
              </tr>
            </thead>
            <tbody>
              {paginaDatos.length === 0 ? (
                <tr>
                  <td colSpan={6} className={s.noData}>
                    {cargando ? "Cargando..." : "Sin datos"}
                  </td>
                </tr>
              ) : (
                paginaDatos.map((r, idx) => (
                  <tr key={startIdx + idx} className={s.row}>
                    <td className={s.cell}>{r.codigo_caja || ""}</td>
                    <td className={s.cell}>{r.accion || ""}</td>
                    <td className={s.cell}>{r.usuario || ""}</td>
                    <td className={s.cell}>{r.fecha ? formatoFecha(r.fecha) : ""}</td>
                    <td className={s.cell}>{r.detalle || ""}</td>
                    <td className={s.cell}>{r.observacion || ""}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginado (abajo) */}
        <Paginador
          s={s}
          pageSize={pageSize}
          setPageSize={setPageSize}
          currentPage={currentPage}
          totalPages={totalPages}
          goFirst={goFirst} goPrev={goPrev} goNext={goNext} goLast={goLast}
          setPage={setPage}
        />
      </div>
    </div>
  );
}

function Th({ label, campo, orden, onSort }) {
  const activo = orden.campo === campo;
  return (
    <th onClick={() => onSort(campo)} className={s.th} title="Ordenar">
      {label}
      {activo ? (orden.dir === "asc" ? " ▲" : " ▼") : ""}
    </th>
  );
}

function Paginador({
  s, pageSize, setPageSize, currentPage, totalPages,
  goFirst, goPrev, goNext, goLast, setPage
}) {
  return (
    <div className={s.paginationBar}>
      <div className={s.pageSizeWrap}>
        <span>Tamaño página:</span>
        <select
          className={s.pageSize}
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      <div className={s.pager}>
        <button className={s.pagerBtn} onClick={goFirst} disabled={currentPage === 1}>« Primera</button>
        <button className={s.pagerBtn} onClick={goPrev}  disabled={currentPage === 1}>‹ Anterior</button>
        <span className={s.pageInfo}>Página {currentPage} de {totalPages}</span>
        <button className={s.pagerBtn} onClick={goNext}  disabled={currentPage === totalPages}>Siguiente ›</button>
        <button className={s.pagerBtn} onClick={goLast}  disabled={currentPage === totalPages}>Última »</button>
      </div>
    </div>
  );
}

function escapeHtml(text) {
  if (!text && text !== 0) return "";
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
