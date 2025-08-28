/**
 * PDF Report Generator - Fisher Backflows
 * Generate professional test reports
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TestReportData {
  customer: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  device: {
    serialNumber: string;
    type: string;
    size: string;
    location: string;
  };
  test: {
    date: string;
    technician: string;
    initialPressure: number;
    finalPressure: number;
    duration: number;
    result: 'pass' | 'fail';
    notes?: string;
  };
  certificateNumber?: string;
}

export function generateTestReport(data: TestReportData): Buffer {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Fisher Backflows', 20, 20);
  doc.setFontSize(14);
  doc.text('Backflow Prevention Device Test Report', 20, 30);
  
  // Certificate info
  if (data.certificateNumber) {
    doc.setFontSize(10);
    doc.text(`Certificate #: ${data.certificateNumber}`, 20, 40);
  }
  
  doc.text(`Test Date: ${data.test.date}`, 20, 50);
  doc.text(`Technician: ${data.test.technician}`, 120, 50);
  
  // Customer info
  doc.setFontSize(12);
  doc.text('Customer Information', 20, 70);
  doc.setFontSize(10);
  doc.text(`Name: ${data.customer.name}`, 20, 80);
  doc.text(`Address: ${data.customer.address}`, 20, 90);
  doc.text(`Phone: ${data.customer.phone}`, 20, 100);
  doc.text(`Email: ${data.customer.email}`, 20, 110);
  
  // Device info
  doc.setFontSize(12);
  doc.text('Device Information', 20, 130);
  doc.setFontSize(10);
  doc.text(`Serial Number: ${data.device.serialNumber}`, 20, 140);
  doc.text(`Type: ${data.device.type}`, 20, 150);
  doc.text(`Size: ${data.device.size}`, 120, 140);
  doc.text(`Location: ${data.device.location}`, 120, 150);
  
  // Test results table
  autoTable(doc, {
    head: [['Test Parameter', 'Value', 'Status']],
    body: [
      ['Initial Pressure (psi)', data.test.initialPressure.toString(), ''],
      ['Final Pressure (psi)', data.test.finalPressure.toString(), ''],
      ['Test Duration (min)', data.test.duration.toString(), ''],
      ['Pressure Drop (psi)', (data.test.initialPressure - data.test.finalPressure).toString(), ''],
      ['Overall Result', data.test.result.toUpperCase(), data.test.result === 'pass' ? 'PASS' : 'FAIL']
    ],
    startY: 170,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] },
    bodyStyles: { 
      fillColor: (rowIndex: number) => rowIndex === 4 ? 
        (data.test.result === 'pass' ? [46, 204, 113] : [231, 76, 60]) : 
        [255, 255, 255]
    }
  });
  
  // Notes if any
  if (data.test.notes) {
    doc.setFontSize(12);
    doc.text('Technician Notes', 20, (doc as any).lastAutoTable.finalY + 20);
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(data.test.notes, 170);
    doc.text(splitText, 20, (doc as any).lastAutoTable.finalY + 30);
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text('Fisher Backflows - Licensed Contractor', 20, pageHeight - 20);
  doc.text('Report generated automatically', 20, pageHeight - 10);
  doc.text(new Date().toISOString(), 120, pageHeight - 10);
  
  return Buffer.from(doc.output('arraybuffer'));
}

export function generateInvoicePDF(invoiceData: any): Buffer {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('INVOICE', 20, 20);
  doc.setFontSize(12);
  doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 20, 35);
  doc.text(`Date: ${invoiceData.issueDate}`, 20, 45);
  doc.text(`Due: ${invoiceData.dueDate}`, 120, 45);
  
  // Billing info
  doc.text('Bill To:', 20, 65);
  doc.setFontSize(10);
  doc.text(invoiceData.customerName, 20, 75);
  
  // Services table
  autoTable(doc, {
    head: [['Service', 'Qty', 'Rate', 'Total']],
    body: invoiceData.items.map((item: any) => [
      item.description,
      item.quantity.toString(),
      `$${item.unitPrice.toFixed(2)}`,
      `$${item.total.toFixed(2)}`
    ]),
    startY: 90,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] }
  });
  
  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.text(`Subtotal: $${invoiceData.subtotal.toFixed(2)}`, 120, finalY);
  doc.text(`Tax: $${invoiceData.taxAmount.toFixed(2)}`, 120, finalY + 10);
  doc.setFontSize(12);
  doc.text(`Total: $${invoiceData.totalAmount.toFixed(2)}`, 120, finalY + 20);
  
  return Buffer.from(doc.output('arraybuffer'));
}