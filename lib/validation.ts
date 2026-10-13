export const SCHOOL_DOMAIN = 'hbalm.nis.edu.kz';
export const CATEGORIES = ['Creative', 'Academic', 'Technology', 'Sports', 'Community'] as const;
export type Category = typeof CATEGORIES[number];
export function normalizeEmail(value: string) { return value.trim().toLowerCase(); }
export function isSchoolEmail(value: string) { return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@hbalm\.nis\.edu\.kz$/i.test(value.trim()); }
export function isValidEmail(value: string) {
  const email=normalizeEmail(value);
  if(email.length>254)return false;
  const parts=email.split('@');if(parts.length!==2)return false;
  const [local,domain]=parts;
  if(local.length<1||local.length>64||local.startsWith('.')||local.endsWith('.')||local.includes('..')||!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local))return false;
  const labels=domain.split('.');
  return labels.length>=2&&labels.every(label=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))&&/^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/i.test(labels.at(-1)!);
}
export function normalizePhone(value: string) {return value.trim().replace(/[\s()\-]/g,'');}
export function validContactPhone(value: string) {return /^\+[1-9][0-9]{7,14}$/.test(normalizePhone(value));}
export function validPassword(value: string) { return value.length >= 10 && value.length <= 128; }
export function validateClub(input: {name: string; description: string; category: string; meeting: string}) {
  if (input.name.trim().length < 3 || input.name.trim().length > 60) return 'Use 3–60 characters for your club name.';
  if (input.description.trim().length < 20 || input.description.trim().length > 500) return 'Describe your club in 20–500 characters.';
  if (!CATEGORIES.includes(input.category as Category)) return 'Choose a club category.';
  if (input.meeting.trim().length < 3 || input.meeting.trim().length > 100) return 'Add a meeting time and place in 3–100 characters.';
  return null;
}
