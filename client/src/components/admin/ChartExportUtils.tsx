// Chart export utilities for CSV and PNG functionality

interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

interface ExportData {
  revenue?: TimeSeriesPoint[];
  orders?: TimeSeriesPoint[];
  revenueBreakdown?: any;
  ordersByStatus?: any[];
  dateRange?: {
    from: string;
    to: string;
  };
}

/**
 * Export chart data to CSV format
 */
export function exportToCSV(data: ExportData, filename: string = 'analytics-export.csv') {
  try {
    let csvContent = '';
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Header information
    csvContent += `Bmaafashion Analytics Export\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n`;
    if (data.dateRange) {
      csvContent += `Period: ${new Date(data.dateRange.from).toLocaleDateString()} - ${new Date(data.dateRange.to).toLocaleDateString()}\n`;
    }
    csvContent += '\n';

    // Revenue time series data
    if (data.revenue && data.revenue.length > 0) {
      csvContent += 'Revenue Time Series\n';
      csvContent += 'Date,Revenue (₹),Label\n';
      data.revenue.forEach(point => {
        const date = new Date(point.date).toLocaleDateString();
        csvContent += `${date},${point.value},${point.label || ''}\n`;
      });
      csvContent += '\n';
    }

    // Orders time series data
    if (data.orders && data.orders.length > 0) {
      csvContent += 'Orders Time Series\n';
      csvContent += 'Date,Order Count,Label\n';
      data.orders.forEach(point => {
        const date = new Date(point.date).toLocaleDateString();
        csvContent += `${date},${point.value},${point.label || ''}\n`;
      });
      csvContent += '\n';
    }

    // Revenue breakdown
    if (data.revenueBreakdown) {
      csvContent += 'Revenue Breakdown\n';
      csvContent += 'Category,Amount (₹)\n';
      csvContent += `Product Revenue,${data.revenueBreakdown.productRevenue}\n`;
      csvContent += `Shipping Revenue,${data.revenueBreakdown.shippingRevenue}\n`;
      csvContent += `Tax Revenue,${data.revenueBreakdown.taxRevenue}\n`;
      csvContent += `Total Revenue,${data.revenueBreakdown.totalRevenue}\n`;
      csvContent += '\n';
    }

    // Orders by status
    if (data.ordersByStatus && data.ordersByStatus.length > 0) {
      csvContent += 'Orders by Status\n';
      csvContent += 'Status,Count,Percentage\n';
      data.ordersByStatus.forEach(status => {
        csvContent += `${status.status},${status.count},${status.percentage}%\n`;
      });
      csvContent += '\n';
    }

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${timestamp}-${filename}`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return false;
  }
}

/**
 * Export chart as PNG image
 */
export function exportToPNG(chartElement: HTMLElement | null, filename: string = 'chart-export.png') {
  try {
    if (!chartElement) {
      throw new Error('Chart element not found');
    }

    // Use html2canvas if available, otherwise fallback to basic screenshot
    if (typeof window !== 'undefined' && (window as any).html2canvas) {
      (window as any).html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        height: chartElement.offsetHeight,
        width: chartElement.offsetWidth,
      }).then((canvas: HTMLCanvasElement) => {
        const timestamp = new Date().toISOString().split('T')[0];
        const link = document.createElement('a');
        
        link.download = `${timestamp}-${filename}`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
      return true;
    } else {
      // Fallback: Create a simple canvas representation
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Canvas context not available');
      
      canvas.width = chartElement.offsetWidth;
      canvas.height = chartElement.offsetHeight;
      
      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add text indicating manual export needed
      ctx.fillStyle = '#666666';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Chart Export', canvas.width / 2, canvas.height / 2 - 10);
      ctx.fillText('Use browser screenshot for chart image', canvas.width / 2, canvas.height / 2 + 10);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.download = `${timestamp}-${filename}`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      return true;
    }
  } catch (error) {
    console.error('Error exporting PNG:', error);
    
    // Ultimate fallback - print functionality
    if (typeof window !== 'undefined') {
      const printContent = chartElement?.outerHTML || 'Chart content not available';
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Chart Export</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .chart-container { max-width: 100%; }
              </style>
            </head>
            <body>
              <h2>Analytics Chart Export</h2>
              <p>Generated: ${new Date().toLocaleString()}</p>
              <div class="chart-container">${printContent}</div>
              <script>window.print(); window.close();</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
    
    return false;
  }
}

/**
 * Get chart element by test ID or class name
 */
export function getChartElement(identifier: string): HTMLElement | null {
  // Try by data-testid first
  let element: HTMLElement | null = document.querySelector(`[data-testid="${identifier}"]`) as HTMLElement | null;
  
  // Fallback to class name
  if (!element) {
    element = document.querySelector(`.${identifier}`) as HTMLElement | null;
  }
  
  // Fallback to ID
  if (!element) {
    element = document.getElementById(identifier);
  }
  
  return element;
}

/**
 * Export all charts data to a comprehensive CSV report
 */
export function exportComprehensiveReport(allData: {
  revenue?: any;
  orders?: any;
  overview?: any;
}) {
  const exportData: ExportData = {
    revenue: allData.revenue?.timeSeries,
    orders: allData.orders?.timeSeries,
    revenueBreakdown: allData.revenue?.revenueBreakdown,
    ordersByStatus: allData.orders?.ordersByStatus,
    dateRange: allData.revenue?.dateRange || allData.orders?.dateRange,
  };
  
  return exportToCSV(exportData, 'comprehensive-analytics-report.csv');
}