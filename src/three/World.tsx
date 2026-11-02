// Composition of the single persistent 3D world. Each child owns one part of the journey and reads
// scrollState / stores itself, so React never re-renders this tree on scroll.
import { Atmosphere } from './Atmosphere';
import { BuildStructure } from './BuildStructure';
import { CameraRig } from './CameraRig';
import { DefenseNetwork } from './DefenseNetwork';
import { Effects } from './Effects';
import { Gate } from './Gate';
import { HorizonGate } from './HorizonGate';
import { ParticleField } from './ParticleField';
import { ServiceConstellation } from './ServiceConstellation';
import { ThreatArcs } from './ThreatArcs';

export function World() {
  return (
    <>
      <CameraRig />
      <Atmosphere />
      <Gate />
      <ParticleField />
      <ThreatArcs />
      <DefenseNetwork />
      <ServiceConstellation />
      <BuildStructure />
      <HorizonGate />
      <Effects />
    </>
  );
}
