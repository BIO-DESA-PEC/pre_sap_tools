"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import styles from "./transferencia.module.css";
import { generarPDF } from "@/app/utils/pdfGenerator";

export default function TransferModal({ transfer, onClose, bodegas = [] }) {
  const { data: session } = useSession();
  const [detalleCompleto, setDetalleCompleto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetalle = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://pruebas-sap-back.onrender.com/get_stock_transfer_detail/${transfer.DocEntry}`
        );
        const data = await response.json();
        setDetalleCompleto(data);
      } catch (error) {
        console.error("Error al obtener detalle:", error);
      } finally {
        setLoading(false);
      }
    };

    if (transfer?.DocEntry) {
      fetchDetalle();
    }
  }, [transfer?.DocEntry]);

  const getNombreBodega = (codigo) => {
    const bodega = bodegas.find((b) => b.CodigoBodega === codigo);
    return bodega ? `${bodega.CodigoBodega} - ${bodega.NombreBodega}` : `${codigo}`;
  };

  const getSoloNombreBodega = (codigo) => {
    const bodega = bodegas.find((b) => b.CodigoBodega === codigo);
    return bodega ? bodega.NombreBodega : "";
  };

  const handleGenerarPDF = () => {
    if (!detalleCompleto) return;

    const dataAdaptada = {
      DocNum: detalleCompleto.DocNum,
      DocEntry: detalleCompleto.DocEntry ?? "N/A",
      Comentarios: detalleCompleto.Comments ?? "",
      Desde: {
        Codigo: detalleCompleto.FromWarehouse,
        Nombre: getSoloNombreBodega(detalleCompleto.FromWarehouse),
      },
      Hacia: {
        Codigo: detalleCompleto.ToWarehouse,
        Nombre: getSoloNombreBodega(detalleCompleto.ToWarehouse),
      },
      Detalles:
        detalleCompleto.StockTransferLines?.map((linea) => ({
          ItemCode: linea.ItemCode,
          ItemDescription: linea.ItemDescription,
          Price: linea.Price ?? 0,
          Quantity: linea.Quantity ?? 0,
          BatchNumbers: (linea.BatchNumbers ?? []).map((batch) => ({
            BatchNumber: batch.BatchNumber ?? "Sin lote",
            ExpiryDate: batch.ExpiryDate ?? "",
            Quantity: batch.Quantity ?? linea.Quantity ?? 0,
          })),
        })) ?? [],
    };

    const usuario = session?.user?.name || "Usuario";
    generarPDF(dataAdaptada, usuario);
  };

  if (!transfer) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>✕</button>

        <h2 className={styles.modalTitle}>
          Transferencia #{transfer.DocNum}
        </h2>

        <table className={styles.detailTable}>
          <tbody>
            <tr>
              <th>DocEntry</th>
              <td>{transfer.DocEntry}</td>
            </tr>
            <tr>
              <th>Origen</th>
              <td>{getNombreBodega(transfer.FromWarehouse)}</td>
            </tr>
            <tr>
              <th>Destino</th>
              <td>{getNombreBodega(transfer.ToWarehouse)}</td>
            </tr>
            <tr>
              <th>Fecha</th>
              <td>{transfer.DocDate?.split("T")[0]}</td>
            </tr>
            <tr>
              <th>Comentarios</th>
              <td>{transfer.Comments || "Sin comentarios"}</td>
            </tr>
          </tbody>
        </table>

        <h3 className={styles.subTitle}>Detalle</h3>

        {loading ? (
          <div className={styles.spinner}>Cargando detalles...</div>
        ) : (
          <table className={styles.detailTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>Código</th>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Lote</th>
                <th>Vencimiento</th>
                <th>Bodega</th>
              </tr>
            </thead>
            <tbody>
              {detalleCompleto?.StockTransferLines?.map((line, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{line.ItemCode}</td>
                  <td>{line.ItemDescription}</td>
                  <td>{line.Quantity}</td>
                  <td>{line.BatchNumbers?.[0]?.BatchNumber ?? "-"}</td>
                  <td>{line.BatchNumbers?.[0]?.ExpiryDate?.split("T")[0] ?? "-"}</td>
                  <td>{getNombreBodega(line.WarehouseCode)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button className={styles.printButton} onClick={handleGenerarPDF}>
          🖨️ Imprimir PDF
        </button>
      </div>
    </div>
  );
}
