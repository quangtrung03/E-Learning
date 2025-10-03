import React from "react";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  containerClass?: string;
  fullWidth?: boolean;
  branded?: boolean; // Option cho background có màu thương hiệu nhẹ
}

const Layout: React.FC<LayoutProps> = ({
  children,
  className = "",
  containerClass = "",
  fullWidth = false,
  branded = false,
}) => {
  const bgClass = branded ? "bg-primary-50" : "bg-gray-50";
  
  return (
    <div className={`min-h-screen flex flex-col ${bgClass} text-gray-800`}>
      <Header />
      <main className={`flex-1 ${className}`}>
        {fullWidth ? (
          children
        ) : (
          <div className={`max-w-7xl mx-auto px-2 ${containerClass}`}>
            {children}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
