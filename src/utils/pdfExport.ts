import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

// Helper function to convert oklch colors to RGB
const convertOklchToRgb = (element: HTMLElement): HTMLElement => {
  const clone = element.cloneNode(true) as HTMLElement;
  const elements = clone.getElementsByTagName('*');
  
  Array.from(elements).forEach(el => {
    if (el instanceof HTMLElement) {
      const computedStyle = window.getComputedStyle(el);
      const styles = [
        'color',
        'backgroundColor',
        'borderColor',
        'fill',
        'stroke'
      ];
      
      styles.forEach(style => {
        const value = computedStyle[style as keyof CSSStyleDeclaration];
        if (value && (value as string).includes('oklch')) {
          ((el.style as unknown) as Record<string, string>)[style] = value as string;
        }
      });
    }
  });
  
  return clone;
};

// Common options for toPng
const toPngOptions = {
  quality: 1.0,
  pixelRatio: 2,
  backgroundColor: '#ffffff',
  style: {
    transform: 'scale(1)',
    transformOrigin: 'top left',
  },
  filter: (node: HTMLElement) => {
    return !(
      node.tagName === 'BUTTON' ||
      node.tagName === 'INPUT' ||
      node.tagName === 'SELECT'
    );
  }
};

// Common function to create PDF
const createPDF = (dataUrl: string, element: HTMLElement): jsPDF => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const imgWidth = pdfWidth;
  const imgHeight = (imgWidth * element.offsetHeight) / element.offsetWidth;

  pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight, '', 'FAST');
  return pdf;
};

export const generatePDF = async (element: HTMLElement, filename: string): Promise<void> => {
  try {
    // Convert colors and prepare element
    const processedElement = convertOklchToRgb(element);
    
    // Create temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.appendChild(processedElement);
    document.body.appendChild(tempContainer);

    try {
      // Capture the element as an image
      const dataUrl = await toPng(processedElement, toPngOptions);
      
      // Create and save PDF
      const pdf = createPDF(dataUrl, processedElement);
      pdf.save(filename);
    } finally {
      // Clean up
      document.body.removeChild(tempContainer);
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

export const generatePDFAsBase64 = async (element: HTMLElement): Promise<string> => {
  try {
    // Convert colors and prepare element
    const processedElement = convertOklchToRgb(element);
    
    // Create temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.appendChild(processedElement);
    document.body.appendChild(tempContainer);

    try {
      // Capture the element as an image
      const dataUrl = await toPng(processedElement, toPngOptions);
      
      // Create PDF and convert to base64
      const pdf = createPDF(dataUrl, processedElement);
      return pdf.output('datauristring').split(',')[1];
    } finally {
      // Clean up
      document.body.removeChild(tempContainer);
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}; 