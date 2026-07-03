'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaHome, FaSignOutAlt } from 'react-icons/fa';
import ModalCajas from './ModalCajas';
import ModalSeleccionItem from './ModalSeleccionItem';
import { useSession } from "next-auth/react";
import ModalLogs from './ModalLogs';
import styles from './Caja.module.css';
import ModalImagenesCaja from "./ModalImagenesCaja";

export default function Caja() {
  const router = useRouter();
  const [cajas, setCajas] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const { data: session } = useSession();
  const [toast, setToast] = useState({ visible: false, mensaje: '', tipo: 'success' });
  const [rol, setRol] = useState(null);
  const [mostrarModalLogs, setMostrarModalLogs] = useState(false);
  const [logsCaja, setLogsCaja] = useState([]);
  const [mostrarModalItems, setMostrarModalItems] = useState(false);
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(null);
  const [modoEditar, setModoEditar] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(5);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalImagenes, setMostrarModalImagenes] = useState(false);

  const correoUsuario = session?.user?.email || "Sistema";
  const API_BASE = "https://pruebas-sap.onrender.com";

  const [formulario, setFormulario] = useState({
    CodigoCaja: '',
    FechaCaja: '',
    Almacen: '',
    ClaseCaja: '',
    Lineas: [
      {
        CodigoItem: '',
        CantidadItem: 1,
        TipoItem: '',
        LoteItem: '',
        Descripcion: '',
        IndividualSet: 'I',
        SerieCaja: ''
      }
    ]
  });

  // =========================
  // ROL
  // =========================
  useEffect(() => {
    const fetchRol = async () => {
      try {
        const res = await fetch(`${API_BASE}/verificar-usuario`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo: session?.user?.email }),
        });

        if (res.ok) {
          const data = await res.json();
          setRol(data.rol);
        } else {
          setRol("user");
        }
      } catch (error) {
        console.error("Error al obtener rol:", error);
        setRol("user");
      }
    };

    if (session?.user?.email && !rol) fetchRol();
  }, [session?.user?.email, rol]);

  // =========================
  // DATA INICIAL
  // =========================
  const obtenerCajas = async () => {
    const res = await fetch(`${API_BASE}/cajas-instrumental`);
    const data = await res.json();
    setCajas(data);
  };

  const obtenerBodegas = async () => {
    try {
      const res = await fetch(`${API_BASE}/warehouses`);
      const data = await res.json();
      setBodegas(data.warehouses || []);
    } catch (err) {
      console.error("Error al cargar bodegas", err);
    }
  };

  useEffect(() => {
    obtenerCajas();
    obtenerBodegas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // HELPERS
  // =========================
  const solicitarObservacion = () => {
    const obs = prompt("Ingrese una observación para esta acción:");
    return obs?.trim() || null;
  };

  const mostrarToast = (mensaje, tipo = 'success') => {
    setToast({ visible: true, mensaje, tipo });
    setTimeout(() => setToast({ visible: false, mensaje: '', tipo: 'success' }), 3000);
  };

  const fetchCajasFresh = async () => {
    const res = await fetch(`${API_BASE}/cajas-instrumental`, { cache: "no-store" });
    return await res.json();
  };

  const enrichLineas = async (lineas) => {
    const enriched = await Promise.all(
      lineas.map(async (l) => {
        if (!l.CodigoItem) return l;

        try {
          const r = await fetch(`${API_BASE}/inventario-af-cajas?q=${encodeURIComponent(l.CodigoItem)}`, { cache: "no-store" });
          const arr = await r.json();
          const match = Array.isArray(arr) ? arr.find(x => x["Código"] === l.CodigoItem) : null;

          if (!match) return l;

          return {
            ...l, // 👈 no borra SerieCaja/IndividualSet
            Grupo: match["Grupo de Artículos"] || "",
            Estado: match["Estado"] || "",
            CodigoProductoCliente: match["Codigo Producto Cliente"] || "",
            SerieAF: match["Serie"] || "",
            Costo: match["Costo"] ?? ""
          };
        } catch {
          return l;
        }
      })
    );

    return enriched;
  };

  // =========================
  // LOGS
  // =========================
  const verLogsCaja = async () => {
    if (!formulario.CodigoCaja) {
      alert("Debe seleccionar una caja.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/logs-caja/${formulario.CodigoCaja}`);
      const data = await res.json();
      setLogsCaja(data);
      setMostrarModalLogs(true);
    } catch (error) {
      console.error("Error al obtener logs:", error);
      alert("Error al obtener los logs.");
    }
  };

  // =========================
  // CRUD CABEZA
  // =========================
  const guardarCaja = async () => {
    const confirmacion = window.confirm("¿Estás seguro de actualizar o insertar esta caja?");
    if (!confirmacion) return;

    const cantidadesInvalidas = formulario.Lineas.some(
      (l) => l.CantidadItem === null || l.CantidadItem < 0
    );
    if (cantidadesInvalidas) {
      alert("La cantidad debe ser 0 o mayor.");
      return;
    }

    const metodo = modoEditar ? 'PUT' : 'POST';
    const url = modoEditar
      ? `${API_BASE}/cajas-instrumental/${formulario.CodigoCaja}`
      : `${API_BASE}/cajas-instrumental`;

    const obs = solicitarObservacion();
    if (!obs) return alert("Debe ingresar una observación para continuar.");

    const res = await fetch(url, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        'usuario': correoUsuario,
        'observacion': obs
      },
      body: JSON.stringify(formulario)
    });

    if (res.ok) {
      const texto = modoEditar ? 'Caja actualizada correctamente' : 'Caja insertada correctamente';
      mostrarToast(texto, 'success');
      obtenerCajas();
      if (!modoEditar) limpiarFormulario();
    } else {
      const err = await res.json();
      alert(err.error || 'Error en operación');
    }
  };

  const eliminarCaja = async () => {
    if (rol !== 'Administrador') {
      alert('Solo un administrador puede eliminar una caja.');
      return;
    }

    if (!formulario.CodigoCaja) return alert('Ingrese código para eliminar');

    const confirmacion = window.confirm("¿Estás seguro de eliminar esta caja?");
    if (!confirmacion) return;

    const obs = solicitarObservacion();
    if (!obs) return alert("Debe ingresar una observación para continuar.");

    const res = await fetch(`${API_BASE}/cajas-instrumental/${formulario.CodigoCaja}`, {
      method: 'DELETE',
      headers: {
        'usuario': correoUsuario,
        'observacion': obs
      }
    });

    if (res.ok) {
      mostrarToast('Caja eliminada correctamente', 'success');
      obtenerCajas();
      limpiarFormulario();
    } else {
      alert('Error al eliminar');
    }
  };

  // =========================
  // BUSCAR (AQUÍ VA LA CORRECCIÓN)
  // =========================
  const buscarCaja = async () => {
    const cajasFresh = await fetchCajasFresh();
    setCajas(cajasFresh);

    const resultados = cajasFresh.filter((c) => c.CodigoCaja === formulario.CodigoCaja);
    if (!resultados.length) return alert("Caja no encontrada");

    // ✅ mapeo robusto (Serie/Individual SIEMPRE)
    const detallesBase = resultados.map((c) => ({
      CodigoItem: c.CodigoItem || "",
      Descripcion: (c.Descripcion && c.Descripcion !== "nan") ? c.Descripcion : "",
      CantidadItem: c.CantidadItem ?? 1,
      TipoItem: c.TipoItem || "",
      LoteItem: c.LoteItem || "",
      IndividualSet: c.U_Individual_Set ?? c.IndividualSet ?? "I",
      SerieCaja: c.U_Serie ?? c.SerieCaja ?? ""
    }));

    const cabecera = resultados[0];
    const fechaOriginal = cabecera.FechaCaja || cabecera.FechaCreacion || cabecera.FechaActualizacion || "";
    const fechaFormateada = fechaOriginal ? new Date(fechaOriginal).toISOString().split("T")[0] : "";

    const detalles = await enrichLineas(detallesBase);

    setFormulario({
      CodigoCaja: cabecera.CodigoCaja,
      FechaCaja: fechaFormateada,
      ClaseCaja: cabecera.ClaseCaja,
      Almacen: cabecera.Almacen,
      Lineas: detalles
    });

    setModoEditar(true);
    setPaginaActual(1);
  };

  // =========================
  // SELECCIONAR DESDE MODAL (AQUÍ VA LA CORRECCIÓN)
  // =========================
  const seleccionarCajaDesdeModal = async (caja) => {
    const cajasFresh = await fetchCajasFresh();
    setCajas(cajasFresh);

    const detallesBase = cajasFresh
      .filter((c) => c.CodigoCaja === caja.CodigoCaja)
      .map((c) => ({
        CodigoItem: c.CodigoItem || "",
        Descripcion: (c.Descripcion && c.Descripcion !== "nan") ? c.Descripcion : "",
        CantidadItem: c.CantidadItem ?? 1,
        TipoItem: c.TipoItem || "",
        LoteItem: c.LoteItem || "",
        // ✅ AHORA SÍ
        IndividualSet: c.U_Individual_Set ?? c.IndividualSet ?? "I",
        SerieCaja: c.U_Serie ?? c.SerieCaja ?? ""
      }));

    const detalles = await enrichLineas(detallesBase);

    const fechaFormateada = caja.FechaCaja ? new Date(caja.FechaCaja).toISOString().split("T")[0] : "";

    setFormulario({
      CodigoCaja: caja.CodigoCaja,
      FechaCaja: fechaFormateada,
      ClaseCaja: caja.ClaseCaja,
      Almacen: caja.Almacen,
      Lineas: detalles
    });

    setModoEditar(true);
    setMostrarModal(false);
    setPaginaActual(1);
  };

  // =========================
  // FORM
  // =========================
  const limpiarFormulario = () => {
    setFormulario({
      CodigoCaja: '',
      FechaCaja: '',
      Almacen: '',
      ClaseCaja: '',
      Lineas: [
        {
          CodigoItem: '',
          CantidadItem: 1,
          TipoItem: '',
          LoteItem: '',
          Descripcion: '',
          IndividualSet: 'I',
          SerieCaja: ''
        }
      ]
    });
    setModoEditar(false);
    setMensaje('');
  };

  const agregarLinea = () => {
    const nuevasLineas = [...formulario.Lineas, {
      CodigoItem: '',
      CantidadItem: 1,
      TipoItem: '',
      LoteItem: '',
      Descripcion: '',
      IndividualSet: 'I',
      SerieCaja: ''
    }];

    setFormulario({ ...formulario, Lineas: nuevasLineas });

    const nuevaCantidad = nuevasLineas.length;
    const nuevaTotalPaginas = Math.ceil(nuevaCantidad / itemsPorPagina);
    setPaginaActual(nuevaTotalPaginas);
  };

  const eliminarLinea = async (index) => {
    const confirmacion = window.confirm("¿Estás seguro de eliminar esta línea?");
    if (!confirmacion) return;

    const obs = solicitarObservacion();
    if (!obs) return alert("Debe ingresar una observación para continuar.");

    const nuevasLineas = formulario.Lineas.filter((_, i) => i !== index);
    const nuevoFormulario = { ...formulario, Lineas: nuevasLineas };
    setFormulario(nuevoFormulario);

    const res = await fetch(`${API_BASE}/cajas-instrumental/${formulario.CodigoCaja}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'usuario': correoUsuario,
        'observacion': obs
      },
      body: JSON.stringify(nuevoFormulario)
    });

    if (res.ok) {
      mostrarToast('Línea eliminada y caja actualizada correctamente', 'success');
      obtenerCajas();
    } else {
      const err = await res.json();
      alert(err.error || 'Error al actualizar la caja después de eliminar la línea');
    }
  };

  const actualizarLinea = (index, campo, valor) => {
    const nuevasLineas = [...formulario.Lineas];
    nuevasLineas[index][campo] = campo === 'CantidadItem' ? parseFloat(valor) : valor;
    setFormulario({ ...formulario, Lineas: nuevasLineas });
  };

  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const lineasPaginadas = formulario.Lineas.slice(indicePrimerItem, indiceUltimoItem);

  const cambiarPagina = (pagina) => {
    setPaginaActual(pagina);
  };

  const totalPaginas = Math.ceil(formulario.Lineas.length / itemsPorPagina);

  // =========================
  // MODAL ITEMS
  // =========================
  const abrirModalSeleccionItem = (index) => {
    setIndiceSeleccionado(index);
    setMostrarModalItems(true);
  };

  const seleccionarItemDesdeModal = (item) => {
    const nuevasLineas = [...formulario.Lineas];

    nuevasLineas[indiceSeleccionado].CodigoItem = item["Código"] || "";
    nuevasLineas[indiceSeleccionado].Descripcion = item["Descripción"] || "";

    const tipoVista = (item["Tipo"] || "").toLowerCase();
    nuevasLineas[indiceSeleccionado].TipoItem = tipoVista.includes("activo fijo") ? "AF" : "VT";

    nuevasLineas[indiceSeleccionado].LoteItem = item["Lote"] || "";

    nuevasLineas[indiceSeleccionado].Grupo = item["Grupo de Artículos"] || "";
    nuevasLineas[indiceSeleccionado].Estado = item["Estado"] || "";
    nuevasLineas[indiceSeleccionado].CodigoProductoCliente = item["Codigo Producto Cliente"] || "";

    const serieItem = item["Serie"] || "";
    nuevasLineas[indiceSeleccionado].SerieAF = serieItem;

    // ✅ editable: solo autollenar si está vacío
    if (!nuevasLineas[indiceSeleccionado].SerieCaja) {
      nuevasLineas[indiceSeleccionado].SerieCaja = serieItem;
    }

    nuevasLineas[indiceSeleccionado].Costo = item["Costo"] ?? "";
    nuevasLineas[indiceSeleccionado].CodigoClaseAF = item["Codigo Clase AF"] || "";
    nuevasLineas[indiceSeleccionado].NombreClaseAF = item["Nombre Clase AF"] || "";

    setFormulario({ ...formulario, Lineas: nuevasLineas });
    setMostrarModalItems(false);
  };

  // =========================
  // UI
  // =========================
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

        <h2 className={styles.titleCentered}>Cajas Instrumental</h2>

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

      <div className={styles.formulario}>
        <div className={styles.inputConIcono}>
          <input
            className={styles.inputControl}
            placeholder="Código Caja"
            value={formulario.CodigoCaja}
            onChange={(e) =>
              setFormulario({ ...formulario, CodigoCaja: e.target.value })
            }
          />
          <button
            type="button"
            className={styles.iconoLupa}
            onClick={() => setMostrarModal(true)}
            title="Buscar caja"
          >
            🔍
          </button>
        </div>

        <input
          className={styles.inputControl}
          type="date"
          value={formulario.FechaCaja}
          onChange={(e) =>
            setFormulario({ ...formulario, FechaCaja: e.target.value })
          }
        />

        <input
          className={styles.inputControl}
          placeholder="Clase Caja"
          value={formulario.ClaseCaja}
          onChange={(e) =>
            setFormulario({ ...formulario, ClaseCaja: e.target.value })
          }
        />

        <select
          className={styles.inputControl}
          value={formulario.Almacen}
          onChange={(e) =>
            setFormulario({ ...formulario, Almacen: e.target.value })
          }
        >
          <option value="">Seleccione una bodega</option>
          {bodegas.map((b) => (
            <option key={b.CodigoBodega} value={b.CodigoBodega}>
              {b.CodigoBodega} - {b.NombreBodega}
            </option>
          ))}
        </select>

        <div className={styles.botones}>
          <button className={styles.boton} onClick={guardarCaja}>
            {modoEditar ? 'Actualizar' : 'Insertar'}
          </button>
          <button className={styles.boton} onClick={buscarCaja}>
            Buscar
          </button>
          <button className={styles.boton} onClick={eliminarCaja}>
            Eliminar
          </button>
          <button className={styles.boton} onClick={limpiarFormulario}>
            Limpiar
          </button>

          {modoEditar && (
            <button className={`${styles.boton} ${styles.botonCancelar}`} onClick={limpiarFormulario}>
              Cancelar Edición
            </button>
          )}

          {rol === 'Administrador' && formulario.CodigoCaja && (
            <button className={styles.boton} onClick={verLogsCaja}>
              Ver Logs
            </button>
          )}

          {formulario.CodigoCaja && (
            <button
              className={styles.boton}
              onClick={() => setMostrarModalImagenes(true)}
            >
              Ver Imágenes
            </button>
          )}
        </div>
      </div>

      <h4 className={styles.subtitulo}>Detalle de Ítems</h4>
      <table className={styles.tabla}>
        <thead>
          <tr>
            <th>Código Ítem</th>
            <th>Descripción</th>
            <th>Cantidad</th>
            <th>Tipo</th>
            <th>Lote</th>
            <th>Individual/Set</th>
            <th>Serie (Caja)</th>
            <th>Grupo</th>
            <th>Estado</th>
            <th>Cód. Prod. Cliente</th>
            <th>Costo</th>
            <th>Acción</th>
          </tr>
        </thead>

        <tbody>
          {lineasPaginadas.map((linea, index) => {
            const lineaIndexReal = indicePrimerItem + index;
            return (
              <tr key={lineaIndexReal}>
                <td>
                  <div className={styles.inputConIcono}>
                    <input
                      className={styles.inputControl}
                      value={linea.CodigoItem}
                      title={linea.CodigoItem}
                      onChange={(e) => actualizarLinea(lineaIndexReal, "CodigoItem", e.target.value)}
                    />
                    <button
                      className={styles.iconoLupa}
                      title="Buscar ítem"
                      onClick={() => abrirModalSeleccionItem(lineaIndexReal)}
                    >
                      🔍
                    </button>
                  </div>
                </td>

                <td>
                  <input
                    className={styles.inputControl}
                    placeholder="Descripción"
                    title={linea.Descripcion || ""}
                    value={linea.Descripcion || ""}
                    onChange={(e) => actualizarLinea(lineaIndexReal, "Descripcion", e.target.value)}
                  />
                </td>

                <td>
                  <input
                    className={styles.inputControl}
                    type="number"
                    min="0"
                    value={linea.CantidadItem}
                    onChange={(e) => actualizarLinea(lineaIndexReal, "CantidadItem", e.target.value)}
                  />
                </td>

                <td>
                  <select
                    className={styles.inputControl}
                    title={linea.TipoItem}
                    value={linea.TipoItem}
                    onChange={(e) => actualizarLinea(lineaIndexReal, "TipoItem", e.target.value)}
                  >
                    <option value="">Seleccione</option>
                    <option value="AF">AF</option>
                    <option value="VT">VT</option>
                  </select>
                </td>

                <td>
                  <input
                    className={styles.inputControl}
                    title={linea.LoteItem || ""}
                    value={linea.LoteItem || ""}
                    onChange={(e) => actualizarLinea(lineaIndexReal, "LoteItem", e.target.value)}
                  />
                </td>

                <td>
                  <select
                    className={styles.inputControl}
                    title={linea.IndividualSet || "I"}
                    value={linea.IndividualSet || "I"}
                    onChange={(e) => actualizarLinea(lineaIndexReal, "IndividualSet", e.target.value)}
                  >
                    <option value="I">I</option>
                    <option value="S">S</option>
                  </select>
                </td>

                <td>
                  <input
                    className={styles.inputControl}
                    title={linea.SerieCaja || ""}
                    value={linea.SerieCaja || ""}
                    onChange={(e) => actualizarLinea(lineaIndexReal, "SerieCaja", e.target.value)}
                  />
                </td>

                <td><span className={styles.infoCell}>{linea.Grupo || "—"}</span></td>
                <td><span className={styles.infoCell}>{linea.Estado || "—"}</span></td>
                <td><span className={styles.infoCell}>{linea.CodigoProductoCliente || "—"}</span></td>
                <td>
                  <span className={styles.infoCell}>
                    {linea.Costo !== null && linea.Costo !== undefined && linea.Costo !== "" ? linea.Costo : "—"}
                  </span>
                </td>

                <td>
                  <button className={styles.botonEliminar} onClick={() => eliminarLinea(lineaIndexReal)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className={styles.paginado}>
        <button
          className={styles.paginadoBoton}
          onClick={() => cambiarPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
        >
          Anterior
        </button>
        <span>{paginaActual} de {totalPaginas}</span>
        <button
          className={styles.paginadoBoton}
          onClick={() => cambiarPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
        >
          Siguiente
        </button>
      </div>

      <button className={styles.boton} onClick={agregarLinea}>Agregar Ítem</button>

      {mostrarModal && (
        <ModalCajas
          cajas={cajas}
          onClose={() => setMostrarModal(false)}
          onSelect={seleccionarCajaDesdeModal}
        />
      )}

      {toast.visible && (
        <div className={`${styles.toast} ${styles[toast.tipo]}`}>
          {toast.mensaje}
        </div>
      )}

      {mostrarModalLogs && (
        <ModalLogs
          logs={logsCaja}
          onClose={() => setMostrarModalLogs(false)}
        />
      )}

      {mostrarModalItems && (
        <ModalSeleccionItem
          onClose={() => setMostrarModalItems(false)}
          onSelect={seleccionarItemDesdeModal}
        />
      )}

      {mostrarModalImagenes && (
        <ModalImagenesCaja
          open={mostrarModalImagenes}
          onClose={() => setMostrarModalImagenes(false)}
          codigoCaja={formulario.CodigoCaja}
          apiBase={API_BASE}
        />
      )}
    </div>
  );
}