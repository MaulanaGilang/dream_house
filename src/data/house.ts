import type { StaticImageData } from "next/image";

import aerial from "@/assets/photos/aerial.webp";
import backGate from "@/assets/photos/back-gate.webp";
import bedroom2 from "@/assets/photos/bedroom-2.webp";
import cliffStairs from "@/assets/photos/cliff-stairs.webp";
import coveView from "@/assets/photos/cove-view.webp";
import ensuite from "@/assets/photos/ensuite.webp";
import facade from "@/assets/photos/facade.webp";
import frontGarden from "@/assets/photos/front-garden.webp";
import frontWalk from "@/assets/photos/front-walk.webp";
import gate from "@/assets/photos/gate.webp";
import guestBath from "@/assets/photos/guest-bath.webp";
import kitchen from "@/assets/photos/kitchen.webp";
import laundry from "@/assets/photos/laundry.webp";
import living from "@/assets/photos/living.webp";
import master from "@/assets/photos/master.webp";
import materials from "@/assets/photos/materials.webp";
import terrace from "@/assets/photos/terrace.webp";
import workRoom from "@/assets/photos/work-room.webp";
import workout from "@/assets/photos/workout.webp";
import roomsFromPlans from "./blueprint-rooms.json";

export const HOUSE_NAME = "Cove House";

export const photos = {
  aerial, backGate, bedroom2, cliffStairs, coveView, ensuite, facade, frontGarden, frontWalk,
  gate, guestBath, kitchen, laundry, living, master, materials, terrace, workRoom, workout,
};

type Floor = "ground" | "upper";

/** Net areas come straight from the CAD model (tools/blueprint). */
export function areaOf(id: string): number | undefined {
  const all = [...roomsFromPlans.ground, ...roomsFromPlans.upper];
  return all.find((r) => r.id === id)?.area;
}

export type Room = {
  id: string;
  name: string;
  floor: Floor;
  note: string;
  image: StaticImageData;
  alt: string;
};

export const rooms: Room[] = [
  {
    id: "living", name: "Living room", floor: "ground", image: living,
    note: "Arched doors open straight onto the terrace. A quiet prayer corner sits by the side window.",
    alt: "Living room with linen sofas, travertine floor and tall arched doors to the terrace",
  },
  {
    id: "kitchen", name: "Kitchen and dining", floor: "ground", image: kitchen,
    note: "Sage glazed tiles inside the arched hood, an island for four and a walk-in pantry.",
    alt: "Kitchen with sage green glazed tile backsplash in an arched alcove, marble island and oak dining table",
  },
  {
    id: "bedroom-2", name: "Bedroom 2", floor: "ground", image: bedroom2,
    note: "The second bedroom doubles as the guest room, next to its own bathroom.",
    alt: "Ground floor bedroom with linen bedding under an arched plaster niche",
  },
  {
    id: "guest-bath", name: "Guest bath", floor: "ground", image: guestBath,
    note: "Terracotta, sand and ochre glaze to two thirds height, with a tiled arched niche.",
    alt: "Guest bathroom with warm terracotta glazed tiles, oak vanity and stone basin",
  },
  {
    id: "workout", name: "Workout", floor: "ground", image: workout,
    note: "A small, bright room for a mat, a rack and a mirror, with a window to the side garden.",
    alt: "Small home workout room with a yoga mat, dumbbell rack and arched mirror",
  },
  {
    id: "laundry", name: "Laundry yard", floor: "ground", image: laundry,
    note: "Behind the garage under a pergola, with the foot rinse on the way in from the beach.",
    alt: "Covered laundry and drying yard with a brass foot rinse tap set into a plaster wall",
  },
  {
    id: "master", name: "Master bedroom", floor: "upper", image: master,
    note: "A king bed under an arched niche and doors to the long balcony over the terrace.",
    alt: "Master bedroom with king bed under an arched plaster niche and balcony doors with sea view",
  },
  {
    id: "ensuite", name: "Ensuite", floor: "upper", image: ensuite,
    note: "A freestanding stone tub and a sea-glass mosaic shower wall behind a plaster arch.",
    alt: "Ensuite bathroom with freestanding stone bathtub and a blue-grey glossy mosaic shower wall",
  },
  {
    id: "work-room", name: "Work room", floor: "upper", image: workRoom,
    note: "A long room with a sit-stand desk, built-in shelves and a balcony at each end.",
    alt: "Work room with oak sit-stand desk, ultrawide monitor and arched glass door to a balcony",
  },
];

export const facts = [
  { value: "1,000", unit: "m²", label: "Plot, 20 by 50 metres" },
  { value: "286", unit: "m²", label: "Over two floors" },
  { value: "2", unit: "", label: "Bedrooms" },
  { value: "6", unit: "m", label: "Above the cove" },
];

export type Stop = { at: string; title: string; text: string; image: StaticImageData; alt: string };

export const walk: Stop[] = [
  {
    at: "0 m", title: "The front gate", image: gate,
    text: "Solid timber with an arched top, set between stone pillars and exactly as tall as the 3 m hedge.",
    alt: "Arched solid timber gate between stone pillars in a tall clipped hedge, the house beyond",
  },
  {
    at: "0 to 21 m", title: "The front garden", image: frontGarden,
    text: "Stepping stones and lavender to the door, a picnic tree on the lawn and columnar thuja along the drive.",
    alt: "Front garden with stepping-stone walk lined with lavender and a row of columnar thuja",
  },
  {
    at: "21 m", title: "The front door", image: frontWalk,
    text: "Granite stones with grass in the joints lead straight to the arched door, on the line of the gate.",
    alt: "Narrow granite stepping-stone path with grass joints leading to the arched front door",
  },
  {
    at: "34 m", title: "The terrace", image: terrace,
    text: "A row of arches as wide as the house, with the dining table, the BBQ and a foot rinse by the path.",
    alt: "Covered arched terrace at sunset with outdoor dining table and stone BBQ counter",
  },
  {
    at: "50 m", title: "The back gate", image: backGate,
    text: "A twin of the front gate. On the far side the garden stops at the edge of the limestone bluff.",
    alt: "Arched back gate in the hedge looking down over stone stairs to a private cove",
  },
  {
    at: "−6 m", title: "The cove", image: cliffStairs,
    text: "Thirty-six stone steps in three flights down to a beach closed in by two headlands.",
    alt: "Stone stairs with an iron handrail descending a limestone bluff to a white sand cove",
  },
];

export const sheets = [
  { id: "site", number: "A-01", title: "Site plan", scale: "1:200" },
  { id: "ground", number: "A-02", title: "Ground floor", scale: "1:100" },
  { id: "upper", number: "A-03", title: "Upper floor", scale: "1:100" },
  { id: "section", number: "A-04", title: "Section A-A", scale: "1:200" },
] as const;

export type SheetId = (typeof sheets)[number]["id"];

export const roomLists = roomsFromPlans;

/** Photo shown when a room is picked on a plan; rooms without a render show the drawing only. */
export const planPhotos: Record<string, StaticImageData> = {
  living, kitchen, "bedroom-2": bedroom2, "guest-bath": guestBath, workout, laundry, terrace,
  entrance: frontWalk, master, ensuite, "work-room": workRoom, balcony: terrace,
};
