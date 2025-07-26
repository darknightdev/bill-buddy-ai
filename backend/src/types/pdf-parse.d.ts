declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    info: any;
  }
  
  function pdf(buffer: Buffer): Promise<PDFData>;
  export = pdf;
} 