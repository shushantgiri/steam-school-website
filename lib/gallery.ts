import { readJson, updateJson } from "./store";
import type { Status } from "./types";

/** Gallery content: albums of photos, stored as one CMS document. */

export type GalleryPhoto = { id: string; src: string; alt: string; category: string; tall?: boolean };
export type GalleryAlbum = { id: string; name: string; status: Status; cover: string; photos: GalleryPhoto[] };

export const GALLERY_FILE = "gallery.json";

export const getAlbums = () => readJson<GalleryAlbum[]>(GALLERY_FILE);
export const updateAlbums = (mutate: (a: GalleryAlbum[]) => GalleryAlbum[]) =>
  updateJson<GalleryAlbum[]>(GALLERY_FILE, mutate);

/** Photos of published albums only — what the public gallery renders. */
export async function getPublicPhotos(): Promise<GalleryPhoto[]> {
  const albums = await getAlbums();
  return albums.filter((a) => a.status === "Published").flatMap((a) => a.photos);
}
