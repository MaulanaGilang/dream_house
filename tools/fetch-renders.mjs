// Download the chosen Higgsfield renders and store web-ready WebP copies in src/assets/photos.
// Usage: node tools/fetch-renders.mjs
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_3HRGlCWAJ2JSOIUWtb4HPHGZ7c7/";
const RAW = path.resolve("design/renders");
const OUT = path.resolve("src/assets/photos");

// name -> Higgsfield result file (job id in the name)
const RENDERS = {
  aerial: "hf_20261004_100346_3ee15f3b-ff5f-4fc0-89e7-ead2eb179915.png",
  gate: "hf_20261004_100550_cbf51f21-af73-42db-8f90-46b45167c435.png",
  "cove-view": "hf_20261004_100549_2dffed04-7b79-4ed3-ae58-9ed9aedb4063.png",
  "back-gate": "hf_20261004_100550_5557645c-24c2-47b9-8d63-28492a58300e.png",
  "cliff-stairs": "hf_20261004_100549_69271653-44a9-46e1-85e6-59d5742fc9b0.png",
  facade: "hf_20261001_060625_1148c785-7121-4273-bfcf-72e8e612163c.png",
  "front-garden": "hf_20261004_061954_88dedc2b-8019-45d6-a859-d3e3f8489b78.png",
  "front-walk": "hf_20261004_061954_1a04687a-e3df-436b-b1cc-a548053e93cd.png",
  terrace: "hf_20261001_070734_7add675e-afd2-43b2-829d-b2b80b35ddb2.png",
  living: "hf_20261001_061433_5e7dd8c6-cb9b-4e00-bc21-4e3c1499acc4.png",
  kitchen: "hf_20261004_094512_076f9877-ba5c-45fd-8143-625131de0302.png",
  master: "hf_20261001_061433_34961bc8-4a1a-4205-b092-a9f448cb9bfd.png",
  ensuite: "hf_20261004_094512_34d318a4-661e-484d-8441-e5da547aa447.png",
  "work-room": "hf_20261001_061433_e7837ecb-cb50-431a-90d6-6ac061d6b609.png",
  "bedroom-2": "hf_20261001_061433_7e38db3c-2fcf-4e2c-95b0-b84d44bf4f45.png",
  workout: "hf_20261001_061433_0f960cd7-04ec-4d39-aee9-69a2c0d12178.png",
  "guest-bath": "hf_20261004_094512_dee0921f-dc9e-4b44-a3b0-c31c89169934.png",
  laundry: "hf_20261001_061432_2a5d59f9-36fc-4e98-9778-a6310f1c601a.png",
  materials: "hf_20261004_104123_4ef72a40-6e6c-436a-a3a0-d55be94594f7.png",
};

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
  const info = await sharp(raw)
    .resize({ width: 2400, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(path.join(OUT, `${name}.webp`));
  console.log(name.padEnd(14), `${info.width}x${info.height}`, `${Math.round(info.size / 1024)} KB`);
}
