export interface LanguageItem {
  language: string;
  level: string;
}

export interface PortfolioProfile {
  full_name: string;
  title_line: string;
  headline: string;
  short_intro: string;
  profession: string;
  about_location: string;
  about_description: string;
  profile_image_url: string;
  contact_email: string;
  contact_phone: string;
  contact_location: string;
  languages: LanguageItem[];
  interests: string[];
  cv_filename: string;
  has_custom_cv: boolean;
  cv_updated_at: string;
  updated_at: string;
}

export interface SkillItem {
  id: number;
  name: string;
  category: string;
  description: string;
  icon_key: string;
  focus_label: string;
  sort_order: number;
}

export interface ExperienceItem {
  id: number;
  role: string;
  company: string;
  period: string;
  location: string;
  responsibilities: string[];
  is_current: boolean;
  sort_order: number;
}

export interface EducationItem {
  id: number;
  degree: string;
  institution: string;
  university: string;
  period: string;
  cgpa: string;
  sort_order: number;
}

export interface CertificationItem {
  id: number;
  title: string;
  issuer: string;
  period: string;
  credential_note: string;
  sort_order: number;
}

export interface SocialLinkItem {
  id: number;
  platform: string;
  label: string;
  url: string;
  sort_order: number;
}

export interface PortfolioData {
  profile: PortfolioProfile;
  skills: SkillItem[];
  experiences: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  socialLinks: SocialLinkItem[];
}

export interface ContactMessageItem {
  id: number;
  sender_name: string;
  sender_email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  created_at: string;
}

export interface ActivityLogItem {
  id: number;
  action: string;
  details: string;
  actor: string;
  created_at: string;
}

export interface AdminOverviewData {
  stats: {
    totalVisitors: number;
    todayVisitors: number;
    totalMessages: number;
    unreadMessages: number;
    skillsCount: number;
    expCount: number;
    certCount: number;
    eduCount: number;
  };
  visitorTrend: Array<{ day: string; visits: number }>;
  recentActivities: ActivityLogItem[];
}

export interface AdminUser {
  id: number;
  username?: string;
  email: string;
  role: string;
  full_name: string;
}
