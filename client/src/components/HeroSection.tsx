import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Crown, Gem, ChevronLeft, ChevronRight, Pause } from "lucide-react";
import { Link } from "wouter";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useState, useEffect, useCallback, useRef } from "react";
import { getImageUrl } from "@/lib/image-utils";

const heroImage = getImageUrl("heroImage");

const SESSION_KEY = "hero-failed-urls";

interface HeroSectionProps {
  onExploreProducts?: () => void;
}

export default function HeroSection({ onExploreProducts }: HeroSectionProps) {
  const { heroImages, heroImageDurations, heroSlideDuration } = useSiteSettings();
  const allImages = heroImages.length > 0 ? heroImages : [heroImage];

  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (!stored) return new Set();
      return new Set(JSON.parse(stored) as string[]);
    } catch {
      return new Set();
    }
  });

  // Build valid image data retaining original index so duration lookup stays correct
  const validImageData = allImages
    .map((src, originalIdx) => ({ src, originalIdx }))
    .filter(({ src }) => !failedUrls.has(src));

  const validImages =
    validImageData.length > 0 ? validImageData.map((d) => d.src) : [heroImage];

  // When all configured images fail, fall back to the default; originalIdx 0 is fine
  const validOriginalIndices =
    validImageData.length > 0 ? validImageData.map((d) => d.originalIdx) : [0];

  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isManualStep, setIsManualStep] = useState(false);
  const manualStepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Clamp synchronously during render so no frame ever shows all slides at
  // opacity-0 while the state-sync useEffect hasn't fired yet.
  const safeCurrent = Math.min(current, Math.max(0, validImages.length - 1));

  const isPaused = isHovered || isFocused;

  const triggerManualIndicator = useCallback(() => {
    setIsManualStep(true);
    if (manualStepTimerRef.current) clearTimeout(manualStepTimerRef.current);
    manualStepTimerRef.current = setTimeout(() => {
      setIsManualStep(false);
    }, 2000);
  }, []);

  const advanceSlide = useCallback(() => {
    setCurrent((c) => (c + 1) % validImages.length);
  }, [validImages.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % validImages.length);
    triggerManualIndicator();
  }, [validImages.length, triggerManualIndicator]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + validImages.length) % validImages.length);
    triggerManualIndicator();
  }, [validImages.length, triggerManualIndicator]);

  // Use the original image index for duration so filtering doesn't shift durations
  const currentOriginalIdx = validOriginalIndices[safeCurrent] ?? 0;
  const currentDuration =
    (heroImageDurations[currentOriginalIdx] ?? heroSlideDuration) * 1000;

  useEffect(() => {
    if (validImages.length <= 1) return;
    if (isPaused) return;
    const timer = setTimeout(advanceSlide, currentDuration);
    return () => clearTimeout(timer);
  }, [validImages.length, advanceSlide, isPaused, currentDuration, safeCurrent]);

  // Clamp index when the valid set shrinks (e.g. an image errors out mid-session)
  useEffect(() => {
    setCurrent((c) => Math.min(c, Math.max(0, validImages.length - 1)));
  }, [validImages.length]);

  useEffect(() => {
    return () => {
      if (manualStepTimerRef.current) clearTimeout(manualStepTimerRef.current);
    };
  }, []);

  const handleImageError = useCallback((src: string) => {
    setFailedUrls((prev) => {
      if (prev.has(src)) return prev;
      const next = new Set(prev);
      next.add(src);
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // sessionStorage may be unavailable; ignore silently
      }
      return next;
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-br from-muted via-white to-accent/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => {
        if (
          sectionRef.current &&
          !sectionRef.current.contains(e.relatedTarget as Node)
        ) {
          setIsFocused(false);
        }
      }}
    >
      {/* Image Background with overlay */}
      <div className="absolute inset-0">
        {validImages.map((src, idx) => (
          <img
            key={src}
            src={src}
            alt={`Hero image ${idx + 1}`}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            style={{ opacity: idx === safeCurrent ? 1 : 0 }}
            data-testid={idx === 0 ? "hero-image-background" : undefined}
            onError={() => handleImageError(src)}
          />
        ))}
        {/* Elegant overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-[650px] text-center text-white py-20">
          {/* Main Content */}
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent drop-shadow-lg">
                Discover Timeless Elegance
              </span>
              <br />
              <span className="text-white drop-shadow-md">& Fashion</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-white/95 max-w-3xl mx-auto leading-relaxed font-light">
              At Bmaafashion Boutique, we curate exclusive dress collections that celebrate your unique style and elegance. Premium fabrics, exquisite designs, and unbeatable quality.
            </p>

            {/* Feature highlights */}
            <div className="flex flex-wrap justify-center gap-8 py-4">
              <div className="flex items-center space-x-2.5 bg-white/10 backdrop-blur-md px-5 py-3 rounded-full border border-primary/30">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold tracking-wide">Premium Quality</span>
              </div>
              <div className="flex items-center space-x-2.5 bg-white/10 backdrop-blur-md px-5 py-3 rounded-full border border-primary/30">
                <Crown className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold tracking-wide">Exclusive Designs</span>
              </div>
              <div className="flex items-center space-x-2.5 bg-white/10 backdrop-blur-md px-5 py-3 rounded-full border border-primary/30">
                <Gem className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold tracking-wide">Latest Trends</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center pt-4">
              <Link to="/products">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl hover:shadow-2xl min-w-[200px]"
                  data-testid="button-book-consultation"
                >
                  Shop The Collection
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <Link to="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/80 text-white backdrop-blur-md bg-white/15 hover:bg-white hover:text-foreground shadow-lg hover:shadow-xl min-w-[200px]"
                  data-testid="button-learn-more"
                >
                  Discover Our Story
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Pause indicator — shown while hovering and carousel is paused */}
      {validImages.length > 1 && (
        <div
          aria-live="polite"
          aria-label="Carousel paused"
          className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-medium transition-opacity duration-300 pointer-events-none ${
            isPaused || isManualStep ? "opacity-100" : "opacity-0"
          }`}
        >
          <Pause className="h-3 w-3" />
          <span>Paused</span>
        </div>
      )}

      {/* Carousel controls — only shown when multiple valid images remain */}
      {validImages.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous hero image"
            className="absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary hover:scale-110 transition-all duration-300 border border-white/30"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={next}
            aria-label="Next hero image"
            className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary hover:scale-110 transition-all duration-300 border border-white/30"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5 bg-black/20 backdrop-blur-md px-4 py-2.5 rounded-full">
            {validImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                aria-label={`Go to hero image ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === safeCurrent ? "w-8 bg-primary shadow-lg" : "w-2.5 bg-white/60 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
