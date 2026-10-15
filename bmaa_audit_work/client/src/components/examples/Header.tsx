import Header from '../Header';

export default function HeaderExample() {
  return (
    <Header 
      cartItemCount={3} 
      onCartOpen={() => console.log('Cart opened')}
    />
  );
}