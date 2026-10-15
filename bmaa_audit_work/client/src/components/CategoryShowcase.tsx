import { Link } from "wouter";

interface CategoryShowcaseProps {
  title: string;
  description: string;
  image: string;
  link: string;
  productCount?: number;
}

export default function CategoryShowcase({
  title,
  description,
  image,
  link,
  productCount,
}: CategoryShowcaseProps) {
  return (
    <Link to={link}>
      <div className="group relative overflow-hidden rounded-2xl aspect-[4/5] cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500">
        {/* Image */}
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
          <div className="transform transition-all duration-500 group-hover:translate-y-0 translate-y-2">
            <h3 className="text-2xl md:text-3xl font-bold mb-2 tracking-wide">
              {title}
            </h3>
            <p className="text-sm md:text-base text-white/90 mb-3 line-clamp-2">
              {description}
            </p>
            {productCount !== undefined && (
              <p className="text-xs text-white/80 font-medium">
                {productCount} {productCount === 1 ? 'Product' : 'Products'}
              </p>
            )}
          </div>
          
          {/* Hover Indicator */}
          <div className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transform transition-all duration-500 group-hover:scale-110 group-hover:bg-primary">
            <svg
              className="w-6 h-6 text-white transform transition-transform duration-500 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
