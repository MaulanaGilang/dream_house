import type { StaticImageData } from "next/image";

import aerial from "@/assets/photos/aerial.webp";
import bedroom2 from "@/assets/photos/bedroom-2.webp";
import bougainvillea from "@/assets/photos/bougainvillea.webp";
import coveView from "@/assets/photos/cove-view.webp";
import ensuite from "@/assets/photos/ensuite.webp";
import facade from "@/assets/photos/facade.webp";
import gate from "@/assets/photos/gate.webp";
import guestBath from "@/assets/photos/guest-bath.webp";
import kitchen from "@/assets/photos/kitchen.webp";
import laundry from "@/assets/photos/laundry.webp";
import living from "@/assets/photos/living.webp";
import master from "@/assets/photos/master.webp";
import portal from "@/assets/photos/portal.webp";
import rear from "@/assets/photos/rear.webp";
import rearNight from "@/assets/photos/rear-night.webp";
import terrace from "@/assets/photos/terrace.webp";
import workRoom from "@/assets/photos/work-room.webp";
import workout from "@/assets/photos/workout.webp";
import roomsFromPlans from "./blueprint-rooms.json";

export const HOUSE_NAME = "La Casa";

export const photos = {
  aerial, bedroom2, bougainvillea, coveView, ensuite, facade, gate, guestBath, kitchen, laundry,
  living, master, portal, rear, rearNight, terrace, workRoom, workout,
};

/** Net areas come straight from the CAD model (tools/blueprint). */
export function areaOf(id: string): number | undefined {
  return [...roomsFromPlans.ground, ...roomsFromPlans.upper].find((r) => r.id === id)?.area;
}

export type Slide = { image: StaticImageData; alt: string };

export type Reason = { title: string; script?: string; text: string; slides: Slide[] };

export const reasons: Reason[] = [
  {
    title: "Private by design",
    text: "A 3 m clipped hedge closes the garden on all four sides, with a dry-stone wall outside it. Two solid timber gates, one at the road and one at the sea, are the only ways in.",
    slides: [
      { image: gate, alt: "The wide arched timber front gate between limestone pillars in the tall hedge" },
      { image: portal, alt: "The arched plaster portal with its solid timber door in the back hedge, the cove beyond" },
      { image: aerial, alt: "Aerial view of the plot closed in by the hedge on all four sides" },
    ],
  },
  {
    title: "Above the cove",
    text: "The garden ends at a 6 m limestone bluff. Thirty-six stone steps go down to a crescent of sand that two rocky headlands hide from the coast.",
    slides: [
      { image: coveView, alt: "The house seen from the water: beach, bluff, stone stairs and the arched portal" },
      { image: portal, alt: "The back portal with the cove and headlands beyond" },
    ],
  },
  {
    title: "Made for a family",
    text: "Two bedrooms, a long work room and a living floor that opens through four arches to a covered terrace and a lawn for play.",
    slides: [
      { image: rear, alt: "The back of the house: four arches over the terrace and a balcony above" },
      { image: terrace, alt: "The covered terrace under the arches with a long oak dining table" },
      { image: living, alt: "The living room with linen sofas and tall arched doors to the terrace" },
    ],
  },
];

export type Room = { id: string; name: string; floor: "Ground" | "Upper"; note: string; image: StaticImageData; alt: string };

export const rooms: Room[] = [
  { id: "living", name: "Living room", floor: "Ground", image: living,
    note: "Arched doors to the terrace, a wide arch to the kitchen and a prayer corner by the side window.",
    alt: "Living room with linen sofas, a jute rug and tall arched doors to the terrace" },
  { id: "kitchen", name: "Kitchen and dining", floor: "Ground", image: kitchen,
    note: "Sage glazed tiles in the arched hood, a marble island and a walk-in pantry.",
    alt: "Kitchen with a sage tiled arched hood alcove, marble island and oak dining table" },
  { id: "bedroom-2", name: "Bedroom two", floor: "Ground", image: bedroom2,
    note: "The guest room at the front, next to its own bathroom.",
    alt: "Ground floor bedroom with linen bedding, cane wardrobe and arched windows" },
  { id: "guest-bath", name: "Guest bath", floor: "Ground", image: guestBath,
    note: "Terracotta, sand and ochre glaze to two thirds height.",
    alt: "Guest bathroom with warm terracotta glazed tiles and an oak vanity" },
  { id: "workout", name: "Workout", floor: "Ground", image: workout,
    note: "A mat, a rack and an arched mirror, with a window to the side garden.",
    alt: "Small workout room with a rubber floor, dumbbell rack and arched mirror" },
  { id: "master", name: "Master bedroom", floor: "Upper", image: master,
    note: "A king bed and tall arched doors to the long balcony over the terrace.",
    alt: "Master bedroom with a king bed and arched balcony doors with a view of the sea" },
  { id: "ensuite", name: "Ensuite", floor: "Upper", image: ensuite,
    note: "A stone tub under the front window and a sea-glass mosaic shower.",
    alt: "Ensuite with a freestanding stone tub and a blue-grey glazed mosaic shower" },
  { id: "work-room", name: "Work room", floor: "Upper", image: workRoom,
    note: "A sit-stand desk at the front balcony doors and shelves along one wall.",
    alt: "Long work room with built-in shelves and a sit-stand desk facing arched balcony doors" },
  { id: "laundry", name: "Laundry yard", floor: "Ground", image: laundry,
    note: "Behind the garage under a pergola, with the foot rinse on the way in.",
    alt: "Laundry yard under a timber pergola with a washer, drying line and a brass foot rinse" },
];

/** The walk from the road to the sand, measured along the plot (site plan v5). */
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
  entrance: facade, master, ensuite, "work-room": workRoom, balcony: rear,
};
