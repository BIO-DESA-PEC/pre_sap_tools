"use client";

import styles from "./Torres.module.css";

const TIPOS_UBICACION = ["BODEGA", "HOSPITAL", "EDUCACION MEDICA"];

const emptyItem = {
  ItemCode: "",
  ItemName: "",
  Lote: "",
  Serie: "",
  AF: "",
  Grupo: "",
  Estado: "ACTIVO",
};

export default function TorreModal({
  form,
  setForm,
  saving,
  tiposTorre,
  ciudades,
  ubicaciones,
  afSearch,
  afResults,
  setAfSearch,
  setAfResults,
  buscarAF,
  handleChange,
  removeDetalle,
  handleSubmit,
  closeModal,
}) {
  function addManualItem() {
    setForm((prev) => ({
      ...prev,
      Detalle: [...prev.Detalle, { ...emptyItem }],
    }));
  }

  function updateDetalle(index, field, value) {
    setForm((prev) => ({
      ...prev,
      Detalle: prev.Detalle.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      ),
    }));
  }

  function addDetalleFromAF(item) {
    const nuevo = {
      ItemCode: item.ItemCode || item.CodigoItem || item.AF || "",
      ItemName: item.ItemName || item.Descripcion || "",
      Descripcion: item.Descripcion || item.ItemName || "",
      Lote: item.Lote || "",
      Serie: item.Serie || "",
      AF: item.AF || item.ItemCode || item.CodigoItem || "",
      Grupo: item.Grupo || "",
      Estado: item.Estado || "ACTIVO",
    };

    const existe = form.Detalle.some(
      (x) =>
        x.ItemCode === nuevo.ItemCode &&
        x.Lote === nuevo.Lote &&
        x.Serie === nuevo.Serie &&
        x.AF === nuevo.AF
    );

    if (existe) return;

    setForm((prev) => ({
      ...prev,
      Detalle: [...prev.Detalle, nuevo],
    }));

    setAfSearch("");
    setAfResults([]);
  }

  return (
    <div className={styles.modalOverlay} onClick={closeModal}>
      <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <span className={styles.modalBadge}>
              {form.DocEntry ? "Actualización" : "Nuevo registro"}
            </span>
            <h2>{form.DocEntry ? "Editar Torre" : "Crear Torre"}</h2>
            <p>Completa la información general y agrega los activos asociados.</p>
          </div>

          <button type="button" className={styles.closeBtn} onClick={closeModal}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.sectionTitle}>
            <h3>Datos generales</h3>
            <p>Información principal de la torre.</p>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Código Torre</label>
              <input
                value={form.CodigoTorre}
                onChange={(e) => handleChange("CodigoTorre", e.target.value)}
                placeholder="Ej. TOR-UIO-001"
                required
              />
            </div>

            <div className={styles.field}>
              <label>Tipo Torre</label>
              <select
                value={form.TipoTorre}
                onChange={(e) => handleChange("TipoTorre", e.target.value)}
                required
              >
                <option value="">Seleccione</option>
                {tiposTorre.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Ciudad</label>
              <select
                value={form.Ciudad}
                onChange={(e) => handleChange("Ciudad", e.target.value)}
                required
              >
                <option value="">Seleccione</option>
                {ciudades.map((x) => (
                  <option key={x.Ciudad} value={x.Ciudad}>{x.Ciudad}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Tipo Ubicación</label>
              <select
                value={form.TipoUbicacion}
                onChange={(e) => handleChange("TipoUbicacion", e.target.value)}
                required
              >
                <option value="">Seleccione</option>
                {TIPOS_UBICACION.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Ubicación</label>
              <select
                value={form.Ubicacion}
                onChange={(e) => handleChange("Ubicacion", e.target.value)}
                required
              >
                <option value="">Seleccione</option>
                {ubicaciones.map((x) => (
                  <option key={x.Id} value={x.NombreUbicacion}>
                    {x.NombreUbicacion}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Fecha Consignación</label>
              <input
                type="date"
                value={form.FechaConsignacion}
                onChange={(e) => handleChange("FechaConsignacion", e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label>Fecha Retiro</label>
              <input
                type="date"
                value={form.FechaRetiro}
                onChange={(e) => handleChange("FechaRetiro", e.target.value)}
              />
            </div>

            <div className={`${styles.field} ${styles.full}`}>
              <label>Observaciones</label>
              <textarea
                rows={3}
                value={form.Observaciones}
                onChange={(e) => handleChange("Observaciones", e.target.value)}
                placeholder="Observaciones de consignación, ubicación o retiro..."
              />
            </div>
          </div>

          <div className={styles.detailSection}>
            <div className={styles.detailHeader}>
              <div>
                <h3>Activos de la torre</h3>
                <p>Busca un activo existente o crea una fila manual.</p>
              </div>

              <div className={styles.detailActions}>
                <span className={styles.counterPill}>
                  {form.Detalle.length} {form.Detalle.length === 1 ? "ítem" : "ítems"}
                </span>

                <button type="button" className={styles.secondaryBtn} onClick={addManualItem}>
                  + Crear manual
                </button>
              </div>
            </div>

            <div className={styles.searchAfBox}>
              <input
                placeholder="Buscar por código item, descripción, lote, serie o activo..."
                value={afSearch}
                onChange={(e) => buscarAF(e.target.value)}
              />
            </div>

            {afResults.length > 0 && (
              <div className={styles.afList}>
                {afResults.map((x, idx) => (
                  <button
                    type="button"
                    key={`${x.AF || x.ItemCode || idx}`}
                    className={styles.afCard}
                    onClick={() => addDetalleFromAF(x)}
                  >
                    <div className={styles.afCardTop}>
                      <strong>{x.ItemCode || x.CodigoItem || "Sin código"}</strong>
                      <span>{x.AF || x.Activo || "Sin activo"}</span>
                    </div>

                    <div className={styles.afCardBottom}>
                      <span>{x.ItemName || x.Descripcion || "Sin descripción"}</span>
                      <span>Lote: {x.Lote || "S/L"}</span>
                      <span>Serie: {x.Serie || "S/S"}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className={styles.detailTableWrap}>
              <table className={styles.detailTable}>
                <thead>
                  <tr>
                    <th>Código Item</th>
                    <th>Descripción</th>
                    <th>Lote</th>
                    <th>Serie</th>
                    <th>Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {form.Detalle.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.emptyDetail}>
                        Sin detalle agregado todavía.
                      </td>
                    </tr>
                  ) : (
                    form.Detalle.map((row, idx) => (
                      <tr key={`${idx}-${row.ItemCode}-${row.AF}`}>
                        <td>
                          <input
                            value={row.ItemCode || ""}
                            onChange={(e) => updateDetalle(idx, "ItemCode", e.target.value)}
                            placeholder="Código"
                          />
                        </td>

                        <td>
                          <input
                            value={row.Descripcion || row.ItemName || ""}
                            onChange={(e) => {
                              updateDetalle(idx, "Descripcion", e.target.value);
                              updateDetalle(idx, "ItemName", e.target.value);
                            }}
                            placeholder="Descripción"
                          />
                        </td>

                        <td>
                          <input
                            value={row.Lote || ""}
                            onChange={(e) => updateDetalle(idx, "Lote", e.target.value)}
                            placeholder="Lote"
                          />
                        </td>

                        <td>
                          <input
                            value={row.Serie || ""}
                            onChange={(e) => updateDetalle(idx, "Serie", e.target.value)}
                            placeholder="Serie"
                          />
                        </td>


                        <td>
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => removeDetalle(idx)}
                          >
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryBtn} disabled={saving}>
              {saving ? "Guardando..." : form.DocEntry ? "Actualizar" : "Guardar"}
            </button>

            <button type="button" className={styles.secondaryBtn} onClick={closeModal}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}