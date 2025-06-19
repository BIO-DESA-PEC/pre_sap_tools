import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generarPDF = async (data) => {
  const doc = new jsPDF();
  const logo = new Image();
  logo.src = "/images/biocells.png";

  logo.onload = () => {
    doc.addImage(logo, "PNG", 15, 10, 30, 20);

    // Información de empresa
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text("BIOCELLS DISCOVERIES INTERNACIONAL S.A.", 50, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("AV. SIENA 214 Y MIGUEL ANGEL", 50, 20);
    doc.text("(02)3550017", 50, 25);
    doc.text("Ruc: 1791994191001", 50, 30);

    // Cuadro derecha
    doc.setDrawColor(0);
    doc.rect(150, 10, 45, 25);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("TRANSFERENCIA DE STOCK", 172.5, 15, null, null, "center");

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    doc.text(`DocEntry: ${data.DocEntry || "N/A"}`, 152, 22);
    doc.text(`DocNum: ${data.DocNum || "N/A"}`, 152, 27);

    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text("Original", 198, 20, { angle: 90 });

    // Comienza contenido debajo del encabezado
    let y = 45;

    // Cuadro Señores
    doc.setDrawColor(0);
    doc.rect(15, y, 90, 34);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    doc.text("Señores:", 17, y + 6);
    doc.setFont("helvetica", "bold");
    doc.text("BIOCELLS DISCOVERIES INTERNACIONAL S.A.", 17, y + 12);
    doc.setFont("helvetica", "normal");
    doc.text("AV: QUITO", 17, y + 17);
    doc.text("COSTA CENTRO", 17, y + 22);
    doc.text("Tel: 095475195", 17, y + 27);
    doc.text("RUC: 1791994191001", 17, y + 32);

    // Cuadro Origen/Destino
    doc.setDrawColor(0);
    doc.rect(110, y, 85, 30);
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.text("ORIGEN:", 112, y + 6);
    doc.text(`${data.Desde.Codigo} - ${data.Desde.Nombre}`, 112, y + 12);
    doc.text("DESTINO:", 112, y + 18);
    doc.text(`${data.Hacia.Codigo} - ${data.Hacia.Nombre}`, 112, y + 24);

    y += 40;

    // Detalle
    let totalCantidad = 0;
    let totalCosto = 0;
    let lineCounter = 1;

    // Recorre las líneas de transferencia
    const detalle = Array.isArray(data.Detalles) ? data.Detalles.flatMap((item) => {
      const lotes = item.BatchNumbers || [];
      const precio = item.Price || 0;
      
      return lotes.length > 0
        ? lotes.map((lote) => {
            const cantidad = lote.Quantity || item.Quantity || 0;
            const total = cantidad * precio;
            totalCantidad += cantidad;
            totalCosto += total; // Calcula el total del costo
            return [
              (lineCounter++).toString(),
              item.ItemCode,
              "SERVICIO LOGÍSTICO",  // Descripción del artículo
              lote.BatchNumber || "N/A",
              lote.ExpiryDate ? lote.ExpiryDate.split("T")[0] : "N/A", // Fecha de vencimiento
              cantidad,
              precio.toFixed(2),
              total.toFixed(2),
            ];
          })
        : [[
            (lineCounter++).toString(),
            item.ItemCode,
            "SERVICIO LOGÍSTICO",
            "Sin lote",
            "N/A",
            item.Quantity,
            precio.toFixed(2),
            (item.Quantity * precio).toFixed(2),
          ]];
    }) : [];

    // Generar la tabla de detalles
    autoTable(doc, {
      startY: y,
      head: [["No.", "Código", "Descripción", "No Lote", "Vencimiento", "Cantidad", "Costo Und", "Total"]],
      body: detalle,
      styles: { fontSize: 9, textColor: 20 },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: 0,
        halign: "center",
        fontStyle: "bold",
        lineColor: 200,
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 20 },
        2: { cellWidth: 45 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 15, halign: "right" },
        6: { cellWidth: 20, halign: "right" },
        7: { cellWidth: 20, halign: "right" },
      },
    });

    y = doc.lastAutoTable.finalY + 5;

    // Totales
    autoTable(doc, {
      startY: y,
      margin: { left: 120 },
      body: [
        ["Cantidad Total:", totalCantidad],
        ["Costo Total:", `$${totalCosto.toFixed(2)}`],
      ],
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 35, halign: "right" },
      },
      theme: "plain",
    });

    y = doc.lastAutoTable.finalY + 10;

    // Notas
    doc.setDrawColor(0);
    doc.rect(15, y, 180, 12);
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Notas: ${data.Comentarios || "Sin comentarios"}`, 17, y + 8);

    y += 20;
    const usuario = localStorage.getItem("usuario") || "N/A";
    doc.text(`Elaborado por: ${usuario}`, 15, y);

    // Reemplazo dinámico del número de página con línea corta centrada
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      const posY = 36; // justo debajo del RUC
      doc.text(`Página ${i} de ${totalPages}`, 140, 31, { align: "right" });

      const centerX = 100;
      const lineWidth = 80;
      const xStart = centerX - lineWidth / 2;
      const xEnd = centerX + lineWidth / 2;
      doc.setDrawColor(180);
      doc.setLineWidth(0.3);
      doc.line(xStart, posY + 2, xEnd, posY + 2); // línea justo debajo del texto
    }

    doc.save(`Transferencia_${data.DocNum}.pdf`);
  };
};
