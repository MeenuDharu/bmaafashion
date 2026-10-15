import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Helper function to convert relative image paths to full API URLs
const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '/placeholder-image.jpg';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/api/images/')) {
    return imagePath;
  }
  // Convert relative paths to full API URLs
  return `/api/images/${imagePath.startsWith('/') ? imagePath.slice(1) : imagePath}`;
};

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  className?: string;
}

interface ImageThumbnailProps {
  src: string;
  alt: string;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

const ImageThumbnail = ({ src, alt, isActive, onClick, index }: ImageThumbnailProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <button
      onClick={onClick}
      className={`
        relative aspect-square rounded-md overflow-hidden border-2 transition-all duration-200 
        ${isActive 
          ? 'border-primary ring-2 ring-primary/20' 
          : 'border-muted hover:border-primary/50'
        }
        focus:outline-none focus:ring-2 focus:ring-primary/20
      `}
      data-testid={`thumbnail-${index}`}
      aria-label={`View image ${index + 1} of ${alt}`}
    >
      {isLoading && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      {hasError ? (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Error</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
        />
      )}
    </button>
  );
};

export default function ProductImageGallery({ 
  images, 
  productName, 
  className = "" 
}: ProductImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMainImageLoading, setIsMainImageLoading] = useState(true);
  const [hasMainImageError, setHasMainImageError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const mainImageRef = useRef<HTMLImageElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  // Fallback to placeholder if no images and convert all paths to full URLs
  const displayImages = images.length > 0 ? images.map(getImageUrl) : ['/placeholder-image.jpg'];
  const currentImage = displayImages[currentImageIndex];

  // Preload images for performance
  useEffect(() => {
    // Preload the main image and next 2-3 thumbnails
    const imagesToPreload = displayImages.slice(0, Math.min(4, displayImages.length));
    imagesToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [displayImages]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateToImage(currentImageIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateToImage(currentImageIndex + 1);
      } else if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentImageIndex]);

  // Body scroll prevention when lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isLightboxOpen]);

  const navigateToImage = (index: number) => {
    if (index < 0) {
      setCurrentImageIndex(displayImages.length - 1);
    } else if (index >= displayImages.length) {
      setCurrentImageIndex(0);
    } else {
      setCurrentImageIndex(index);
    }
    setIsMainImageLoading(true);
    setHasMainImageError(false);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      navigateToImage(currentImageIndex + 1);
    }
    if (isRightSwipe) {
      navigateToImage(currentImageIndex - 1);
    }
  };

  // Auto-scroll thumbnails to keep active thumbnail visible
  useEffect(() => {
    if (thumbnailsRef.current && displayImages.length > 1) {
      const activeThumb = thumbnailsRef.current.children[currentImageIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentImageIndex]);

  const MainImageDisplay = ({ isInLightbox = false }: { isInLightbox?: boolean }) => (
    <div className={`relative ${isInLightbox ? 'w-full h-full' : 'aspect-square'} bg-muted rounded-lg overflow-hidden group`}>
      {/* Loading skeleton */}
      {isMainImageLoading && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}

      {/* Error state */}
      {hasMainImageError ? (
        <div className="w-full h-full flex items-center justify-center flex-col space-y-2">
          <div className="text-muted-foreground">Failed to load image</div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setHasMainImageError(false);
              setIsMainImageLoading(true);
            }}
          >
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {/* Main image */}
          <img
            ref={mainImageRef}
            src={currentImage}
            alt={`${productName} - Image ${currentImageIndex + 1}`}
            className={`
              w-full h-full object-cover transition-all duration-300 cursor-zoom-in
              ${isMainImageLoading ? 'opacity-0' : 'opacity-100'}
              ${isZoomed && !isInLightbox ? 'scale-150 cursor-zoom-out' : ''}
            `}
            onLoad={() => setIsMainImageLoading(false)}
            onError={() => {
              setHasMainImageError(true);
              setIsMainImageLoading(false);
            }}
            onClick={() => {
              if (isInLightbox) return;
              setIsZoomed(!isZoomed);
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            data-testid="img-gallery-main"
          />

          {/* Image counter */}
          {displayImages.length > 1 && (
            <Badge 
              variant="secondary" 
              className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm"
              data-testid="text-image-counter"
            >
              {currentImageIndex + 1} / {displayImages.length}
            </Badge>
          )}

          {/* Zoom indicator */}
          {!isInLightbox && (
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                size="icon"
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomed(!isZoomed);
                }}
                data-testid="button-zoom"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Navigation arrows for multiple images */}
          {displayImages.length > 1 && (
            <>
              <Button
                size="icon"
                variant="secondary"
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/80 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToImage(currentImageIndex - 1);
                }}
                data-testid="button-prev-image"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                size="icon"
                variant="secondary"
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/80 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToImage(currentImageIndex + 1);
                }}
                data-testid="button-next-image"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Lightbox trigger */}
          {!isInLightbox && (
            <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="bg-background/80 backdrop-blur-sm"
                    data-testid="button-lightbox"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-screen-lg max-h-screen-lg p-0 bg-black/90">
                  <div className="relative w-full h-[80vh] flex items-center justify-center">
                    <MainImageDisplay isInLightbox={true} />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-4 right-4 text-white hover:bg-white/20"
                      onClick={() => setIsLightboxOpen(false)}
                      data-testid="button-close-lightbox"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    
                    {/* Lightbox navigation */}
                    {displayImages.length > 1 && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                          onClick={() => navigateToImage(currentImageIndex - 1)}
                          data-testid="button-lightbox-prev"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                          onClick={() => navigateToImage(currentImageIndex + 1)}
                          data-testid="button-lightbox-next"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`} data-testid="gallery-container">
      {/* Main image */}
      <MainImageDisplay />

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="space-y-2">
          <div 
            ref={thumbnailsRef}
            className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
            data-testid="gallery-thumbnails"
          >
            {displayImages.map((image, index) => (
              <div key={index} className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20">
                <ImageThumbnail
                  src={image}
                  alt={`${productName} thumbnail ${index + 1}`}
                  isActive={index === currentImageIndex}
                  onClick={() => navigateToImage(index)}
                  index={index}
                />
              </div>
            ))}
          </div>
          
          {/* Thumbnail navigation hint */}
          <p className="text-xs text-muted-foreground text-center">
            Click thumbnails to view • Use arrow keys to navigate • Click main image to zoom
          </p>
        </div>
      )}
    </div>
  );
}