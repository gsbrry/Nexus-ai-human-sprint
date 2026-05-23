import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.05em] transition-colors',
  {
    variants: {
      variant: {
        default: 'border border-border bg-[#0A0A0A] text-muted-foreground',
        gold: 'border border-gold/30 bg-gold/15 text-gold',
        blue: 'border border-[#378ADD]/30 bg-[#378ADD]/15 text-[#7AB4EA]',
        teal: 'border border-[#1D9E75]/30 bg-[#1D9E75]/15 text-[#5BC498]',
        purple: 'border border-[#7F77DD]/30 bg-[#7F77DD]/15 text-[#A8A2F0]',
        red: 'border border-[#E24B4A]/30 bg-[#E24B4A]/15 text-[#F09595]',
        amber: 'border border-[#EF9F27]/30 bg-[#EF9F27]/15 text-[#F2BB6B]',
        green: 'border border-[#639922]/30 bg-[#639922]/15 text-[#9FCC58]',
        outline: 'border border-border text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
