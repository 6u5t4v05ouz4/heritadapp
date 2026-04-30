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
        className="h-full bg-white/5 hover:bg-white/10 transition-colors border-white/10 group-hover:border-[#D4AF37]/50 relative overflow-hidden"
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-white group-hover:text-[#D4AF37] transition-colors">
            {title}
          </h3>
          <div className="text-gray-500 group-hover:text-[#D4AF37] transition-colors">
            {icon}
          </div>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          {description}
        </p>
      </Card>
    </Link>
  );
}
