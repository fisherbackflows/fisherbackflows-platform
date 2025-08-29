/**
 * Data Export/Import System
 * Handles exporting customer data, reports, and business data
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export type ExportFormat = 'csv' | 'json' | 'pdf' | 'excel';

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf' | 'excel';
  dateRange?: {
    start: string;
    end: string;
  };
  includeImages?: boolean;
  customFields?: string[];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  duplicates: number;
}

class DataExportService {
  /**
   * Export customer data
   */
  async exportCustomers(
    customers: any[], 
    options: ExportOptions = { format: 'csv' }
  ): Promise<string | Blob> {
    const processedData = customers.map(customer => ({
      'Account Number': customer.accountNumber || customer.account_number,
      'Name': customer.name,
      'Email': customer.email,
      'Phone': customer.phone,
      'Address': customer.address,
      'Status': customer.status,
      'Balance': customer.balance || 0,
      'Last Test Date': customer.lastTestDate || customer.last_test_date || 'N/A',
      'Next Test Date': customer.nextTestDate || customer.next_test_date || 'N/A',
      'Device Count': customer.devices?.length || 0,
      'Created Date': customer.createdAt || customer.created_at || ''
    }));

    switch (options.format) {
      case 'csv':
        return this.exportToCSV(processedData, 'customers');
      case 'json':
        return this.exportToJSON(processedData, 'customers');
      case 'pdf':
        return this.exportToPDF(processedData, 'Fisher Backflows - Customer List');
      case 'excel':
        return this.exportToExcel(processedData, 'customers');
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export test reports
   */
  async exportTestReports(
    reports: any[], 
    options: ExportOptions = { format: 'csv' }
  ): Promise<string | Blob> {
    const processedData = reports.map(report => ({
      'Test Number': report.testNumber || report.test_number,
      'Customer Name': report.customerName || report.customer_name,
      'Test Date': report.testDate || report.test_date,
      'Result': report.result,
      'Technician': report.technicianName || report.technician_name,
      'Device Location': report.deviceLocation || report.device_location,
      'Device Serial': report.deviceSerial || report.device_serial,
      'Line Pressure': report.readings?.linePressure || 'N/A',
      'Check Valve 1': report.readings?.checkValve1 || 'N/A',
      'Check Valve 2': report.readings?.checkValve2 || 'N/A',
      'Relief Valve': report.readings?.reliefValve || 'N/A',
      'Notes': report.notes || '',
      'Photos': report.photos?.length || 0
    }));

    switch (options.format) {
      case 'csv':
        return this.exportToCSV(processedData, 'test-reports');
      case 'json':
        return this.exportToJSON(processedData, 'test-reports');
      case 'pdf':
        return this.exportTestReportsPDF(reports);
      default:
        return this.exportToCSV(processedData, 'test-reports');
    }
  }

  /**
   * Export invoices
   */
  async exportInvoices(
    invoices: any[], 
    options: ExportOptions = { format: 'csv' }
  ): Promise<string | Blob> {
    const processedData = invoices.map(invoice => ({
      'Invoice Number': invoice.invoiceNumber || invoice.invoice_number,
      'Customer Name': invoice.customerName || invoice.customer_name,
      'Date': invoice.date,
      'Due Date': invoice.dueDate || invoice.due_date,
      'Status': invoice.status,
      'Subtotal': invoice.subtotal,
      'Tax': invoice.tax,
      'Total': invoice.total,
      'Paid Date': invoice.paidDate || invoice.paid_date || 'Not Paid',
      'Payment Method': invoice.paymentMethod || invoice.payment_method || 'N/A',
      'Description': invoice.lineItems?.map((item: any) => item.description).join('; ') || ''
    }));

    switch (options.format) {
      case 'csv':
        return this.exportToCSV(processedData, 'invoices');
      case 'json':
        return this.exportToJSON(processedData, 'invoices');
      case 'pdf':
        return this.exportInvoicesPDF(invoices);
      default:
        return this.exportToCSV(processedData, 'invoices');
    }
  }

  /**
   * Export appointments
   */
  async exportAppointments(
    appointments: any[], 
    options: ExportOptions = { format: 'csv' }
  ): Promise<string | Blob> {
    const processedData = appointments.map(appointment => ({
      'Date': appointment.scheduledDate || appointment.scheduled_date,
      'Time': appointment.scheduledTime || appointment.scheduled_time,
      'Customer Name': appointment.customerName || appointment.customer_name,
      'Phone': appointment.customerPhone || appointment.customer_phone,
      'Address': appointment.customerAddress || appointment.customer_address,
      'Type': appointment.type,
      'Status': appointment.status,
      'Technician': appointment.technicianName || appointment.technician_name || 'Unassigned',
      'Duration': appointment.duration || 60,
      'Notes': appointment.notes || '',
      'Created': appointment.createdAt || appointment.created_at
    }));

    switch (options.format) {
      case 'csv':
        return this.exportToCSV(processedData, 'appointments');
      case 'json':
        return this.exportToJSON(processedData, 'appointments');
      case 'pdf':
        return this.exportAppointmentsPDF(appointments);
      default:
        return this.exportToCSV(processedData, 'appointments');
    }
  }

  /**
   * Export business analytics
   */
  async exportAnalytics(
    analyticsData: any,
    options: ExportOptions = { format: 'json' }
  ): Promise<string | Blob> {
    const processedData = {
      generatedAt: new Date().toISOString(),
      dateRange: options.dateRange,
      revenue: {
        total: analyticsData.revenue?.total || 0,
        monthly: analyticsData.revenue?.monthly || [],
        growth: analyticsData.revenue?.growth || 0
      },
      customers: {
        total: analyticsData.customers?.total || 0,
        new: analyticsData.customers?.new || 0,
        active: analyticsData.customers?.active || 0,
        churn: analyticsData.customers?.churn || 0
      },
      tests: {
        completed: analyticsData.tests?.completed || 0,
        passed: analyticsData.tests?.passed || 0,
        failed: analyticsData.tests?.failed || 0,
        completionRate: analyticsData.tests?.completionRate || 0
      },
      appointments: {
        scheduled: analyticsData.appointments?.scheduled || 0,
        completed: analyticsData.appointments?.completed || 0,
        cancelled: analyticsData.appointments?.cancelled || 0
      }
    };

    switch (options.format) {
      case 'json':
        return this.exportToJSON(processedData, 'analytics');
      case 'csv':
        // Flatten analytics for CSV
        const flatData = this.flattenObject(processedData);
        return this.exportToCSV([flatData], 'analytics');
      case 'pdf':
        return this.exportAnalyticsPDF(processedData);
      default:
        return this.exportToJSON(processedData, 'analytics');
    }
  }

  /**
   * Export to CSV format
   */
  private exportToCSV(data: any[], filename: string): string {
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values that might contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    // Trigger download
    this.downloadFile(csvContent, `${filename}-${this.getDateString()}.csv`, 'text/csv');
    
    return csvContent;
  }

  /**
   * Export to JSON format
   */
  private exportToJSON(data: any, filename: string): string {
    const jsonContent = JSON.stringify(data, null, 2);
    
    // Trigger download
    this.downloadFile(jsonContent, `${filename}-${this.getDateString()}.json`, 'application/json');
    
    return jsonContent;
  }

  /**
   * Export to PDF format
   */
  private exportToPDF(data: any[], title: string): jsPDF {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 20, 20);
    
    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Prepare table data
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = data.map(item => headers.map(header => String(item[header] || '')));
      
      // Add table
      (doc as any).autoTable({
        head: [headers],
        body: rows,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 102, 204] }
      });
    }
    
    // Trigger download
    doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${this.getDateString()}.pdf`);
    
    return doc;
  }

  /**
   * Export test reports to PDF with detailed formatting
   */
  private exportTestReportsPDF(reports: any[]): jsPDF {
    const doc = new jsPDF();
    let yPosition = 20;
    
    // Title
    doc.setFontSize(16);
    doc.text('Fisher Backflows - Test Reports', 20, yPosition);
    yPosition += 10;
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;
    
    reports.forEach((report, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Report header
      doc.setFontSize(12);
      doc.text(`Test #${report.testNumber || index + 1}`, 20, yPosition);
      yPosition += 8;
      
      // Report details
      doc.setFontSize(10);
      const details = [
        `Customer: ${report.customerName || 'N/A'}`,
        `Date: ${report.testDate || 'N/A'}`,
        `Result: ${report.result || 'N/A'}`,
        `Technician: ${report.technicianName || 'N/A'}`
      ];
      
      details.forEach(detail => {
        doc.text(detail, 25, yPosition);
        yPosition += 6;
      });
      
      yPosition += 5;
    });
    
    doc.save(`test-reports-${this.getDateString()}.pdf`);
    return doc;
  }

  /**
   * Export to Excel format (using CSV with Excel-friendly formatting)
   */
  private exportToExcel(data: any[], filename: string): string {
    // For now, we'll export as CSV with .xlsx extension
    // In a full implementation, you'd use a library like xlsx
    const csvContent = this.exportToCSV(data, filename);
    
    // Change the download to .xlsx extension
    const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${this.getDateString()}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    return csvContent;
  }

  /**
   * Import data from CSV
   */
  async importFromCSV(file: File, dataType: string): Promise<ImportResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          const data = [];
          const errors = [];
          const duplicates = 0;
          
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              try {
                const values = this.parseCSVLine(lines[i]);
                const row: any = {};
                
                headers.forEach((header, index) => {
                  row[header] = values[index] || '';
                });
                
                // Basic validation based on data type
                if (this.validateImportRow(row, dataType)) {
                  data.push(row);
                } else {
                  errors.push(`Line ${i + 1}: Invalid data format`);
                }
              } catch (error) {
                errors.push(`Line ${i + 1}: ${error}`);
              }
            }
          }
          
          resolve({
            success: errors.length < data.length,
            imported: data.length,
            errors,
            duplicates
          });
          
        } catch (error) {
          resolve({
            success: false,
            imported: 0,
            errors: [`File parsing error: ${error}`],
            duplicates: 0
          });
        }
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Import data from JSON
   */
  async importFromJSON(file: File): Promise<ImportResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          
          // Validate JSON structure
          if (Array.isArray(jsonData)) {
            resolve({
              success: true,
              imported: jsonData.length,
              errors: [],
              duplicates: 0
            });
          } else {
            resolve({
              success: false,
              imported: 0,
              errors: ['Invalid JSON format - expected array'],
              duplicates: 0
            });
          }
        } catch (error) {
          resolve({
            success: false,
            imported: 0,
            errors: [`JSON parsing error: ${error}`],
            duplicates: 0
          });
        }
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Parse CSV content into array of objects
   */
  async parseCSV(csvContent: string): Promise<any[]> {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = this.parseCSVLine(lines[i]);
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].replace(/"/g, '') : '';
        });
        
        data.push(row);
      }
    }

    return data;
  }

  /**
   * Helper methods
   */
  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private flattenObject(obj: any, prefix = ''): any {
    const flattened: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(flattened, this.flattenObject(obj[key], newKey));
        } else {
          flattened[newKey] = obj[key];
        }
      }
    }
    
    return flattened;
  }

  private parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private validateImportRow(row: any, dataType: string): boolean {
    switch (dataType) {
      case 'customers':
        return row.Name && (row.Email || row.Phone);
      case 'appointments':
        return row.Date && row['Customer Name'];
      case 'invoices':
        return row['Invoice Number'] && row.Total;
      default:
        return true;
    }
  }

  private exportAnalyticsPDF(data: any): jsPDF {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text('Fisher Backflows - Analytics Report', 20, 20);
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    
    let yPos = 50;
    
    // Revenue section
    doc.setFontSize(14);
    doc.text('Revenue', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Total Revenue: $${data.revenue.total.toLocaleString()}`, 25, yPos);
    yPos += 6;
    doc.text(`Growth: ${data.revenue.growth}%`, 25, yPos);
    yPos += 15;
    
    // Customers section
    doc.setFontSize(14);
    doc.text('Customers', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Total Customers: ${data.customers.total}`, 25, yPos);
    yPos += 6;
    doc.text(`New Customers: ${data.customers.new}`, 25, yPos);
    yPos += 6;
    doc.text(`Active Customers: ${data.customers.active}`, 25, yPos);
    yPos += 15;
    
    // Tests section
    doc.setFontSize(14);
    doc.text('Tests', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Completed Tests: ${data.tests.completed}`, 25, yPos);
    yPos += 6;
    doc.text(`Passed: ${data.tests.passed}`, 25, yPos);
    yPos += 6;
    doc.text(`Failed: ${data.tests.failed}`, 25, yPos);
    yPos += 6;
    doc.text(`Completion Rate: ${data.tests.completionRate}%`, 25, yPos);
    
    doc.save(`analytics-report-${this.getDateString()}.pdf`);
    return doc;
  }

  private exportAppointmentsPDF(appointments: any[]): jsPDF {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text('Fisher Backflows - Appointments Schedule', 20, 20);
    
    // Prepare table data
    if (appointments.length > 0) {
      const headers = ['Date', 'Time', 'Customer', 'Type', 'Status', 'Technician'];
      const rows = appointments.map(apt => [
        apt.scheduledDate || apt.scheduled_date,
        apt.scheduledTime || apt.scheduled_time,
        apt.customerName || apt.customer_name,
        apt.type,
        apt.status,
        apt.technicianName || apt.technician_name || 'Unassigned'
      ]);
      
      (doc as any).autoTable({
        head: [headers],
        body: rows,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 102, 204] }
      });
    }
    
    doc.save(`appointments-${this.getDateString()}.pdf`);
    return doc;
  }

  private exportInvoicesPDF(invoices: any[]): jsPDF {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text('Fisher Backflows - Invoice Summary', 20, 20);
    
    // Prepare table data
    if (invoices.length > 0) {
      const headers = ['Invoice #', 'Customer', 'Date', 'Amount', 'Status'];
      const rows = invoices.map(inv => [
        inv.invoiceNumber || inv.invoice_number,
        inv.customerName || inv.customer_name,
        inv.date,
        `$${inv.total}`,
        inv.status
      ]);
      
      (doc as any).autoTable({
        head: [headers],
        body: rows,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 102, 204] }
      });
    }
    
    doc.save(`invoices-${this.getDateString()}.pdf`);
    return doc;
  }
}

// Export singleton instance
export const dataExportService = new DataExportService();
export default dataExportService;