
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface Industry {
  value: string;
  label: string;
  query: string;
}

export const industries: Industry[] = [
  // Turizam i smještaj - precizniji upiti
  { value: 'hotel', label: 'Hoteli', query: 'hotel "accommodation" "lodging" -apartment -hostel' },
  { value: 'hostel', label: 'Hosteli', query: 'hostel "backpacker" "budget accommodation" -hotel -apartment' },
  { value: 'apartment', label: 'Apartmani za iznajmljivanje', query: '"vacation rental" "apartment rental" "holiday apartment" -hotel' },
  { value: 'motel', label: 'Moteli', query: 'motel "roadside accommodation" -hotel -hostel' },
  
  // Usluge čišćenja - vrlo specifični
  { value: 'laundry', label: 'Praonice rublja', query: '"laundry service" "dry cleaning" "wash and fold" -self-service' },
  { value: 'dry-cleaning', label: 'Kemijske čistionice', query: '"dry cleaning" "professional cleaning" -laundromat' },
  { value: 'industrial-laundry', label: 'Industrijske praonice', query: '"industrial laundry" "commercial washing" "linen service"' },
  
  // Ugostiteljstvo - razdvojeno po tipovima
  { value: 'restaurant', label: 'Restorani', query: 'restaurant "fine dining" "casual dining" -fast -cafe -bar' },
  { value: 'fast-food', label: 'Brza hrana', query: '"fast food" "quick service" "takeaway" -restaurant' },
  { value: 'cafe', label: 'Kafići', query: 'cafe "coffee shop" "espresso bar" -restaurant -bar' },
  { value: 'bar', label: 'Barovi i klubovi', query: 'bar "cocktail bar" "nightclub" "pub" -cafe -restaurant' },
  { value: 'catering', label: 'Catering servisi', query: '"catering service" "event catering" "wedding catering"' },
  
  // Trgovina - specifične kategorije
  { value: 'clothing', label: 'Trgovine odjeće', query: '"clothing store" "fashion boutique" "apparel shop" -grocery -supermarket' },
  { value: 'grocery', label: 'Trgovine mješovitom robom', query: '"grocery store" "supermarket" "convenience store" -clothing -pharmacy' },
  { value: 'pharmacy', label: 'Ljekarne', query: 'pharmacy "drugstore" "chemist" -grocery -supermarket' },
  { value: 'electronics', label: 'Trgovine elektronike', query: '"electronics store" "computer shop" "mobile phone store"' },
  
  // Ljepota i wellness - detaljnije
  { value: 'beauty-salon', label: 'Kozmetički saloni', query: '"beauty salon" "nail salon" "hair salon" -spa -massage' },
  { value: 'spa', label: 'Spa i wellness centri', query: 'spa "wellness center" "day spa" "beauty spa" -salon' },
  { value: 'barbershop', label: 'Brijačnice', query: 'barbershop "barber shop" "men\'s grooming" -salon' },
  { value: 'massage', label: 'Masažni saloni', query: '"massage therapy" "massage salon" "therapeutic massage"' },
  
  // Fitness i sport
  { value: 'gym', label: 'Teretane', query: 'gym "fitness center" "weight training" -spa -yoga' },
  { value: 'yoga', label: 'Yoga studiji', query: '"yoga studio" "pilates studio" "meditation center" -gym' },
  { value: 'sports-club', label: 'Sportski klubovi', query: '"sports club" "athletic club" "tennis club" "golf club"' },
  
  // Zdravstvo - razdvojeno po specijalizacijama
  { value: 'general-practice', label: 'Opća medicina', query: '"general practitioner" "family doctor" "medical clinic" -dental -veterinary' },
  { value: 'dental', label: 'Stomatološke ordinacije', query: 'dentist "dental clinic" "orthodontist" -medical -veterinary' },
  { value: 'veterinary', label: 'Veterinarske ambulante', query: 'veterinarian "animal clinic" "pet hospital" -dental -medical' },
  { value: 'optometry', label: 'Optike', query: 'optometrist "eye clinic" "glasses shop" "vision center"' },
  
  // Autoindustrija - specifični servisi
  { value: 'auto-repair', label: 'Auto servisi', query: '"auto repair" "car service" "mechanic shop" -dealership -rental' },
  { value: 'car-dealership', label: 'Auto saloni', query: '"car dealership" "auto dealer" "car sales" -repair -rental' },
  { value: 'car-rental', label: 'Rent-a-car', query: '"car rental" "vehicle rental" "auto rental" -dealership -repair' },
  { value: 'car-wash', label: 'Autopraone', query: '"car wash" "auto detailing" "vehicle cleaning" -repair' },
  
  // Nekretnine
  { value: 'real-estate', label: 'Agencije za nekretnine', query: '"real estate agency" "property agency" "realtor office"' },
  { value: 'property-management', label: 'Upravljanje nekretninama', query: '"property management" "building management" "facility management"' },
  
  // Edukacija - po razinama
  { value: 'kindergarten', label: 'Vrtići', query: 'kindergarten "preschool" "daycare center" -school' },
  { value: 'primary-school', label: 'Osnovne škole', query: '"primary school" "elementary school" -kindergarten -high' },
  { value: 'language-school', label: 'Jezične škole', query: '"language school" "language center" "English school"' },
  { value: 'tutoring', label: 'Instrukcije', query: 'tutoring "private lessons" "academic support"' },
  
  // Poslovne usluge - detaljnije
  { value: 'accounting', label: 'Računovodstvene usluge', query: '"accounting service" "bookkeeping" "tax preparation" -legal' },
  { value: 'legal', label: 'Pravni servisi', query: '"law firm" "legal services" "attorney office" -accounting' },
  { value: 'consulting', label: 'Poslovni konsalting', query: '"business consulting" "management consulting" "advisory services"' },
  { value: 'marketing-agency', label: 'Marketing agencije', query: '"marketing agency" "advertising agency" "digital marketing"' },
  
  // Tehničke usluge - specijalizirano
  { value: 'plumbing', label: 'Vodoinstalaterstvo', query: 'plumber "plumbing service" "water repair" -electrical -construction' },
  { value: 'electrical', label: 'Elektroinstalaterstvo', query: 'electrician "electrical service" "wiring repair" -plumbing -construction' },
  { value: 'hvac', label: 'Klimatizacija i grijanje', query: '"HVAC service" "air conditioning" "heating repair" "climate control"' },
  { value: 'construction', label: 'Građevinske tvrtke', query: '"construction company" "building contractor" "renovation service"' },
  
  // Proizvodnja i industrija
  { value: 'manufacturing', label: 'Proizvodnja općenito', query: 'manufacturing "production company" "industrial production" -retail -service' },
  { value: 'textile-manufacturing', label: 'Tekstilna proizvodnja', query: '"textile manufacturing" "clothing production" "fabric production"' },
  { value: 'food-production', label: 'Proizvodnja hrane', query: '"food production" "food manufacturing" "food processing" -restaurant -bakery' },
  { value: 'metal-manufacturing', label: 'Metalska industrija', query: '"metal manufacturing" "steel production" "metalworking" "machining"' },
  { value: 'plastic-manufacturing', label: 'Proizvodnja plastike', query: '"plastic manufacturing" "polymer production" "injection molding"' },
  { value: 'wood-manufacturing', label: 'Drvna industrija', query: '"wood manufacturing" "lumber production" "furniture manufacturing"' },
  { value: 'chemical-manufacturing', label: 'Kemijska industrija', query: '"chemical manufacturing" "chemical production" "pharmaceutical manufacturing"' },
  { value: 'electronics-manufacturing', label: 'Elektronička proizvodnja', query: '"electronics manufacturing" "circuit board" "electronic components"' },
  { value: 'automotive-manufacturing', label: 'Automobilska industrija', query: '"automotive manufacturing" "car production" "auto parts manufacturing"' },
  { value: 'machinery-manufacturing', label: 'Proizvodnja strojeva', query: '"machinery manufacturing" "industrial equipment" "manufacturing equipment"' },

  // Privatni korisnici
  { value: 'privatni', label: 'Privatni korisnici', query: '"private individual" "personal services" "residential services"' },

  // Ostale specifične usluge
  { value: 'cleaning-service', label: 'Usluge čišćenja', query: '"cleaning service" "housekeeping" "office cleaning" -laundry' },
  { value: 'photography', label: 'Foto studiji', query: '"photography studio" "wedding photographer" "portrait photography"' },
  { value: 'florist', label: 'Cvjećarnice', query: 'florist "flower shop" "wedding flowers" "floral design"' },
  { value: 'bakery', label: 'Pekare', query: 'bakery "bread shop" "pastry shop" "cake shop" -restaurant' },
  { value: 'pet-services', label: 'Usluge za kućne ljubimce', query: '"pet grooming" "dog daycare" "pet sitting" -veterinary' },
  { value: 'jewelry', label: 'Zlatarnice', query: '"jewelry store" "jeweler" "watch repair" "gold shop"' },
  { value: 'insurance', label: 'Osiguravajuće agencije', query: '"insurance agency" "insurance broker" "insurance office"' },
  { value: 'travel-agency', label: 'Turističke agencije', query: '"travel agency" "tour operator" "vacation planning"' },
  { value: 'it-services', label: 'IT usluge', query: '"computer repair" "IT support" "tech support" "software development"' }
];

interface IndustrySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const IndustrySelector = ({ value, onChange }: IndustrySelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-blue-300 transition-colors">
        <SelectValue placeholder="Odaberite industriju" />
      </SelectTrigger>
      <SelectContent className="bg-white border-2 border-gray-200 shadow-lg max-h-80 overflow-y-auto">
        {industries.map((industry) => (
          <SelectItem 
            key={industry.value} 
            value={industry.value}
            className="hover:bg-blue-50 cursor-pointer"
          >
            {industry.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default IndustrySelector;
