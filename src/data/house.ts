import type { StaticImageData } from "next/image";

import aerial from "@/assets/photos/aerial.webp";
import bedroom2 from "@/assets/photos/bedroom-2.webp";
import bloomCascade from "@/assets/photos/bloom-cascade.webp";
import bloomMound from "@/assets/photos/bloom-mound.webp";
import bootRoom from "@/assets/photos/boot-room.webp";
import coveView from "@/assets/photos/cove-view.webp";
import ensuite from "@/assets/photos/ensuite.webp";
import entrance from "@/assets/photos/entrance.webp";
import facade from "@/assets/photos/facade.webp";
import frontBalcony from "@/assets/photos/front-balcony.webp";
import garage from "@/assets/photos/garage.webp";
import gate from "@/assets/photos/gate.webp";
import guestBath from "@/assets/photos/guest-bath.webp";
import hall from "@/assets/photos/hall.webp";
import kitchen from "@/assets/photos/kitchen.webp";
import landing from "@/assets/photos/landing.webp";
import laundry from "@/assets/photos/laundry.webp";
import lavenderRoses from "@/assets/photos/lavender-roses.webp";
import linen from "@/assets/photos/linen.webp";
import living from "@/assets/photos/living.webp";
import master from "@/assets/photos/master.webp";
import pantry from "@/assets/photos/pantry.webp";
import portal from "@/assets/photos/portal.webp";
import rear from "@/assets/photos/rear.webp";
import rearNight from "@/assets/photos/rear-night.webp";
import roseBranch from "@/assets/photos/rose-branch.webp";
import terrace from "@/assets/photos/terrace.webp";
import walkIn from "@/assets/photos/walk-in.webp";
import workRoom from "@/assets/photos/work-room.webp";
import workout from "@/assets/photos/workout.webp";
import roomsFromPlans from "./blueprint-rooms.json";

export const HOUSE_NAME = "La Casa";

export const photos = {
  aerial, bedroom2, bloomCascade, bloomMound, bootRoom, coveView, ensuite, entrance, facade, frontBalcony, garage, gate, guestBath, hall, kitchen, landing, laundry,
  lavenderRoses, linen, living, master, pantry, portal, rear, rearNight, roseBranch, terrace, walkIn, workRoom, workout,
};

/** Net areas come straight from the CAD model (tools/blueprint). */
export function areaOf(id: string): number | undefined {
  return [...roomsFromPlans.ground, ...roomsFromPlans.upper].find((r) => r.id === id)?.area;
}

export type Slide = { image: StaticImageData; alt: string };

export type Reason = { title: string; text: string; slides: Slide[] };

/** Set big in caps over a full-bleed picture (ERA's quote panel), so each line stays short. */
export const reasons: Reason[] = [
  {
    title: "Private by design",
    text: "A three-metre hedge closes the garden on all four sides. Two solid arched gates, one at the road and one at the sea, are the only ways in.",
    slides: [
      { image: gate, alt: "The wide arched timber front gate between limestone pillars in the tall hedge" },
      { image: portal, alt: "The arched plaster portal with its solid timber door in the back hedge, the cove beyond" },
      { image: aerial, alt: "Aerial view of the plot closed in by the hedge on all four sides" },
    ],
  },
  {
    title: "Above the cove",
    text: "The garden ends at a six-metre limestone bluff. Thirty-six stone steps go down to a crescent of sand that only the house can reach.",
    slides: [
      { image: coveView, alt: "The house seen from the water: beach, bluff, stone stairs and the arched portal" },
      { image: portal, alt: "The back portal with the cove and headlands beyond" },
    ],
  },
  {
    title: "Made for a family",
    text: "Every room opens through an arch, and every arch looks out to green or to the sea. Two bedrooms, a work room, and a terrace for long dinners.",
    slides: [
      { image: terrace, alt: "The covered terrace under the arches with a long oak dining table" },
      { image: rear, alt: "The back of the house: four arches over the terrace and a balcony above with a flowering cable pergola" },
      { image: living, alt: "The living room with linen sofas and tall arched doors to the terrace" },
    ],
  },
];

export type Room = { id: string; name: string; floor: "Ground" | "Upper" | "Garden"; note: string; image: StaticImageData; alt: string };

export const rooms: Room[] = [
  { id: "entrance", name: "Entrance sitting room", floor: "Ground", image: entrance,
    note: "The ruang tamu: guests are received just inside the arched front door, on linen and cane around a travertine table.",
    alt: "Front sitting room with a linen sofa and two cane armchairs around a travertine table, the arched oak front door beyond" },
  { id: "hall", name: "Inner hall", floor: "Ground", image: hall,
    note: "Behind a wall and a short wing wall, out of the guests' sight: the foot of the stair, the guest bath and bedroom two.",
    alt: "Small inner hall with the foot of a plastered stair, arched oak doors on the left and a rounded wing wall hiding it from the sitting room" },
  { id: "living", name: "Living room", floor: "Ground", image: living,
    note: "Arched doors to the terrace, a wide arch to the kitchen and a prayer corner by the side window.",
    alt: "Living room with linen sofas, a jute rug and tall arched doors to the terrace" },
  { id: "kitchen", name: "Kitchen and dining", floor: "Ground", image: kitchen,
    note: "Sage glazed tiles in the arched hood, a marble island and a walk-in pantry.",
    alt: "Kitchen with a sage tiled arched hood alcove, marble island and oak dining table" },
  { id: "pantry", name: "Pantry", floor: "Ground", image: pantry,
    note: "Oak shelves floor to ceiling behind a reeded-glass arched door, with a coffee counter under a run of sage tiles.",
    alt: "Walk-in pantry with oak shelves of glass jars and ceramics, a marble counter with a coffee machine and sage tiles" },
  { id: "bedroom-2", name: "Bedroom two", floor: "Ground", image: bedroom2,
    note: "The guest room at the front, next to its own bathroom.",
    alt: "Ground floor bedroom with linen bedding, cane wardrobe and arched windows" },
  { id: "guest-bath", name: "Guest bath", floor: "Ground", image: guestBath,
    note: "Terracotta, sand and ochre glaze to two thirds height.",
    alt: "Guest bathroom with warm terracotta glazed tiles and an oak vanity" },
  { id: "workout", name: "Workout", floor: "Ground", image: workout,
    note: "A mat, a rack and an arched mirror, with a window to the side garden.",
    alt: "Small workout room with a rubber floor, dumbbell rack and arched mirror" },
  { id: "boot-room", name: "Boot room", floor: "Ground", image: bootRoom,
    note: "Between the garage and the entrance: a cane bench, hooks for beach towels and a tiled splash corner with a foot tap.",
    alt: "Boot room with a long oak and cane bench, beach towels on brass hooks, open shoe cubbies and a terracotta-tiled corner" },
  { id: "garage", name: "Garage", floor: "Ground", image: garage,
    note: "Six metres wide for two cars side by side, with the motorbike across the back wall and boards on the side.",
    alt: "Two-car garage with a silver Honda Civic Type R and a silver Nissan GT-R, a red Ducati Streetfighter in front and oak storage along one wall" },
  { id: "laundry", name: "Laundry yard", floor: "Ground", image: laundry,
    note: "Behind the garage under a pergola, with the foot rinse on the way in.",
    alt: "Laundry yard under a timber pergola with a washer, drying line and a brass foot rinse" },
  { id: "landing", name: "Landing", floor: "Upper", image: landing,
    note: "The stair arrives under a tall arched window to the front garden; the master suite on one side, the work room on the other.",
    alt: "Upstairs landing with the stair rail on the left, a tall arched window ahead and arched doorways to either side" },
  { id: "master", name: "Master bedroom", floor: "Upper", image: master,
    note: "A king bed and tall arched doors to the long balcony over the terrace.",
    alt: "Master bedroom with a king bed and arched balcony doors with a view of the sea" },
  { id: "walk-in", name: "Walk-in closet", floor: "Upper", image: walkIn,
    note: "Oak and cane wardrobes on both walls, an island in the middle and an arch through to the ensuite.",
    alt: "Walk-in closet with oak and woven cane wardrobes, a travertine-topped island and an arched door to the ensuite" },
  { id: "ensuite", name: "Ensuite", floor: "Upper", image: ensuite,
    note: "A stone tub under the front window and a sea-glass mosaic shower.",
    alt: "Ensuite with a freestanding stone tub and a blue-grey glazed mosaic shower" },
  { id: "work-room", name: "Work room", floor: "Upper", image: workRoom,
    note: "A sit-stand desk at the front balcony doors and shelves along one wall.",
    alt: "Long work room with built-in shelves and a sit-stand desk facing arched balcony doors" },
  { id: "front-balcony", name: "Front balcony", floor: "Upper", image: frontBalcony,
    note: "A coffee table's worth of balcony off the work room, above the front door, looking down the walk to the gate.",
    alt: "Small limestone balcony with a bistro table and lavender pots, looking over the front garden, the S-shaped driveway and the gate" },
  { id: "balcony", name: "Back balcony", floor: "Upper", image: rear,
    note: "Eleven metres long over the terrace. Five limestone pillars carry steel beams and taut cables, grown over with crimson bougainvillea and climbing roses.",
    alt: "The back of the house: square limestone pillars on the upper balcony with steel beams and cables grown over by crimson bougainvillea and roses, four arches below" },
  { id: "stairs", name: "Stone stairs", floor: "Garden", image: coveView,
    note: "Through the arched portal and down the six-metre bluff: three flights of twelve limestone steps with an iron rail, to the sand.",
    alt: "Stone switchback stairs with a black wrought-iron rail down the limestone bluff from the arched portal to the beach" },
];

/** The walk from the road to the sand, measured along the plot (site plan v6). */
export const walk = [
  { at: "0 m", name: "Front gate" },
  { at: "21 m", name: "Front door" },
  { at: "34 m", name: "Terrace" },
  { at: "50 m", name: "Arched portal" },
  { at: "−6 m", name: "The beach" },
];

export const features = ["3 m hedge", "Two arched gates", "Covered terrace", "Foot rinse", "Thirty-six steps"];

export const sheets = [
  { id: "ground", number: "A-02", title: "Ground floor", scale: "1:100" },
  { id: "upper", number: "A-03", title: "Upper floor", scale: "1:100" },
  { id: "site", number: "A-01", title: "Site plan", scale: "1:200" },
  { id: "section", number: "A-04", title: "Section A-A", scale: "1:200" },
] as const;

export type SheetId = (typeof sheets)[number]["id"];

export const roomLists = roomsFromPlans;

/** Photo shown when a room is picked on a plan; rooms without a render show the drawing only. */
export const planPhotos: Record<string, StaticImageData> = {
  living, kitchen, "bedroom-2": bedroom2, "guest-bath": guestBath, workout, laundry, terrace,
  entrance, hall, garage, "boot-room": bootRoom, pantry, master, ensuite, "walk-in": walkIn, landing, linen,
  "work-room": workRoom, balcony: rear, "front-balcony": frontBalcony,
};
