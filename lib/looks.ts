import type { CoupleLooks, CustomLookPiece, LookPerson, LookProgress, LookStatus } from "./types";

export const LOOK_STATUSES: { value: LookStatus; label: string }[] = [
  { value: "needed", label: "To shop" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "bought", label: "Bought" },
  { value: "skipped", label: "Not for us" },
];

export const LOOK_ZONES = [
  { id: "head", label: "Head & hair" },
  { id: "ears", label: "Ears" },
  { id: "face", label: "Face" },
  { id: "neck", label: "Neck" },
  { id: "arms", label: "Arms & hands" },
  { id: "outfit", label: "Outfit" },
  { id: "waist", label: "Waist" },
  { id: "feet", label: "Legs & feet" },
  { id: "bag", label: "Bag" },
] as const;

export type LookZoneId = (typeof LOOK_ZONES)[number]["id"];

export const LOOK_CEREMONIES = [
  {
    id: "mehendi",
    label: "Mehendi",
    note: "Colourful and easy to sit in. Long necklaces end up in the paste.",
  },
  {
    id: "haldi",
    label: "Haldi",
    note: "Yellow clothes you can stain. Leave heavy metal jewellery off.",
  },
  {
    id: "sangeet",
    label: "Sangeet",
    note: "A look you can dance in. Keep the wedding outfit for the ceremony.",
  },
  {
    id: "wedding",
    label: "Wedding",
    note: "The full set, from the head jewellery or safa down to footwear you can take off for the pheras.",
  },
  {
    id: "reception",
    label: "Reception",
    note: "A second look. Repeat a wedding piece only when you mean to.",
  },
  {
    id: "engagement",
    label: "Engagement / Roka",
    note: "Optional. Mark the ceremony off if you are not holding one.",
  },
] as const;

export type LookCeremonyId = (typeof LOOK_CEREMONIES)[number]["id"];

export interface LookPiece {
  id: string;
  person: LookPerson;
  ceremony: LookCeremonyId;
  zone: LookZoneId;
  name: string;
  detail: string;
}

const bride: LookPiece[] = [
  piece("bride", "haldi", "head", "Gajra or fresh flowers", "Haldi stains metal, so skip a maang tikka for this ceremony."),
  piece("bride", "haldi", "ears", "Small studs, or none", "Studs are easier to clean than dangling earrings."),
  piece("bride", "haldi", "face", "Makeup you can wash off", "A light base, or none. Save the bridal makeup for the wedding."),
  piece("bride", "haldi", "arms", "A few glass bangles", "Not the wedding chooda. Glass can be replaced if it stains."),
  piece("bride", "haldi", "outfit", "Yellow cotton set", "Kurta or lehenga, plus a dupatta. Buy something you are happy to stain."),
  piece("bride", "haldi", "feet", "Flats you can stain", "Cheap juttis, or plan to go barefoot."),
  piece("bride", "haldi", "bag", "A change of clothes", "Something dry for after the haldi, and a towel."),

  piece("bride", "mehendi", "head", "Flowers or a light passa", "Keep it light so it does not snag while you sit."),
  piece("bride", "mehendi", "ears", "Earrings that stay clear of the hands", "Shorter earrings are easier than a long bridal pair."),
  piece("bride", "mehendi", "face", "Daytime makeup and a bindi", "Bright enough for photos, light enough for a long afternoon."),
  piece("bride", "mehendi", "face", "Nath", "Only if your family wears one at the mehendi. The chain should not fall into the paste."),
  piece("bride", "mehendi", "neck", "Choker or a short necklace", "A long haar sits in the mehendi."),
  piece("bride", "mehendi", "arms", "Bangle stack", "The colourful stack is the mehendi look. Leave the wedding chooda for the ceremony."),
  piece("bride", "mehendi", "arms", "Rings you can take off", "You will want your palms clear while the paste goes on."),
  piece("bride", "mehendi", "outfit", "Bright lehenga, sharara, or anarkali", "Include the blouse and dupatta. Yellow, green, orange, and pink are the usual colours."),
  piece("bride", "mehendi", "waist", "Kamarbandh", "Worth buying only if the blouse is short and you want the waist finished."),
  piece("bride", "mehendi", "feet", "Embroidered juttis or kolhapuris", "You will be seated for hours. Skip stilettos."),
  piece("bride", "mehendi", "bag", "Potli", "A small bag that can sit beside you, plus a few dupatta pins."),

  piece("bride", "sangeet", "head", "Hair jewellery or a side passa", "A maang tikka is optional. This should not be the full wedding head set."),
  piece("bride", "sangeet", "ears", "Statement earrings", "They need to read on camera while you are moving."),
  piece("bride", "sangeet", "face", "Evening makeup", "Book it separately from the wedding-morning makeup."),
  piece("bride", "sangeet", "neck", "One necklace", "A choker or a mid-length piece. One strong necklace is enough."),
  piece("bride", "sangeet", "arms", "Bangles or a cuff", "Enough to show in photos, not so many that they catch on people while you dance."),
  piece("bride", "sangeet", "outfit", "Dance outfit", "Lehenga and blouse, or a gown, that you can move in. Keep it separate from the wedding lehenga."),
  piece("bride", "sangeet", "feet", "Shoes you can dance in", "Block heels or juttis. Pack a spare flat pair."),
  piece("bride", "sangeet", "bag", "Clutch", "Something small, with dupatta pins and a spare blouse hook inside."),

  piece("bride", "wedding", "head", "Maang tikka", "The centre-part piece. Check that it sits with the bun, not in front of it."),
  piece("bride", "wedding", "head", "Passa or jhoomar", "The side hair piece. Try it with the maang tikka so the two do not collide."),
  piece("bride", "wedding", "head", "Juda pins and bun accessories", "Pins, a gajra if you want flowers, and whatever holds the bun through the pheras."),
  piece("bride", "wedding", "ears", "Bridal earrings", "Jhumka or chandbali, matched to the necklace set."),
  piece("bride", "wedding", "face", "Bridal makeup", "Book the artist for the wedding morning, including a trial if you want one."),
  piece("bride", "wedding", "face", "Nath with chain", "Skip it if your family does not wear a nath. If you do, buy the chain that hooks into the hair."),
  piece("bride", "wedding", "face", "Bindi", "A bridal bindi, plus a spare."),
  piece("bride", "wedding", "neck", "Rani haar", "The long necklace. It should sit over the blouse, not under the dupatta fold you cannot move."),
  piece("bride", "wedding", "neck", "Choker", "Fills the neck under the long haar so portraits are not bare at the collar."),
  piece("bride", "wedding", "arms", "Chooda or bridal bangles", "The set you will wear for the pheras. Confirm who brings it if a relative is gifting it."),
  piece("bride", "wedding", "arms", "Kaleere", "Only if your family hangs them from the chooda."),
  piece("bride", "wedding", "arms", "Hathphool", "The hand harness from bracelet to ring. Try it over the mehendi."),
  piece("bride", "wedding", "arms", "Bajuband", "An armlet. Skip it if the blouse sleeves cover the upper arm."),
  piece("bride", "wedding", "arms", "Rings", "Include any ring used in the ceremony."),
  piece("bride", "wedding", "outfit", "Bridal lehenga or saree", "Lehenga, blouse, and dupatta, or saree, blouse, and petticoat. The dupatta should be able to cover the head if that is your custom for the pheras."),
  piece("bride", "wedding", "waist", "Kamarbandh", "The waist belt. Measure it over the blouse, not over a t-shirt."),
  piece("bride", "wedding", "feet", "Footwear you can take off", "Juttis or heels for the entrance. You will remove them for the pheras, so they need to come off quickly."),
  piece("bride", "wedding", "feet", "Payal", "Anklets. Check they do not fight with the footwear."),
  piece("bride", "wedding", "feet", "Toe rings", "Bichua, if that is your custom. Buy the pair that fits before the morning of the wedding."),
  piece("bride", "wedding", "bag", "A small pouch for the vidai", "Safety pins, blotting paper, and a place for the phone."),

  piece("bride", "reception", "head", "A lighter hair piece, or none", "Leave the maang tikka and passa for the wedding unless you want the same look twice."),
  piece("bride", "reception", "ears", "Earrings for this outfit", "A second pair, matched to the reception necklace."),
  piece("bride", "reception", "face", "Evening makeup and a smaller bindi", "A refresh if the reception follows the wedding, or a separate booking if it is another day."),
  piece("bride", "reception", "neck", "A lighter necklace", "Often a different set from the rani haar."),
  piece("bride", "reception", "arms", "Fewer bangles and a ring", "One cuff or a short stack is enough."),
  piece("bride", "reception", "outfit", "Reception outfit in another colour", "Lehenga, gown, or saree. Include the blouse and dupatta or cape."),
  piece("bride", "reception", "feet", "Heels, and a pair you can stand in", "One pair for the entrance and one pair for the rest of the night."),
  piece("bride", "reception", "bag", "Clutch", "Sized for the phone, lipstick, and pins."),

  piece("bride", "engagement", "head", "A small maang tikka, if you want one", "Easy to skip. Engagement jewellery is usually lighter than the wedding set."),
  piece("bride", "engagement", "ears", "Earrings", "A pair that suits daylight photos."),
  piece("bride", "engagement", "face", "Daytime makeup and a small bindi", "Lighter than the wedding makeup."),
  piece("bride", "engagement", "neck", "A delicate necklace", "One fine piece is enough."),
  piece("bride", "engagement", "arms", "A few bangles, and the ring", "Include the ring if you are exchanging one at this event."),
  piece("bride", "engagement", "outfit", "Lighter lehenga, saree, or anarkali", "Include the blouse and dupatta. This is not the bridal outfit."),
  piece("bride", "engagement", "feet", "Heels or juttis", "Whatever you can stand in for the gathering."),
  piece("bride", "engagement", "bag", "Clutch", "A small bag for the event."),
];

const groom: LookPiece[] = [
  piece("groom", "haldi", "outfit", "Yellow cotton kurta set", "Kurta with pajama or churidar, in a cloth you can stain."),
  piece("groom", "haldi", "neck", "Stole or gamchha", "A cotton stole is easier to wash than an embroidered wedding stole."),
  piece("groom", "haldi", "arms", "A watch you can do without", "Leave a good watch off. Haldi is hard to get out of a strap."),
  piece("groom", "haldi", "feet", "Mojaris you can stain", "An old pair, or go barefoot."),
  piece("groom", "haldi", "bag", "A spare kurta", "For after the ceremony."),

  piece("groom", "mehendi", "outfit", "Kurta set or indo-western", "Kurta, bottom, and a nehru jacket or bandi if you want a layer."),
  piece("groom", "mehendi", "neck", "Stole", "A colour that sits with the bride's mehendi outfit, without matching it exactly."),
  piece("groom", "mehendi", "arms", "Watch or a bracelet", "One of the two is enough."),
  piece("groom", "mehendi", "feet", "Juttis or kolhapuris", "You will be in and out of the seating. Skip new leather dress shoes."),
  piece("groom", "mehendi", "bag", "Pocket square", "Optional. Useful if the jacket has a pocket and looks empty."),

  piece("groom", "sangeet", "head", "Pagdi", "Only if it matches this outfit. Many grooms leave the safa for the wedding."),
  piece("groom", "sangeet", "outfit", "An outfit you can dance in", "Sherwani, indo-western, or a suit, including the bottom and any jacket."),
  piece("groom", "sangeet", "neck", "Stole or pocket square", "A stole with a sherwani. A pocket square if it is a suit."),
  piece("groom", "sangeet", "arms", "Watch, and cufflinks if you need them", "Cufflinks only when the cuffs are made for them."),
  piece("groom", "sangeet", "waist", "Belt or kamarbandh", "Whichever the outfit is cut for."),
  piece("groom", "sangeet", "feet", "Mojaris or shoes with a grip", "You will be on a floor that may be smooth."),
  piece("groom", "sangeet", "bag", "Boutonniere", "A fresh one on the day, if the outfit has a lapel or a pocket."),

  piece("groom", "wedding", "head", "Safa or pagdi", "Sized when you try the sherwani, so the fabric and the shoulder line agree."),
  piece("groom", "wedding", "head", "Kalgi or sarpech", "The ornament on the turban. Buy it with the safa so the clip fits."),
  piece("groom", "wedding", "head", "Sehra", "A beaded or floral veil, if your family uses one. Skip it if you do not."),
  piece("groom", "wedding", "face", "Barber", "Book the trim for the day before, not in the hour before you dress."),
  piece("groom", "wedding", "ears", "Studs", "Only if you wear them. Otherwise mark this not for you."),
  piece("groom", "wedding", "neck", "Mala", "Pearl or polki. It should sit on the sherwani, above the stole."),
  piece("groom", "wedding", "neck", "Sherwani stole", "The dupatta that comes with the sherwani, or one you buy to match."),
  piece("groom", "wedding", "arms", "Brooch", "For the stole or the sherwani placket."),
  piece("groom", "wedding", "arms", "Watch or bracelet", "One piece that matches the metal of the brooch and the mala."),
  piece("groom", "wedding", "outfit", "Sherwani or achkan", "Include the inner kurta and the churidar or the bottom that belongs with it."),
  piece("groom", "wedding", "waist", "Kamarbandh", "Tied over the sherwani. Try the length when the outfit is on."),
  piece("groom", "wedding", "feet", "Mojaris", "In the sherwani colour. Walk in them before the wedding day."),
  piece("groom", "wedding", "bag", "Stole pins and a handkerchief", "Pins fail on the day. Carry extras."),

  piece("groom", "reception", "outfit", "Suit, tuxedo, or bandhgala", "Include the trousers. This is usually not the wedding sherwani."),
  piece("groom", "reception", "neck", "Tie or nothing extra", "A suit often wants a tie. A bandhgala usually does not."),
  piece("groom", "reception", "arms", "Watch and cufflinks", "Match the metal. Skip cufflinks on a bandhgala if the cuffs are plain."),
  piece("groom", "reception", "waist", "Belt", "Leather, in the same colour as the shoes."),
  piece("groom", "reception", "feet", "Formal shoes", "Broken in before the night."),
  piece("groom", "reception", "bag", "Pocket square and a boutonniere", "The pocket square stays. The flower is for the entrance."),

  piece("groom", "engagement", "outfit", "Bandhgala, nehru jacket, or suit", "Include the trousers or churidar."),
  piece("groom", "engagement", "neck", "Pocket square or a light stole", "One of the two, matched to the jacket."),
  piece("groom", "engagement", "arms", "Watch", "The one you will actually wear that day."),
  piece("groom", "engagement", "feet", "Shoes or mojaris", "Formal shoes with a suit, mojaris with a bandhgala or nehru jacket."),
  piece("groom", "engagement", "bag", "Pocket square", "Skip it if the jacket has no pocket, or if the stole already finishes the look."),
];

function piece(
  person: LookPerson,
  ceremony: LookCeremonyId,
  zone: LookZoneId,
  name: string,
  detail: string,
): LookPiece {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return { id: `${person}-${ceremony}-${zone}-${slug}`, person, ceremony, zone, name, detail };
}

export const LOOK_PIECES: LookPiece[] = [...bride, ...groom];

export function blankCoupleLooks(): CoupleLooks {
  return { progress: [], custom: [], skippedCeremonies: [] };
}

export function isCeremonyOff(looks: CoupleLooks, person: LookPerson, ceremony: string) {
  return looks.skippedCeremonies.some((item) => item.person === person && item.ceremony === ceremony);
}

export function piecesFor(person: LookPerson, ceremony: string, custom: CustomLookPiece[]) {
  const catalog = LOOK_PIECES.filter((item) => item.person === person && item.ceremony === ceremony).map((item) => ({
    ...item,
    custom: false,
  }));
  const extra = custom
    .filter((item) => item.person === person && item.ceremony === ceremony)
    .map((item) => ({ ...item, custom: true }));
  return [...catalog, ...extra];
}

export function progressFor(looks: CoupleLooks, pieceId: string): Pick<LookProgress, "status" | "note"> {
  const row = looks.progress.find((item) => item.pieceId === pieceId);
  return { status: row?.status ?? "needed", note: row?.note ?? "" };
}

export function zoneLabel(zone: string) {
  return LOOK_ZONES.find((item) => item.id === zone)?.label ?? zone;
}

const LOOK_STATUS_VALUES = new Set<LookStatus>(["needed", "shortlisted", "bought", "skipped"]);

export function normalizeCoupleLooks(value: unknown): CoupleLooks {
  const blank = blankCoupleLooks();
  if (!value || typeof value !== "object") return blank;
  const raw = value as Partial<CoupleLooks>;
  const progress = Array.isArray(raw.progress)
    ? raw.progress.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Partial<LookProgress>;
        if (typeof row.pieceId !== "string" || !row.pieceId) return [];
        const status = LOOK_STATUS_VALUES.has(row.status as LookStatus) ? (row.status as LookStatus) : "needed";
        return [{ pieceId: row.pieceId, status, note: typeof row.note === "string" ? row.note : "" }];
      })
    : [];
  const custom = Array.isArray(raw.custom)
    ? raw.custom.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Partial<CustomLookPiece>;
        if (typeof row.id !== "string" || !row.id || typeof row.name !== "string" || !row.name.trim()) return [];
        if (row.person !== "bride" && row.person !== "groom") return [];
        return [
          {
            id: row.id,
            person: row.person,
            ceremony: typeof row.ceremony === "string" ? row.ceremony : "wedding",
            zone: typeof row.zone === "string" ? row.zone : "outfit",
            name: row.name.trim(),
            detail: typeof row.detail === "string" ? row.detail : "",
          },
        ];
      })
    : [];
  const skippedCeremonies = Array.isArray(raw.skippedCeremonies)
    ? raw.skippedCeremonies.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as { person?: string; ceremony?: string };
        const person: LookPerson | null = row.person === "bride" || row.person === "groom" ? row.person : null;
        if (!person || typeof row.ceremony !== "string" || !row.ceremony) return [];
        return [{ person, ceremony: row.ceremony }];
      })
    : [];
  return { progress, custom, skippedCeremonies };
}
