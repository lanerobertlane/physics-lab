// Shared engine for calculation questions, used by Calculation practice and by the
// "Practice questions" tab in the tools. Needs equations-data.js.
// Each equation has a short context and ranges for a set of "free" quantities. The free
// values are chosen at random, the remaining quantity is worked out from the equation,
// then one quantity is hidden and becomes the question.

const PQ = (() => {
  // r(min, max, step): a random multiple of step. list: pick one.
  const r = (min, max, step) => ({ min, max, step });
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function draw(spec) {
    if (Array.isArray(spec)) return pick(spec);
    const n = Math.round((spec.max - spec.min) / spec.step);
    return Number((spec.min + spec.step * Math.floor(Math.random() * (n + 1))).toPrecision(10));
  }

  // Each equation: default ranges for its "free" quantities, and several contexts. A context
  // can replace some of the ranges with values that suit it; ks3: false leaves it out of KS3.
  const G = [9.8];
  const c = (ctx, free = {}, more = {}) => ({ ctx, free, ...more });
  const SETUPS = {
    weight: { free: { m: r(0.2, 60, 0.1), g: G }, contexts: [
      c('An object is hung from a newtonmeter.'),
      c('A bag of shopping is lifted off the floor.', { m: r(1, 15, 0.5) }),
      c('An astronaut stands on the surface of the Moon.', { m: r(60, 150, 1), g: [1.6] }),
      c('A rover drives across the surface of Mars.', { m: r(100, 1000, 10), g: [3.7] }),
      c('A pupil stands on some bathroom scales.', { m: r(30, 90, 1) }),
    ] },
    work: { free: { F: r(5, 400, 5), s: r(0.5, 40, 0.5) }, contexts: [
      c('A box is pushed along the floor.'),
      c('A shopping trolley is pushed across a car park.', { F: r(10, 80, 5), s: r(5, 100, 5) }),
      c('A tractor pulls a trailer across a field.', { F: r(1000, 20000, 500), s: r(10, 500, 10) }),
      c('A cyclist’s brakes bring the bike to a stop.', { F: r(50, 300, 10), s: r(2, 30, 1) }),
      c('A heavy crate is dragged up a ramp.', { F: r(100, 600, 10), s: r(1, 8, 0.5) }),
    ] },
    hooke: { free: { k: r(10, 400, 10), e: r(0.01, 0.25, 0.01) }, contexts: [
      c('A spring is stretched by hanging masses on it.'),
      c('A trampoline is stretched as a gymnast lands on it.', { k: r(2000, 20000, 500), e: r(0.05, 0.5, 0.05) }),
      c('A car’s suspension spring is squashed as a passenger gets in.', { k: r(10000, 60000, 1000), e: r(0.005, 0.05, 0.005) }),
      c('A bungee cord stretches as a jumper falls.', { k: r(50, 300, 10), e: r(5, 25, 1) }),
      c('An elastic band is stretched.', { k: r(20, 200, 10), e: r(0.02, 0.2, 0.01) }),
    ] },
    moment: { free: { F: r(5, 300, 5), d: r(0.05, 1.5, 0.05) }, contexts: [
      c('A force is used to turn a spanner.'),
      c('A door is pushed open at its handle.', { F: r(5, 50, 1), d: r(0.5, 0.9, 0.05) }),
      c('A child sits on one end of a see-saw.', { F: r(200, 500, 10), d: r(0.5, 2, 0.1) }),
      c('A wheelbarrow is lifted at its handles.', { F: r(50, 300, 10), d: r(0.8, 1.5, 0.1) }),
      c('A crowbar is used to lift a heavy rock.', { F: r(100, 600, 20), d: r(0.5, 1.5, 0.1) }),
    ] },
    pressure: { free: { F: r(50, 5000, 50), A: r(0.05, 2, 0.05) }, contexts: [
      c('A crate rests on the ground.'),
      c('A person stands on snow.', { F: r(400, 900, 10), A: r(0.02, 0.08, 0.01) }),
      c('An elephant stands on its four feet.', { F: r(30000, 60000, 1000), A: r(0.4, 1.2, 0.1) }),
      c('A tractor with wide tyres drives over a muddy field.', { F: r(20000, 80000, 1000), A: r(0.5, 2, 0.1) }),
      c('A person stands on a pair of skis.', { F: r(400, 900, 10), A: r(0.2, 0.4, 0.02) }),
    ] },
    speed: { free: { v: r(2, 15, 0.5), t: r(10, 600, 10) }, contexts: [
      c('A cyclist travels at a steady speed.'),
      c('A runner runs a race at a steady speed.', { v: r(4, 9, 0.5), t: r(10, 300, 5) }),
      c('A train travels between two stations.', { v: r(20, 60, 1), t: r(60, 1800, 60) }),
      c('A snail crawls across a path.', { v: r(0.001, 0.005, 0.001), t: r(60, 1200, 60) }),
      c('Sound travels from a firework to someone watching.', { v: [330, 340], t: r(0.5, 5, 0.5) }),
      c('A car drives along a motorway at a steady speed.', { v: r(25, 35, 1), t: r(60, 3600, 60) }),
    ] },
    accel: { free: { dv: r(2, 30, 1), t: r(2, 20, 0.5) }, contexts: [
      c('A car speeds up along a straight road.'),
      c('A sprinter accelerates from the starting blocks.', { dv: r(5, 10, 0.5), t: r(1, 4, 0.5) }),
      c('A plane accelerates along the runway.', { dv: r(50, 90, 5), t: r(20, 60, 5) }),
      c('A cyclist speeds up down a hill.', { dv: r(2, 10, 1), t: r(2, 15, 1) }),
      c('A lift accelerates upwards.', { dv: r(1, 4, 0.5), t: r(1, 4, 0.5) }),
    ] },
    newton2: { free: { m: r(600, 2000, 50), a: r(0.5, 5, 0.5) }, contexts: [
      c('A car accelerates along a straight road.'),
      c('A footballer kicks a ball.', { m: [0.4, 0.45], a: r(50, 300, 10) }),
      c('A lorry pulls away from traffic lights.', { m: r(8000, 40000, 1000), a: r(0.2, 1.5, 0.1) }),
      c('A shopping trolley is pushed.', { m: r(10, 60, 1), a: r(0.2, 2, 0.1) }),
      c('A rocket lifts off from the launch pad.', { m: r(50000, 500000, 10000), a: r(5, 30, 1) }, { ks3: false }),
    ] },
    momentum: { free: { m: r(0.2, 90, 0.1), v: r(1, 30, 0.5) }, contexts: [
      c('An object moves in a straight line.'),
      c('A rugby player runs towards the try line.', { m: r(70, 120, 1), v: r(3, 9, 0.5) }),
      c('A tennis ball is served.', { m: [0.057], v: r(30, 60, 1) }),
      c('A car travels along a road.', { m: r(800, 2000, 50), v: r(5, 30, 1) }),
      c('A bowling ball rolls down the lane.', { m: r(4, 7, 0.5), v: r(5, 9, 0.5) }),
    ] },
    ke: { free: { m: r(40, 100, 1), v: r(2, 10, 0.5) }, contexts: [
      c('A runner is moving at a steady speed.'),
      c('A car drives along a road.', { m: r(800, 2000, 50), v: r(10, 30, 1) }),
      c('A cricket ball is bowled.', { m: [0.16], v: r(20, 40, 1) }),
      c('A skateboarder rolls down a ramp.', { m: r(30, 80, 1), v: r(2, 8, 0.5) }),
      c('A high-speed train travels at its top speed.', { m: r(300000, 700000, 10000), v: r(60, 90, 5) }, { ks3: false }),
    ] },
    gpe: { free: { m: r(0.5, 50, 0.5), g: G, h: r(0.2, 20, 0.1) }, contexts: [
      c('A box is lifted onto a high shelf.'),
      c('A climber climbs up a cliff.', { m: r(50, 90, 1), h: r(5, 100, 1) }),
      c('A roller coaster car is pulled to the top of the first hill.', { m: r(500, 2000, 50), h: r(20, 80, 1) }),
      c('A book is lifted onto a shelf.', { m: r(0.2, 2, 0.1), h: r(0.5, 2, 0.1) }),
      c('Water is stored behind a dam.', { m: r(1000, 100000, 1000), h: r(20, 200, 10) }),
      c('An astronaut lifts a rock on the Moon.', { m: r(1, 20, 1), g: [1.6], h: r(0.5, 2, 0.1) }),
    ] },
    'power-e': { free: { P: r(500, 3000, 100), t: r(30, 300, 10) }, contexts: [
      c('An electric kettle is switched on.'),
      c('A hair dryer is used.', { P: r(1000, 2200, 100), t: r(60, 600, 30) }),
      c('A light bulb is left on.', { P: [4, 8, 10, 40, 60, 100], t: r(60, 3600, 60) }),
      c('A microwave oven heats some food.', { P: r(600, 1000, 50), t: r(30, 300, 10) }),
      c('A phone is charged.', { P: r(5, 20, 1), t: r(600, 7200, 600) }),
    ] },
    'power-w': { free: { Wwd: r(100, 20000, 100), t: r(2, 60, 1) }, contexts: [
      c('A motor lifts a load.'),
      c('A student runs up a flight of stairs.', { Wwd: r(1500, 3500, 100), t: r(3, 15, 1) }),
      c('A crane lifts a steel girder.', { Wwd: r(50000, 500000, 10000), t: r(10, 120, 5) }),
      c('A weightlifter lifts a barbell above their head.', { Wwd: r(500, 3000, 100), t: r(1, 4, 0.5) }),
      c('A lift carries people up a building.', { Wwd: r(20000, 200000, 5000), t: r(10, 60, 5) }),
    ] },
    'eff-e': { free: { eff: r(0.15, 0.95, 0.05), Ein: r(100, 10000, 100) }, contexts: [
      c('An electric motor transfers energy.'),
      c('A kettle heats some water.', { eff: r(0.8, 0.95, 0.05), Ein: r(50000, 500000, 10000) }),
      c('A car engine burns some fuel.', { eff: r(0.2, 0.4, 0.05), Ein: r(100000, 5000000, 100000) }),
      c('A light bulb is switched on.', { eff: r(0.05, 0.4, 0.05), Ein: r(100, 6000, 100) }),
      c('A wind turbine generates electricity.', { eff: r(0.3, 0.5, 0.05), Ein: r(100000, 1000000, 50000) }),
    ] },
    'eff-p': { free: { eff: r(0.05, 0.9, 0.05), Pin: r(5, 2000, 5) }, contexts: [
      c('A lamp is switched on.'),
      c('An electric motor runs a fan.', { eff: r(0.5, 0.9, 0.05), Pin: r(20, 200, 5) }),
      c('A solar panel produces electricity.', { eff: r(0.1, 0.25, 0.05), Pin: r(200, 2000, 50) }),
      c('A loudspeaker plays music.', { eff: r(0.01, 0.1, 0.01), Pin: r(10, 200, 10) }),
      c('A power station generates electricity.', { eff: r(0.3, 0.6, 0.05), Pin: r(100e6, 2000e6, 100e6) }, { ks3: false }),
    ] },
    charge: { free: { I: r(0.1, 5, 0.1), t: r(5, 600, 5) }, contexts: [
      c('A current flows through a lamp.'),
      c('A phone is charged.', { I: r(0.5, 3, 0.1), t: r(600, 7200, 600) }),
      c('A car’s starter motor turns the engine over.', { I: r(100, 300, 10), t: r(1, 5, 0.5) }),
      c('A lightning strike lasts a very short time.', { I: r(10000, 50000, 1000), t: r(0.0002, 0.002, 0.0001) }, { ks3: false }),
      c('A calculator runs from its battery.', { I: r(0.0001, 0.001, 0.0001), t: r(60, 3600, 60) }),
    ] },
    ohm: { free: { I: r(0.1, 2, 0.1), R: r(2, 60, 2) }, contexts: [
      c('A resistor is connected in a circuit.'),
      c('A lamp is lit by a battery.', { V: [1.5, 3, 4.5, 6, 9, 12], I: r(0.1, 1, 0.05) }),
      c('A heating element is connected to the 230 V mains.', { V: [230], I: r(2, 13, 0.5) }),
      c('A thermistor is used in a temperature sensor.', { V: [5, 6, 9, 12], R: r(100, 5000, 100) }),
      c('An LED and a resistor are connected to a battery.', { V: [3, 4.5, 6, 9], I: r(0.005, 0.03, 0.005) }),
    ] },
    'power-vi': { free: { V: [3, 6, 9, 12, 230], I: r(0.1, 10, 0.1) }, contexts: [
      c('An appliance is connected to a power supply.'),
      c('A kettle is plugged into the mains.', { V: [230], I: r(5, 13, 0.5) }),
      c('A torch bulb is lit by a battery.', { V: [1.5, 3, 4.5], I: r(0.1, 1, 0.05) }),
      c('A laptop charger is plugged in.', { V: [19, 20], I: r(1, 4.5, 0.5) }),
      c('A car headlamp is switched on.', { V: [12], I: r(2, 6, 0.5) }),
    ] },
    'power-i2r': { free: { I: r(0.1, 5, 0.1), R: r(1, 200, 1) }, contexts: [
      c('A current flows through a resistor.'),
      c('Power cables carry a current from a power station.', { I: r(100, 2000, 50), R: r(1, 20, 1) }, { ks3: false }),
      c('The heating element in a toaster gets hot.', { I: r(3, 6, 0.5), R: r(30, 80, 5) }),
      c('A long extension cable warms up.', { I: r(5, 13, 1), R: r(0.1, 1, 0.1) }),
    ] },
    'energy-pt': { free: { P: r(5, 3000, 5), t: r(10, 3600, 10) }, contexts: [
      c('An appliance is switched on.'),
      c('A TV is left on standby.', { P: r(0.5, 5, 0.5), t: r(3600, 86400, 3600) }),
      c('An electric shower is used.', { P: r(7000, 10000, 500), t: r(180, 900, 60) }),
      c('A toaster makes some toast.', { P: r(800, 1500, 100), t: r(60, 240, 30) }),
      c('An LED bulb is used for an evening.', { P: r(4, 12, 1), t: r(3600, 18000, 1800) }),
    ] },
    'energy-qv': { free: { Qc: r(1, 500, 1), V: [1.5, 3, 6, 9, 12, 24, 230] }, contexts: [
      c('Charge flows through a component.'),
      c('A phone battery is charged.', { Qc: r(5000, 20000, 1000), V: [5] }),
      c('Charge flows through a lamp connected to a 12 V battery.', { Qc: r(10, 500, 10), V: [12] }),
      c('A lightning bolt transfers charge to the ground.', { Qc: r(5, 30, 1), V: r(100e6, 1000e6, 100e6) }, { ks3: false }),
    ] },
    density: { free: { rho: [700, 920, 1000, 2700, 7900, 8900, 11300, 19300], vol: r(0.0005, 0.02, 0.0005) }, contexts: [
      c('A block of material is measured.'),
      c('A gold bar is weighed in a bank vault.', { rho: [19300], vol: r(0.0001, 0.001, 0.0001) }),
      c('A tank is filled with water.', { rho: [1000], vol: r(0.05, 2, 0.05) }),
      c('A stone is found on a beach.', { rho: r(2000, 3000, 100), vol: r(0.0001, 0.002, 0.0001) }),
      c('A block of wood floats on a pond.', { rho: r(400, 800, 50), vol: r(0.001, 0.02, 0.001) }),
    ] },
    wave: { free: { f: r(0.5, 20, 0.5), lam: r(0.05, 5, 0.05) }, contexts: [
      c('A wave travels across the surface of some water.'),
      c('A guitar plays a note, and the sound travels through the air.', { v: [330, 340], f: r(100, 2000, 50) }),
      c('Ocean waves roll in towards a beach.', { f: r(0.05, 0.3, 0.05), lam: r(10, 100, 5) }),
      c('A radio station broadcasts its signal.', { v: [300000000], f: r(88e6, 108e6, 1e6) }, { ks3: false }),
      c('An ultrasound scanner sends pulses into the body.', { v: [1500], f: r(1e6, 10e6, 0.5e6) }, { ks3: false }),
      c('A wave travels along a slinky spring.', { f: r(1, 5, 0.5), lam: r(0.2, 2, 0.1) }),
    ] },
    magnification: { free: { ho: r(0.5, 10, 0.5), mag: r(0.5, 6, 0.5) }, contexts: [
      c('A lens forms an image of an object.'),
      c('A magnifying glass is used to read small print.', { ho: r(0.1, 1, 0.1), mag: r(2, 5, 0.5) }),
      c('A camera lens forms an image of a tree.', { ho: r(200, 1000, 50), mag: r(0.01, 0.05, 0.01) }),
      c('A projector shows a slide on a screen.', { ho: r(1, 5, 0.5), mag: r(20, 100, 5) }),
    ] },
    suvat: { free: { u: r(2, 20, 1), a: r(0.5, 5, 0.5), s: r(5, 200, 5) }, contexts: [
      c('A car accelerates along a straight road.'),
      c('A ball is thrown straight down from a bridge.', { u: r(2, 10, 1), a: [9.8], s: r(5, 40, 1) }),
      c('A train speeds up as it leaves a station.', { u: r(2, 10, 1), a: r(0.2, 1, 0.1), s: r(100, 1000, 50) }),
      c('A cyclist speeds up down a hill.', { u: r(2, 8, 1), a: r(0.5, 2, 0.5), s: r(10, 100, 5) }),
      c('A plane accelerates down the runway.', { u: r(10, 30, 5), a: r(2, 4, 0.5), s: r(500, 1500, 50) }),
    ] },
    epe: { free: { k: r(10, 500, 10), e: r(0.01, 0.3, 0.01) }, contexts: [
      c('A spring is stretched without going past its limit of proportionality.'),
      c('The elastic of a catapult is pulled back.', { k: r(100, 500, 10), e: r(0.05, 0.3, 0.01) }),
      c('A trampoline is stretched as a gymnast lands on it.', { k: r(2000, 20000, 500), e: r(0.05, 0.5, 0.05) }),
      c('A bow is pulled back before an arrow is fired.', { k: r(300, 800, 10), e: r(0.2, 0.6, 0.05) }),
      c('The spring in a pinball launcher is squashed.', { k: r(50, 300, 10), e: r(0.02, 0.1, 0.01) }),
    ] },
    shc: { free: { m: r(0.2, 5, 0.1), c: [4200, 2100, 900, 450, 390, 130], dth: r(2, 60, 1) }, contexts: [
      c('A block is heated with an electric heater.'),
      c('Water is heated in a kettle.', { c: [4200], m: r(0.5, 1.7, 0.1), dth: r(20, 80, 1) }),
      c('A swimming pool is warmed up.', { c: [4200], m: r(100000, 500000, 10000), dth: r(1, 5, 1) }),
      c('An aluminium saucepan is heated on a hob.', { c: [900], m: r(0.5, 2, 0.1), dth: r(20, 150, 5) }),
      c('A copper pipe is warmed by hot water.', { c: [390], m: r(0.2, 3, 0.1), dth: r(10, 50, 1) }),
      c('Cooking oil is heated in a fryer.', { c: [2000], m: r(1, 5, 0.5), dth: r(100, 160, 5) }),
    ] },
    period: { free: { f: r(0.5, 50, 0.5) }, contexts: [
      c('A wave passes a point.'),
      c('A pendulum swings back and forth.', { f: r(0.2, 2, 0.1) }),
      c('The mains supply alternates.', { f: [50, 60] }),
      c('A guitar string vibrates.', { f: r(80, 1000, 10) }),
      c('A buoy bobs up and down on the waves.', { f: r(0.1, 0.5, 0.05) }),
    ] },
    fbil: { free: { B: r(0.05, 1, 0.05), I: r(0.5, 10, 0.5), l: r(0.02, 0.5, 0.01) }, contexts: [
      c('A wire carrying a current is at right angles to a magnetic field.'),
      c('The coil of an electric motor sits between two magnets.', { B: r(0.1, 0.5, 0.05), I: r(1, 5, 0.5), l: r(0.05, 0.2, 0.01) }),
      c('The coil of a loudspeaker sits in a magnetic field.', { B: r(0.5, 1.5, 0.1), I: r(0.1, 2, 0.1), l: r(1, 5, 0.5) }),
      c('A wire is placed between the poles of a horseshoe magnet.', { B: r(0.05, 0.2, 0.01), I: r(1, 6, 0.5), l: r(0.03, 0.1, 0.01) }),
    ] },
    latent: { free: { m: r(0.1, 5, 0.1), L: [334000, 2260000, 200000] }, contexts: [
      c('A substance changes state at a constant temperature.'),
      c('Ice melts in a drink.', { L: [334000], m: r(0.01, 0.2, 0.01) }),
      c('Water boils away in a pan.', { L: [2260000], m: r(0.05, 1, 0.05) }),
      c('Molten lead becomes solid in a mould.', { L: [23000], m: r(0.5, 5, 0.5) }),
      c('Sweat evaporates from someone’s skin.', { L: [2400000], m: r(0.01, 0.1, 0.01) }),
    ] },
    'transformer-ratio': { free: { Vp: [12, 230, 400, 11000], np: r(100, 5000, 100), ns: r(10, 2000, 10) }, contexts: [
      c('A transformer changes the size of an alternating p.d.'),
      c('A phone charger contains a step-down transformer.', { Vp: [230], np: r(1000, 5000, 100), ns: r(10, 100, 10) }),
      c('A step-up transformer at a power station feeds the National Grid.', { Vp: [25000], np: r(100, 1000, 50), ns: r(1500, 16000, 500) }),
      c('A transformer powers a 12 V model railway from the mains.', { Vp: [230], np: r(500, 2500, 100), ns: r(20, 200, 10) }),
    ] },
    'transformer-power': { free: { Vp: [230, 400, 11000], Ip: r(0.5, 10, 0.5), Vs: [6, 12, 24, 110] }, contexts: [
      c('A transformer is 100% efficient.'),
      c('A step-down transformer in a substation supplies a town.', { Vp: [11000, 33000], Ip: r(1, 20, 1), Vs: [230, 400] }),
      c('A doorbell runs from a small transformer.', { Vp: [230], Ip: r(0.05, 0.5, 0.05), Vs: [8, 12] }),
      c('A step-up transformer at a power station is 100% efficient.', { Vp: [25000], Ip: r(100, 1000, 50), Vs: [275000, 400000] }),
    ] },
    gas: { free: { p1: r(100000, 300000, 10000), V1: r(0.002, 0.01, 0.0005), V2: r(0.0005, 0.0019, 0.0001) }, contexts: [
      c('A fixed mass of gas is compressed slowly, so its temperature stays the same.'),
      c('A bicycle pump is pushed in slowly, so the temperature of the air inside stays the same.', { p1: [100000], V1: r(0.0001, 0.0003, 0.00002), V2: r(0.00003, 0.00009, 0.00001) }),
      c('The end of a syringe is sealed and its plunger is pulled out slowly, at constant temperature.', { p1: [100000], V1: r(0.000005, 0.00002, 0.000001), V2: r(0.00003, 0.00006, 0.000005) }),
      c('A weather balloon rises slowly, and the gas inside stays at the same temperature.', { p1: [100000], V1: r(0.002, 0.01, 0.001), V2: r(0.011, 0.03, 0.001) }),
    ] },
    liquid: { free: { h: r(0.5, 50, 0.5), rho: [1000, 1030], g: G }, contexts: [
      c('A diver is under water.'),
      c('A dam holds back a reservoir.', { rho: [1000], h: r(10, 100, 5) }),
      c('A submarine dives in the sea.', { rho: [1030], h: r(50, 300, 10) }),
      c('Oil fills a storage tank.', { rho: [800, 900], h: r(1, 10, 0.5) }),
      c('A swimmer dives to the bottom of a pool.', { rho: [1000], h: r(1, 4, 0.5) }),
    ] },
    impulse: { free: { m: r(0.1, 1, 0.05), dv: r(2, 30, 1), dt: r(0.01, 0.5, 0.01) }, contexts: [
      c('A ball is kicked.'),
      c('A car crashes into a wall and stops.', { m: r(800, 1500, 50), dv: r(5, 20, 1), dt: r(0.05, 0.2, 0.01) }),
      c('A tennis ball is hit by a racket.', { m: [0.058], dv: r(20, 60, 1), dt: r(0.003, 0.01, 0.001) }),
      c('A crash-test dummy hits an airbag.', { m: r(50, 80, 5), dv: r(5, 15, 1), dt: r(0.05, 0.15, 0.01) }),
    ] },
  };

  // Units a value can be shown in instead of the SI unit, and when that looks natural.
  const CONVERT = {
    m: [{ unit: 'km', f: 1000, ok: (v) => v >= 1000 }, { unit: 'cm', f: 0.01, ok: (v) => v < 1 }],
    kg: [{ unit: 'g', f: 0.001, ok: (v) => v < 5 }],
    J: [{ unit: 'MJ', f: 1e6, ok: (v) => v >= 1e6 }, { unit: 'kJ', f: 1000, ok: (v) => v >= 1000 && v < 1e6 }],
    W: [{ unit: 'kW', f: 1000, ok: (v) => v >= 1000 }],
    s: [{ unit: 'minutes', f: 60, ok: (v) => v >= 60 && v % 60 === 0 }],
    A: [{ unit: 'mA', f: 0.001, ok: (v) => v < 1 }],
    Hz: [{ unit: 'kHz', f: 1000, ok: (v) => v >= 1000 }],
    Pa: [{ unit: 'kPa', f: 1000, ok: (v) => v >= 1000 }],
    V: [{ unit: 'kV', f: 1000, ok: (v) => v >= 1000 }],
    'Ω': [{ unit: 'kΩ', f: 1000, ok: (v) => v >= 1000 }],
    N: [{ unit: 'kN', f: 1000, ok: (v) => v >= 1000 }],
    'm³': [{ unit: 'cm³', f: 1e-6, ok: (v) => v < 0.01 }],
  };

  const sig3 = (x) => Number(x.toPrecision(3));
  const unitOf = (id) => Q[id].unit;
  const fmt = (v) => PK.sig(v, 4);
  const unitText = (u) => (u ? ` ${u}` : '');  // non-breaking: "220 kJ" never splits
  const isExact = (v) => Number(v.toPrecision(3)) === Number(v.toPrecision(12));

  function writtenFormula(eq) {
    if (eq.custom || eq.html) return eq.html;
    return `${Q[eq.lhs].sym} = ${expression(eq, eq.lhs, (id) => Q[id].sym, false)}`;
  }
  function rearranged(eq, subject) {
    if (eq.custom) return eq.forms[subject].html;
    return `${Q[subject].word ? nameOf(eq, subject) : Q[subject].sym} = ${expression(eq, subject, (id) => Q[id].sym, false)}`;
  }

  // KS3: rounder numbers. A range becomes about ten round values; g is 10 N/kg.
  function ease(spec) {
    if (Array.isArray(spec)) return spec.map((v) => (v === 9.8 ? 10 : v));
    const target = (spec.max - spec.min) / 10, mag = 10 ** Math.floor(Math.log10(target));
    const step = Math.max(spec.step, [1, 2, 5, 10].map((k) => k * mag).find((v) => v >= target - 1e-12));
    const min = Math.max(step, Math.ceil(spec.min / step - 1e-9) * step), max = Math.max(min, Math.floor(spec.max / step + 1e-9) * step);
    return { min: Number(min.toPrecision(10)), max: Number(max.toPrecision(10)), step };
  }
  // A "nice" number for KS3: at most 2 significant figures
  const nice = (v) => Math.abs(Number(v.toPrecision(2)) - v) <= Math.abs(v) * 1e-9;

  // The contexts an equation can use
  const contextsFor = (eq, ks3) => SETUPS[eq.id].contexts.map((ctx, i) => ({ ...ctx, i })).filter((ctx) => !ks3 || ctx.ks3 !== false);
  // The ranges for a context: its own, topped up from the equation's defaults
  function freeFor(eq, ctx, ks3) {
    const need = varsOf(eq).length - 1, free = { ...ctx.free };
    for (const [id, spec] of Object.entries(SETUPS[eq.id].free)) if (Object.keys(free).length < need && !(id in free)) free[id] = spec;
    if (ks3) for (const id of Object.keys(free)) free[id] = ease(free[id]);
    return free;
  }
  // Work out every quantity: the free ones are drawn, the last one comes from the equation.
  function fullSet(eq, free) {
    const x = {};
    for (const [id, spec] of Object.entries(free)) x[id] = draw(spec);
    const rest = varsOf(eq).find((id) => !(id in x));
    if (rest) x[rest] = sig3(solve(eq, rest, x));
    return x;
  }

  // A question from one of the equations in the list.
  // keep: an earlier question, to keep its equation, context and unknown (new numbers only).
  function make(list, { rearrange = true, convert = false, ks3 = false, keep = null } = {}) {
    list = list.filter((eq) => SETUPS[eq.id] && contextsFor(eq, ks3).length);
    if (keep && !list.includes(keep.eq)) keep = null;
    if (!list.length) return null;
    const tries = ks3 ? 400 : 60;
    let fallback = null;
    for (let n = 0; n < tries; n++) {
      const eq = keep ? keep.eq : pick(list);
      const ctxs = contextsFor(eq, ks3);
      const ctx = keep ? (ctxs.find((k) => k.i === keep.ci) || ctxs[0]) : pick(ctxs);
      const x = fullSet(eq, freeFor(eq, ctx, ks3));
      const defaultSub = eq.custom ? eq.vars[0] : eq.lhs;
      const subject = keep ? keep.subject : rearrange ? pick(varsOf(eq)) : defaultSub;
      const given = varsOf(eq).filter((id) => id !== subject);
      const answer = solve(eq, subject, Object.fromEntries(given.map((id) => [id, x[id]])));
      if (!isFinite(answer) || answer <= 0 || given.some((id) => !(x[id] > 0))) continue;
      // Choose how each given value is shown
      const shown = {};
      for (const id of given) shown[id] = { value: x[id], unit: unitOf(id), f: 1 };
      if (convert) {
        const options = given.filter((id) => (CONVERT[unitOf(id)] || []).some((cv) => cv.ok(x[id])));
        options.sort(() => Math.random() - 0.5);
        options.slice(0, Math.random() < 0.4 ? 2 : 1).forEach((id) => {
          const cv = CONVERT[unitOf(id)].find((k) => k.ok(x[id]));
          shown[id] = { value: Number((x[id] / cv.f).toPrecision(6)), unit: cv.unit, f: cv.f };
        });
      }
      const q = { eq, subject, given, x, shown, answer, ctx: ctx.ctx, ci: ctx.i, ks3 };
      // KS3: keep going until every number, and the answer, is a round one
      if (ks3 && !(nice(answer) && Object.values(x).every(nice))) { fallback = fallback || q; continue; }
      return q;
    }
    return fallback;
  }

  // Plainer wording for questions than the formal names on the equation sheet.
  const PLAIN = {
    'force applied to a spring': 'force', 'moment of a force': 'moment', 'force normal to a surface': 'force',
    'area of that surface': 'area', 'speed (or velocity)': 'speed', 'distance travelled': 'distance',
    'force on a conductor carrying a current': 'force on the wire', 'pressure due to a column of liquid': 'pressure',
    'height of the column': 'depth', 'perpendicular distance from the pivot': 'distance from the pivot',
  };
  const plainName = (eq, id) => PLAIN[nameOf(eq, id)] || nameOf(eq, id);
  const sentenceName = (eq, id) => { const n = plainName(eq, id); return n.charAt(0).toUpperCase() + n.slice(1); };

  // The question as a card: tags, context, the given values and what to find
  function questionHtml(q, { showEq = false } = {}) {
    const { eq, subject, given, shown } = q;
    const rows = given.map((id) => `<li><span>${sentenceName(eq, id)}</span><b>${fmt(shown[id].value)}${unitText(shown[id].unit)}</b></li>`).join('');
    const unit = unitOf(subject);
    const tags = [
      eq.po ? '<span class="tag po">Physics only</span>' : '',
      eq.ht ? '<span class="tag ht">Higher</span>' : '',
    ].join('');
    return `
      <div class="tags">${tags}<span class="tag">${eq.topic}</span></div>
      <p class="ctx">${q.ctx}</p>
      <ul class="givens">${rows}</ul>
      <p class="ask">Calculate the <b>${plainName(eq, subject)}</b>${unit ? ` in ${unit}` : ''}.${Q[subject].word && subject === 'eff' ? ' Give your answer as a decimal.' : ''}</p>
      ${showEq ? `<div class="eq-show">${writtenFormula(eq)}</div>` : ''}`;
  }
  const hintHtml = (q) => `<div class="eq-show">${writtenFormula(q.eq)}</div><div class="note">${wordEquation(q.eq)}</div>`;

  // Numbered worked answer (the normal view)
  function workingHtml(q) {
    const { eq, subject, given, shown, x, answer } = q;
    const steps = [];
    steps.push(`<li><b>Write down the equation.</b><div class="eq-show">${writtenFormula(eq)}</div></li>`);
    const conv = given.filter((id) => shown[id].f !== 1);
    if (conv.length) steps.push(`<li><b>Convert to SI units.</b>${conv.map((id) => `<div>${fmt(shown[id].value)} ${shown[id].unit} = ${fmt(x[id])} ${unitOf(id)}</div>`).join('')}</li>`);
    const asWritten = eq.custom ? eq.vars[0] : eq.lhs;
    if (subject !== asWritten || (eq.html && !eq.custom)) steps.push(`<li><b>Rearrange for the ${plainName(eq, subject)}.</b><div class="eq-show">${rearranged(eq, subject)}</div></li>`);
    const sub = eq.custom
      ? eq.forms[subject].sub(Object.fromEntries(given.map((id) => [id, numLabel(x[id])])))
      : expression(eq, subject, (id) => numLabel(x[id]), true);
    const lhsLabel = Q[subject].word ? nameOf(eq, subject) : Q[subject].sym;
    steps.push(`<li><b>Substitute the values.</b><div class="eq-show">${lhsLabel} = ${sub}</div></li>`);
    steps.push(`<li><b>Work it out.</b><div class="ans">${lhsLabel} = ${PK.sig(answer, 3)}${unitText(unitOf(subject))}</div>${isExact(answer) ? '' : '<div class="note">Rounded to 3 significant figures.</div>'}</li>`);
    return `<h2>Worked answer</h2><ol class="steps">${steps.join('')}</ol>`;
  }

  // VESRAU layout: Values, Equation, Substitute, Rearrange (only when it's needed), Answer
  // and Units. Just the lines, without labels.
  const symOf = (eq, id) => (Q[id].word ? plainName(eq, id) : Q[id].sym);
  // Equations written on the sheet in a different form from the one used to solve them.
  const WRITTEN = {
    'transformer-ratio': { order: ['Vp', 'Vs', 'np', 'ns'], html: 'V<sub>p</sub> / V<sub>s</sub> = n<sub>p</sub> / n<sub>s</sub>', sub: (l) => `${l('Vp')} / ${l('Vs')} = ${l('np')} / ${l('ns')}` },
    'transformer-power': { order: ['Vs', 'Is', 'Vp', 'Ip'], html: 'V<sub>s</sub> I<sub>s</sub> = V<sub>p</sub> I<sub>p</sub>', sub: (l) => `${l('Vs')} × ${l('Is')} = ${l('Vp')} × ${l('Ip')}` },
    gas: { order: ['p1', 'V1', 'p2', 'V2'], html: 'p<sub>1</sub> V<sub>1</sub> = p<sub>2</sub> V<sub>2</sub>', sub: (l) => `${l('p1')} × ${l('V1')} = ${l('p2')} × ${l('V2')}` },
  };
  function vesrauHtml(q) {
    const { eq, subject, given, shown, x, answer } = q;
    const lab = (id) => (id === subject ? symOf(eq, id) : numLabel(x[id]));
    const blocks = [];
    const written = WRITTEN[eq.id];
    blocks.push((written ? written.order : varsOf(eq)).map((id) => {
      if (id === subject) return `<span class="v">${symOf(eq, id)} = ?</span>`;
      const sh = shown[id];
      return `<span class="v">${symOf(eq, id)} = ${fmt(sh.value)}${unitText(sh.unit)}${sh.f !== 1 ? ` = ${fmt(x[id])}${unitText(unitOf(id))}` : ''}</span>`;
    }).join(''));
    blocks.push(`<div>${written ? written.html : writtenFormula(eq)}</div>`);
    blocks.push(`<div>${written ? written.sub(lab)
      : eq.custom ? `${lab('vf')}<sup>2</sup> − ${lab('u')}<sup>2</sup> = 2 × ${lab('a')} × ${lab('s')}`
        : `${lab(eq.lhs)} = ${expression(eq, eq.lhs, lab, true)}`}</div>`);
    if (written || eq.custom || subject !== eq.lhs) {
      const solved = eq.custom
        ? eq.forms[subject].sub(Object.fromEntries(given.map((id) => [id, numLabel(x[id])])))
        : expression(eq, subject, (id) => numLabel(x[id]), true);
      blocks.push(`<div>${symOf(eq, subject)} = ${solved}</div>`);
    }
    blocks.push(`<div class="ans">${symOf(eq, subject)} = ${PK.sig(answer, 3)}${unitText(unitOf(subject))}</div>`);
    return `<div class="vesrau">${blocks.map((b) => `<div class="vb">${b}</div>`).join('')}</div>`;
  }

  // The question as sentences, for presentation view
  const joinList = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
  function presentationText(q) {
    const { eq, subject, given, shown } = q;
    const sentence = joinList(given.map((id) => `the ${plainName(eq, id)} is ${fmt(shown[id].value)}${unitText(shown[id].unit)}`));
    const unit = unitOf(subject);
    return `<p>${q.ctx} ${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.</p>
      <p>Calculate the ${plainName(eq, subject)}${unit ? ` in ${unit}` : ''}.${subject === 'eff' ? ' Give your answer as a decimal.' : ''}</p>`;
  }

  // Mark an answer: { ok, tip } with a hint for the usual slips
  function mark(q, v) {
    if (Math.abs(v - q.answer) / Math.abs(q.answer) <= 0.011) return { ok: true };
    const ratio = v / q.answer;
    const near = (k) => Math.abs(ratio / k - 1) < 0.02;
    let tip = 'Not quite. Check your rearranging and your arithmetic, then try again.';
    if ([1000, 0.001, 1e6, 1e-6, 100, 0.01, 60, 1 / 60].some(near)) tip = 'Not quite. Your answer is out by a power of ten (or a factor of 60). Check you converted every value to SI units.';
    else if (q.answer !== 1 && (near(q.answer) || Math.abs((v * v) / q.answer - 1) < 0.02)) tip = 'Not quite. Did you square or square-root when you shouldn’t have, or forget to?';
    else if (Math.abs(v * q.answer - 1) < 0.02) tip = 'Not quite. Have you divided the wrong way round?';
    else if (near(2) || near(0.5)) tip = 'Not quite. Your answer is out by a factor of 2. Check for a ½ (or a 2) in the equation.';
    else if (near(4) || near(0.25)) tip = 'Not quite. Your answer is out by a factor of 4. Did you square a value twice, or forget to?';
    return { ok: false, tip };
  }

  // ---------- Presentation view: timer and pen ----------
  // Adds a Timer and a Pen to a presentation overlay. Returns { clear, close }.
  const TOOLS_CSS = `
    .pq-ink { position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; z-index: 1001; pointer-events: none; display: block; }
    .pq-ink.on { pointer-events: auto; touch-action: none; cursor: crosshair; user-select: none; -webkit-user-select: none; }
    .pq-pens, .pq-timer-pick { position: fixed; left: 50%; transform: translateX(-50%); bottom: 76px; z-index: 1003; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px;
      padding: 8px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: 999px; box-shadow: 0 8px 24px rgba(0,0,0,.2); }
    .pq-pens[hidden], .pq-timer-pick[hidden], .pq-clock[hidden] { display: none; }
    .pq-pens button, .pq-timer-pick button { min-width: 40px; height: 40px; border-radius: 999px; border: 2px solid var(--border-strong); background: var(--surface); color: var(--text); font: 700 .9rem var(--font-body); cursor: pointer; padding: 0 12px; }
    .pq-pens button[aria-pressed="true"] { outline: 3px solid var(--accent); outline-offset: 1px; }
    .pq-pens .sw { width: 40px; padding: 0; }
    .pq-clock { position: fixed; top: clamp(12px, 2vw, 32px); right: clamp(16px, 3vw, 56px); z-index: 1002; font: 800 clamp(2rem, 5vw, 4.5rem)/1 var(--font-body);
      font-variant-numeric: tabular-nums; color: var(--text); background: var(--surface); padding: 8px 18px; border-radius: 14px; border: 2px solid var(--border-strong); cursor: pointer; }
    .pq-clock.done { color: #fff; background: #c62828; border-color: #c62828; animation: pq-flash 1s steps(2) infinite; }
    @keyframes pq-flash { 50% { opacity: .55; } }
    .present .p-bar, .pq-present .p-bar { z-index: 1004; }`;
  function presentTools(present, bar) {
    if (!document.getElementById('pq-tools-css')) document.head.appendChild(Object.assign(document.createElement('style'), { id: 'pq-tools-css', textContent: TOOLS_CSS }));
    const mk = (html) => { const b = document.createElement('button'); b.className = 'btn'; b.type = 'button'; b.innerHTML = html; return b; };
    const penBtn = mk('✏️ Pen'), timerBtn = mk('⏱ Timer');
    penBtn.dataset.tip = 'Write on the screen with your finger, a stylus or the mouse. It clears when you go to the next question.';
    timerBtn.dataset.tip = 'Starts a countdown, such as “you have 3 minutes”. Tap the clock to stop it.';
    bar.prepend(timerBtn); bar.prepend(penBtn);

    // Pen
    const ink = document.createElement('canvas'); ink.className = 'pq-ink';
    present.appendChild(ink);
    const pens = document.createElement('div'); pens.className = 'pq-pens'; pens.hidden = true;
    const COLS = [['#111111', 'Black'], ['#1e63c6', 'Blue'], ['#c62828', 'Red'], ['#2e7d32', 'Green']];
    pens.innerHTML = COLS.map(([c, n], i) => `<button class="sw" data-c="${c}" aria-label="${n} pen" aria-pressed="${i === 0}" style="background:${c}"></button>`).join('')
      + '<button data-c="erase" aria-pressed="false">Eraser</button><button data-x="clear">Clear</button><button data-x="done">Done</button>';
    present.appendChild(pens);
    let strokes = [], cur = null, colour = COLS[0][0], on = false;
    const ctx = ink.getContext('2d');
    function redraw() {
      const d = window.devicePixelRatio || 1;
      ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const st of strokes) {
        ctx.globalCompositeOperation = st.c === 'erase' ? 'destination-out' : 'source-over';
        ctx.strokeStyle = st.c === 'erase' ? '#000' : st.c; ctx.lineWidth = st.c === 'erase' ? 34 : 4;
        ctx.beginPath(); st.p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        if (st.p.length === 1) ctx.lineTo(st.p[0][0] + 0.1, st.p[0][1]);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    function fit() { const d = window.devicePixelRatio || 1; ink.width = innerWidth * d; ink.height = innerHeight * d; redraw(); }
    function setPen(v) { on = v; ink.classList.toggle('on', v); pens.hidden = !v; penBtn.classList.toggle('primary', v); if (v) fit(); }
    penBtn.addEventListener('click', () => setPen(!on));
    pens.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.c) { colour = b.dataset.c; pens.querySelectorAll('[data-c]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }
      if (b.dataset.x === 'clear') { strokes = []; redraw(); }
      if (b.dataset.x === 'done') setPen(false);
    });
    const at = (ev) => { const r = ink.getBoundingClientRect(); return [(ev.clientX - r.left) * (innerWidth / r.width), (ev.clientY - r.top) * (innerHeight / r.height)]; };
    ink.addEventListener('pointerdown', (e) => { if (!on) return; e.preventDefault(); ink.setPointerCapture(e.pointerId); cur = { c: colour, p: [at(e)] }; strokes.push(cur); redraw(); });
    ink.addEventListener('pointermove', (e) => {
      if (!cur) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
      for (const ev of (evs.length ? evs : [e])) cur.p.push(at(ev));
      redraw();
    });
    const end = () => { cur = null; };
    ink.addEventListener('pointerup', end); ink.addEventListener('pointercancel', end);
    window.addEventListener('resize', () => { if (!present.hidden) fit(); });
    fit();

    // Timer
    const clock = document.createElement('div'); clock.className = 'pq-clock'; clock.hidden = true; clock.setAttribute('role', 'timer');
    clock.title = 'Tap to stop the timer';
    const pick = document.createElement('div'); pick.className = 'pq-timer-pick'; pick.hidden = true;
    pick.innerHTML = [1, 2, 3, 5, 10].map((m) => `<button data-m="${m}">${m} min</button>`).join('') + '<button data-m="0">Stop</button>';
    present.appendChild(clock); present.appendChild(pick);
    let endAt = 0, tick = null;
    const show = () => {
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      clock.textContent = left ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : 'Time’s up!';
      clock.classList.toggle('done', !left);
      if (!left) clearInterval(tick);
    };
    timerBtn.addEventListener('click', () => { pick.hidden = !pick.hidden; pens.hidden = true; });
    pick.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const m = Number(b.dataset.m); pick.hidden = true; clearInterval(tick);
      if (!m) { clock.hidden = true; return; }
      endAt = Date.now() + m * 60000; clock.hidden = false; show(); tick = setInterval(show, 250);
    });
    clock.addEventListener('click', () => { clearInterval(tick); clock.hidden = true; });
    return { clear() { strokes = []; redraw(); }, close() { setPen(false); pick.hidden = true; }, fit };
  }

  // ---------- Printable worksheets ----------
  const PRINT_CSS = `
    #pq-print { display: none; }
    @media print {
      @page { margin: 15mm; }
      html, body { background: #fff !important; }
      body > *:not(#pq-print) { display: none !important; }
      #pq-print, #pq-print * { color: #000 !important; background: transparent !important; box-shadow: none !important; }
      #pq-print { display: block; color: #000; font-family: Calibri, Arial, sans-serif; font-size: 11.5pt; }
      #pq-print h1 { font-size: 18pt; margin: 0 0 6px; color: #000; }
      #pq-print .meta { display: flex; gap: 40px; margin: 0 0 14px; }
      #pq-print .meta span { flex: 1; border-bottom: 1px solid #000; padding-bottom: 2px; }
      #pq-print ol { padding-left: 22px; margin: 0; }
      #pq-print li { margin: 0 0 12px; break-inside: avoid; }
      #pq-print li p { margin: 0 0 4px; }
      #pq-print .work { height: 64px; border-bottom: 1px dotted #888; }
      #pq-print .ansline { text-align: right; margin-top: 4px; }
      #pq-print .answers { break-before: page; }
      #pq-print .vesrau { display: grid; gap: 2px; }
      #pq-print .vesrau .v { margin-right: 1.6em; }
      #pq-print .vesrau .ans { font-weight: 700; }
      #pq-print .frac { display: inline-flex; flex-direction: column; vertical-align: middle; text-align: center; }
      #pq-print .frac > span:first-child { border-bottom: 1px solid #000; }
      #pq-print .foot { margin-top: 10px; font-size: 9pt; color: #555; }
    }`;
  // make(): a new question each call. Prints the questions, then the worked answers on a new page.
  function printWorksheet({ make: makeOne, title = 'Calculation practice', count = 10, answers = true }) {
    const qs = [];
    for (let i = 0; i < count * 4 && qs.length < count; i++) {
      const q = makeOne();
      if (q && !qs.some((o) => o.eq === q.eq && o.subject === q.subject && o.answer === q.answer)) qs.push(q);
    }
    let el = document.getElementById('pq-print');
    if (!el) {
      el = document.createElement('div'); el.id = 'pq-print'; document.body.appendChild(el);
      document.head.appendChild(Object.assign(document.createElement('style'), { textContent: PRINT_CSS }));
    }
    const qHtml = qs.map((q) => `<li>${presentationText(q)}<div class="work"></div><div class="ansline">Answer: ____________${unitText(unitOf(q.subject))}</div></li>`).join('');
    const aHtml = qs.map((q) => `<li>${vesrauHtml(q)}</li>`).join('');
    el.innerHTML = `
      <section><h1>${title}</h1><div class="meta"><span>Name:</span><span>Date:</span></div>
        <p>Show your working. Use g = ${qs[0] && qs[0].ks3 ? 10 : 9.8} N/kg. Give your answers to 3 significant figures.</p><ol>${qHtml}</ol>
        <p class="foot">Mr Lane’s Physics Lab · lanerobertlane.space</p></section>
      ${answers ? `<section class="answers"><h1>${title}: answers</h1><ol>${aHtml}</ol></section>` : ''}`;
    window.print();
  }
  // A small window to choose the worksheet options, then print
  function worksheetDialog(opts) {
    const m = document.createElement('div');
    m.className = 'pk-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', 'Print a worksheet');
    m.innerHTML = `<div class="pk-modal-box"><h2>Print a worksheet</h2>
      <p class="note" style="margin-top:0">The questions use your current settings. The worked answers go on a separate page.</p>
      <label style="display:grid;gap:4px;font-weight:700;margin:10px 0">Number of questions
        <select class="select" id="ws-n"><option>5</option><option selected>10</option><option>15</option><option>20</option></select></label>
      <label class="toggle"><input type="checkbox" id="ws-a" checked> Include the answers page</label>
      <div class="btn-row" style="justify-content:flex-end;margin-top:14px"><button class="btn" id="ws-cancel">Cancel</button><button class="btn primary" id="ws-go">🖨 Print</button></div></div>`;
    document.body.appendChild(m);
    const close = () => m.remove();
    m.addEventListener('click', (e) => { if (e.target === m) close(); });
    m.querySelector('#ws-cancel').addEventListener('click', close);
    m.querySelector('#ws-go').addEventListener('click', () => {
      const count = Number(m.querySelector('#ws-n').value), answers = m.querySelector('#ws-a').checked;
      close(); printWorksheet({ ...opts, count, answers });
    });
    m.querySelector('#ws-go').focus();
  }

  // ---------- Scores saved on this device ----------
  const loadScore = (key) => ({ right: 0, total: 0, streak: 0, ...(PK.store.get(`score.${key}`, null) || {}) });
  const saveScore = (key, sc) => PK.store.set(`score.${key}`, sc);

  // A question as a small object for a link, and back again
  function encodeQ(q) {
    if (!q) return null;
    return { e: q.eq.id, c: q.ci, s: q.subject, k: q.ks3 ? 1 : 0, x: q.x, sh: Object.fromEntries(q.given.map((id) => [id, [q.shown[id].value, q.shown[id].unit, q.shown[id].f]])) };
  }
  function decodeQ(o) {
    const eq = o && EQUATIONS.find((e) => e.id === o.e);
    if (!eq || !SETUPS[eq.id] || !o.x) return null;
    const subject = o.s, given = varsOf(eq).filter((id) => id !== subject);
    const x = o.x, answer = solve(eq, subject, Object.fromEntries(given.map((id) => [id, x[id]])));
    if (!isFinite(answer)) return null;
    const shown = {};
    for (const id of given) { const v = (o.sh || {})[id]; shown[id] = v ? { value: v[0], unit: v[1], f: v[2] } : { value: x[id], unit: unitOf(id), f: 1 }; }
    const ctx = SETUPS[eq.id].contexts[o.c] || SETUPS[eq.id].contexts[0];
    return { eq, subject, given, x, shown, answer, ctx: ctx.ctx, ci: SETUPS[eq.id].contexts.indexOf(ctx), ks3: Boolean(o.k) };
  }

  // Equations used at KS3 (Calculation practice's KS3 option)
  const KS3 = ['weight', 'work', 'hooke', 'moment', 'pressure', 'speed', 'density', 'ohm', 'power-e', 'energy-pt', 'eff-e', 'eff-p', 'wave'];
  return { SETUPS, CONVERT, KS3, make, encodeQ, decodeQ, presentTools, worksheetDialog, loadScore, saveScore, questionHtml, hintHtml, workingHtml, vesrauHtml, presentationText, mark, writtenFormula, plainName, unitOf, unitText };
})();
