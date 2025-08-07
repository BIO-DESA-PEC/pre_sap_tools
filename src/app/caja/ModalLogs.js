'use client';
import styles from './Caja.module.css';

export default function ModalLogs({ logs, onClose }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalLogs}>
        <div className={styles.modalLogsHeader}>
          <h3>📋 Logs de la Caja</h3>
          <button className={styles.botonCerrar} onClick={onClose}>✖</button>
        </div>

        <div className={styles.modalLogsTableContainer}>
          {logs.length === 0 ? (
            <p>No hay registros disponibles.</p>
          ) : (
            <table className={styles.tablaLogs}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Detalle</th>
                  <th>Observación</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={index}>
                    <td>{new Date(log.fecha).toLocaleString()}</td>
                    <td>{log.usuario}</td>
                    <td>{log.accion}</td>
                    <td>
                      <pre className={styles.detallePre}>{log.detalle}</pre>
                    </td>
                    <td>{log.observacion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
