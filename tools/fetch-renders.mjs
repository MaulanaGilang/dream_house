// Download the La Casa renders (all guided by the massing model built from design/site-plan-1000m2.svg)
// and store web-ready copies in src/assets/photos. Usage: node tools/fetch-renders.mjs
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_3HRGlCWAJ2JSOIUWtb4HPHGZ7c7/";
const RAW = path.resolve("design/renders");
const OUT = path.resolve("src/assets/photos");

// name -> Higgsfield result file (the job id is in the name)
const RENDERS = {
  gate: "hf_20261004_113715_db14bf50-bb32-4e73-bc34-2219e88afafd.png",
  facade: "hf_20261004_113715_afaec0b4-c045-4a2e-91b4-878ca7781254.png",
  // round 3: single front gate, driveway curving inside the hedge into its right half (site plan v5)
  // round 5: two-car S driveway through the gate, walk stops at its edge (site plan v7; collage + clean-up)
  aerial: "hf_20261006_025813_4762eca8-a7c8-4143-81c5-3cb57f71e1b3.png",
  "front-balcony": "hf_20261005_130048_feb110a6-200b-4364-98ac-a4e9f9b29fb9.png",
  hall: "hf_20261005_130115_21dabdf0-e1c5-48d6-b7aa-8008f427bc17.png",
  portal: "hf_20261004_113715_91288aff-d94c-4b6b-b970-a1f7677f625e.png",
  "cove-view": "hf_20261006_030133_ba2e90ad-6bc1-402d-8a7e-644b88fd03cc.png",
  rear: "hf_20261006_025524_d431333f-753c-47bb-aae0-fb6b4482140c.png",
  terrace: "hf_20261004_113945_b97be51a-a64d-46ed-a51d-f5631e098aeb.png",
  laundry: "hf_20261004_113944_bd44d63f-d3fc-4c33-9ad3-1c56727a9ed0.png",
  "rear-night": "hf_20261006_025808_62f27fdb-cdc1-4498-9c1e-01f2af57f509.png",
  living: "hf_20261004_113944_a4f384f9-7bef-45d5-b3e4-da48355a69a1.png",
  kitchen: "hf_20261004_113945_d6172376-5667-4e81-a259-f6e862257505.png",
  "bedroom-2": "hf_20261004_113946_6e6b7e6f-3391-4e47-aeb9-9ab19cab398b.png",
  "guest-bath": "hf_20261004_114455_d51a88ff-2926-4130-bbcf-f0045dbbaa3e.png",
  workout: "hf_20261004_114456_10860f53-6e2f-44cf-bc8b-4b53e871292c.png",
  master: "hf_20261006_025810_bc94dacc-11ed-4639-9f9f-efba95c2d541.png",
  ensuite: "hf_20261004_114457_feafd5d7-e700-4e85-9a7a-2f2daabf1a69.png",
  "work-room": "hf_20261004_114456_6411475f-de81-4caa-b047-76f31f7f4f5e.png",
  // round 3: rooms that had no render, the entrance as a ruang tamu, and lavender + rose cut-outs
  entrance: "hf_20261005_072038_d7c9ece1-8855-4cab-9a69-9c460a32672f.png",
  "walk-in": "hf_20261005_072300_04b9a2ab-5474-4599-8d86-1fa48c32b5c5.png",
  landing: "hf_20261005_072108_32d4c471-711f-425e-b744-85a97fb3305e.png",
  // two-car garage (6 m, site plan v6): silver Civic Type R + GT-R R35, Ducati Streetfighter V4
  garage: "hf_20261005_083714_336ae2b5-e0af-4110-8142-64e3c4c45641.png",
  "boot-room": "hf_20261005_083116_78e03f3d-ca77-4729-a14a-82a48573506c.png",
  pantry: "hf_20261005_083656_fd5e097c-3e6f-43fd-afe6-05bf5d69a9e3.png",
  linen: "hf_20261005_083117_e62beb2c-ee75-44cd-b007-2dcabd9eb877.png",
  // maroon roses (recoloured from 33e759cd / 7c714bc3)
  "lavender-roses": "hf_20261005_083117_ead68fe8-3d98-4418-9dff-ded6ba39bdd9.png",
  "rose-branch": "hf_20261005_083116_c8c908c8-bf5f-4599-9138-61396032bc65.png",
};

// round 6: the back balcony gets a flowering pergola; round 7: rebuilt as ERA's cable pergola (square
// limestone pillars, dark steel beams, taut cables): rear d431333f is the source for rear-night, master, aerial, cove-view; lush flower masses for the sideways story (ERA's bougainvillea, in maroon roses and lavender)
Object.assign(RENDERS, {
  "bloom-cascade": "hf_20261005_140321_52f6ce6c-a4c4-4728-8a9f-efff0bf1f986.png",
  "bloom-mound": "hf_20261005_140322_4e59c7fc-8e7e-4f4c-9e73-d2dffde2a5b9.png",
});

// generated on a transparent background: keep the alpha, trim the empty margin
const CUTOUTS = new Set(["lavender-roses", "rose-branch", "bloom-cascade", "bloom-mound"]);

await mkdir(RAW, { recursive: true });
await mkdir(OUT, { recursive: true });

for (const [name, file] of Object.entries(RENDERS)) {
  const raw = path.join(RAW, `${name}.png`);
  try {
    await access(raw);
  } catch {
    const res = await fetch(CDN + file);
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    await writeFile(raw, Buffer.from(await res.arrayBuffer()));
  }
  if (CUTOUTS.has(name)) {
    const out = await sharp(raw).trim().resize({ width: name.startsWith("bloom") ? 1600 : 1200, withoutEnlargement: true }).webp({ quality: 84, alphaQuality: 90 }).toFile(path.join(OUT, `${name}.webp`));
    console.log(name.padEnd(14), `${out.width}x${out.height}`, `${Math.round(out.size / 1024)} KB`);
    continue;
  }
  const info = await sharp(raw)
    .resize({ width: 2400, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(OUT, `${name}.webp`));
  console.log(name.padEnd(14), `${info.width}x${info.height}`, `${Math.round(info.size / 1024)} KB`);
}
