import { Pressable } from 'react-native';
import type { Behavior } from '../logic/behavior';
import type { Equipped } from '../shop/catalog';
import { LivingNuri } from './LivingNuri';

type Props = {
  behavior: Behavior;
  stage: 1 | 2 | 3;
  equipped: Equipped;
  size?: number;
};

/** Public pet API — one living character, cosmetics layered on top. */
export function NuriPet(props: Props) {
  return (
    <Pressable>
      <LivingNuri {...props} />
    </Pressable>
  );
}
