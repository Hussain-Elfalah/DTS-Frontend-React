import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border px-4 py-3 lg:px-6">
      <div className="text-xs text-muted-foreground">
        &copy; {currentYear} Defect Tracking System. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
