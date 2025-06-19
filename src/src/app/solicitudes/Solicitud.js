"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import './Solicitud.css';
import { jsPDF } from 'jspdf';
import { generarReporteTransferencia } from '../utils/generarReporteTransferencia';
import { FaHome, FaSignOutAlt } from 'react-icons/fa';

const Solicitud = () => {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [docEntry, setDocEntry] = useState('');
  const [transferencia, setTransferencia] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
  const usuario = localStorage.getItem("usuario");
  if (!usuario) {
    router.push("/login");
  } else {
    cargarSolicitudesPendientes();
    cargarBodegas();
  }
}, []); // Asegúrate de que esto no cambie

  const cargarSolicitudesPendientes = () => {
  setIsLoading(true);
  const startTime = Date.now();
  fetch('https://pruebas-sap-back.onrender.com/check_inventory_transfer')
    .then(res => res.json())
    .then(data => {
      console.log('Tiempo de respuesta:', Date.now() - startTime, 'ms');
      if (data.value) {
        setSolicitudes(data.value);
      } else {
        mostrarPopupError("Error al obtener solicitudes");
      }
    })
    .catch(() => mostrarPopupError("Error al conectar con el servidor."))
    .finally(() => setIsLoading(false));
};


  // Al cargar las bodegas
const cargarBodegas = () => {
  fetch("https://pruebas-sap-back.onrender.com/get-warehouses")
    .then(res => res.json())
    .then(data => {
      const bodegas = data.warehouses || []; // <-- arreglo correcto
      setWarehouses(bodegas);
    })
    .catch(err => console.error("Error al obtener bodegas:", err));
};

  const getWarehouseName = (code) => {
  const wh = warehouses.find(w => w.WarehouseCode === code);
  return wh ? `${code} - ${wh.WarehouseName}` : code;
};


  const mostrarPopupError = (mensaje) => {
    setPopupMessage(mensaje);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 4000);
  };

  const verDetalle = (solicitud) => {
    if (detalle?.DocEntry === solicitud.DocEntry) {
      setDetalle(null);
      return;
    }

    fetch(`https://pruebas-sap-back.onrender.com/get_inventory_transfer_detail/${solicitud.DocEntry}`)
      .then(res => res.json())
      .then(data => {
        if (data.DocEntry) {
          setDetalle(data);
          setTransferencia(null);
        } else {
          mostrarPopupError("No se pudo obtener el detalle con lote");
        }
      })
      .catch(() => mostrarPopupError("Error al obtener detalle con lote"));
  };

  const realizarTransferencia = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`https://pruebas-sap-back.onrender.com/create_inventory_transfer/${docEntry}`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        setTransferencia(data.data);
        generarReporteTransferencia(data.data, warehouses);
        mostrarPopupError("✅ Transferencia realizada con éxito");

        setDetalle(null);
        setDocEntry('');
        setTimeout(() => setTransferencia(null), 5000);
        cargarSolicitudesPendientes();
      } else {
        const errorMsg = data.error?.message?.value || data.message || "Error al crear la transferencia";
        mostrarPopupError(errorMsg);
        console.error("Error en la respuesta de la transferencia:", errorMsg);
      }
    } catch (error) {
      console.error("Error en la conexión o en la transferencia:", error);
      mostrarPopupError("Error en la conexión o en la transferencia.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="solicitud-container">
      {/* Encabezado */}
      <div className="top-bar">
        <button className="top-button" onClick={() => router.push("/dashboard")} title="Inicio">
          <FaHome size={18} />
        </button>
        <h2 className="title-centered">Solicitud - Transferencia</h2>
        <button className="logout-button" onClick={() => {
          localStorage.clear();
          router.push("/login");
        }} title="Cerrar sesión">
          <FaSignOutAlt size={18} />
        </button>
      </div>

      <h1>📋 Solicitudes Pendientes</h1>

      {showPopup && (
        <div className="popup-error">
          <div>{popupMessage}</div>
        </div>
      )}

      {isLoading ? (
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p className="loading-text">Cargando solicitudes...</p>
        </div>
      ) : (
        <div className="lista-solicitudes">
          {solicitudes.length === 0 ? (
            <p>No hay solicitudes pendientes.</p>
          ) : (
            solicitudes.map(s => (
              <div key={s.DocEntry} className="solicitud-card" onClick={() => verDetalle(s)}>
                <p><strong>DocEntry:</strong> {s.DocEntry}</p>
                <p><strong>DocNum:</strong> {s.DocNum}</p>
                <p><strong>Fecha:</strong> {s.DocDate}</p>
              </div>
            ))
          )}
        </div>
      )}

      {detalle && (
        <div className="detalle-solicitud">
          <h2>📝 Detalle de la Solicitud #{detalle.DocEntry}</h2>
          <table className="detalle-table">
            <thead>
              <tr>
                <th>Código Cliente</th>
                <th>Nombre Cliente</th>
                <th>DocEntry</th>
                <th>Número Documento</th>
                <th>Almacén Origen</th>
                <th>Almacén Destino</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{detalle.CardCode}</td>
                <td>{detalle.CardName}</td>
                <td>{detalle.DocEntry}</td>
                <td>{detalle.DocNum}</td>
                <td>{getWarehouseName(detalle.FromWarehouse)}</td>
                <td>{getWarehouseName(detalle.ToWarehouse)}</td>
                <td>{detalle.DocDate}</td>
              </tr>
            </tbody>
          </table>

          <table className="detalle-table">
            <thead>
              <tr>
                <th>Código Item</th>
                <th>Nombre Item</th>
                <th>Cantidad</th>
                <th>Lote</th>
              </tr>
            </thead>
            <tbody>
              {detalle.StockTransferLines?.map((item, idx) => {
                const batch = (item.BatchNumbers && item.BatchNumbers.length > 0)
                  ? item.BatchNumbers[0].BatchNumber
                  : '—';

                return (
                  <tr key={idx}>
                    <td>{item.ItemCode}</td>
                    <td>SERVICIO LOGÍSTICO</td>
                    <td>{item.Quantity}</td>
                    <td>{batch}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="form-transferencia">
        <h2>🚚 Realizar Transferencia</h2>
        <input
          type="number"
          placeholder="Ingrese DocEntry"
          value={docEntry}
          onChange={e => setDocEntry(e.target.value)}
        />
        <div className="button-spinner-wrapper">
          <button onClick={realizarTransferencia} disabled={isLoading}>
            {isLoading ? 'Cargando...' : 'Realizar Transferencia'}
          </button>
          {isLoading && <div className="spinner"></div>}
        </div>
      </div>

      {transferencia && (
        <div className="detalle-transferencia">
          <h2>✅ Transferencia Realizada</h2>
          <p>La transferencia con número <strong>{transferencia.DocNum}</strong> fue generada exitosamente.</p>
          <p>Desde almacén: <strong>{getWarehouseName(transferencia.FromWarehouse)}</strong></p>
          <p>Hacia almacén: <strong>{getWarehouseName(transferencia.ToWarehouse)}</strong></p>
          <p>Fecha: <strong>{transferencia.DocDate}</strong></p>
        </div>
      )}
    </div>
  );
};

export default Solicitud;
