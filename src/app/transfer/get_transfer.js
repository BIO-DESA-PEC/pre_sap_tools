"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaHome, FaSignOutAlt } from "react-icons/fa";
import TransferModal from "./TransferModal";
import styles from "./transferencia.module.css";

// ✅ Formato correcto y sin desfase horario
const formatearFecha = (fechaString) => {
  if (!fechaString) return "Sin fecha";

  const fecha = new Date(fechaString);
  if (isNaN(fecha.getTime())) return "Formato inválido";

  const year = fecha.getUTCFullYear();
  const month = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const day = String(fecha.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function Transfer() {
  const [transferencias, setTransferencias] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [filtroGlobal, setFiltroGlobal] = useState("");
  const [filtros, setFiltros] = useState({ DocNum: "", Filler: "", ToWhsCode: "" });
  const [filtroFecha, setFiltroFecha] = useState("");
  const [transferSeleccionada, setTransferSeleccionada] = useState(null);
  const [docEntryCargando, setDocEntryCargando] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const porPagina = 10;
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transfersRes, bodegasRes] = await Promise.all([
          fetch("https://pruebas-sap.onrender.com/stock-transfers-filtradas"),
          fetch("https://pruebas-sap.onrender.com/warehouses"),
        ]);

        const [transfersData, bodegasDataRaw] = await Promise.all([
          transfersRes.json(),
          bodegasRes.json(),
        ]);

        const bodegasData = bodegasDataRaw.warehouses ?? bodegasDataRaw;
        setTransferencias(transfersData);
        setBodegas(bodegasData);
      } catch (err) {
        console.error("Error al obtener datos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getNombreBodega = (codigo) => {
    const bodega = bodegas.find((b) => b.CodigoBodega === codigo);
    return bodega ? `${codigo} - ${bodega.NombreBodega}` : codigo;
  };

  const handleVerDetalles = async (transfer) => {
    setDocEntryCargando(transfer.DocEntry);
    try {
      const detalleRes = await fetch(
        `https://pruebas-sap.onrender.com/get_stock_transfer_detail/${transfer.DocEntry}`
      );
      const detalleData = await detalleRes.json();
      setTransferSeleccionada({ ...detalleData, bodegas });
    } catch (error) {
      console.error("Error al obtener detalles de la transferencia:", error);
    } finally {
      setDocEntryCargando(null);
    }
  };

  const transferenciasFiltradas = transferencias.filter((t) => {
    const fechaFormateada = formatearFecha(t.DocDate);

    const global =
      t.DocNum.toString().includes(filtroGlobal) ||
      getNombreBodega(t.Filler).toLowerCase().includes(filtroGlobal.toLowerCase()) ||
      getNombreBodega(t.ToWhsCode).toLowerCase().includes(filtroGlobal.toLowerCase());

    const filtrosIndividuales =
      t.DocNum.toString().includes(filtros.DocNum) &&
      getNombreBodega(t.Filler).toLowerCase().includes(filtros.Filler.toLowerCase()) &&
      getNombreBodega(t.ToWhsCode).toLowerCase().includes(filtros.ToWhsCode.toLowerCase());

    const cumpleFecha = !filtroFecha || fechaFormateada === filtroFecha;

    return global && filtrosIndividuales && cumpleFecha;
  });

  const totalPaginas = Math.ceil(transferenciasFiltradas.length / porPagina);
  const transferenciasPaginadas = transferenciasFiltradas.slice(
    (paginaActual - 1) * porPagina,
    paginaActual * porPagina
  );

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button
          className={styles.topButton}
          onClick={() => router.push("/dashboard")}
          title="Ir al menú principal"
        >
          <FaHome />
        </button>

        <h2 className={styles.titleCentered}>Transferencias</h2>

        <button
          className={styles.topButton}
          onClick={() => {
            localStorage.removeItem("usuario");
            router.push("/login");
          }}
          title="Cerrar sesión"
        >
          <FaSignOutAlt />
        </button>
      </div>

      {/* 🔍 Filtros globales centrados */}
      <div className={styles.filtrosGlobales}>
        <input
          type="text"
          placeholder="🔍 Buscar general..."
          value={filtroGlobal}
          onChange={(e) => {
            setPaginaActual(1);
            setFiltroGlobal(e.target.value);
          }}
          className={styles.inputFiltro}
        />
        <input
          type="date"
          value={filtroFecha}
          onChange={(e) => {
            setPaginaActual(1);
            setFiltroFecha(e.target.value);
          }}
          className={styles.inputFiltro}
          title="Filtrar por fecha"
        />
      </div>

      {loading ? (
        <div className={styles.spinner}>Cargando transferencias...</div>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>
                  DocNum
                  <input
                    className={styles.inputHeader}
                    type="text"
                    placeholder="🔍"
                    value={filtros.DocNum}
                    onChange={(e) => setFiltros({ ...filtros, DocNum: e.target.value })}
                  />
                </th>
                <th>
                  Bodega Origen
                  <input
                    className={styles.inputHeader}
                    type="text"
                    placeholder="🔍"
                    value={filtros.Filler}
                    onChange={(e) =>
                      setFiltros({ ...filtros, Filler: e.target.value })
                    }
                  />
                </th>
                <th>
                  Bodega Destino
                  <input
                    className={styles.inputHeader}
                    type="text"
                    placeholder="🔍"
                    value={filtros.ToWhsCode}
                    onChange={(e) =>
                      setFiltros({ ...filtros, ToWhsCode: e.target.value })
                    }
                  />
                </th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {transferenciasPaginadas.map((t, idx) => (
                <tr key={t.DocEntry} className={styles.rowHover}>
                  <td>{(paginaActual - 1) * porPagina + idx + 1}</td>
                  <td>{t.DocNum}</td>
                  <td>{getNombreBodega(t.Filler)}</td>
                  <td>{getNombreBodega(t.ToWhsCode)}</td>
                  <td>{formatearFecha(t.DocDate)}</td>
                  <td>
                    <button
                      className={styles.viewButton}
                      onClick={() => handleVerDetalles(t)}
                      disabled={docEntryCargando === t.DocEntry}
                    >
                      {docEntryCargando === t.DocEntry ? "Cargando..." : "Ver Detalles"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.pagination}>
            {Array.from({ length: totalPaginas }, (_, i) => (
              <button
                key={i}
                className={`${styles.pageButton} ${
                  paginaActual === i + 1 ? styles.activePage : ""
                }`}
                onClick={() => setPaginaActual(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}

      {transferSeleccionada && (
        <TransferModal
          transfer={transferSeleccionada}
          bodegas={bodegas}
          onClose={() => setTransferSeleccionada(null)}
        />
      )}
    </div>
  );
}
