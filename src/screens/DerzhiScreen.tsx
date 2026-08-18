import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  buildShare,
  dailyRun,
  formatRuDate,
  formatTime,
  survivedCount,
  type TimedTrap,
} from '../derzhi/engine';
import { ink } from '../derzhi/palette';
import { shareOrCopy } from '../derzhi/share';
import {
  loadOfficial,
  loadStreak,
  saveOfficial,
  type OfficialResult,
} from '../derzhi/storage';

type Phase = 'boot' | 'idle' | 'live' | 'result';

function buzz(kind: 'start' | 'trap' | 'fail' | 'win') {
  if (Platform.OS === 'web') return;
  const run = async () => {
    try {
      if (kind === 'trap') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (kind === 'fail') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      else if (kind === 'win') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      /* web / missing */
    }
  };
  void run();
}

export function DerzhiScreen() {
  const run = useMemo(() => dailyRun(), []);
  const [phase, setPhase] = useState<Phase>('boot');
  const [streak, setStreak] = useState(0);
  const [official, setOfficial] = useState<OfficialResult | null>(null);
  const [practice, setPractice] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<OfficialResult | null>(null);
  const [shareHint, setShareHint] = useState('');
  const holding = useRef(false);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  const finished = useRef(false);
  const practiceRef = useRef(false);
  const phaseRef = useRef<Phase>('boot');
  const playedTodayRef = useRef(false);
  const currentFromRef = useRef<string | null>(null);
  const startHoldRef = useRef<() => void>(() => undefined);
  const endHoldRef = useRef<() => void>(() => undefined);
  const pulse = useRef(new Animated.Value(1)).current;
  const lastTrapId = useRef<string | null>(null);
  phaseRef.current = phase;

  useEffect(() => {
    let live = true;
    (async () => {
      const [s, o] = await Promise.all([loadStreak(), loadOfficial()]);
      if (!live) return;
      setStreak(s);
      setOfficial(o);
      setPhase('idle');
    })();
    return () => {
      live = false;
    };
  }, [run.dateISO]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.title = 'ДЕРЖИ';
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = 'hidden';
    html.style.height = '100%';
    body.style.overflow = 'hidden';
    body.style.height = '100%';
    body.style.overscrollBehavior = 'none';
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 780, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 780, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const playedToday = official?.dateISO === run.dateISO;
  playedTodayRef.current = playedToday;
  const activeTraps = run.deck.filter((t) => elapsed >= t.atMs);
  const current = activeTraps.length ? activeTraps[activeTraps.length - 1] : null;
  currentFromRef.current = current?.from ?? null;
  const shown = activeTraps.slice(-2);

  const finish = useCallback(
    (ms: number, won: boolean, killer?: string) => {
      if (finished.current) return;
      finished.current = true;
      holding.current = false;
      cancelAnimationFrame(rafRef.current);
      const survived = survivedCount(run.deck, ms);
      const res: OfficialResult = {
        dateISO: run.dateISO,
        ms,
        won,
        killer: won ? undefined : killer,
        survived,
      };
      setElapsed(ms);
      setResult(res);
      setPhase('result');
      buzz(won ? 'win' : 'fail');
      if (!practiceRef.current) {
        void saveOfficial(res, official).then(setStreak);
        setOfficial(res);
      }
    },
    [official, run.dateISO, run.deck],
  );

  const tick = useCallback(() => {
    if (!holding.current) return;
    const ms = performance.now() - startRef.current;
    setElapsed(ms);
    const trap = [...run.deck].reverse().find((t) => ms >= t.atMs) ?? null;
    if (trap && trap.id !== lastTrapId.current) {
      lastTrapId.current = trap.id;
      currentFromRef.current = trap.from;
      buzz('trap');
    }
    if (ms >= run.winMs) {
      finish(run.winMs, true);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [finish, run.deck, run.winMs]);

  const onDown = () => {
    if (phaseRef.current === 'boot' || phaseRef.current === 'result') return;
    if (holding.current) return;
    const isPractice = playedTodayRef.current;
    practiceRef.current = isPractice;
    setPractice(isPractice);
    finished.current = false;
    holding.current = true;
    startRef.current = performance.now();
    lastTrapId.current = null;
    currentFromRef.current = null;
    setElapsed(0);
    setShareHint('');
    setPhase('live');
    buzz('start');
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  const onUp = () => {
    if (!holding.current) return;
    const ms = performance.now() - startRef.current;
    const killer = currentFromRef.current ?? 'палец';
    finish(ms, false, killer);
  };

  startHoldRef.current = onDown;
  endHoldRef.current = onUp;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    let cancelled = false;
    let unbind: (() => void) | undefined;

    const bind = () => {
      if (cancelled) return;
      const el = document.getElementById('derzhi-pad');
      if (!el) {
        requestAnimationFrame(bind);
        return;
      }

      el.style.touchAction = 'none';
      el.style.userSelect = 'none';
      const css = el.style as CSSStyleDeclaration & { webkitTouchCallout?: string; webkitUserSelect?: string };
      css.webkitTouchCallout = 'none';
      css.webkitUserSelect = 'none';

      const down = (e: PointerEvent) => {
        if (e.button != null && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* unsupported */
        }
        const pointerId = e.pointerId;
        startHoldRef.current();
        const release = (ev: PointerEvent) => {
          if (ev.pointerId !== pointerId) return;
          if (ev.type === 'pointercancel' && document.visibilityState === 'visible') return;
          window.removeEventListener('pointerup', release, true);
          window.removeEventListener('pointercancel', release, true);
          endHoldRef.current();
        };
        window.addEventListener('pointerup', release, true);
        window.addEventListener('pointercancel', release, true);
      };
      const blockMenu = (e: Event) => e.preventDefault();
      const onHide = () => {
        if (document.visibilityState === 'hidden') endHoldRef.current();
      };

      el.addEventListener('pointerdown', down);
      el.addEventListener('contextmenu', blockMenu);
      el.addEventListener('selectstart', blockMenu);
      document.addEventListener('visibilitychange', onHide);
      unbind = () => {
        el.removeEventListener('pointerdown', down);
        el.removeEventListener('contextmenu', blockMenu);
        el.removeEventListener('selectstart', blockMenu);
        document.removeEventListener('visibilitychange', onHide);
      };
    };

    bind();
    return () => {
      cancelled = true;
      unbind?.();
    };
  }, []);

  const onShare = async () => {
    const res = result ?? (playedToday ? official : null);
    if (!res) return;
    const text = buildShare({
      dateISO: run.dateISO,
      ms: res.ms,
      won: res.won,
      killer: res.killer,
      deck: run.deck,
    });
    const how = await shareOrCopy(text);
    setShareHint(how === 'copied' ? 'Скопировано. Кинь в чат.' : how === 'shared' ? 'Отправлено.' : '');
  };

  const shownResult = phase === 'result' ? result : playedToday ? official : null;

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <View>
          <Text style={styles.brand}>ДЕРЖИ</Text>
          <Text style={styles.sub}>{formatRuDate(run.dateISO)} · одна колода на всех</Text>
        </View>
        <View style={styles.streakWrap}>
          <Text style={styles.streakNum}>{streak}</Text>
          <Text style={styles.streakLbl}>серия</Text>
        </View>
      </View>

      <Text style={styles.timer}>{formatTime(phase === 'idle' ? 0 : elapsed)}</Text>
      <Text style={styles.timerHint}>
        {phase === 'live' ? 'не отпускай' : phase === 'result' ? resultLine(shownResult) : idleLine(playedToday)}
      </Text>

      <View style={styles.toastCol}>
        {phase === 'live' || phase === 'result'
          ? shown.map((t) => <TrapCard key={t.id} trap={t} active={t.id === current?.id} />)
          : null}
      </View>

      <View
        nativeID="derzhi-pad"
        collapsable={false}
        // @ts-expect-error web host id so pointer capture can bind
        id="derzhi-pad"
        onStartShouldSetResponder={() => Platform.OS !== 'web'}
        onResponderGrant={onDown}
        onResponderRelease={onUp}
        onResponderTerminate={onUp}
        style={[
          styles.pad,
          phase === 'live' && styles.padLive,
          phase === 'result' && styles.padDead,
        ]}
      >
        <Animated.View pointerEvents="none" style={{ transform: [{ scale: pulse }] }}>
          <Text style={[styles.padTitle, phase === 'live' && styles.padTitleLive]}>
            {phase === 'live' ? 'ДЕРЖИ' : 'зажми'}
          </Text>
          <Text style={[styles.padSub, phase === 'live' && styles.padSubLive]}>
            {phase === 'result' ? 'замер окончен' : playedToday && phase === 'idle' ? 'тренировка' : 'и не отпускай'}
          </Text>
        </Animated.View>
      </View>

      {phase === 'result' && shownResult ? (
        <View style={styles.result}>
          <Text style={styles.resultKicker}>{shownResult.won ? 'нервы из стали' : 'сорвался'}</Text>
          <Text style={styles.resultTime}>{formatTime(shownResult.ms)} сек</Text>
          {!shownResult.won ? (
            <Text style={styles.resultKill}>на: {shownResult.killer}</Text>
          ) : (
            <Text style={styles.resultKill}>не отпустил ни одно уведомление</Text>
          )}
          <Pressable onPress={onShare} style={styles.shareBtn}>
            <Text style={styles.shareTxt}>Кинуть результат в чат</Text>
          </Pressable>
          {shareHint ? <Text style={styles.hint}>{shareHint}</Text> : null}
          <Pressable
            onPress={() => {
              finished.current = false;
              setPractice(true);
              setPhase('idle');
              setElapsed(0);
              setResult(null);
            }}
            style={styles.ghostBtn}
          >
            <Text style={styles.ghostTxt}>Ещё раз · тренировка</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.footer}>
          Сегодня у всего интернета одни и те же ловушки. Первый замер — официальный. Потом
          сравниваете сетку, как в Wordle.
        </Text>
      )}
    </View>
  );
}

function idleLine(played: boolean) {
  return played ? 'официальный замер уже сделан' : 'первый зажим сегодня — зачёт';
}

function resultLine(res: OfficialResult | null) {
  if (!res) return '';
  return res.won ? 'прошёл колоду' : `убило: ${res.killer}`;
}

function TrapCard({ trap, active }: { trap: TimedTrap; active: boolean }) {
  return (
    <View style={[styles.toast, active && styles.toastActive]}>
      <Text style={styles.toastFrom}>{trap.from}</Text>
      <Text style={styles.toastBody} numberOfLines={2}>
        {trap.body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ink.bg,
    paddingTop: 28,
    paddingHorizontal: 22,
    paddingBottom: 24,
    alignItems: 'center',
  },
  top: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brand: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 34,
    color: ink.lime,
    letterSpacing: 1.2,
  },
  sub: {
    marginTop: 4,
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: ink.mute,
  },
  streakWrap: { alignItems: 'flex-end' },
  streakNum: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
    color: ink.cream,
  },
  streakLbl: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: ink.mute,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timer: {
    marginTop: 28,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 72,
    lineHeight: 78,
    color: ink.cream,
    fontVariant: ['tabular-nums'],
  },
  timerHint: {
    marginTop: 2,
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: ink.mute,
  },
  toastCol: {
    width: '100%',
    maxWidth: 420,
    minHeight: 128,
    marginTop: 18,
    gap: 8,
    justifyContent: 'flex-end',
  },
  toast: {
    backgroundColor: ink.toast,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    opacity: 0.55,
  },
  toastActive: { opacity: 1 },
  toastFrom: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: ink.toastInk,
  },
  toastBody: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    color: ink.toastInk,
    marginTop: 2,
  },
  pad: {
    marginTop: 18,
    width: 188,
    height: 188,
    borderRadius: 94,
    borderWidth: 3,
    borderColor: ink.lime,
    backgroundColor: ink.limeDim,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
  },
  padLive: {
    backgroundColor: ink.lime,
  },
  padDead: {
    opacity: 0.35,
    borderColor: ink.mute,
  },
  padTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
    color: ink.cream,
  },
  padTitleLive: {
    color: '#14180F',
  },
  padSub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: ink.mute,
    marginTop: 4,
  },
  padSubLive: {
    color: '#2A3218',
  },
  footer: {
    marginTop: 'auto',
    maxWidth: 380,
    textAlign: 'center',
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: ink.mute,
    paddingTop: 20,
  },
  result: {
    marginTop: 18,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  resultKicker: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: ink.lime,
  },
  resultTime: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 40,
    color: ink.cream,
    marginTop: 4,
  },
  resultKill: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 16,
    color: ink.mute,
    marginTop: 4,
    marginBottom: 16,
  },
  shareBtn: {
    width: '100%',
    backgroundColor: ink.lime,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareTxt: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    color: '#14180F',
  },
  ghostBtn: {
    marginTop: 10,
    paddingVertical: 10,
  },
  ghostTxt: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: ink.mute,
  },
  hint: {
    marginTop: 8,
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: ink.lime,
  },
});
