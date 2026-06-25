import React from 'react';
import { Button } from '@/components/ui/button';
import { Rows3, Rows2 } from 'lucide-react';
import { useDensity } from '@/hooks/useDensity';

interface DensityToggleProps {
  className?: string;
}

const DensityToggle: React.FC<DensityToggleProps> = ({ className }) => {
  const { density, setDensity } = useDensity();

  return (
    <div
      role="group"
      aria-label="Gustoća prikaza"
      className={`inline-flex items-center rounded-md border border-border bg-card p-0.5 ${className ?? ''}`}
    >
      <Button
        type="button"
        size="sm"
        variant={density === 'comfortable' ? 'secondary' : 'ghost'}
        onClick={() => setDensity('comfortable')}
        aria-pressed={density === 'comfortable'}
        title="Comfortable — više prostora"
        className="h-7 gap-1.5 px-2 text-xs"
      >
        <Rows2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Comfortable</span>
      </Button>
      <Button
        type="button"
        size="sm"
        variant={density === 'compact' ? 'secondary' : 'ghost'}
        onClick={() => setDensity('compact')}
        aria-pressed={density === 'compact'}
        title="Compact — više redaka na ekranu"
        className="h-7 gap-1.5 px-2 text-xs"
      >
        <Rows3 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Compact</span>
      </Button>
    </div>
  );
};

export default DensityToggle;
