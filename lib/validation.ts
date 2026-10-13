export const SCHOOL_DOMAIN = 'hbalm.nis.edu.kz';
export const CATEGORIES = ['Creative', 'Academic', 'Technology', 'Sports', 'Community'] as const;
export type Category = typeof CATEGORIES[number];
export function normalizeEmail(value: string) { return value.trim().toLowerCase(); }
export function isSchoolEmail(value: string) { return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@hbalm\.nis\.edu\.kz$/i.test(value.trim()); }
export function validPassword(value: string) { return value.length >= 10 && value.length <= 128; }
export function validateClub(input: {name: string; description: string; category: string; meeting: string}) {
  if (input.name.trim().length < 3 || input.name.trim().length > 60) return 'Use 3–60 characters for your club name.';
  if (input.description.trim().length < 20 || input.description.trim().length > 500) return 'Describe your club in 20–500 characters.';
  if (!CATEGORIES.includes(input.category as Category)) return 'Choose a club category.';
  if (input.meeting.trim().length < 3 || input.meeting.trim().length > 100) return 'Add a meeting time and place in 3–100 characters.';
  return null;
}
