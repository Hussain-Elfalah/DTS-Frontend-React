import React from 'react';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-primary/15 text-primary border-primary/20',
  secondary: 'bg-muted text-muted-foreground border-border',
  success: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-700 border-amber-500/20',
  destructive: 'bg-destructive/15 text-destructive border-destructive/20',
  outline: 'bg-transparent text-foreground border-border',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  className = '',
  children,
  ...props
}) => (
  <span
    className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    {...props}
  >
    {children}
  </span>
);

export default Badge;
