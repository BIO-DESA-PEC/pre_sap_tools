'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaHome, FaSignOutAlt } from 'react-icons/fa';
import ModalCajas from './ModalCajas';
import { useSession } from "next-auth/react";
import styles from './Caja.module.css';

export default function Caja() {
  const router = useRouter();
  const [cajas, setCajas] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const { data: session } = useSession();
  const [observacion, setObservacion] = useState('');
  const [rol, setRol] = useState(null);
  const correoUsuario = session?.user?.email || "Sistema";
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
        Descripcion: ''
      }
    ]
  });
  const [modoEditar, setModoEditar] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(5);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
  const fetchRol = async () => {
    try {
      const res = await fetch("https://pruebas-sap-back.onrender.com/verificar-usuario", {
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

  if (session?.user?.email && !rol) {
    fetchRol();
  }
}, [session?.user?.email, rol]);

  const obtenerCajas = async () => {
    const res = await fetch('https://pruebas-sap-back.onrender.com/cajas-instrumental');
    const data = await res.json();
    setCajas(data);
  };

  const obtenerBodegas = async () => {
    try {
      const res = await fetch('https://pruebas-sap-back.onrender.com/warehouses');
      const data = await res.json();
      setBodegas(data.warehouses || []);
    } catch (err) {
      console.error("Error al cargar bodegas", err);
    }
  };


  useEffect(() => {
    obtenerCajas();
    obtenerBodegas();
  }, []);
  const solicitarObservacion = () => {
  const obs = prompt("Ingrese una observación para esta acción:");
  return obs?.trim() || null;
};


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
      ? `https://pruebas-sap-back.onrender.com/cajas-instrumental/${formulario.CodigoCaja}`
      : 'https://pruebas-sap-back.onrender.com/cajas-instrumental';

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
      setMensaje(texto);
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

const res = await fetch(
  `https://pruebas-sap-back.onrender.com/cajas-instrumental/${formulario.CodigoCaja}`,
  {
    method: 'DELETE',
    headers: {
      'usuario': correoUsuario,
      'observacion': obs
    }
  }
);


  if (res.ok) {
    setMensaje('Caja eliminada correctamente');
    obtenerCajas();
    limpiarFormulario();
  } else {
    alert('Error al eliminar');
  }
};


  const buscarCaja = () => {
    const resultados = cajas.filter((c) => c.CodigoCaja === formulario.CodigoCaja);
    if (!resultados.length) return alert('Caja no encontrada');

    const detalles = resultados.map((c) => ({
      CodigoItem: c.CodigoItem || '',
      Descripcion: c.Descripcion || '',
      CantidadItem: c.CantidadItem || 1,
      TipoItem: c.TipoItem || '',
      LoteItem: c.LoteItem || ''
    }));

    const cabecera = resultados[0];
    const fechaOriginal = cabecera.FechaCaja || cabecera.FechaCreacion || cabecera.FechaActualizacion || '';
    const fechaFormateada = fechaOriginal ? new Date(fechaOriginal).toISOString().split('T')[0] : '';

    setFormulario({
      CodigoCaja: cabecera.CodigoCaja,
      FechaCaja: fechaFormateada,
      ClaseCaja: cabecera.ClaseCaja,
      Almacen: cabecera.Almacen,
      Lineas: detalles
    });
    setModoEditar(true);
  };

  const seleccionarCajaDesdeModal = (caja) => {
    const detalles = cajas
      .filter((c) => c.CodigoCaja === caja.CodigoCaja)
      .map((c) => ({
        CodigoItem: c.CodigoItem || '',
        Descripcion: c.Descripcion || '',
        CantidadItem: c.CantidadItem || 1,
        TipoItem: c.TipoItem || '',
        LoteItem: c.LoteItem || ''
      }));

    const fechaFormateada = caja.FechaCaja
      ? new Date(caja.FechaCaja).toISOString().split('T')[0]
      : '';

    setFormulario({
      CodigoCaja: caja.CodigoCaja,
      FechaCaja: fechaFormateada,
      ClaseCaja: caja.ClaseCaja,
      Almacen: caja.Almacen,
      Lineas: detalles
    });

    setModoEditar(true);
    setMostrarModal(false);
  };

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
          Descripcion: ''
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
      Descripcion: ''
    }];
    setFormulario({ ...formulario, Lineas: nuevasLineas });
  };

  const eliminarLinea = async (index) => {
  const confirmacion = window.confirm("¿Estás seguro de eliminar esta línea?");
  if (!confirmacion) return;

  const obs = solicitarObservacion();
  if (!obs) return alert("Debe ingresar una observación para continuar.");

  const nuevasLineas = formulario.Lineas.filter((_, i) => i !== index);
  const nuevoFormulario = { ...formulario, Lineas: nuevasLineas };
  setFormulario(nuevoFormulario);

  // Ejecutar actualización inmediatamente
  const res = await fetch(`https://pruebas-sap-back.onrender.com/cajas-instrumental/${formulario.CodigoCaja}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'usuario': correoUsuario,
      'observacion': obs
    },
    body: JSON.stringify(nuevoFormulario)
  });

  if (res.ok) {
    setMensaje('Línea eliminada y caja actualizada correctamente');
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
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {lineasPaginadas.map((linea, index) => (
            <tr key={index}>
              <td>
                <input
                  className={styles.inputControl}
                  value={linea.CodigoItem}
                  onChange={(e) => actualizarLinea(index, 'CodigoItem', e.target.value)}
                />
              </td>
              <td>
                <input
                  className={styles.inputControl}
                  placeholder="Descripción"
                  value={linea.Descripcion || ''}
                  onChange={(e) => actualizarLinea(index, 'Descripcion', e.target.value)}
                />
              </td>
              <td>
                <input
                  className={styles.inputControl}
                  type="number"
                  min="0"
                  value={linea.CantidadItem}
                  onChange={(e) => actualizarLinea(index, 'CantidadItem', e.target.value)}
                />
              </td>
              <td>
                <select
                  className={styles.inputControl}
                  value={linea.TipoItem}
                  onChange={(e) => actualizarLinea(index, 'TipoItem', e.target.value)}
                >
                  <option value="">Seleccione</option>
                  <option value="AF">AF</option>
                  <option value="VT">VT</option>
                </select>
              </td>
              <td>
                <input
                  className={styles.inputControl}
                  value={linea.LoteItem}
                  onChange={(e) => actualizarLinea(index, 'LoteItem', e.target.value)}
                />
              </td>
              <td>
                <button className={styles.botonEliminar} onClick={() => eliminarLinea(index)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
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

      {mensaje && <p className={styles.mensaje}>{mensaje}</p>}

      {mostrarModal && (
        <ModalCajas
          cajas={cajas}
          onClose={() => setMostrarModal(false)}
          onSelect={seleccionarCajaDesdeModal}
        />
      )}
    </div>
  );
}
