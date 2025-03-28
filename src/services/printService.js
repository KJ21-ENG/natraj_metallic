const { BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Temporary directory for HTML files
const TEMP_DIR = path.join(os.tmpdir(), 'natraj-metallic');

// Ensure the temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Helper function to generate a box label HTML
const generateBoxLabelHtml = (boxData) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Box Label - ${boxData.box_id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
        }
        .label {
          border: 1px solid #000;
          padding: 15px;
          width: 350px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 15px;
          border-bottom: 1px solid #000;
          padding-bottom: 10px;
        }
        .company-name {
          font-size: 18px;
          font-weight: bold;
        }
        .title {
          font-size: 14px;
          margin-top: 5px;
        }
        .details {
          margin-bottom: 15px;
        }
        .row {
          display: flex;
          margin-bottom: 5px;
        }
        .label-text {
          font-weight: bold;
          width: 120px;
        }
        .value {
          flex: 1;
        }
        .barcode {
          text-align: center;
          margin-top: 15px;
        }
        .barcode img {
          max-width: 100%;
        }
        @media print {
          body {
            padding: 0;
          }
          .label {
            border: none;
          }
          @page {
            margin: 10mm;
          }
        }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    </head>
    <body>
      <div class="label">
        <div class="header">
          <div class="company-name">Natraj Metallic</div>
          <div class="title">BOX LABEL</div>
        </div>
        <div class="details">
          <div class="row">
            <div class="label-text">Box ID:</div>
            <div class="value">${boxData.box_id}</div>
          </div>
          <div class="row">
            <div class="label-text">Roll ID:</div>
            <div class="value">${boxData.roll_id}</div>
          </div>
          <div class="row">
            <div class="label-text">Net Weight:</div>
            <div class="value">${parseFloat(boxData.net_weight).toFixed(2)} kg</div>
          </div>
          <div class="row">
            <div class="label-text">Bobbins:</div>
            <div class="value">${boxData.bobbin_count} x ${boxData.bobbin_type}</div>
          </div>
          <div class="row">
            <div class="label-text">Date:</div>
            <div class="value">${boxData.date_created}</div>
          </div>
        </div>
        <div class="barcode">
          <svg id="barcode"></svg>
        </div>
      </div>
      <script>
        JsBarcode("#barcode", "${boxData.box_id}", {
          format: "CODE128",
          lineColor: "#000",
          width: 2,
          height: 50,
          displayValue: true
        });
        window.onload = function() {
          setTimeout(() => {
            window.print();
            setTimeout(() => {
              window.close();
            }, 500);
          }, 500);
        };
      </script>
    </body>
    </html>
  `;
};

// Helper function to generate a dispatch note HTML
const generateDispatchNoteHtml = (dispatchData) => {
  const boxes = dispatchData.boxes || [];
  let boxesHtml = '';
  
  boxes.forEach((box, index) => {
    boxesHtml += `
      <tr>
        <td>${index + 1}</td>
        <td>${box.box_id}</td>
        <td>${box.roll_id}</td>
        <td>${parseFloat(box.net_weight).toFixed(2)} kg</td>
        <td>${box.bobbin_count}</td>
      </tr>
    `;
  });
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Dispatch Note - ${dispatchData.dispatch_id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
        }
        .dispatch-note {
          border: 1px solid #000;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #000;
          padding-bottom: 15px;
        }
        .company-name {
          font-size: 22px;
          font-weight: bold;
        }
        .title {
          font-size: 18px;
          margin-top: 5px;
        }
        .info {
          margin-bottom: 20px;
        }
        .info-row {
          display: flex;
          margin-bottom: 10px;
        }
        .info-label {
          font-weight: bold;
          width: 150px;
        }
        .info-value {
          flex: 1;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        .totals {
          text-align: right;
          margin-top: 20px;
          font-weight: bold;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 50px;
        }
        .signature {
          width: 40%;
        }
        .signature-line {
          border-top: 1px solid #000;
          margin-top: 40px;
          padding-top: 5px;
          text-align: center;
        }
        @media print {
          body {
            padding: 0;
          }
          .dispatch-note {
            border: none;
          }
          @page {
            margin: 10mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="dispatch-note">
        <div class="header">
          <div class="company-name">Natraj Metallic</div>
          <div class="title">DISPATCH NOTE</div>
        </div>
        <div class="info">
          <div class="info-row">
            <div class="info-label">Dispatch ID:</div>
            <div class="info-value">${dispatchData.dispatch_id}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Date:</div>
            <div class="info-value">${dispatchData.dispatch_date}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Customer:</div>
            <div class="info-value">${dispatchData.customer_name}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Box ID</th>
              <th>Roll ID</th>
              <th>Net Weight</th>
              <th>Bobbin Count</th>
            </tr>
          </thead>
          <tbody>
            ${boxesHtml}
          </tbody>
        </table>
        <div class="totals">
          <div>Total Boxes: ${boxes.length}</div>
          <div>Total Weight: ${parseFloat(dispatchData.total_weight).toFixed(2)} kg</div>
          <div>Total Bobbins: ${dispatchData.total_bobbins}</div>
        </div>
        <div class="signatures">
          <div class="signature">
            <div class="signature-line">Authorized Signature</div>
          </div>
          <div class="signature">
            <div class="signature-line">Receiver's Signature</div>
          </div>
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(() => {
            window.print();
            setTimeout(() => {
              window.close();
            }, 500);
          }, 500);
        };
      </script>
    </body>
    </html>
  `;
};

// Helper function to generate a report HTML
const generateReportHtml = (reportType, reportData) => {
  // Implementation depends on the report type
  // For now, just a basic stub
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${reportType} Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
        }
        h1 {
          text-align: center;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        @media print {
          body {
            padding: 0;
          }
          @page {
            margin: 10mm;
          }
        }
      </style>
    </head>
    <body>
      <h1>${reportType} Report</h1>
      <p>This feature will be implemented in the next phase.</p>
      <script>
        window.onload = function() {
          setTimeout(() => {
            window.print();
            setTimeout(() => {
              window.close();
            }, 500);
          }, 500);
        };
      </script>
    </body>
    </html>
  `;
};

// Print a label or document
const printLabel = async (printData) => {
  const { type, data } = printData;
  let html = '';
  let tempFile = '';
  
  switch (type) {
    case 'box':
      html = generateBoxLabelHtml(data);
      tempFile = path.join(TEMP_DIR, `box_label_${data.box_id}.html`);
      break;
    case 'dispatch':
      html = generateDispatchNoteHtml(data);
      tempFile = path.join(TEMP_DIR, `dispatch_note_${data.dispatch_id}.html`);
      break;
    case 'report':
      html = generateReportHtml(data.reportType, data);
      tempFile = path.join(TEMP_DIR, `report_${Date.now()}.html`);
      break;
    default:
      throw new Error(`Unknown print type: ${type}`);
  }
  
  // Write the HTML to a temporary file
  fs.writeFileSync(tempFile, html);
  
  // Get printer settings
  const printerSettingsService = require('./printerSettingsService');
  const printerSettings = printerSettingsService.getSettings();
  const selectedPrinter = type === 'box' ? printerSettings.labelPrinter : printerSettings.invoicePrinter;
  
  if (!selectedPrinter) {
    throw new Error(`No printer configured for ${type} printing`);
  }
  
  // Create a browser window to print the label
  const printWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: false
    }
  });
  
  await printWindow.loadFile(tempFile);
  
  try {
    // Print with dialog for invoice/dispatch, silently for others
    await new Promise((resolve, reject) => {
      printWindow.webContents.print(
        {
          silent: type === 'box', // Show dialog for dispatch/invoice, silent for box labels
          printBackground: true,
          deviceName: selectedPrinter
        },
        (success, errorType) => {
          if (success) {
            resolve();
          } else {
            reject(new Error(`Print failed: ${errorType}`));
          }
        }
      );
    });

    // Clean up
    printWindow.close();
    
    return tempFile;
  } catch (error) {
    printWindow.close();
    throw error;
  }
};

module.exports = {
  printLabel
}; 