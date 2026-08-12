import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import type { Behavior } from '../logic/behavior';
import type { Equipped } from '../shop/catalog';
import { itemById } from '../shop/catalog';
import { SvgClothes } from './SvgClothes';

type Props = {
  behavior: Behavior;
  stage: 1 | 2 | 3;
  equipped: Equipped;
  size?: number;
};

/**
 * One movable Nuri — articulated SVG, continuous idle motion,
 * behavior gestures (sleep / screen / walk+pebble), cosmetics as layers.
 */
export function LivingNuri({ behavior, stage, equipped, size = 300 }: Props) {
  const breath = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const arm = useRef(new Animated.Value(0)).current;
  const kick = useRef(new Animated.Value(0)).current;
  const pebble = useRef(new Animated.Value(0)).current;
  const zzz = useRef(new Animated.Value(0)).current;
  const nod = useRef(new Animated.Value(0)).current;

  const costume = itemById(equipped.costume);
  const hair = itemById(equipped.hair);
  const accessory = itemById(equipped.accessory);
  const ear = 0.9 + stage * 0.05;

  // continuous life
  useEffect(() => {
    const loops = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(breath, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(breath, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(sway, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(sway, { toValue: 0, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]),
      ),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [breath, pulse, sway]);

  // idle blink + behavior-driven eyes/arms
  useEffect(() => {
    let cancelled = false;
    let blinkTimer: ReturnType<typeof setInterval> | undefined;

    blink.setValue(1);
    arm.setValue(0);
    kick.setValue(0);
    pebble.setValue(0);
    zzz.setValue(0);
    nod.setValue(0);

    if (behavior === 'idle') {
      const doBlink = () => {
        if (cancelled) return;
        Animated.sequence([
          Animated.timing(blink, { toValue: 0.05, duration: 80, useNativeDriver: true }),
          Animated.timing(blink, { toValue: 1, duration: 120, useNativeDriver: true }),
        ]).start();
      };
      blinkTimer = setInterval(doBlink, 3200);

      const wave = Animated.loop(
        Animated.sequence([
          Animated.delay(5000),
          Animated.timing(arm, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.timing(arm, { toValue: -0.4, duration: 160, useNativeDriver: true }),
          Animated.timing(arm, { toValue: 1, duration: 160, useNativeDriver: true }),
          Animated.timing(arm, { toValue: 0, duration: 180, useNativeDriver: true }),
          Animated.delay(4000),
        ]),
      );
      wave.start();
      return () => {
        cancelled = true;
        clearInterval(blinkTimer);
        wave.stop();
      };
    }

    if (behavior === 'sleepy') {
      blink.setValue(0.25);
      const sleepAnim = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(nod, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(nod, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(zzz, { toValue: 1, duration: 1400, useNativeDriver: true }),
            Animated.timing(zzz, { toValue: 0, duration: 1400, useNativeDriver: true }),
          ]),
        ]),
      );
      sleepAnim.start();
      return () => {
        cancelled = true;
        sleepAnim.stop();
      };
    }

    if (behavior === 'screen') {
      // rapid blink then hold eyes nearly closed
      const screenAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(blink, { toValue: 0.1, duration: 70, useNativeDriver: true }),
          Animated.timing(blink, { toValue: 0.85, duration: 90, useNativeDriver: true }),
          Animated.timing(blink, { toValue: 0.1, duration: 70, useNativeDriver: true }),
          Animated.timing(blink, { toValue: 0.85, duration: 90, useNativeDriver: true }),
          Animated.timing(blink, { toValue: 0.08, duration: 200, useNativeDriver: true }),
          Animated.delay(1600),
          Animated.timing(blink, { toValue: 0.7, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ]),
      );
      screenAnim.start();
      return () => {
        cancelled = true;
        screenAnim.stop();
      };
    }

    // walk — kick pebble
    const walkAnim = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.parallel([
          Animated.timing(kick, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(pebble, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.timing(kick, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(pebble, { toValue: 0, duration: 1, useNativeDriver: true }),
        Animated.delay(1600),
      ]),
    );
    walkAnim.start();
    return () => {
      cancelled = true;
      walkAnim.stop();
    };
  }, [arm, behavior, blink, kick, nod, pebble, zzz]);

  const bodyScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });
  const swayX = sway.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] });
  const nodY = nod.interpolate({ inputRange: [0, 1], outputRange: [0, 6] });
  const armRot = arm.interpolate({ inputRange: [-1, 0, 1], outputRange: ['20deg', '0deg', '-55deg'] });
  const legRot = kick.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-40deg'] });
  const pebbleX = pebble.interpolate({ inputRange: [0, 1], outputRange: [0, 70] });
  const pebbleY = pebble.interpolate({ inputRange: [0, 1], outputRange: [0, -28] });
  const pebbleOp = pebble.interpolate({ inputRange: [0, 0.15, 1], outputRange: [1, 1, 0.15] });
  const heartScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const zOpacity = zzz.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const zY = zzz.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });

  // eye open as scaleY on pupils group — blink value 0..1
  const eyeScaleY = blink;

  const moss = behavior === 'sleepy' ? '#7E8F82' : behavior === 'screen' ? '#6F8A78' : '#6F9B72';
  const mossDeep = '#3F5A44';
  const core = behavior === 'sleepy' ? '#D4A36A' : '#E8A24A';

  return (
    <View style={{ width: size, height: size + 24, alignItems: 'center' }}>
      <Animated.View
        style={{
          width: size,
          height: size,
          transform: [{ translateX: swayX }, { translateY: nodY }, { scale: bodyScale }],
        }}
      >
        <Svg width={size} height={size} viewBox="0 0 260 260">
          <Defs>
            <RadialGradient id="fur" cx="38%" cy="30%" r="70%">
              <Stop offset="0%" stopColor={moss} />
              <Stop offset="100%" stopColor={mossDeep} />
            </RadialGradient>
            <RadialGradient id="core" cx="50%" cy="40%" r="65%">
              <Stop offset="0%" stopColor="#FFF1C8" />
              <Stop offset="55%" stopColor={core} />
              <Stop offset="100%" stopColor={core} stopOpacity="0.35" />
            </RadialGradient>
          </Defs>

          {/* ground shadow */}
          <Ellipse cx={130} cy={232} rx={48} ry={8} fill="#243028" opacity={0.18} />

          {/* petal ears */}
          <Ellipse cx={86} cy={78} rx={18 * ear} ry={30 * ear} fill={moss} transform="rotate(-26 86 78)" />
          <Ellipse cx={174} cy={78} rx={18 * ear} ry={30 * ear} fill={moss} transform="rotate(26 174 78)" />
          <Ellipse cx={86} cy={82} rx={8 * ear} ry={14 * ear} fill={core} opacity={0.35} transform="rotate(-26 86 82)" />
          <Ellipse cx={174} cy={82} rx={8 * ear} ry={14 * ear} fill={core} opacity={0.35} transform="rotate(26 174 82)" />

          {/* left arm (wave) — approximated via rotated ellipse group using native driver wrapper outside for arm */}
          <Ellipse cx={58} cy={150} rx={14} ry={22} fill={moss} />
          <Ellipse cx={202} cy={150} rx={14} ry={22} fill={moss} />

          {/* body */}
          <Ellipse cx={130} cy={140} rx={78} ry={72} fill="url(#fur)" />
          <Ellipse cx={108} cy={118} rx={24} ry={14} fill="#FFFFFF" opacity={0.16} />

          {/* feet */}
          <Ellipse cx={108} cy={205} rx={16} ry={10} fill={mossDeep} />
          {/* right foot kicks — drawn static in svg; kick motion via overlay view */}
          <Ellipse cx={152} cy={205} rx={16} ry={10} fill={mossDeep} />

          {/* eyes */}
          <G>
            <Ellipse cx={108} cy={128} rx={9} ry={11} fill="#1C271F" />
            <Ellipse cx={152} cy={128} rx={9} ry={11} fill="#1C271F" />
          </G>

          {/* mouth */}
          {behavior === 'sleepy' ? (
            <Ellipse cx={130} cy={158} rx={7} ry={5} fill="#1C271F" opacity={0.7} />
          ) : behavior === 'walk' ? (
            <Path d="M118 156 Q130 168 142 156" stroke="#1C271F" strokeWidth={3} fill="none" strokeLinecap="round" />
          ) : (
            <Path d="M122 158 Q130 164 138 158" stroke="#1C271F" strokeWidth={2.5} fill="none" strokeLinecap="round" />
          )}

          {/* amber heart */}
          <Circle cx={130} cy={182} r={20 + stage} fill="url(#core)" />
          <Circle cx={123} cy={175} r={6} fill="#FFFFFF" opacity={0.4} />
        </Svg>

        {/* eyelid overlay using animated opacity black bars via Views for blink scale */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.eyeMask,
            {
              left: size * 0.33,
              top: size * 0.42,
              opacity: eyeScaleY.interpolate({ inputRange: [0, 1], outputRange: [0.92, 0] }),
              transform: [{ scaleY: eyeScaleY.interpolate({ inputRange: [0, 1], outputRange: [1, 0.15] }) }],
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.eyeMask,
            {
              left: size * 0.5,
              top: size * 0.42,
              opacity: eyeScaleY.interpolate({ inputRange: [0, 1], outputRange: [0.92, 0] }),
              transform: [{ scaleY: eyeScaleY.interpolate({ inputRange: [0, 1], outputRange: [1, 0.15] }) }],
            },
          ]}
        />

        {/* waving arm accent */}
        <Animated.View
          style={[
            styles.waveArm,
            {
              left: size * 0.72,
              top: size * 0.45,
              transform: [{ rotate: armRot }],
              backgroundColor: moss,
            },
          ]}
        />

        {/* kicking foot + pebble */}
        <Animated.View
          style={[
            styles.kickFoot,
            {
              left: size * 0.52,
              top: size * 0.74,
              backgroundColor: mossDeep,
              transform: [{ rotate: legRot }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pebble,
            {
              left: size * 0.62,
              top: size * 0.78,
              opacity: pebbleOp,
              transform: [{ translateX: pebbleX }, { translateY: pebbleY }],
            },
          ]}
        />

        {/* heart pulse halo */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.halo,
            {
              width: size * 0.18,
              height: size * 0.18,
              borderRadius: size * 0.09,
              left: size * 0.41,
              top: size * 0.63,
              backgroundColor: core,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.3] }),
              transform: [{ scale: heartScale }],
            },
          ]}
        />

        {/* Zzz */}
        {behavior === 'sleepy' && (
          <Animated.View style={[styles.zzz, { opacity: zOpacity, transform: [{ translateY: zY }] }]}>
            <Svg width={60} height={40}>
              <SvgText x="8" y="28" fill="#5A6B5E" fontSize="18" fontWeight="700">
                z z
              </SvgText>
            </Svg>
          </Animated.View>
        )}

        {/* cosmetics layers */}
        {[costume, hair, accessory].filter(Boolean).map((item) => {
          if (!item) return null;
          const box = {
            position: 'absolute' as const,
            left: size * item.layout.x,
            top: size * item.layout.y,
            width: size * item.layout.w,
            height: size * item.layout.h,
          };
          if (item.render === 'png' && item.asset) {
            return <Image key={item.id} source={item.asset} style={box} resizeMode="contain" />;
          }
          if (item.render === 'svg' && item.svg) {
            return (
              <View key={item.id} style={box} pointerEvents="none">
                <SvgClothes id={item.svg} width={box.width} height={box.height} />
              </View>
            );
          }
          return null;
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  eyeMask: {
    position: 'absolute',
    width: 28,
    height: 18,
    borderRadius: 10,
    backgroundColor: '#5F7A63',
  },
  waveArm: {
    position: 'absolute',
    width: 18,
    height: 34,
    borderRadius: 12,
    transformOrigin: 'bottom center',
  },
  kickFoot: {
    position: 'absolute',
    width: 22,
    height: 14,
    borderRadius: 10,
    transformOrigin: 'left center',
  },
  pebble: {
    position: 'absolute',
    width: 12,
    height: 10,
    borderRadius: 6,
    backgroundColor: '#8A8478',
  },
  halo: { position: 'absolute' },
  zzz: { position: 'absolute', right: 18, top: 36 },
});
