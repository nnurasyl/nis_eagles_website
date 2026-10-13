export type GovernmentMember = {id: string; name: string | null; role: string; icon: 'code' | 'globe' | 'media' | 'culture' | 'education' | 'shield' | 'sport' | 'ecology' | 'finance'};
export const PRESIDENT = {name: 'Тоқтанәлі Айша', role: 'President'};
export const LEADERSHIP = [
  {name: 'Айдынұлы Болат', role: 'Vice President'},
  {name: 'Разах Аружан', role: 'Speaker of Student Council'},
  {name: 'Спандияр Арайлым', role: 'Secretary'},
];
export const MINISTRIES: GovernmentMember[] = [
  {id: 'it', name: 'Құрманғали Нұрасыл', role: 'IT minister', icon: 'code'},
  {id: 'external', name: 'Сейтбек Ақбаян', role: 'Сыртқы саясат және еріктілік министрі', icon: 'globe'},
  {id: 'media', name: 'Берекетова Анель', role: 'БАҚ министрі', icon: 'media'},
  {id: 'culture', name: 'Әбдіқаш Кәусар', role: 'Мәдениет және қоғам министрі', icon: 'culture'},
  {id: 'education', name: 'Асылхан Айсұлу', role: 'Білім және ғылым министрі', icon: 'education'},
  {id: 'internal', name: 'Бекбай Айзере', role: 'Ішкі істер министрі', icon: 'shield'},
  {id: 'sport', name: 'Капиз Даниал', role: 'Спорт және салауатты өмір министрі', icon: 'sport'},
  {id: 'ecology', name: null, role: 'Экология министрі', icon: 'ecology'},
  {id: 'finance', name: 'Әбдіқайым Гүлжауһар', role: 'Қаржы министрі', icon: 'finance'},
];
