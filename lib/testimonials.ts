import { readJson, updateJson } from "./store";

/** Short quotes from parents and students, managed in the CMS and shown on the homepage. */

export type TestimonialStatus = "Published" | "Draft";
export type Testimonial = {
  id: string;
  name: string;
  role: string;   // e.g. "Parent · Grade 6 student"
  quote: string;
  status: TestimonialStatus;
};

export const TESTIMONIALS_FILE = "testimonials.json";

export const getTestimonials = () => readJson<Testimonial[]>(TESTIMONIALS_FILE);
export const updateTestimonials = (mutate: (t: Testimonial[]) => Testimonial[]) =>
  updateJson<Testimonial[]>(TESTIMONIALS_FILE, mutate);

export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  return (await getTestimonials()).filter((t) => t.status === "Published");
}
