import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';
import type { SvgOverlayId } from '../shop/catalog';

type Props = {
  id: SvgOverlayId;
  width: number;
  height: number;
};

/** Procedural clothes that sit on the one base Nuri body. */
export function SvgClothes({ id, width, height }: Props) {
  if (id === 'hoodie') {
    return (
      <Svg width={width} height={height} viewBox="0 0 200 160">
        <Defs>
          <LinearGradient id="hood" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#F4E7D4" />
            <Stop offset="100%" stopColor="#E2CDB3" />
          </LinearGradient>
        </Defs>
        <Path
          d="M28 48 C40 18 160 18 172 48 L178 140 C150 152 50 152 22 140 Z"
          fill="url(#hood)"
        />
        <Path
          d="M55 42 C70 28 130 28 145 42"
          fill="none"
          stroke="#D9C2A4"
          strokeWidth={6}
          strokeLinecap="round"
        />
        <Ellipse cx={100} cy={78} rx={34} ry={18} fill="#F8F0E4" opacity={0.55} />
        <Path d="M88 70 L100 92 L112 70" fill="none" stroke="#C9AE8F" strokeWidth={3} strokeLinecap="round" />
      </Svg>
    );
  }

  if (id === 'cape') {
    return (
      <Svg width={width} height={height} viewBox="0 0 220 180">
        <Defs>
          <LinearGradient id="cape" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#D97845" />
            <Stop offset="55%" stopColor="#B84F2C" />
            <Stop offset="100%" stopColor="#7A3A22" />
          </LinearGradient>
        </Defs>
        <Path
          d="M40 36 C70 18 150 18 180 36 C200 70 210 140 198 168 C150 150 70 150 22 168 C10 140 20 70 40 36 Z"
          fill="url(#cape)"
        />
        <Path d="M70 50 C90 70 110 70 130 52" fill="none" stroke="#F0B27A" strokeWidth={4} opacity={0.5} />
        <Path d="M55 90 C80 110 120 112 155 88" fill="none" stroke="#8C3F24" strokeWidth={3} opacity={0.35} />
      </Svg>
    );
  }

  // beanie
  return (
    <Svg width={width} height={height} viewBox="0 0 180 120">
      <Defs>
        <LinearGradient id="bean" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#E8C99A" />
          <Stop offset="100%" stopColor="#B8894E" />
        </LinearGradient>
      </Defs>
      <Path d="M30 70 C35 25 145 25 150 70 C120 82 60 82 30 70 Z" fill="url(#bean)" />
      <Ellipse cx={90} cy={72} rx={62} ry={14} fill="#C9A06A" />
      <Ellipse cx={90} cy={28} rx={10} ry={12} fill="#8C5A2B" />
      <Path d="M90 18 C98 8 108 10 110 18" fill="none" stroke="#6E421C" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}
