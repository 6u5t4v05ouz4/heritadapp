import Link from "next/link";
import { ReactNode } from "react";
import Card from "@/components/ui/Card";

interface DocCardProps {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
}

export function DocCard({ href, title, description, icon }: DocCardProps) {
  return (
    <Link href={href} className="block group">
      <Card 
        padding="lg" 
        className="h-full bg-bg-elevated/50 hover:bg-bg-elevated transition-colors border-border-subtle group-hover:border-accent-primary/50 relative overflow-hidden"
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
            {title}
          </h3>
          <div className="text-text-tertiary group-hover:text-accent-primary transition-colors">
            {icon}
          </div>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          {description}
        </p>
      </Card>
    </Link>
  );
}
