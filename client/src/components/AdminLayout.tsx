import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from '@/components/AdminSidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { getTotalItems, openCart } = useCart();
  
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header cartItemCount={getTotalItems()} onCartOpen={openCart} />
      
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex flex-1 w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-admin-sidebar-toggle" />
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Admin Panel</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-muted/30 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
    
    <Footer />
  </div>
  );
}