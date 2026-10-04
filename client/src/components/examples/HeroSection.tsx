import HeroSection from '../HeroSection';

export default function HeroSectionExample() {
  return (
    <HeroSection onExploreProducts={() => console.log('Explore products clicked')} />
  );
}