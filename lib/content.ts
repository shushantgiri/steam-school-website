import { img } from "./images";

/* ------------------------------------------------------------------ */
/* Structural page content — the parts of the site that are design,    */
/* not day-to-day editing. Everything staff maintain (news, notices,   */
/* events, school details) lives in /data and is served by /api.       */
/* ------------------------------------------------------------------ */

export type { CalCategory, CalEvent, Post, PostCategory } from "./types";

// The public navigation now lives in lib/navigation.ts and is CMS-managed.

export const steam = [
  { key: "S", name: "Science", line: "Explore and understand the world.", image: img.science },
  { key: "T", name: "Technology", line: "Build digital confidence.", image: img.technology },
  { key: "E", name: "Engineering", line: "Design and solve real problems.", image: img.engineering },
  { key: "A", name: "Arts", line: "Imagine, create and express.", image: img.arts },
  { key: "M", name: "Mathematics", line: "Think logically and solve.", image: img.math },
];

export const journey = [
  { step: "01", name: "Explore", line: "Ask questions about the world around you." },
  { step: "02", name: "Create", line: "Turn ideas into real projects." },
  { step: "03", name: "Experiment", line: "Test, fail and improve." },
  { step: "04", name: "Collaborate", line: "Learn together, from each other." },
  { step: "05", name: "Present", line: "Communicate ideas with confidence." },
];

export type Program = {
  slug: string; name: string; ages: string; description: string; image: string; featured?: boolean;
  /** Photo slot id — lets the Media Library change this photo. */
  slot?: string;
};
export const programs: Program[] = [
  { slug: "steam-learning", slot: "academics-steam", name: "STEAM Learning", ages: "All grades", featured: true, image: img.steamLab,
    description: "Our signature programme. Science, technology, engineering, arts and mathematics taught as one connected way of thinking — through projects students design, build and present themselves." },
  { slug: "early-education", slot: "academics-early", name: "Early Education", ages: "Nursery – KG · Ages 3–5", image: img.earlyEd,
    description: "Play-based foundations in language, numbers and curiosity, in a warm and safe environment." },
  { slug: "primary-education", slot: "academics-primary", name: "Primary Education", ages: "Grades 1–5 · Ages 6–10", image: img.primary,
    description: "Strong academic basics with hands-on discovery in every subject." },
  { slug: "secondary-education", slot: "academics-secondary", name: "Secondary Education", ages: "Grades 6–10 · Ages 11–16", image: img.secondary,
    description: "Depth, rigour and independent thinking, preparing students for national exams and beyond." },
  { slug: "computer-technology", slot: "academics-computer", name: "Computer & Technology", ages: "Grades 3–10", image: img.computerLab,
    description: "Typing to programming — practical digital skills for a connected world." },
  { slug: "creative-arts", slot: "academics-arts", name: "Creative Arts", ages: "All grades", image: img.artRoom,
    description: "Drawing, music, drama and design as serious parts of learning, not extras." },
  { slug: "sports-pe", slot: "academics-sports", name: "Sports & Physical Education", ages: "All grades", image: img.sports,
    description: "Teamwork, discipline and health on the field and in the hall." },
];

export const facilities = [
  { name: "STEAM Lab", slot: "facility-steam-lab", image: img.steamLab, featured: true, line: "Where ideas are built, tested and rebuilt." },
  { name: "Science Laboratory", slot: "facility-science-lab", image: img.lab, line: "Hands-on experiments from grade 4 upward." },
  { name: "Computer Lab", slot: "facility-computer-lab", image: img.computerLab, line: "One student, one machine." },
  { name: "Library", slot: "facility-library", image: img.library, line: "Quiet space, open shelves." },
  { name: "Modern Classrooms", slot: "facility-classrooms", image: img.classroom, line: "Bright, calm rooms built for focus." },
  { name: "Playground", slot: "facility-playground", image: img.playground, line: "Room to run, every single day." },
  { name: "Sports Facilities", slot: "facility-sports", image: img.sports, line: "Football, volleyball and athletics." },
  { name: "Creative / Art Space", slot: "facility-art-space", image: img.artRoom, line: "A studio for making things." },
  { name: "Transportation", slot: "facility-transport", image: img.campus, line: "Safe routes across the Deukhuri valley." },
  { name: "Cafeteria", slot: "facility-cafeteria", image: img.celebration, line: "Fresh, local, balanced meals." },
];

export const studentLife = [
  { name: "Science Projects", slot: "life-science", image: img.science, size: "lg" },
  { name: "Sports", slot: "life-sports", image: img.sports, size: "sm" },
  { name: "Music", slot: "life-music", image: img.music, size: "sm" },
  { name: "Technology Projects", slot: "life-technology", image: img.technology, size: "sm" },
  { name: "Educational Tours", slot: "life-tours", image: img.tour, size: "lg" },
  { name: "Arts & Clubs", slot: "life-arts", image: img.arts, size: "sm" },
  { name: "Competitions", slot: "life-competitions", image: img.math, size: "sm" },
  { name: "Celebrations", slot: "life-celebrations", image: img.celebration, size: "sm" },
];

export type GalleryCategory = "School Life" | "STEAM" | "Sports" | "Events" | "Classroom" | "Trips" | "Competitions" | "Cultural Programs";
export type GalleryImage = { src: string; alt: string; category: GalleryCategory; tall?: boolean };
export const gallery: GalleryImage[] = [
  { src: img.hero, alt: "Students collaborating on a group project", category: "School Life", tall: true },
  { src: img.science, alt: "Science experiment in the laboratory", category: "STEAM" },
  { src: img.sports, alt: "Football practice on the school ground", category: "Sports", tall: true },
  { src: img.classroom, alt: "Morning lesson in a primary classroom", category: "Classroom" },
  { src: img.technology, alt: "Robotics club testing a line-following robot", category: "STEAM" },
  { src: img.celebration, alt: "Cultural programme on the school stage", category: "Cultural Programs", tall: true },
  { src: img.tour, alt: "Educational tour to Lumbini", category: "Trips" },
  { src: img.arts, alt: "Art class working with colour", category: "School Life" },
  { src: img.math, alt: "Mathematics competition final round", category: "Competitions" },
  { src: img.library, alt: "Reading hour in the library", category: "Classroom", tall: true },
  { src: img.event, alt: "Annual day celebration", category: "Events" },
  { src: img.studentsOutdoor, alt: "Friends on the school campus", category: "School Life" },
];

export const admissions = {
  steps: [
    { step: "01", name: "Explore", line: "Visit the campus or browse the website to see how we teach." },
    { step: "02", name: "Apply", line: "Complete the online application in about ten minutes." },
    { step: "03", name: "Review", line: "Our team reviews the application and documents." },
    { step: "04", name: "Connect", line: "We invite your family for a friendly conversation." },
    { step: "05", name: "Enroll", line: "Confirm the seat and get ready for the first day." },
  ],
  eligibility: [
    "Nursery: 3 years completed by the start of the academic year.",
    "Grades 1–10: successful completion of the previous grade.",
    "Transfer students: character and transfer certificates from the previous school.",
  ],
  documents: [
    "Birth certificate (copy)",
    "Previous school report card or transfer certificate",
    "Two passport-size photographs of the student",
    "Parent / guardian citizenship or ID (copy)",
  ],
  dates: [
    { label: "Applications open", value: "20 August 2026" },
    { label: "Campus visit days", value: "Every Friday, 10 AM – 1 PM" },
    { label: "Family conversations", value: "Within one week of applying" },
    { label: "Classes begin", value: "Baishakh 2083" },
  ],
  fees: "Fee structure varies by grade and includes tuition, lab access and learning materials. Request the current fee schedule from the school office or through the application form — we will share it before any commitment is asked of you.",
  faqs: [
    { q: "Can we visit the school before applying?", a: "Yes — and we encourage it. Campus visit days run every Friday from 10 AM to 1 PM, or call the office to arrange another time." },
    { q: "Does my child need prior English or computer experience?", a: "No. We meet every student where they are. Foundational support is built into the first months of each grade." },
    { q: "Is transportation available from surrounding villages?", a: "Yes, school transport covers major routes across the Deukhuri valley. Routes and stops are confirmed at enrollment." },
    { q: "Are scholarships available?", a: "A limited number of merit and need-based scholarships are awarded each year. Ask about them during your family conversation." },
    { q: "When will we hear back after applying?", a: "Our admissions team responds within three working days with the next step." },
  ],
};

export const grades = ["Nursery", "LKG", "UKG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10"];
