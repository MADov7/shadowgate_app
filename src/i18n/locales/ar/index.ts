// Namespace registry — builder agents only edit their own namespace files, not this one.
import { commonAr } from './common';
import { navAr } from './nav';
import { welcomeAr } from './welcome';
import { heroAr } from './hero';
import { radarAr } from './radar';
import { layersAr } from './layers';
import { simulationAr } from './simulation';
import { quizAr } from './quiz';
import { constellationAr } from './constellation';
import { catalogAr } from './catalog';
import { detailsAr } from './details';
import { basketAr } from './basket';
import { packagesAr } from './packages';
import { buildAr } from './build';
import { personalAr } from './personal';
import { bookingAr } from './booking';
import { contactAr } from './contact';
import { brandAr } from './brand';
import { footerAr } from './footer';
import { shopAr } from './shop';
import { authAr } from './auth';

export const ar = {
  common: commonAr,
  nav: navAr,
  welcome: welcomeAr,
  hero: heroAr,
  radar: radarAr,
  layers: layersAr,
  simulation: simulationAr,
  quiz: quizAr,
  constellation: constellationAr,
  catalog: catalogAr,
  details: detailsAr,
  basket: basketAr,
  packages: packagesAr,
  build: buildAr,
  personal: personalAr,
  booking: bookingAr,
  contact: contactAr,
  brand: brandAr,
  footer: footerAr,
  shop: shopAr,
  auth: authAr,
};
