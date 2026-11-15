import navyBackdropImg from '@/src/assets/images/navy_ledger_backdrop_1794713226553.jpg';

const baseUrl = import.meta.env.BASE_URL || './';
const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

export const USER_PROFILE_PHOTO_PATH = `${normalizedBase}assets/aistudio/Gemini_Generated_Image_559a2245.jpeg`;

export function resolveProfileImage(url?: string): string {
  if (!url || url === 'default:portrait') {
    return USER_PROFILE_PHOTO_PATH;
  }
  return url;
}

export const defaultBackdropImage = navyBackdropImg;
export const defaultPortraitImage = USER_PROFILE_PHOTO_PATH;
