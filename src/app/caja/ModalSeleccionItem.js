// ModalSeleccionItem.js
'use client';

import { useEffect, useState } from 'react';
import styles from './Caja.module.css';

export default function ModalSeleccionItem({ onClose, onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 30;

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch('https://pruebas-sap-back.onrender.com/inventario-af-cajas');
        const data = await res.json();
        if (Array.isArray(data)) {
          setItems(data);
        } else {
          console.error('Respuesta inesperada:', data);
          setItems([]);
        }
      } catch (error) {
        console.error('Error al obtener ítems:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const filteredItems = items.filter(item =>
  (item['Código']?.toLowerCase()?.includes(searchTerm.toLowerCase()) || '') ||
  (item['Descripción']?.toLowerCase()?.includes(searchTerm.toLowerCase()) || '')
);


  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelect = (item) => {
    onSelect(item);
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <h2 className={styles.modalTitle}>Datos Maestros de Artículos y Activos Fijos</h2>

        <input
          type="text"
          placeholder="Buscar por código o descripción"
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Grupo</th>
                <th>Tipo</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item, idx) => (
                <tr key={idx}>
                  <td>{item['Código']}</td>
                  <td>{item['Descripción']}</td>
                  <td>{item['Grupo de Artículos']}</td>
                  <td>{item['Tipo']}</td>
                  <td>
                    <button className={styles.botonAzul} onClick={() => handleSelect(item)}>
                      Seleccionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className={styles.paginationContainer}>
          <button
            className={styles.paginationButton}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          <span className={styles.paginationText}>{currentPage} de {totalPages}</span>
          <button
            className={styles.paginationButton}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </button>
        </div>

        <button className={styles.botonCerrar} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}