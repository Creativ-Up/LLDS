import type { StopService } from '@llds/shared';
import type { StaticImageData } from 'next/image';

import cafe from '@llds/assets/icons/service-cafe.svg';
import gare from '@llds/assets/icons/service-gare-sncb.svg';
import info from '@llds/assets/icons/service-info.svg';
import parking from '@llds/assets/icons/service-parking.svg';
import patrimoine from '@llds/assets/icons/service-patrimoine.svg';
import remise from '@llds/assets/icons/service-remise.svg';
import restaurant from '@llds/assets/icons/service-restaurant.svg';

/** Icônes des services (assets/icons). Le « B » dans un anneau est la gare SNCB, les bâtiments le patrimoine. */
export const SERVICE_ICONS: Record<StopService, StaticImageData> = {
  cafe,
  parking,
  info,
  restaurant,
  gare,
  patrimoine,
  remise,
};
