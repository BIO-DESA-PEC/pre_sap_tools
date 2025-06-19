'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaHome, FaSignOutAlt } from 'react-icons/fa';
import styles from './Caja.module.css';

export default function Caja() {
  const router = useRouter();
  const [cajas, setCajas] = useState([]);
  const [bodegas, setBodegas] = useState([]);
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

    const res = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formulario)
    });

    if (res.ok) {
      const texto = modoEditar ? 'Caja actualizada correctamente' : 'Caja insertada correctamente';
      setMensaje(texto);
      obtenerCajas();
      limpiarFormulario();
    } else {
      const err = await res.json();
      alert(err.error || 'Error en operación');
    }
  };

  const eliminarCaja = async () => {
    if (!formulario.CodigoCaja) return alert('Ingrese código para eliminar');

    const confirmacion = window.confirm("¿Estás seguro de eliminar esta caja?");
    if (!confirmacion) return;

    const res = await fetch(
      `https://pruebas-sap-back.onrender.com/cajas-instrumental/${formulario.CodigoCaja}`,
      { method: 'DELETE' }
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

  const eliminarLinea = (index) => {
    const nuevasLineas = formulario.Lineas.filter((_, i) => i !== index);
    setFormulario({ ...formulario, Lineas: nuevasLineas });
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
        <input
          className={styles.inputControl}
          placeholder="Código Caja"
          value={formulario.CodigoCaja}
          onChange={(e) =>
            setFormulario({ ...formulario, CodigoCaja: e.target.value })
          }
        />

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
    </div>
  );
}
