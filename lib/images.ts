/**
 * Placeholder photography, keyed so every image can be swapped from the CMS
 * (Media Library) without touching layout code. Replace these URLs with real
 * photographs of The School of STEAM Education when they are available.
 */
const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const img = {
  hero: u("photo-1571260899304-425eee4c7efc", 2200), // students collaborating
  about: u("photo-1509062522246-3755977927d7"), // teacher with class
  science: u("photo-1554475901-4538ddfbccc2"),
  technology: u("photo-1581090464777-f3220bbe1b8b"),
  engineering: u("photo-1567168544646-208fa5d408fb"),
  arts: u("photo-1513364776144-60967b0f800f"),
  math: u("photo-1596495578065-6e0763fa1178"),
  classroom: u("photo-1580582932707-520aed937b7b"),
  library: u("photo-1521587760476-6c12a4b040da"),
  lab: u("photo-1532094349884-543bc11b234d"),
  computerLab: u("photo-1610484826967-09c5720778c7"), // replaced a photo Unsplash removed
  playground: u("photo-1543269865-cbf427effbad"),
  sports: u("photo-1461896836934-ffe607ba8211"),
  artRoom: u("photo-1503676260728-1c00da094a0b"),
  earlyEd: u("photo-1587654780291-39c9404d746b"),
  primary: u("photo-1427504494785-3a9ca7044f45"),
  secondary: u("photo-1523240795612-9a054b0db644"),
  steamLab: u("photo-1564981797816-1043664bf78d"),
  event: u("photo-1524178232363-1fb2b075b655"),
  tour: u("photo-1544717297-fa95b6ee9643"),
  music: u("photo-1514320291840-2e0a9bf2a9ae"),
  celebration: u("photo-1511578314322-379afb476865"),
  campus: u("photo-1580537659466-0a9bfa916a54"),
  studentsOutdoor: u("photo-1529390079861-591de354faf5"),
  login: u("photo-1522202176988-66273c2fd55f", 1800),
};
export type ImageKey = keyof typeof img;
