import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const europeanCountries = [
  { code: 'HR', name: 'Hrvatska', flag: '🇭🇷' },
  { code: 'SI', name: 'Slovenija', flag: '🇸🇮' },
  { code: 'AT', name: 'Austrija', flag: '🇦🇹' },
  { code: 'DE', name: 'Njemačka', flag: '🇩🇪' },
  { code: 'IT', name: 'Italija', flag: '🇮🇹' },
  { code: 'CH', name: 'Švicarska', flag: '🇨🇭' },
  { code: 'HU', name: 'Mađarska', flag: '🇭🇺' },
  { code: 'SK', name: 'Slovačka', flag: '🇸🇰' },
  { code: 'CZ', name: 'Češka', flag: '🇨🇿' },
  { code: 'PL', name: 'Poljska', flag: '🇵🇱' },
  { code: 'RS', name: 'Srbija', flag: '🇷🇸' },
  { code: 'BA', name: 'Bosna i Hercegovina', flag: '🇧🇦' },
  { code: 'ME', name: 'Crna Gora', flag: '🇲🇪' },
  { code: 'MK', name: 'Sjeverna Makedonija', flag: '🇲🇰' },
  { code: 'AL', name: 'Albanija', flag: '🇦🇱' },
  { code: 'FR', name: 'Francuska', flag: '🇫🇷' },
  { code: 'ES', name: 'Španjolska', flag: '🇪🇸' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'NL', name: 'Nizozemska', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgija', flag: '🇧🇪' },
  { code: 'LU', name: 'Luksemburg', flag: '🇱🇺' },
  { code: 'DK', name: 'Danska', flag: '🇩🇰' },
  { code: 'SE', name: 'Švedska', flag: '🇸🇪' },
  { code: 'NO', name: 'Norveška', flag: '🇳🇴' },
  { code: 'FI', name: 'Finska', flag: '🇫🇮' },
  { code: 'EE', name: 'Estonija', flag: '🇪🇪' },
  { code: 'LV', name: 'Latvija', flag: '🇱🇻' },
  { code: 'LT', name: 'Litva', flag: '🇱🇹' },
  { code: 'IE', name: 'Irska', flag: '🇮🇪' },
  { code: 'GB', name: 'Velika Britanija', flag: '🇬🇧' },
  { code: 'RO', name: 'Rumunjska', flag: '🇷🇴' },
  { code: 'BG', name: 'Bugarska', flag: '🇧🇬' },
  { code: 'GR', name: 'Grčka', flag: '🇬🇷' },
  { code: 'CY', name: 'Cipar', flag: '🇨🇾' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹' }
];

interface CountrySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const CountrySelector = ({ value, onChange }: CountrySelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full bg-background border-input hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <SelectValue placeholder="Odaberite državu..." />
      </SelectTrigger>
      <SelectContent className="max-h-60 bg-background border border-border shadow-lg z-50">
        <SelectItem value="all" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
          Sve države
        </SelectItem>
        {europeanCountries.map((country) => (
          <SelectItem 
            key={country.code} 
            value={country.name}
            className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
          >
            <span className="flex items-center gap-2">
              <span>{country.flag}</span>
              <span>{country.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CountrySelector;