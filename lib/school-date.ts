import {LOCALES,type Language} from './i18n';
const months=['қаңтар','ақпан','наурыз','сәуір','мамыр','маусым','шілде','тамыз','қыркүйек','қазан','қараша','желтоқсан'];
const shortMonths=['қаң','ақп','нау','сәу','мам','мау','шіл','там','қыр','қаз','қар','жел'];
function parts(value:string){return Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Almaty',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',numberingSystem:'latn'}).formatToParts(new Date(value)).map(x=>[x.type,x.value]));}
// Some Chromium builds lack Kazakh month names and return placeholders like "M11".
export function schoolDate(value:string,language:Language){
  if(language!=='kk')return new Intl.DateTimeFormat(LOCALES[language],{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Almaty'}).format(new Date(value));
  const p=parts(value);return `${Number(p.day)} ${months[Number(p.month)-1]} ${p.year} · ${p.hour}:${p.minute}`;
}
export function schoolMonth(value:string,language:Language){return language==='kk'?shortMonths[Number(parts(value).month)-1]:new Intl.DateTimeFormat(LOCALES[language],{month:'short',timeZone:'Asia/Almaty'}).format(new Date(value));}
export function schoolDay(value:string){return parts(value).day;}
export function schoolTime(value:string){const p=parts(value);return `${p.hour}:${p.minute}`;}
