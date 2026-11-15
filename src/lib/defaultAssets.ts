import navyBackdropImg from '@/src/assets/images/navy_ledger_backdrop_1794713226553.jpg';

export const USER_PROFILE_PHOTO_PATH = '/assets/aistudio/Gemini_Generated_Image_559a2245.jpeg';

export function resolveProfileImage(url?: string): string {
  if (!url || url === 'default:portrait') {
    return USER_PROFILE_PHOTO_PATH;
  }
  return url;
}

export const defaultBackdropImage = navyBackdropImg;
export const defaultPortraitImage = USER_PROFILE_PHOTO_PATH;
