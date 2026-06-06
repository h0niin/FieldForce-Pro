/**
 * Export utilities for PDF, CSV, and Excel downloads
 */

/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Determine columns
  const cols = columns || Object.keys(data[0]).map((key) => ({ key, label: key }));

  // Create CSV header
  const header = cols.map((col) => col.label).join(',');

  // Create CSV rows
  const rows = data.map((row) =>
    cols
      .map((col) => {
        const value = row[col.key];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',')
  );

  // Combine header and rows
  const csv = [header, ...rows].join('\n');

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data to Excel format (using CSV as fallback)
 * For full Excel support, install xlsx library: npm install xlsx
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  try {
    // Try to use xlsx if available
    // @ts-ignore - dynamic import
    if (typeof window !== 'undefined' && window.XLSX) {
      // @ts-ignore
      const XLSX = window.XLSX;
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    } else {
      // Fallback to CSV with .xlsx extension
      console.warn('xlsx library not available, falling back to CSV export');
      exportToCSV(data, filename, columns);
    }
  } catch (error) {
    console.error('Excel export failed', error);
    // Fallback to CSV
    exportToCSV(data, filename, columns);
  }
}

/**
 * Export content to PDF
 * For full PDF support, install jspdf: npm install jspdf
 */
export function exportToPDF(
  content: string | HTMLElement,
  filename: string,
  options?: {
    orientation?: 'portrait' | 'landscape';
    format?: 'a4' | 'letter';
  }
) {
  try {
    // Try to use jspdf if available
    // @ts-ignore - dynamic import
    if (typeof window !== 'undefined' && window.jspdf) {
      // @ts-ignore
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: options?.orientation || 'portrait',
        format: options?.format || 'a4',
      });

      if (typeof content === 'string') {
        doc.text(content, 10, 10);
      } else {
        doc.html(content, {
          callback: (doc: any) => {
            doc.save(`${filename}.pdf`);
          },
        });
        return;
      }

      doc.save(`${filename}.pdf`);
    } else {
      // Fallback: open print dialog
      console.warn('jspdf library not available, opening print dialog');
      window.print();
    }
  } catch (error) {
    console.error('PDF export failed', error);
    window.print();
  }
}

/**
 * Export table data with automatic column detection
 */
export function exportTableData<T extends Record<string, any>>(
  data: T[],
  filename: string,
  format: 'csv' | 'excel' | 'pdf'
) {
  switch (format) {
    case 'csv':
      exportToCSV(data, filename);
      break;
    case 'excel':
      exportToExcel(data, filename);
      break;
    case 'pdf':
      // For PDF table export, we need more complex logic
      // This is a simplified version
      const tableHtml = generateTableHTML(data);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = tableHtml;
      exportToPDF(tempDiv, filename);
      break;
  }
}

/**
 * Generate HTML table from data (helper for PDF export)
 */
function generateTableHTML<T extends Record<string, any>>(data: T[]): string {
  if (data.length === 0) return '<p>No data</p>';

  const headers = Object.keys(data[0]);
  const headerRow = `<tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>`;
  const dataRows = data
    .map(
      (row) =>
        `<tr>${headers.map((h) => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`
    )
    .join('');

  return `
    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
      <thead>${headerRow}</thead>
      <tbody>${dataRows}</tbody>
    </table>
  `;
}

/**
 * Download file from URL
 */
export function downloadFile(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}