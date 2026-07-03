"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import TorreModal from "./TorreModal";
import styles from "./Torres.module.css";

const API_BASE = "https://pruebas-sap.onrender.com";

const initialForm = {
  DocEntry: null,
  CodigoTorre: "",
  TipoTorre: "",
  Ciudad: "",
  TipoUbicacion: "",
  Ubicacion: "",
  FechaConsignacion: "",
  FechaRetiro: "",
  Observaciones: "",
  Detalle: [],
};

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("es-EC", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function TorresPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [tiposTorre, setTiposTorre] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);

  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);

  const [afSearch, setAfSearch] = useState("");
  const [afResults, setAfResults] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function fetchTorres() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/torres`, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCatalogos() {
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API_BASE}/torres/catalogos/tipos-torre`, {
          cache: "no-store",
        }),
        fetch(`${API_BASE}/torres/catalogos/ciudades`, {
          cache: "no-store",
        }),
      ]);

      const d1 = await r1.json();
      const d2 = await r2.json();

      if (r1.ok) setTiposTorre(Array.isArray(d1) ? d1 : []);
      if (r2.ok) setCiudades(Array.isArray(d2) ? d2 : []);
    } catch (e) {
      console.error("Error cargando catálogos:", e);
      setTiposTorre([]);
      setCiudades([]);
    }
  }

  async function fetchUbicaciones(ciudad, tipo) {
    if (!ciudad || !tipo) {
      setUbicaciones([]);
      return;
    }

    try {
      const params = new URLSearchParams({ ciudad, tipo });

      const res = await fetch(
        `${API_BASE}/torres/catalogos/ubicaciones?${params}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      setUbicaciones(res.ok && Array.isArray(data) ? data : []);
    } catch {
      setUbicaciones([]);
    }
  }

  async function buscarAF(value) {
    setAfSearch(value);

    if (!value.trim()) {
      setAfResults([]);
      return;
    }

    try {
      const params = new URLSearchParams({ q: value });

      const res = await fetch(`${API_BASE}/torres/buscar-af?${params}`, {
        cache: "no-store",
      });

      const data = await res.json();

      setAfResults(res.ok && Array.isArray(data) ? data : []);
    } catch {
      setAfResults([]);
    }
  }

  useEffect(() => {
    fetchTorres();
    fetchCatalogos();
  }, []);

  useEffect(() => {
    fetchUbicaciones(form.Ciudad, form.TipoUbicacion);
  }, [form.Ciudad, form.TipoUbicacion]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  const grouped = useMemo(() => {
    const map = new Map();

    for (const r of items) {
      const key = r.DocEntry;

      if (!map.has(key)) {
        map.set(key, {
          DocEntry: r.DocEntry,
          CodigoTorre: r.CodigoTorre || "",
          TipoTorre: r.TipoTorre || "",
          Ciudad: r.Ciudad || "",
          TipoUbicacion: r.TipoUbicacion || "",
          Ubicacion: r.Ubicacion || "",
          FechaConsignacion: r.FechaConsignacion || "",
          FechaRetiro: r.FechaRetiro || "",
          Observaciones: r.Observaciones || "",
          Detalle: [],
        });
      }

      if (r.AF || r.ItemCode || r.Lote || r.Serie) {
        map.get(key).Detalle.push({
          ItemCode: r.ItemCode || "",
          ItemName: r.ItemName || r.Descripcion || "",
          AF: r.AF || "",
          Lote: r.Lote || "",
          Serie: r.Serie || "",
          Grupo: r.Grupo || "",
          Estado: r.Estado || "",
        });
      }
    }

    return Array.from(map.values());
  }, [items]);

  const filtered = useMemo(() => {
    const txt = search.trim().toLowerCase();
    if (!txt) return grouped;

    return grouped.filter((x) =>
      [
        x.CodigoTorre,
        x.TipoTorre,
        x.Ciudad,
        x.TipoUbicacion,
        x.Ubicacion,
        x.Observaciones,
        ...x.Detalle.map(
          (d) =>
            `${d.ItemCode} ${d.ItemName} ${d.AF} ${d.Lote} ${d.Serie} ${d.Grupo} ${d.Estado}`
        ),
      ]
        .join(" ")
        .toLowerCase()
        .includes(txt)
    );
  }, [grouped, search]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = filtered.slice(startIndex, startIndex + pageSize);

  const totalActivos = grouped.reduce(
    (acc, torre) => acc + torre.Detalle.length,
    0
  );

  function handleChange(name, value) {
    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "Ciudad") {
        next.TipoUbicacion = "";
        next.Ubicacion = "";
      }

      if (name === "TipoUbicacion") {
        next.Ubicacion = "";
      }

      return next;
    });
  }

  function removeDetalle(index) {
    setForm((prev) => ({
      ...prev,
      Detalle: prev.Detalle.filter((_, i) => i !== index),
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setAfSearch("");
    setAfResults([]);
    setUbicaciones([]);
    setError("");
  }

  function openCreateModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    resetForm();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const method = form.DocEntry ? "PUT" : "POST";
      const url = form.DocEntry
        ? `${API_BASE}/torres/${form.DocEntry}`
        : `${API_BASE}/torres`;

      const payload = {
        ...form,
        Detalle: form.Detalle.map((x) => ({
        AF: x.AF || x.ItemCode || "",
        Descripcion: x.Descripcion || x.ItemName || "",
        Lote: x.Lote || "",
        Serie: x.Serie || "",
        Grupo: x.Grupo || "",
        Estado: x.Estado || "ACTIVO",
      })),
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          usuario:
            typeof window !== "undefined"
              ? localStorage.getItem("usuario") || "Sistema"
              : "Sistema",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      await fetchTorres();
      closeModal();
      alert(data?.mensaje || data?.message || "Guardado correctamente");
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  }

  async function editar(docEntry) {
    try {
      setError("");

      const res = await fetch(`${API_BASE}/torres/${docEntry}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      setForm({
        DocEntry: data.DocEntry,
        CodigoTorre: data.CodigoTorre || "",
        TipoTorre: data.TipoTorre || "",
        Ciudad: data.Ciudad || "",
        TipoUbicacion: data.TipoUbicacion || "",
        Ubicacion: data.Ubicacion || "",
        FechaConsignacion: data.FechaConsignacion || "",
        FechaRetiro: data.FechaRetiro || "",
        Observaciones: data.Observaciones || "",
        Detalle: Array.isArray(data.Detalle)
          ? data.Detalle.map((x) => ({
              ItemCode: x.ItemCode || "",
              ItemName: x.ItemName || x.Descripcion || "",
              Descripcion: x.Descripcion || x.ItemName || "",
              Lote: x.Lote || "",
              Serie: x.Serie || "",
              AF: x.AF || "",
              Grupo: x.Grupo || "",
              Estado: x.Estado || "ACTIVO",
            }))
          : [],
      });

      setAfSearch("");
      setAfResults([]);
      setIsModalOpen(true);
    } catch (e) {
      setError(e.message);
    }
  }

  async function eliminar(docEntry) {
    const ok = confirm("¿Eliminar esta torre?");
    if (!ok) return;

    try {
      setError("");

      const res = await fetch(`${API_BASE}/torres/${docEntry}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      await fetchTorres();
      alert(data?.mensaje || "Eliminado correctamente");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <AppLayout>
      <div className={styles.page}>
        <div className={styles.overlayGlow}></div>

        <div className={styles.container}>
          <header className={styles.hero}>
            <div className={styles.heroLeft}>
              <span className={styles.moduleBadge}>Módulo de Activos</span>

              <h1 className={styles.title}>Gestión de Torres</h1>

              <p className={styles.subtitle}>
                Administra torres, ubicaciones, fechas de consignación y activos
                fijos asociados.
              </p>
            </div>

            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={openCreateModal}
              >
                + Crear Torre
              </button>
            </div>
          </header>

          <section className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span>Total torres</span>
              <strong>{grouped.length}</strong>
            </div>

            <div className={styles.statCard}>
              <span>Registros filtrados</span>
              <strong>{filtered.length}</strong>
            </div>

            <div className={styles.statCard}>
              <span>Activos asociados</span>
              <strong>{totalActivos}</strong>
            </div>
          </section>

          {error ? <div className={styles.error}>{error}</div> : null}

          <section className={styles.listPanel}>
            <div className={styles.toolbar}>
              <div>
                <h2 className={styles.panelTitle}>Listado de torres</h2>
                <p className={styles.panelSubtitle}>
                  Consulta rápida por código, ciudad, ubicación, item, lote,
                  serie o activo.
                </p>
              </div>

              <div className={styles.toolbarControls}>
                <div className={styles.searchBox}>
                  <input
                    placeholder="Buscar torre, ciudad, ubicación, item, lote, serie o activo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <select
                  className={styles.pageSize}
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  <option value={5}>5 por página</option>
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className={styles.emptyState}>
                <h4>Cargando...</h4>
                <p>Espera un momento mientras consultamos la información.</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.emptyState}>
                <h4>Sin registros</h4>
                <p>No encontramos torres con los filtros actuales.</p>
              </div>
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Tipo</th>
                        <th>Ciudad</th>
                        <th>Tipo ubicación</th>
                        <th>Ubicación</th>
                        <th>Consignación</th>
                        <th>Retiro</th>
                        <th>AFs</th>
                        <th>Acción</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedRows.map((row) => (
                        <tr key={row.DocEntry}>
                          <td>
                            <span className={styles.codePill}>
                              {row.CodigoTorre || "-"}
                            </span>
                          </td>

                          <td>{row.TipoTorre || "-"}</td>
                          <td>{row.Ciudad || "-"}</td>

                          <td>
                            <span className={styles.locationType}>
                              {row.TipoUbicacion || "-"}
                            </span>
                          </td>

                          <td>{row.Ubicacion || "-"}</td>
                          <td>{formatDate(row.FechaConsignacion)}</td>
                          <td>{formatDate(row.FechaRetiro)}</td>

                          <td>
                            <span className={styles.afCounter}>
                              {row.Detalle.length}
                            </span>
                          </td>

                          <td>
                            <div className={styles.rowActions}>
                              <button
                                type="button"
                                className={styles.editBtn}
                                onClick={() => editar(row.DocEntry)}
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                className={styles.deleteBtn}
                                onClick={() => eliminar(row.DocEntry)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.pagination}>
                  <div className={styles.paginationInfo}>
                    Mostrando {startIndex + 1} -{" "}
                    {Math.min(startIndex + pageSize, totalItems)} de{" "}
                    {totalItems}
                  </div>

                  <div className={styles.paginationControls}>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }
                    >
                      Anterior
                    </button>

                    <span className={styles.pageIndicator}>
                      Página {currentPage} de {totalPages}
                    </span>

                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>

        {isModalOpen && (
          <TorreModal
            form={form}
            setForm={setForm}
            saving={saving}
            tiposTorre={tiposTorre}
            ciudades={ciudades}
            ubicaciones={ubicaciones}
            afSearch={afSearch}
            afResults={afResults}
            setAfSearch={setAfSearch}
            setAfResults={setAfResults}
            buscarAF={buscarAF}
            handleChange={handleChange}
            removeDetalle={removeDetalle}
            handleSubmit={handleSubmit}
            closeModal={closeModal}
          />
        )}
      </div>
    </AppLayout>
  );
}