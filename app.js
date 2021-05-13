
 const fs = require("fs");
 const PDFDocument = require("pdfkit");
 const JsBarcode = require("jsbarcode");
 const SVGtoPDF = require("svg-to-pdfkit");
 const express = require('express');
 const app = express();
 const {getOrderItems, getOrders,getOrderComments,getOrder} = require('dafiti');




app.listen(3011, ()=>{
console.log("Server en el puero 3011")

})

app.use(express.json());

app.get('/', (req,res)=>{

res.render("HOLA")

})




app.post('/webhook', (req,res)=>{
   
    res.sendStatus(200);
    datos = req.body;
    console.log(datos)

//Cominexo codigos de BARRA

    const doc = new PDFDocument({ size: "A6" });
    const { DOMImplementation, XMLSerializer } = require("xmldom");
    const xmlSerializer = new XMLSerializer();
    const document = new DOMImplementation().createDocument(
      "http://www.w3.org/1999/xhtml",
      "html",
      null
    );
    const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const svgNode2 = document.createElementNS("http://www.w3.org/2000/svg", "svg");

//Fin comienzo Codigos de Barra


let orderId;

if(datos.event == "onOrderItemsStatusChanged" && datos.payload.NewStatus == "ready_to_ship"){

  orderId = datos.payload.OrderId;
  console.log("ESTO ES EL ORDERID: " + orderId);


   getOrder(orderId).then(res => { console.log (res.SuccessResponse.Body.Orders.Order.AddressShipping)

    let link = res.SuccessResponse.Body.Orders.Order.AddressShipping;

    let nombre = link.FirstName + " " + link.LastName
    let direccion = link.Address1;
    let depto = link.Address2;
    let prov = link.City;
    let cp = link.PostCode;
    let pais = link.Country;
    let purcheseOrderNumber1 = res.SuccessResponse.Body.Orders.Order.OrderNumber


    doc.text("RNPSP: 586", 5, 5);
    doc.text("Direccion:", 5, 25);
    doc.text(nombre, 5, 40);
    doc.text(direccion, 5, 55);
    doc.text(depto, 5, 70);
    doc.text(prov, 5, 85);
    doc.text(cp, 5, 100);
    doc.text(pais, 5, 115);
    
    doc.fontSize(10).text(`# de Orden: ${purcheseOrderNumber1}`, 110, 130);
    doc.fontSize(10).text("Proveedor de envios:", 110, 145);


    getOrderItems(orderId).then(res => {console.log(res.SuccessResponse.Body)

        let packageId;
        let purcheseOrderNumber;
        
    
    if(res.SuccessResponse.Body.OrderItems.OrderItem.length >= 2){
    
     packageId = res.SuccessResponse.Body.OrderItems.OrderItem[0].PackageId
    purcheseOrderNumber = res.SuccessResponse.Body.OrderItems.OrderItem[0].PurchaseOrderNumber
    }else { packageId = res.SuccessResponse.Body.OrderItems.OrderItem.PackageId
    
            purcheseOrderNumber = res.SuccessResponse.Body.OrderItems.OrderItem.PurchaseOrderNumber
    }
    
    JsBarcode(svgNode2, purcheseOrderNumber, {
        xmlDocument: document,
        format: "code39",
        width: 1,
        height: 40,
        displayValue: true,
      });
    
      const svgText2 = xmlSerializer.serializeToString(svgNode2);
    
      
    
    JsBarcode(svgNode, packageId, {
        xmlDocument: document,
        format: "code39",
        width: 1,
        height: 40,
        displayValue: true,
      });
      
    
      
      const svgText = xmlSerializer.serializeToString(svgNode);
      
      
     
      
      doc
        .fontSize(10)
        .text(
          "ATENCION! En caso de domicilio incorrecto/incompleto, por favor reenviar a:",
          5,
          240
        );
      doc.text("REMITENTE: KAMNIK SRL", 5, 265);
      doc.text("Av. Belgrano 1382", 5, 280);
      doc.text("CABA", 5, 295);
      doc.text("CP: 1093", 5, 310);
      
     
      SVGtoPDF(doc, svgText2, 100, 160);
      SVGtoPDF(doc, svgText, 50, 320);
      
      let nombreEtiqueta = "/" + packageId + ".pdf";
      
      doc.pipe(fs.createWriteStream("./etiquetas-dafiti" + nombreEtiqueta));
      doc.end();
    
    });
   
});




} else {

console.log("OTRO ESTADO NO DEFINIDO");

}

    
   


})


  
