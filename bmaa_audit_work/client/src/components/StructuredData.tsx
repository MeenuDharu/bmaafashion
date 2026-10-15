import { useEffect } from 'react';

interface StructuredDataProps {
  data: object | object[];
}

export function StructuredData({ data }: StructuredDataProps) {
  useEffect(() => {
    const scriptId = 'structured-data-script';
    
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const schemas = Array.isArray(data) ? data : [data];
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": schemas
    };

    script.textContent = JSON.stringify(jsonLd);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [data]);

  return null;
}

export function useStructuredData(data: object | object[]) {
  useEffect(() => {
    const scriptId = `structured-data-${Math.random().toString(36).substr(2, 9)}`;
    
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    
    const schemas = Array.isArray(data) ? data : [data];
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": schemas
    };
    
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [data]);
}
