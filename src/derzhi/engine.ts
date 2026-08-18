/** Pure daily-run engine — no React. One file so Node tests can import it. */

export function moscowDateISO(at: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);
}

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function formatRuDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const months = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];
  return `${d} ${months[(m ?? 1) - 1]} ${y}`;
}

export function formatDotDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export function shiftISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export type TrapTone = 'mom' | 'money' | 'love' | 'work' | 'fomo' | 'system';

export type Trap = {
  id: string;
  from: string;
  title: string;
  body: string;
  tone: TrapTone;
};

export type TimedTrap = Trap & { atMs: number };

export const TRAP_CATALOG: Trap[] = [
  { id: 'mom-1', from: 'Мама', title: 'Мама', body: 'Ты где????? ответь', tone: 'mom' },
  { id: 'mom-2', from: 'Мама', title: 'Мама', body: 'Я положила деньги. Не трать на ерунду', tone: 'mom' },
  { id: 'mom-3', from: 'Мама', title: 'Мама', body: 'Почему трубку не берёшь', tone: 'mom' },
  { id: 'mom-4', from: 'Мама', title: 'Мама', body: 'Бабушка спрашивает когда приедешь', tone: 'mom' },
  { id: 'dad-1', from: 'Папа', title: 'Папа', body: 'Переведи за интернет', tone: 'mom' },
  { id: 'bank-1', from: 'Сбер', title: 'Списание', body: '−47 890 ₽ · супермаркет', tone: 'money' },
  { id: 'bank-2', from: 'Тинькофф', title: 'Карта заблокирована', body: 'Подтверди операцию в приложении', tone: 'money' },
  { id: 'bank-3', from: 'Банк', title: 'Код', body: 'Код: 1842. Никому не сообщай', tone: 'money' },
  { id: 'bank-4', from: 'Ozon', title: 'Оплата не прошла', body: 'Заказ сейчас отменят', tone: 'money' },
  { id: 'bank-5', from: 'Налоги', title: 'Задолженность', body: 'Есть начисление. Открой', tone: 'money' },
  { id: 'love-1', from: 'Бывший', title: 'Бывший', body: 'Написал', tone: 'love' },
  { id: 'love-2', from: 'Бывшая', title: 'Бывшая', body: 'Печатает…', tone: 'love' },
  { id: 'love-3', from: 'Он', title: 'Он', body: 'Смотрел твои сторис 3 раза', tone: 'love' },
  { id: 'love-4', from: 'Она', title: 'Она', body: 'Скинула геолокацию', tone: 'love' },
  { id: 'love-5', from: 'Telegram', title: 'голосовое', body: '0:47 · от человека, которого ты ждёшь', tone: 'love' },
  { id: 'love-6', from: 'Матч', title: 'Матч', body: 'Вы понравились друг другу', tone: 'love' },
  { id: 'work-1', from: 'Начальник', title: 'Начальник', body: 'Ты где, созвон уже идёт', tone: 'work' },
  { id: 'work-2', from: 'Работа', title: 'Календарь', body: 'Встреча через 1 мин', tone: 'work' },
  { id: 'work-3', from: 'HR', title: 'HR', body: 'Нужен ответ сегодня. Это важно', tone: 'work' },
  { id: 'work-4', from: 'Slack', title: 'Slack', body: '@you в треде на 40 сообщений', tone: 'work' },
  { id: 'work-5', from: 'Клиент', title: 'Клиент', body: 'Горит. Можно на 5 минут?', tone: 'work' },
  { id: 'fomo-1', from: 'Чат', title: 'Общий чат', body: '999+ непрочитанных. Тебя обсуждают', tone: 'fomo' },
  { id: 'fomo-2', from: 'Stories', title: 'Stories', body: 'Все уже там. Тебя нет', tone: 'fomo' },
  { id: 'fomo-3', from: 'Instagram', title: 'Прямой эфир', body: 'кто-то кого ты знаешь · 12k смотрят', tone: 'fomo' },
  { id: 'fomo-4', from: 'Друг', title: 'Друг', body: 'ты видел что она выложила????', tone: 'fomo' },
  { id: 'fomo-5', from: 'TikTok', title: 'TikTok', body: 'ролик про тебя. 80к просмотров', tone: 'fomo' },
  { id: 'sys-1', from: 'iPhone', title: 'Заряд 3%', body: 'Осталось 8 минут', tone: 'system' },
  { id: 'sys-2', from: 'Система', title: 'Face ID', body: 'Не удалось. Повторите', tone: 'system' },
  { id: 'sys-3', from: 'Доставка', title: 'Курьер', body: 'Я уже у двери. Открой', tone: 'system' },
  { id: 'sys-4', from: 'WhatsApp', title: 'WhatsApp', body: 'видеозвонок…', tone: 'system' },
  { id: 'sys-5', from: 'Почта', title: 'Пароль', body: 'Кто-то вошёл в аккаунт', tone: 'system' },
  { id: 'sys-6', from: 'Find My', title: 'Find My', body: 'Наушник остался в кафе', tone: 'system' },
  { id: 'sys-7', from: 'Календарь', title: 'День рождения', body: 'Сегодня. Ты ничего не отправил', tone: 'system' },
  { id: 'sys-8', from: 'Авиа', title: 'Регистрация', body: 'Закроется через 12 минут', tone: 'system' },
  { id: 'sys-9', from: 'Госуслуги', title: 'Госуслуги', body: 'Новое письмо. Срок сегодня', tone: 'system' },
  { id: 'sys-10', from: 'App Store', title: 'Подписка', body: 'Спишется 2 490 ₽ через час', tone: 'system' },
];

const TONE_GAP: Record<TrapTone, number> = {
  mom: 0,
  money: 1,
  love: 2,
  work: 3,
  fomo: 4,
  system: 5,
};

export function buildDailyDeck(rng: () => number, count = 10): TimedTrap[] {
  const bag = [...TRAP_CATALOG];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  const picked = bag.slice(0, count);
  let t = 1600 + rng() * 400;
  return picked.map((trap, i) => {
    const next: TimedTrap = { ...trap, atMs: Math.round(t) };
    t += 1150 * Math.pow(0.9, i) + rng() * 280 + TONE_GAP[trap.tone] * 20;
    return next;
  });
}

export const WIN_PAD_MS = 2800;
export const HARD_CAP_MS = 90000;

export type DailyRun = {
  dateISO: string;
  deck: TimedTrap[];
  winMs: number;
};

export function dailyRun(at: Date = new Date()): DailyRun {
  const dateISO = moscowDateISO(at);
  const rng = mulberry32(hashString(`derzhi:${dateISO}:v1`));
  const deck = buildDailyDeck(rng, 10);
  const last = deck.length ? deck[deck.length - 1].atMs : 0;
  const winMs = Math.min(HARD_CAP_MS, last + WIN_PAD_MS);
  return { dateISO, deck, winMs };
}

export function survivedCount(deck: TimedTrap[], elapsedMs: number): number {
  return deck.filter((t) => elapsedMs > t.atMs + 80).length;
}

export function formatTime(ms: number): string {
  const s = Math.max(0, ms) / 1000;
  return s.toFixed(1).replace('.', ',');
}

export function shareGrid(deck: TimedTrap[], elapsedMs: number, won: boolean): string {
  let deathPlaced = false;
  return deck
    .map((t) => {
      if (elapsedMs < t.atMs) return '⬜';
      if (!won && !deathPlaced && elapsedMs < t.atMs + 900) {
        deathPlaced = true;
        return '💀';
      }
      return '🟩';
    })
    .join('');
}

export function buildShare(opts: {
  dateISO: string;
  ms: number;
  won: boolean;
  killer?: string;
  deck: TimedTrap[];
  url?: string;
}): string {
  const grid = shareGrid(opts.deck, opts.ms, opts.won);
  const head = `ДЕРЖИ ${formatDotDate(opts.dateISO)}`;
  const time = `${formatTime(opts.ms)} сек`;
  const tail = opts.won ? 'не отпустил.' : `сорвался: ${opts.killer ?? 'палец'}`;
  const url = opts.url ?? 'https://ramza107.github.io/Tamagochi/';
  return `${head}\n${time}\n${grid}\n${tail}\n${url}`;
}
