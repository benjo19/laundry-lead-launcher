
import { Facebook, Linkedin, Instagram } from 'lucide-react';

export const platforms = [
  { value: 'LinkedIn', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600' },
  { value: 'Facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-800' },
  { value: 'Instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { value: 'TikTok', label: 'TikTok', icon: Instagram, color: 'text-black' },
];

export const contentTypes = [
  { value: 'tip', label: 'Korisni savjet' },
  { value: 'case-study', label: 'Studija slučaja' },
  { value: 'news', label: 'Novosti' },
  { value: 'promotional', label: 'Promocijski sadržaj' },
  { value: 'educational', label: 'Edukacijski sadržaj' },
  { value: 'behind-scenes', label: 'Iza kulisa' },
];

export const industries = [
  { value: 'praone', label: 'Profesionalne praone rublja' },
  { value: 'ugostiteljstvo', label: 'Ugostiteljstvo i turizam' },
  { value: 'zdravstvo', label: 'Zdravstvo i medicina' },
  { value: 'obrazovanje', label: 'Obrazovanje' },
  { value: 'tehnologija', label: 'Tehnologija i IT' },
  { value: 'retail', label: 'Maloprodaja' },
  { value: 'proizvodnja', label: 'Proizvodnja' },
  { value: 'usluge', label: 'Poslovne usluge' },
  { value: 'nekretnine', label: 'Nekretnine' },
  { value: 'fitness', label: 'Fitness i wellness' },
  { value: 'općenito', label: 'Općenito poslovanje' },
];

export const aiProviders = [
  { value: 'openai', label: 'OpenAI GPT', placeholder: 'sk-...', docs: 'https://platform.openai.com/api-keys' },
  { value: 'gemini', label: 'Google Gemini', placeholder: 'AIza...', docs: 'https://aistudio.google.com/app/apikey' },
];

export const contentFormats = [
  { value: 'text', label: 'Samo tekst' },
  { value: 'text-with-image', label: 'Tekst + AI slika' },
];
