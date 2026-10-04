import { useEffect, useRef } from 'react';

interface SEOProps {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: 'website' | 'article' | 'product';
  structuredData?: object | object[];
  canonicalUrl?: string;
  keywords?: string;
  noIndex?: boolean;
}

export function useSEO({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  ogType = 'website',
  structuredData,
  canonicalUrl,
  keywords,
  noIndex = false,
}: SEOProps) {
  const scriptIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.title = title;

    const setMetaTag = (name: string, content: string | undefined, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (content === undefined || content === '') {
        if (element) element.remove();
        return;
      }
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    const setLinkTag = (rel: string, href: string | undefined) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      
      if (href === undefined || href === '') {
        if (element) element.remove();
        return;
      }
      
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      
      element.setAttribute('href', href);
    };

    const getAbsoluteUrl = (path?: string): string | undefined => {
      if (!path) return undefined;
      if (path.startsWith('http://') || path.startsWith('https://')) return path;
      const baseUrl = window.location.origin;
      return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const absoluteImageUrl = getAbsoluteUrl(ogImage);
    const absolutePageUrl = ogUrl || window.location.href;

    setMetaTag('description', description);
    setMetaTag('og:title', ogTitle || title, true);
    setMetaTag('og:description', ogDescription || description, true);
    setMetaTag('og:url', absolutePageUrl, true);
    setMetaTag('og:type', ogType, true);
    setMetaTag('og:site_name', 'Bmaafashion', true);
    
    if (absoluteImageUrl) {
      setMetaTag('og:image', absoluteImageUrl, true);
      setMetaTag('og:image:width', '1200', true);
      setMetaTag('og:image:height', '630', true);
      setMetaTag('og:image:alt', ogTitle || title, true);
    }
    
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', ogTitle || title);
    setMetaTag('twitter:description', ogDescription || description);
    
    if (absoluteImageUrl) {
      setMetaTag('twitter:image', absoluteImageUrl);
    }

    setMetaTag('keywords', keywords);

    if (noIndex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      setMetaTag('robots', 'index, follow');
    }

    const canonicalHref = canonicalUrl ? getAbsoluteUrl(canonicalUrl) : absolutePageUrl;
    setLinkTag('canonical', canonicalHref);

    if (structuredData) {
      const scriptId = 'seo-structured-data';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      scriptIdRef.current = scriptId;

      const schemas = Array.isArray(structuredData) ? structuredData : [structuredData];
      const jsonLd = {
        "@context": "https://schema.org",
        "@graph": schemas
      };

      script.textContent = JSON.stringify(jsonLd);
    } else {
      const existingScript = document.getElementById('seo-structured-data');
      if (existingScript) {
        existingScript.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": [] });
      }
    }

  }, [title, description, ogTitle, ogDescription, ogImage, ogUrl, ogType, structuredData, canonicalUrl, keywords, noIndex]);
}
