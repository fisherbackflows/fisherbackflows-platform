import jsPDF from 'jspdf'

export interface TestReportData {
  customerName: string
  customerAddress: string
  customerPhone: string
  accountNumber?: string
  deviceLocation: string
  deviceSerialNumber: string
  deviceSize: string
  deviceMake: string
  deviceModel: string
  testDate: string
  testResult: 'Passed' | 'Failed' | 'Needs Repair'
  initialPressure: number
  finalPressure: number
  testDuration: number
  technician: string
  technicianLicense?: string
  waterDistrict: string
  notes?: string
  photos?: string[]
}

// Generate professional backflow test report PDF
export function generateTestReportPDF(data: TestReportData): Uint8Array {
  const doc = new jsPDF()
  
  // Page dimensions
  const pageWidth = doc.internal.pageSize.width
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  let yPos = 30

  // Helper function to add text with proper positioning
  const addText = (text: string, x: number, y: number, fontSize = 10, fontWeight: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', fontWeight)
    doc.text(text, x, y)
  }

  // Header with company logo placeholder
  doc.setFillColor(30, 64, 175) // Blue header
  doc.rect(0, 0, pageWidth, 25, 'F')
  
  addText('FISHER BACKFLOWS', margin, 15, 16, 'bold')
  doc.setTextColor(255, 255, 255)
  addText('Professional Backflow Testing Services', margin, 22, 10)
  
  // Reset text color
  doc.setTextColor(0, 0, 0)

  // Report title
  yPos = 40
  addText('BACKFLOW PREVENTION DEVICE TEST REPORT', margin, yPos, 14, 'bold')
  yPos += 15

  // Test status indicator
  const statusColor = data.testResult === 'Passed' ? [16, 185, 129] : 
                     data.testResult === 'Failed' ? [239, 68, 68] : [245, 158, 11]
  doc.setFillColor(...statusColor)
  doc.roundedRect(margin, yPos, 50, 8, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  addText(data.testResult.toUpperCase(), margin + 5, yPos + 5, 10, 'bold')
  doc.setTextColor(0, 0, 0)
  yPos += 20

  // Customer Information Section
  addText('CUSTOMER INFORMATION', margin, yPos, 12, 'bold')
  yPos += 10
  
  addText(`Name: ${data.customerName}`, margin, yPos)
  yPos += 6
  addText(`Address: ${data.customerAddress}`, margin, yPos)
  yPos += 6
  addText(`Phone: ${data.customerPhone}`, margin, yPos)
  yPos += 6
  if (data.accountNumber) {
    addText(`Account Number: ${data.accountNumber}`, margin, yPos)
    yPos += 6
  }
  yPos += 10

  // Device Information Section
  addText('DEVICE INFORMATION', margin, yPos, 12, 'bold')
  yPos += 10
  
  addText(`Location: ${data.deviceLocation}`, margin, yPos)
  yPos += 6
  addText(`Serial Number: ${data.deviceSerialNumber}`, margin, yPos)
  yPos += 6
  addText(`Size: ${data.deviceSize}`, margin, yPos)
  yPos += 6
  addText(`Make: ${data.deviceMake}`, margin, yPos)
  yPos += 6
  addText(`Model: ${data.deviceModel}`, margin, yPos)
  yPos += 15

  // Test Results Section
  addText('TEST RESULTS', margin, yPos, 12, 'bold')
  yPos += 10
  
  addText(`Test Date: ${new Date(data.testDate).toLocaleDateString()}`, margin, yPos)
  yPos += 6
  addText(`Initial Pressure: ${data.initialPressure} PSI`, margin, yPos)
  yPos += 6
  addText(`Final Pressure: ${data.finalPressure} PSI`, margin, yPos)
  yPos += 6
  
  const pressureDrop = data.initialPressure - data.finalPressure
  addText(`Pressure Drop: ${pressureDrop.toFixed(1)} PSI`, margin, yPos)
  yPos += 6
  addText(`Test Duration: ${data.testDuration} minutes`, margin, yPos)
  yPos += 6
  addText(`Water District: ${data.waterDistrict}`, margin, yPos)
  yPos += 15

  // Test Analysis
  addText('TEST ANALYSIS', margin, yPos, 12, 'bold')
  yPos += 10
  
  const allowableDrop = 1.0
  let analysisText = ''
  
  if (pressureDrop <= allowableDrop) {
    analysisText = `The pressure drop of ${pressureDrop.toFixed(1)} PSI is within the allowable limit of ${allowableDrop} PSI. The device is functioning properly.`
  } else if (pressureDrop <= 2.0) {
    analysisText = `The pressure drop of ${pressureDrop.toFixed(1)} PSI exceeds the allowable limit of ${allowableDrop} PSI but is repairable. Minor adjustments or cleaning may be required.`
  } else {
    analysisText = `The pressure drop of ${pressureDrop.toFixed(1)} PSI significantly exceeds the allowable limit of ${allowableDrop} PSI. The device requires repair or replacement.`
  }
  
  // Word wrap the analysis text
  const splitText = doc.splitTextToSize(analysisText, contentWidth)
  doc.text(splitText, margin, yPos)
  yPos += splitText.length * 6 + 10

  // Notes section (if any)
  if (data.notes) {
    addText('ADDITIONAL NOTES', margin, yPos, 12, 'bold')
    yPos += 10
    const splitNotes = doc.splitTextToSize(data.notes, contentWidth)
    doc.text(splitNotes, margin, yPos)
    yPos += splitNotes.length * 6 + 15
  } else {
    yPos += 10
  }

  // Technician Certification Section
  addText('TECHNICIAN CERTIFICATION', margin, yPos, 12, 'bold')
  yPos += 10
  
  addText(`Technician: ${data.technician}`, margin, yPos)
  yPos += 6
  addText(`License Number: ${data.technicianLicense || 'WA-BT-12345'}`, margin, yPos)
  yPos += 6
  addText(`Test Date: ${new Date(data.testDate).toLocaleDateString()}`, margin, yPos)
  yPos += 15

  // Certification Statement
  const certificationText = `I certify that this backflow prevention device has been tested in accordance with WAC 246-290-490 and ${data.testResult === 'Passed' ? 'meets' : 'does not meet'} the requirements for proper operation.`
  const splitCertification = doc.splitTextToSize(certificationText, contentWidth)
  doc.text(splitCertification, margin, yPos)
  yPos += splitCertification.length * 6 + 20

  // Signature line
  doc.line(margin, yPos, margin + 80, yPos)
  addText('Technician Signature', margin, yPos + 8, 8)
  
  doc.line(margin + 100, yPos, margin + 160, yPos)
  addText('Date', margin + 100, yPos + 8, 8)

  // Footer
  const footerY = doc.internal.pageSize.height - 20
  doc.setFillColor(30, 64, 175)
  doc.rect(0, footerY - 5, pageWidth, 25, 'F')
  doc.setTextColor(255, 255, 255)
  addText('Fisher Backflows • (253) 278-8692 • fisherbackflows@gmail.com', margin, footerY + 5, 10)
  addText('Licensed & Insured • Serving Tacoma, WA and Surrounding Areas', margin, footerY + 12, 8)

  // Return PDF as Uint8Array
  return doc.output('arraybuffer') as Uint8Array
}

// Generate invoice PDF
export function generateInvoicePDF(invoiceData: {
  invoiceNumber: string
  customerName: string
  customerAddress: string
  serviceDate: string
  serviceType: string
  deviceSize: string
  amount: number
  dueDate: string
  notes?: string
}): Uint8Array {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const margin = 20
  let yPos = 30

  const addText = (text: string, x: number, y: number, fontSize = 10, fontWeight: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', fontWeight)
    doc.text(text, x, y)
  }

  // Header
  doc.setFillColor(30, 64, 175)
  doc.rect(0, 0, pageWidth, 25, 'F')
  doc.setTextColor(255, 255, 255)
  addText('FISHER BACKFLOWS', margin, 15, 16, 'bold')
  addText('Professional Backflow Testing Services', margin, 22, 10)
  doc.setTextColor(0, 0, 0)

  // Invoice title
  yPos = 45
  addText('INVOICE', margin, yPos, 18, 'bold')
  addText(`Invoice #: ${invoiceData.invoiceNumber}`, pageWidth - 80, yPos, 12, 'bold')
  yPos += 20

  // Bill to section
  addText('BILL TO:', margin, yPos, 12, 'bold')
  yPos += 8
  addText(invoiceData.customerName, margin, yPos, 11, 'bold')
  yPos += 6
  const addressLines = invoiceData.customerAddress.split('\n')
  addressLines.forEach(line => {
    addText(line, margin, yPos)
    yPos += 6
  })
  yPos += 15

  // Service details header
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, yPos, pageWidth - (margin * 2), 10, 'F')
  addText('Description', margin + 5, yPos + 7, 10, 'bold')
  addText('Amount', pageWidth - 60, yPos + 7, 10, 'bold')
  yPos += 20

  // Service line item
  addText(`${invoiceData.serviceType} (${invoiceData.deviceSize})`, margin + 5, yPos)
  addText(`$${invoiceData.amount.toFixed(2)}`, pageWidth - 60, yPos)
  yPos += 10

  addText(`Service Date: ${new Date(invoiceData.serviceDate).toLocaleDateString()}`, margin + 5, yPos, 9)
  yPos += 20

  // Total
  doc.line(pageWidth - 100, yPos, pageWidth - margin, yPos)
  yPos += 8
  addText('TOTAL:', pageWidth - 100, yPos, 12, 'bold')
  addText(`$${invoiceData.amount.toFixed(2)}`, pageWidth - 60, yPos, 12, 'bold')
  yPos += 20

  // Payment info
  addText('PAYMENT INFORMATION', margin, yPos, 12, 'bold')
  yPos += 10
  addText(`Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString()}`, margin, yPos)
  yPos += 8
  addText('Payment Methods: Check, Cash, Credit Card, Online Payment', margin, yPos)
  yPos += 8
  addText('Make checks payable to: Fisher Backflows', margin, yPos)

  // Footer
  const footerY = doc.internal.pageSize.height - 30
  addText('Thank you for your business!', margin, footerY, 12, 'bold')
  addText('Questions? Call (253) 278-8692 or email fisherbackflows@gmail.com', margin, footerY + 8, 10)

  return doc.output('arraybuffer') as Uint8Array
}

// Generate payment receipt PDF
export function generateReceiptPDF(receiptData: {
  receiptNumber: string
  customerName: string
  invoiceNumber: string
  amount: number
  paymentDate: string
  paymentMethod: string
}): Uint8Array {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const margin = 20
  let yPos = 30

  const addText = (text: string, x: number, y: number, fontSize = 10, fontWeight: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', fontWeight)
    doc.text(text, x, y)
  }

  // Header
  doc.setFillColor(16, 185, 129) // Green for receipt
  doc.rect(0, 0, pageWidth, 25, 'F')
  doc.setTextColor(255, 255, 255)
  addText('PAYMENT RECEIPT', pageWidth / 2 - 40, 15, 16, 'bold')
  doc.setTextColor(0, 0, 0)

  yPos = 45
  addText(`Receipt #: ${receiptData.receiptNumber}`, margin, yPos, 12, 'bold')
  yPos += 15

  addText('PAYMENT RECEIVED', margin, yPos, 14, 'bold')
  yPos += 15

  addText(`Customer: ${receiptData.customerName}`, margin, yPos)
  yPos += 8
  addText(`Invoice #: ${receiptData.invoiceNumber}`, margin, yPos)
  yPos += 8
  addText(`Amount Paid: $${receiptData.amount.toFixed(2)}`, margin, yPos, 12, 'bold')
  yPos += 8
  addText(`Payment Date: ${new Date(receiptData.paymentDate).toLocaleDateString()}`, margin, yPos)
  yPos += 8
  addText(`Payment Method: ${receiptData.paymentMethod}`, margin, yPos)
  yPos += 20

  // Thank you message
  doc.setFillColor(240, 253, 244)
  doc.rect(margin, yPos, pageWidth - (margin * 2), 30, 'F')
  addText('Thank you for your prompt payment!', margin + 10, yPos + 15, 12, 'bold')
  addText('Your account is now current.', margin + 10, yPos + 25)

  return doc.output('arraybuffer') as Uint8Array
}

// Utility function to convert Uint8Array to base64 for email attachments
export function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}