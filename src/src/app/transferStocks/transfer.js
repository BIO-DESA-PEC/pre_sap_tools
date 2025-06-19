"use client";
import { useEffect, useState } from "react";
import styles from "./transfer.module.css";
import { generarPDF } from "../utils/pdfGenerator";
import { useRouter } from "next/navigation"; 
import { FaHome, FaSignOutAlt } from "react-icons/fa";


const StockTransfer = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("usuario");

    if (!user) {
      router.push("/login"); // Si no hay usuario, redirigir al login
    } else {
      setUsuario(user);
    }
  }, [router]);

  const [mensaje, setMensaje] = useState("");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [items, setItems] = useState([]); 
  const [fecha, setFecha] = useState("");
  const [cliente, setCliente]= useState("CN1791994191001");
  const [comentarios, setComentarios]=useState("");
  const [priceLists, setPriceLists] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPriceList, setSelectedPriceList] = useState("");
  const [selectedItemCode, setSelectedItemCode] = useState("");
  const [cantidadPorLote, setCantidadPorLote] = useState({});
  const [stockTransferLines, setStockTransferLines] = useState([
    {
      LineNum: 1,
      ItemCode: "", 
      ItemDescription: "", 
      Quantity: "", 
      SerialNumber: null,
      "WarehouseCode": origen,
      "FromWarehouseCode": destino,
      Factor: 1.0,
      Factor2: 1.0,
      Factor3: 1.0,
      Factor4: 1.0,
      UseBaseUnits: "tYES",
      MeasureUnit: null,
      UnitsOfMeasurment: 1.0,
      BaseType: "Default",
      BaseLine: null,
      BaseEntry: null,
      UoMEntry: -1,
      UoMCode: "Manual",
      LineStatus: "bost_Open",
      WeightOfRecycledPlastic: null,
      SerialNumbers: [],
      BatchNumbers: [],
      "CCDNumbers": [],
      "StockTransferLinesBinAllocations": []
  },
  ]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchList, setBatchList] = useState([]); // Lista de lotes disponibles
  const [selectedBatch, setSelectedBatch] = useState(null); // Lote seleccionado
  const [currentBatchItemIndex, setCurrentBatchItemIndex] = useState(null);
  const [batchDetails, setBatchDetails] = useState({
    BatchNumber: "",
    ManufacturerSerialNumber: "",
    ExpiryDate: "",
    Quantity: "",
    BaseLineNumber: "",
    ItemCode: "",
  });

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString(); 
  };

  const handleTransfer = async (e) => {
    e.preventDefault();

    if (!origen || !destino || !fecha || !cliente || !comentarios)   {
      setMensaje("Todos los campos son obligatorios");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("https://pruebas-sap-back.onrender.com/stock-transfer", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  body: JSON.stringify({
    Series: 27,
    Printed: "tNO",
    DocDate: formatDate(fecha),
    DueDate: formatDate(fecha),
    CardCode: cliente,
    Comments: comentarios,
    JournalMemo: `Inventory Transfers - I ${cliente}`,
    FromWarehouse: origen,
    ToWarehouse: destino,
    CreationDate: formatDate(fecha),
    UpdateDate: formatDate(fecha),
    FinancialPeriod: 48,
    TaxDate: formatDate(fecha),
    StockTransferLines: stockTransferLines, // Verifica que aquí se estén enviando correctamente los datos
    StockTransferTaxExtension: {
      SupportVAT: "tNO"
    },
    DocumentReferences: []
  })
});

      if (!response.ok) {
  throw new Error("Error en la transferencia");
}

const jsonData = await response.json();
console.log(jsonData); // Verifica la respuesta completa

// Verifica que jsonData contenga 'Detalles' y que 'BatchNumbers' no esté vacío
if (jsonData && jsonData.Detalles && jsonData.Detalles.length > 0) {
  // Verificamos si los lotes están presentes en 'BatchNumbers'
  const tieneLotes = jsonData.Detalles.some(detalle => detalle.BatchNumbers && detalle.BatchNumbers.length > 0);

  if (tieneLotes) {
    generarPDF(jsonData); // Llamamos a generarPDF solo si hay lotes
  } else {
    alert("No se encontraron lotes para imprimir en el PDF.");
  }
} else {
  alert("No se encontraron detalles para el PDF.");
}

// Muestra el mensaje en un popup
      // Limpiar la bandeja después de la transferencia
      setOrigen("");
      setDestino("");
      setFecha("");
      setComentarios("");
      setStockTransferLines([]); // Limpiar líneas de transferencia
      setBatchList([]);
      setMensaje(""); // Limpiar mensajes de error
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false); // Ocultar spinner y habilitar botón
    }
  };
  const addNewItemLine = () => {
    const newLine = {
      LineNum: stockTransferLines.length + 1,
      ItemCode: "", 
      ItemDescription: "", 
      Quantity: "", 
      SerialNumber: null,
      "WarehouseCode": destino,
      "FromWarehouseCode": origen,
      Factor: 1.0,
      Factor2: 1.0,
      Factor3: 1.0,
      Factor4: 1.0,
      UseBaseUnits: "tYES",
      MeasureUnit: null,
      UnitsOfMeasurment: 1.0,
      BaseType: "Default",
      BaseLine: null,
      BaseEntry: null,
      UoMEntry: -1,
      UoMCode: "Manual",
      LineStatus: "bost_Open",
      WeightOfRecycledPlastic: 0.0,
      SerialNumbers: [],
      BatchNumbers: [], 
    };
    setStockTransferLines([...stockTransferLines, newLine]);
  };
  const [isRemoving, setIsRemoving] = useState(false);

const removeLastItemLine = () => {
  if (stockTransferLines.length > 0 && !isRemoving) {
    setIsRemoving(true);
    setStockTransferLines(stockTransferLines.slice(0, -1));
    // Simula un retardo o acción asíncrona
    setTimeout(() => {
      setIsRemoving(false);
    }, 300); // tiempo en milisegundos
  }
};

  
  const handleBatchModal = async (index) => {
    await fetchBatchNumbers(stockTransferLines[index].ItemCode); // Obtener los lotes disponibles
    setCurrentBatchItemIndex(index);
  };

  const handleBatchInputChange = (e) => {
    const { name, value } = e.target;
    setBatchDetails({ ...batchDetails, [name]: value });
  };
  
  const handleBatchSave = () => {
  // Verifica que los datos del lote estén completos
  if (!batchDetails.BatchNumber || !batchDetails.Quantity) {
    setMensaje("Debe completar los datos del lote");
    return;
  }

  const line = stockTransferLines[currentBatchItemIndex]; // Línea que estamos editando
  const totalAssigned = line.BatchNumbers.reduce((sum, b) => sum + b.Quantity, 0); // Total de los lotes ya asignados
  const itemQuantity = parseFloat(line.Quantity); // Cantidad total del artículo
  const batchQty = parseFloat(batchDetails.Quantity); // Cantidad que estamos agregando al lote

  // Verifica que no se asignen más lotes de los que corresponden
  if (totalAssigned + batchQty > itemQuantity) {
    setMensaje(`La suma de lotes (${totalAssigned + batchQty}) supera la cantidad total (${itemQuantity})`);
    return;
  }

  // Actualiza la línea con el nuevo lote
  const updatedLines = [...stockTransferLines];
  updatedLines[currentBatchItemIndex].BatchNumbers.push({
    BatchNumber: batchDetails.BatchNumber, // Lote
    ManufacturerSerialNumber: batchDetails.ManufacturerSerialNumber || "", // Serial del fabricante
    ExpiryDate: formatDate(batchDetails.ExpiryDate || ""), // Fecha de vencimiento
    Quantity: batchQty, // Cantidad del lote
    BaseLineNumber: parseInt(batchDetails.BaseLineNumber), // Línea base
    ItemCode: batchDetails.ItemCode || "", // Código del ítem
  });

  // Verifica que los lotes se hayan asignado correctamente
  console.log("Lotes asignados a la línea:", updatedLines[currentBatchItemIndex].BatchNumbers);

  setStockTransferLines(updatedLines); // Actualiza el estado de las líneas
  setBatchList(prevBatches =>
    prevBatches.filter(batch => batch.BatchNumber !== batchDetails.BatchNumber) // Quita el lote de la lista
  );
  setShowBatchModal(false); // Cierra el modal
  setBatchDetails({ // Limpia los detalles del lote
    BatchNumber: "",
    ManufacturerSerialNumber: "",
    ExpiryDate: "",
    Quantity: "",
    BaseLineNumber: "",
    ItemCode: "",
  });
};

   // Obtener la lista de ítems del backend
   useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("https://pruebas-sap-back.onrender.com/items");
        const data = await response.json();
        setItems(data); // Asume que data contiene la lista de ítems
      } catch (error) {
        console.error("Error al obtener los ítems:", error);
      }
    };
    fetchItems();
  }, []);
  // Manejo de la selección de un ItemCode
  const handleItemCodeChange = (e, index) => {
    const selectedItemCode = e.target.value;
    const selectedItem = items.find(item => item.ItemCode === selectedItemCode);
    setSelectedItemCode(selectedItemCode);

    const updatedLines = [...stockTransferLines];
    updatedLines[index].ItemCode = selectedItemCode;
    updatedLines[index].ItemDescription = selectedItem ? selectedItem.ItemName : "";
    setStockTransferLines(updatedLines);
    console.log("Item seleccionado:", selectedItemCode, "Descripción:", updatedLines[index].ItemDescription);
  };

  const fetchBatchNumbers = async (itemCode) => {
    try {
      const response = await fetch(`https://pruebas-sap-back.onrender.com/inventario?codigo_item=${itemCode}&codigo_almacen=${origen}`);
      const text = await response.text();
      const data = JSON.parse(text);
  
      if (Array.isArray(data)) {
        const normalizedData = data.map(batch => ({
          BatchNumber: batch["Lote"],
          ManufacturerSerialNumber: batch["Cod Barras"] || "",
          ExpiryDate: batch["Fecha Vencimiento"] ? new Date(batch["Fecha Vencimiento"]).toISOString().split('T')[0] : "",
          Quantity: batch["Cantidad"] || 0
        }));
        console.log("Lotes",data);
        setBatchList(normalizedData);
      } else {
        console.error("Los datos recibidos no son un array:", data);
      }
    } catch (error) {
      console.error("Error al obtener los lotes:", error);
    }
  };
  
  
  const handleModal = (batch) => {
    setSelectedBatch(batch)
    setShowBatchModal(true);
    console.log("Lote seleccionado:", batch);
  };


  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await fetch("https://pruebas-sap-back.onrender.com/get-warehouses");
        const data = await response.json();
        setWarehouses(data.warehouses); // Asumiendo que el backend devuelve la lista de bodegas
      } catch (error) {
        alert(`Error: ${error.message}`);
        console.error("Error al obtener las bodegas:", error);
      }
    };

    fetchWarehouses();
  }, []);
  

useEffect(() => {
  const fetchPriceLists = async () => {
    const controller = new AbortController(); // Para abortar la petición si el componente se desmonta
    const signal = controller.signal;

    try {
      const response = await fetch(`https://pruebas-sap-back.onrender.com/business-partner-price-list/${cliente}`, { signal });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json(); // Usar directamente response.json()

      setPriceLists(data);
      if (data?.PriceListNum) {
        setSelectedPriceList(data.PriceListNum);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error fetching price lists:", error);
      }
    }

    return () => controller.abort(); // Limpiar efecto para evitar problemas de memoria
  };

  if (cliente) {
    fetchPriceLists();
  }
}, [cliente]);

  //obtener los lotes por item y bodega de origen

  // Actualización de los valores de WarehouseCode y FromWarehouseCode
  useEffect(() => {
    if (origen && destino) {
      setStockTransferLines((prevLines) =>
        prevLines.map((line) => ({
          ...line,
          WarehouseCode: destino,
          FromWarehouseCode: origen,
        }))
      );
    }
  }, [origen, destino]);
  
  useEffect(() => {
    if (selectedBatch) {
        const lastLineNum = stockTransferLines.length > 0 
            ? stockTransferLines[stockTransferLines.length - 1].LineNum 
            : 1; // Si no hay líneas, asigna 1
        setBatchDetails({
            BatchNumber: selectedBatch.BatchNumber,
            ManufacturerSerialNumber: selectedBatch.ManufacturerSerialNumber,
            ExpiryDate: selectedBatch.ExpiryDate,
            Quantity: selectedBatch.Quantity,
            BaseLineNumber: lastLineNum, // Asigna el último LineNum
            ItemCode: stockTransferLines[currentBatchItemIndex]?.ItemCode || "",
        });
    }
}, [selectedBatch, currentBatchItemIndex, stockTransferLines]);
const handleRemoveBatch = (lineIndex, batchIndex, batchToRestore) => {
  // 1. Elimina el lote de la línea correspondiente
  const updatedLines = [...stockTransferLines];
  updatedLines[lineIndex].BatchNumbers.splice(batchIndex, 1);
  setStockTransferLines(updatedLines);

  // 2. Devuelve el lote a la lista de lotes disponibles
  setBatchList(prev => [...prev, {
    BatchNumber: batchToRestore.BatchNumber,
    ManufacturerSerialNumber: batchToRestore.ManufacturerSerialNumber,
    ExpiryDate: batchToRestore.ExpiryDate,
    Quantity: batchToRestore.Quantity,
  }]);
};
const handleAgregarLoteDirecto = (batch) => {
  const cantidad = parseFloat(cantidadPorLote[batch.BatchNumber]);

  if (!cantidad || cantidad <= 0 || cantidad > batch.Quantity) {
    alert("Cantidad inválida");
    return;
  }

  const updatedLines = [...stockTransferLines];
  const currentLine = updatedLines[currentBatchItemIndex];

  const cantidadAsignada = currentLine.BatchNumbers.reduce((sum, b) => sum + b.Quantity, 0);

  if (cantidadAsignada + cantidad > currentLine.Quantity) {
    alert("No puedes asignar más cantidad de la permitida para este ítem.");
    return;
  }

  currentLine.BatchNumbers.push({
    BatchNumber: batch.BatchNumber,
    ManufacturerSerialNumber: batch.ManufacturerSerialNumber || "",
    ExpiryDate: batch.ExpiryDate,
    Quantity: cantidad,
    BaseLineNumber: currentLine.LineNum,
    ItemCode: currentLine.ItemCode,
  });

  // Quita el lote de la lista disponible
  setBatchList((prev) =>
    prev.filter((b) => b.BatchNumber !== batch.BatchNumber)
  );

  // Limpia el input de cantidad para ese lote
  setCantidadPorLote((prev) => {
    const copy = { ...prev };
    delete copy[batch.BatchNumber];
    return copy;
  });

  setStockTransferLines(updatedLines);
};


const cantidadAsignada = stockTransferLines[currentBatchItemIndex]?.BatchNumbers.reduce((sum, b) => sum + b.Quantity, 0) || 0;
const cantidadTotal = stockTransferLines[currentBatchItemIndex]?.Quantity || 0;
const cantidadMaximaAlcanzada = cantidadAsignada >= cantidadTotal;

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

  <h2 className={styles.titleCentered}>Transferencia de Stock</h2>

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

      <p className={styles.subtitle}>Complete los detalles a continuación</p>
      <form onSubmit={handleTransfer} className={styles.form}>
        {/* Encabezado con los campos principales */}
        <div className={styles.header}>
          <div className={styles.inputField}>
            <label>Código Cliente</label>
            <input
              type="text"
              placeholder="Código Cliente"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputField}>
            <label>Comentarios</label>
            <input
              type="text"
              placeholder="Comentarios"
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputField}>
            <label>Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>

          {/* Lista de precios */}
          {priceLists && priceLists.PriceListName ? (
            <div className={styles.inputField}>
              <label>Lista de Precios</label>
              <p>{priceLists.PriceListName}</p>
            </div>
          ) : (
            <p>No hay listas de precios disponibles.</p>
          )}

          {/* Selects de Origen y Destino */}
          <div className={styles.inputField}>
            <label>Almacén Origen</label>
            <select
              value={origen}
              onChange={(e) => setOrigen(e.target.value)}
              required
            >
              <option value="">Seleccione Almacén Origen</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.WarehouseCode} value={warehouse.WarehouseCode}>
                  {warehouse.WarehouseName}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputField}>
            <label>Almacén Destino</label>
            <select
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              required
            >
              <option value="">Seleccione Almacén Destino</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.WarehouseCode} value={warehouse.WarehouseCode}>
                  {warehouse.WarehouseName}
                </option>
              ))}
            </select>
          </div>
        </div>
      
        {/* Mostrar las líneas de transferencia */}
<div className={styles.stockLines}>
  <h3>Detalle de la Transferencia</h3>
  <table className={styles.table}>
    <thead>
      <tr>
        <th>Código Artículo</th>
        <th>Descripción Artículo</th>
        <th>Cantidad</th>
        <th>Agregar Lote</th>
      </tr>
    </thead>
    <tbody>
      {stockTransferLines.map((line, index) => (
        <tr key={index} className={styles.lineItem}>
          <td>
            <select
              value={line.ItemCode}
              onChange={(e) => handleItemCodeChange(e, index)} // Se actualiza el código de artículo
            >
              <option value="">Seleccione el Código de Artículo</option>
              {items.map((item) => (
                <option key={item.ItemCode} value={item.ItemCode}>
                  {item.ItemCode}
                </option>
              ))}
            </select>
          </td>
          <td>
            <input
              type="text"
              value="SERVICIO LOGÍSTICO"
              placeholder="Descripción del Artículo"
              disabled
            />
          </td>
          <td>
          <input
            type="number"
            value={line.Quantity}
            min="1"
            onChange={(e) => {
              const newValue = Math.max(1, parseFloat(e.target.value) || 1); // Asegura que sea al menos 1
              const updatedLines = [...stockTransferLines];
              updatedLines[index].Quantity = newValue;
              setStockTransferLines(updatedLines);
            }}
          />
        </td>
          <td>
            <button 
  type="button" 
  onClick={() => handleBatchModal(index)}
  disabled={line.BatchNumbers.reduce((sum, b) => sum + b.Quantity, 0) >= line.Quantity}
>
  Llenar Lotes
</button>

          </td>
        </tr>
      ))}
    </tbody>
    </table>
<div style={{ marginTop: "20px" }}>
  <button className={styles.btnAdd} onClick={addNewItemLine}>
    Agregar Item
  </button>
  <button className={styles.btnRemove} onClick={removeLastItemLine}>
    Quitar Último Item
  </button>
</div>
</div>

        <div className={styles.stockLines}>
      <h3>Detalle de Lotes</h3>
      <div className={styles.loteTableScroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Lote</th>
            <th>Número de Serie</th>
            <th>Fecha de Vencimiento</th>
            <th>Cantidad</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
  {batchList.length > 0 ? (
    <>
      {/* Contenedor flexible para los botones */}
      <tr>
  <td colSpan="5">
    {(() => {
      const cantidadAsignada = stockTransferLines[currentBatchItemIndex]?.BatchNumbers.reduce((sum, b) => sum + b.Quantity, 0) || 0;
      const cantidadTotal = stockTransferLines[currentBatchItemIndex]?.Quantity || 0;
      const cantidadMaximaAlcanzada = cantidadAsignada >= cantidadTotal;
    })()}
  </td>
</tr>


      {/* Tabla de lotes */}
     {batchList.map((batch, idx) => (
        <tr key={idx}>
  <td>{batch.BatchNumber}</td>
  <td>{batch.ManufacturerSerialNumber}</td>
  <td>{batch.ExpiryDate}</td>
  <td>{batch.Quantity}</td>
  <td style={{ display: "flex", gap: "5px", alignItems: "center" }}>
    <input
      type="number"
      min="1"
      max={batch.Quantity}
      placeholder="Cant."
      value={cantidadPorLote[batch.BatchNumber] || ""}
      onChange={(e) =>
        setCantidadPorLote({
          ...cantidadPorLote,
          [batch.BatchNumber]: e.target.value,
        })
      }
      style={{
        width: "60px",
        padding: "4px",
        borderRadius: "4px",
        border: "1px solid #ccc",
      }}
      disabled={cantidadMaximaAlcanzada}
    />

    <button
      type="button"
      onClick={() => handleAgregarLoteDirecto(batch)}
      disabled={
        cantidadMaximaAlcanzada || !cantidadPorLote[batch.BatchNumber]
      }
      style={{
        backgroundColor: cantidadMaximaAlcanzada ? "#ccc" : "green",
        color: "white",
        border: "none",
        padding: "5px 10px",
        borderRadius: "5px",
        cursor: cantidadMaximaAlcanzada ? "not-allowed" : "pointer",
      }}
    >
      Seleccionar
    </button>
  </td>
</tr>

      ))}
    </>
  ) : (
    <tr>
      <td colSpan="5" style={{ textAlign: "center", color: "#d9534f" }}>
        No hay lotes disponibles
      </td>
    </tr>
  )}
</tbody>

      </table>
      </div>
    </div>
<div className={styles.summaryBox}>
  <h3>Resumen de Transferencia</h3>
  {stockTransferLines.map((line, index) => (
    <div key={index} className={styles.summaryItem}>
      <h4>Item: {line.ItemCode}</h4>
      <p><strong>Cantidad total:</strong> {line.Quantity}</p>

      {line.BatchNumbers.length > 0 ? (
        <table className={styles.summaryTable}>
          <thead>
            <tr>
              <th>Lote</th>
              <th>N° de Serie</th>
              <th>Fecha de Vencimiento</th>
              <th>Cantidad</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {line.BatchNumbers.map((batch, i) => (
              <tr key={i}>
                <td>{batch.BatchNumber}</td>
                <td>{batch.ManufacturerSerialNumber}</td>
                <td>{batch.ExpiryDate}</td>
                <td>{batch.Quantity}</td>
                <td>
                  <button
                    onClick={() => handleRemoveBatch(index, i, batch)}
                    className={styles.removeBtn}
                    title="Eliminar lote"
                  >
                    ✖
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: "#999" }}>No hay lotes seleccionados para este ítem.</p>
      )}
    </div>
  ))}
</div>

        {/* Botón para realizar la transferencia */}
        <div className={styles.submitButton}>
        <button
  onClick={handleTransfer}
  disabled={loading}
  className={styles.transferButton}
>
  {loading ? (
    <span className={styles.spinner}></span> // O puedes usar un texto: "Transfiriendo..."
  ) : (
    "Transferir"
  )}
</button>

        </div>
      </form>

      {mensaje && <div className={styles.message}>{mensaje}</div>}
    </div>
  );
};



export default StockTransfer;
