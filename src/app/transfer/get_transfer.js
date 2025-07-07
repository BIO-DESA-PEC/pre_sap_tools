"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaHome, FaSignOutAlt } from "react-icons/fa";
import TransferModal from "./TransferModal";
import styles from "./transferencia.module.css";

export default function Transfer() {
  const [transferencias, setTransferencias] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [filtroGlobal, setFiltroGlobal] = useState("");
  const [filtros, setFiltros] = useState({ DocNum: "", FromWarehouse: "", ToWarehouse: "" });
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
          fetch("https://pruebas-sap-back.onrender.com/stock-transfers-filtradas"),
          fetch("https://pruebas-sap-back.onrender.com/warehouses"),
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
        `https://pruebas-sap-back.onrender.com/get_stock_transfer_detail/${transfer.DocEntry}`
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
    const global =
      t.DocNum.toString().includes(filtroGlobal) ||
      t.FromWarehouse.toLowerCase().includes(filtroGlobal.toLowerCase()) ||
      t.ToWarehouse.toLowerCase().includes(filtroGlobal.toLowerCase());

    const filtrosIndividuales =
      t.DocNum.toString().includes(filtros.DocNum) &&
      t.FromWarehouse.toLowerCase().includes(filtros.FromWarehouse.toLowerCase()) &&
      t.ToWarehouse.toLowerCase().includes(filtros.ToWarehouse.toLowerCase());

    return global && filtrosIndividuales;
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

      <div className={styles.filtroContainer}>
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
                    value={filtros.FromWarehouse}
                    onChange={(e) =>
                      setFiltros({ ...filtros, FromWarehouse: e.target.value })
                    }
                  />
                </th>
                <th>
                  Bodega Destino
                  <input
                    className={styles.inputHeader}
                    type="text"
                    placeholder="🔍"
                    value={filtros.ToWarehouse}
                    onChange={(e) =>
                      setFiltros({ ...filtros, ToWarehouse: e.target.value })
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
                  <td>{getNombreBodega(t.FromWarehouse)}</td>
                  <td>{getNombreBodega(t.ToWarehouse)}</td>
                  <td>{t.DocDate?.split("T")[0]}</td>
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
