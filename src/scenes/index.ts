import type React from 'react';
import {Area} from './Area';
import {Bond} from './Bond';
import {Brakes} from './Brakes';
import {Conservation} from './Conservation';
import {Conservative} from './Conservative';
import {Currency} from './Currency';
import {Friction} from './Friction';
import {Gravity} from './Gravity';
import {Heat} from './Heat';
import {Home} from './Home';
import {Hook} from './Hook';
import {Hydro} from './Hydro';
import {Kinetic} from './Kinetic';
import {Outro} from './Outro';
import {Power} from './Power';
import {Reaction} from './Reaction';
import {Recap} from './Recap';
import {Roadmap} from './Roadmap';
import {Spring} from './Spring';
import {Strategy} from './Strategy';
import {Suitcase} from './Suitcase';
import {Title} from './Title';
import {Work} from './Work';

// Pemetaan id adegan di naskah → komponen visual.
export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  title: Title,
  roadmap: Roadmap,
  currency: Currency,
  work: Work,
  suitcase: Suitcase,
  area: Area,
  kinetic: Kinetic,
  conservative: Conservative,
  gravity: Gravity,
  spring: Spring,
  conservation: Conservation,
  friction: Friction,
  power: Power,
  strategy: Strategy,
  bond: Bond,
  heat: Heat,
  reaction: Reaction,
  hydro: Hydro,
  brakes: Brakes,
  home: Home,
  recap: Recap,
  outro: Outro,
};
