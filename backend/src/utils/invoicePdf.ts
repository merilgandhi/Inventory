import PDFDocument from "pdfkit";
import { Orders, OrderItem, Seller, Product, Variation, ProductVariation } from "@models/index";


const calcBoxes = (strips: number, boxQty: number) => {
    if (!boxQty) return { boxes: 0, remaining: strips };
    return {
        boxes: Math.floor(strips / boxQty),
        remaining: strips % boxQty,
    };
};

export const buildInvoicePdf = async (orderId: number, res: any) => {
    const order: any = await Orders.findByPk(orderId, {
        include: [
            { model: Seller, as: "seller" },
            {
                model: OrderItem,
                as: "items",
                include: [
                    { model: Product, as: "product" },
                    {
                        model: ProductVariation,
                        as: "productVariation",
                        include: [{ model: Variation, as: "variation" }]
                    },
                ],
            },
        ],
        paranoid: false,
    });

    if (!order) throw new Error(`Order not found with id: ${orderId}`);

  
    const allVariations = await Variation.findAll({
        where: { status: true },
        order: [["id", "ASC"]],
    });
    const variations: [number, string][] = allVariations.map((v: any) => [v.id, v.name]);

    const productGroups = new Map<number, { product: any; items: any[] }>();
    order.items.forEach((item: any) => {
        const pId = item.product?.id;
        if (!productGroups.has(pId)) {
            productGroups.set(pId, { product: item.product, items: [] });
        }
        productGroups.get(pId)!.items.push(item);
    });

    const doc = new PDFDocument({ margin: 15, size: "A4", layout: "portrait" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=order-form-${order.id}.pdf`);
    doc.pipe(res);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 15;
    const usableWidth = pageWidth - (margin * 2);
    const usableHeight = pageHeight - (margin * 2);

    const srNoWidth = 25;
    const productNameWidth = 100;
    const fixedColumnsWidth = srNoWidth + productNameWidth;
    const remainingWidth = usableWidth - fixedColumnsWidth;
    
    const subColCount = 3; // ALL, STR, CTN
    const totalSubCols = variations.length * subColCount;
    const subColWidth = Math.floor(remainingWidth / totalSubCols);
    const varColWidth = subColWidth * subColCount;
    const tableWidth = srNoWidth + productNameWidth + (varColWidth * variations.length);

    const rowHeight = 16;
    const headerHeight = rowHeight * 2;
    let startX = margin;
    let currentY = margin;

    const totals: Record<number, { all: number; str: number; ctn: number }> = {};
    variations.forEach(([vId]) => { totals[vId] = { all: 0, str: 0, ctn: 0 }; });

    const drawHeaderInfo = () => {
        doc.fontSize(14).font("Helvetica-Bold");
        
        doc.rect(startX, currentY, tableWidth, 22).stroke();
        doc.text("Order Form", startX, currentY + 6, { width: tableWidth, align: "center" });
        currentY += 22;

        doc.fontSize(8).font("Helvetica");
        
        doc.rect(startX, currentY, tableWidth, 14).stroke();
        doc.text(`Order By: ${order.seller?.name || "N/A"}`, startX + 5, currentY + 3);
        currentY += 14;

        doc.rect(startX, currentY, tableWidth, 14).stroke();
        doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, startX + 5, currentY + 3);
        currentY += 14;

        const infoRowHeight = 16;
        const colCount = 3;
        const infoColWidth = tableWidth / colCount;

        doc.rect(startX, currentY, tableWidth, infoRowHeight).stroke();
        
        for (let i = 1; i < colCount; i++) {
            doc.moveTo(startX + (infoColWidth * i), currentY)
               .lineTo(startX + (infoColWidth * i), currentY + infoRowHeight)
               .stroke();
        }

        doc.text(`Total Amt.: Rs.${order.subtotal || 0}`, startX + 5, currentY + 4, { width: infoColWidth - 10 });
        
        doc.text(`Tax Amt.: Rs.${order.gstTotal || 0}`, startX + infoColWidth + 5, currentY + 4, { width: infoColWidth - 10 });
        
        doc.font("Helvetica-Bold");
        doc.text(`Grand Total: Rs.${order.grandTotal || 0}`, startX + (infoColWidth * 2) + 5, currentY + 4, { width: infoColWidth - 10 });
        doc.font("Helvetica");

        currentY += infoRowHeight;
    };

    const drawTableHeader = () => {
        let x = startX;
        doc.fontSize(7).font("Helvetica-Bold");

        doc.rect(x, currentY, srNoWidth, headerHeight).stroke();
        doc.text("Sr", x + 2, currentY + rowHeight - 3, { width: srNoWidth - 4, align: "center" });
        x += srNoWidth;

        doc.rect(x, currentY, productNameWidth, headerHeight).stroke();
        doc.text("Product Name", x + 2, currentY + rowHeight - 3, { width: productNameWidth - 4, align: "center" });
        x += productNameWidth;

        variations.forEach(([vId, vName]) => {

            doc.rect(x, currentY, varColWidth, rowHeight).stroke();
            doc.text(vName, x + 2, currentY + 4, { width: varColWidth - 4, align: "center" });

            ["ALL", "STR", "CTN"].forEach((label, i) => {
                doc.rect(x + (i * subColWidth), currentY + rowHeight, subColWidth, rowHeight).stroke();
                doc.text(label, x + (i * subColWidth) + 2, currentY + rowHeight + 4, { width: subColWidth - 4, align: "center" });
            });
            x += varColWidth;
        });

        currentY += headerHeight;
        doc.font("Helvetica");
    };

    const checkPageBreak = (requiredHeight: number): boolean => {
        if (currentY + requiredHeight > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
            drawHeaderInfo();
            drawTableHeader();
            return true;
        }
        return false;
    };

    const drawDataRow = (srNo: number, product: any, items: any[]) => {
        checkPageBreak(rowHeight);

        let x = startX;
        const y = currentY;

        doc.fontSize(7);

        doc.rect(x, y, srNoWidth, rowHeight).stroke();
        doc.text(srNo.toString(), x + 2, y + 4, { width: srNoWidth - 4, align: "center" });
        x += srNoWidth;

        doc.rect(x, y, productNameWidth, rowHeight).stroke();
        doc.text(product?.name || "N/A", x + 2, y + 4, { width: productNameWidth - 4 });
        x += productNameWidth;

        variations.forEach(([vId]) => {
            const item = items.find((i: any) => i.productVariation?.variation?.id === vId);
            const qty = item?.quantity || 0;
            const boxQuantity = item?.productVariation?.boxQuantity || 0;
            const { boxes, remaining: strips } = calcBoxes(qty, boxQuantity);

            doc.rect(x, y, subColWidth, rowHeight).stroke();
            if (qty > 0) doc.text(qty.toString(), x + 2, y + 4, { width: subColWidth - 4, align: "center" });

            doc.rect(x + subColWidth, y, subColWidth, rowHeight).stroke();
            if (strips > 0) doc.text(strips.toString(), x + subColWidth + 2, y + 4, { width: subColWidth - 4, align: "center" });

            doc.rect(x + (subColWidth * 2), y, subColWidth, rowHeight).stroke();
            if (boxes > 0) doc.text(boxes.toString(), x + (subColWidth * 2) + 2, y + 4, { width: subColWidth - 4, align: "center" });

            totals[vId].all += qty;
            totals[vId].str += strips;
            totals[vId].ctn += boxes;

            x += varColWidth;
        });

        currentY += rowHeight;
    };

    const drawTotalRow = () => {
        checkPageBreak(rowHeight);

        let x = startX;
        const y = currentY;

        doc.fontSize(7).font("Helvetica-Bold");

        doc.rect(x, y, srNoWidth + productNameWidth, rowHeight).stroke();
        doc.text("Total", x + 2, y + 4, { width: srNoWidth + productNameWidth - 4, align: "center" });
        x += srNoWidth + productNameWidth;

        variations.forEach(([vId]) => {
           
            doc.rect(x, y, subColWidth, rowHeight).stroke();
            if (totals[vId].all > 0) doc.text(totals[vId].all.toString(), x + 2, y + 4, { width: subColWidth - 4, align: "center" });

          
            doc.rect(x + subColWidth, y, subColWidth, rowHeight).stroke();
            if (totals[vId].str > 0) doc.text(totals[vId].str.toString(), x + subColWidth + 2, y + 4, { width: subColWidth - 4, align: "center" });

           
            doc.rect(x + (subColWidth * 2), y, subColWidth, rowHeight).stroke();
            if (totals[vId].ctn > 0) doc.text(totals[vId].ctn.toString(), x + (subColWidth * 2) + 2, y + 4, { width: subColWidth - 4, align: "center" });

            x += varColWidth;
        });

        currentY += rowHeight;
    };


    drawHeaderInfo();
    drawTableHeader();


    let srNo = 1;
    productGroups.forEach(({ product, items }) => {
        drawDataRow(srNo, product, items);
        srNo++;
    });


    drawTotalRow();

    doc.end();
};
