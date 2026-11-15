import {
  BookOpen,
  Briefcase,
  Calculator,
  Compass,
  FileSpreadsheet,
  Globe,
  Landmark,
  Linkedin,
  Mail,
  Phone,
  Receipt,
  Scale,
  ShieldCheck,
  TrendingUp,
  Share2,
} from 'lucide-react';

export function renderSkillIcon(iconKey: string, className = 'w-5 h-5') {
  switch (iconKey) {
    case 'Landmark':
      return <Landmark className={className} />;
    case 'Scale':
      return <Scale className={className} />;
    case 'FileSpreadsheet':
      return <FileSpreadsheet className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'Receipt':
      return <Receipt className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'Calculator':
      return <Calculator className={className} />;
    case 'TrendingUp':
      return <TrendingUp className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    default:
      return <Briefcase className={className} />;
  }
}

export function renderSocialIcon(platform: string, className = 'w-4 h-4') {
  const key = platform.toLowerCase();
  if (key.includes('mail')) return <Mail className={className} />;
  if (key.includes('phone') || key.includes('call') || key.includes('whatsapp')) {
    return <Phone className={className} />;
  }
  if (key.includes('linkedin')) return <Linkedin className={className} />;
  if (key.includes('web') || key.includes('site') || key.includes('portfolio')) {
    return <Globe className={className} />;
  }
  return <Share2 className={className} />;
}

export const SKILL_ICON_OPTIONS = [
  'Landmark',
  'Scale',
  'FileSpreadsheet',
  'BookOpen',
  'Receipt',
  'Compass',
  'Calculator',
  'TrendingUp',
  'ShieldCheck',
  'Briefcase',
] as const;
