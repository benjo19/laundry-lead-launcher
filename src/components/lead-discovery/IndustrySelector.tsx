
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface Industry {
  value: string;
  label: string;
  query: string;
}

export const industries: Industry[] = [
  { value: 'laundry', label: 'Praonice', query: 'laundry cleaning dry cleaning' },
  { value: 'restaurant', label: 'Restorani', query: 'restaurant food dining' },
  { value: 'retail', label: 'Trgovina', query: 'shop store retail clothing' },
  { value: 'beauty', label: 'Ljepota i wellness', query: 'beauty salon spa wellness' },
  { value: 'fitness', label: 'Fitness centri', query: 'gym fitness center workout' },
  { value: 'healthcare', label: 'Zdravstvo', query: 'clinic doctor medical health' },
  { value: 'automotive', label: 'Autoindustrija', query: 'car repair auto service garage' },
  { value: 'real-estate', label: 'Nekretnine', query: 'real estate property agency' },
  { value: 'education', label: 'Edukacija', query: 'school education training course' },
  { value: 'legal', label: 'Pravni servisi', query: 'lawyer law legal attorney' },
  { value: 'accounting', label: 'Računovodstvo', query: 'accounting bookkeeping tax' },
  { value: 'construction', label: 'Građevina', query: 'construction building contractor' },
  { value: 'plumbing', label: 'Vodoinstalaterstvo', query: 'plumber plumbing water repair' },
  { value: 'electrical', label: 'Elektro usluge', query: 'electrician electrical repair' },
  { value: 'cleaning', label: 'Čišćenje', query: 'cleaning service housekeeping' },
  { value: 'photography', label: 'Fotografija', query: 'photographer photography studio' },
  { value: 'catering', label: 'Catering', query: 'catering event food service' },
  { value: 'travel', label: 'Putovanje i turizam', query: 'travel agency tourism hotel' },
  { value: 'insurance', label: 'Osiguranje', query: 'insurance agency broker' },
  { value: 'consulting', label: 'Konsalting', query: 'consulting advisor business' },
  { value: 'marketing', label: 'Marketing agencije', query: 'marketing agency advertising' },
  { value: 'it-services', label: 'IT usluge', query: 'computer repair IT support tech' },
  { value: 'veterinary', label: 'Veterinarske usluge', query: 'veterinarian animal clinic' },
  { value: 'dental', label: 'Stomatologija', query: 'dentist dental clinic' },
  { value: 'optometry', label: 'Optika', query: 'optometrist glasses vision' },
  { value: 'pet-services', label: 'Usluge za kućne ljubimce', query: 'pet grooming daycare' },
  { value: 'florist', label: 'Cvjećarnice', query: 'florist flowers wedding' },
  { value: 'bakery', label: 'Pekare', query: 'bakery bread pastry' },
  { value: 'pharmacy', label: 'Apoteke', query: 'pharmacy drugstore medicine' },
  { value: 'jewelry', label: 'Zlatarnice', query: 'jewelry gold silver repair' }
];

interface IndustrySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const IndustrySelector = ({ value, onChange }: IndustrySelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Odaberite industriju" />
      </SelectTrigger>
      <SelectContent>
        {industries.map((industry) => (
          <SelectItem key={industry.value} value={industry.value}>
            {industry.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default IndustrySelector;
