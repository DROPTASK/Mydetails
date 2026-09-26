import { hasTmdbKey } from "./tmdb";

export type CinemaIndustry = "bollywood" | "hollywood" | "tollywood" | "kollywood" | "all";

export interface CinemaMovie {
  id: number;
  title: string;
  year: string;
  industry: "bollywood" | "hollywood" | "tollywood" | "kollywood";
  industryLabel: string;
  overview: string;
  tagline: string;
  genres: string[];
  leadActor: string;
  director: string;
  poster_path: string;
  vote_average?: number;
}

export const CINEMA_CATEGORIES: { id: CinemaIndustry; label: string; icon: string; description: string }[] = [
  { id: "all", label: "All Cinemas", icon: "🌍", description: "Random mix of all cinema industries" },
  { id: "bollywood", label: "Bollywood", icon: "🎬", description: "Hindi Cinema classics & blockbusters" },
  { id: "hollywood", label: "Hollywood", icon: "🌟", description: "Global & English cinematic masterpieces" },
  { id: "tollywood", label: "Tollywood", icon: "⚡", description: "Telugu action, drama & historical epics" },
  { id: "kollywood", label: "Kollywood", icon: "💥", description: "Tamil cinema legends, thrillers & stories" },
];

export const CURATED_MOVIES: CinemaMovie[] = [
  // ================= BOLLYWOOD =================
  {
    id: 101,
    title: "3 Idiots",
    year: "2009",
    industry: "bollywood",
    industryLabel: "Bollywood",
    overview: "Two friends search for their long-lost college companion who inspired them to think freely and pursue excellence.",
    tagline: "Don't chase success, chase excellence.",
    genres: ["Comedy", "Drama"],
    leadActor: "Aamir Khan",
    director: "Rajkumar Hirani",
    poster_path: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80",
    vote_average: 8.4,
  },
  {
    id: 102,
    title: "Dangal",
    year: "2016",
    industry: "bollywood",
    industryLabel: "Bollywood",
    overview: "Former wrestler Mahavir Singh Phogat trains his daughters Geeta and Babita to become world-class champions.",
    tagline: "Gold medals don't grow on trees, you have to cultivate them.",
    genres: ["Biography", "Drama", "Sport"],
    leadActor: "Aamir Khan",
    director: "Nitesh Tiwari",
    poster_path: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=500&q=80",
    vote_average: 8.3,
  },
  {
    id: 103,
    title: "Sholay",
    year: "1975",
    industry: "bollywood",
    industryLabel: "Bollywood",
    overview: "Two ex-convicts are hired by a retired policeman to capture a ruthless dacoit who terrorized his village.",
    tagline: "The greatest star cast ever assembled.",
    genres: ["Action", "Adventure", "Drama"],
    leadActor: "Amitabh Bachchan",
    director: "Ramesh Sippy",
    poster_path: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80",
    vote_average: 8.2,
  },
  {
    id: 104,
    title: "Lagaan",
    year: "2001",
    industry: "bollywood",
    industryLabel: "Bollywood",
    overview: "In Victorian India, villagers stake their future on a game of cricket against ruthless British officers to cancel high taxes.",
    tagline: "Once upon a time in India.",
    genres: ["Drama", "Musical", "Sport"],
    leadActor: "Aamir Khan",
    director: "Ashutosh Gowariker",
    poster_path: "https://images.unsplash.com/photo-1531415074868-036b1c5d53ec?auto=format&fit=crop&w=500&q=80",
    vote_average: 8.1,
  },
  {
    id: 105,
    title: "Taare Zameen Par",
    year: "2007",
    industry: "bollywood",
    industryLabel: "Bollywood",
    overview: "An eight-year-old boy is thought to be a lazy trouble-maker until an empathetic art teacher discovers his real struggles with dyslexia.",
    tagline: "Every child is special.",
    genres: ["Drama", "Family"],
    leadActor: "Aamir Khan",
    director: "Aamir Khan",
    poster_path: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=500&q=80",
    vote_average: 8.3,
  },
  {
    id: 106,
    title: "Swades",
    year: "2004",
    industry: "bollywood",
    industryLabel: "Bollywood",
    overview: "A successful Indian scientist at NASA returns to an Indian village to find his childhood nanny and discovers his nation's soul.",
    tagline: "We, the people.",
    genres: ["Drama"],
    leadActor: "Shah Rukh Khan",
    director: "Ashutosh Gowariker",
    poster_path: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=500&q=80",
    vote_average: 8.2,
  },
  {
    id: 107,
    title: "Zindagi Na Milegi Dobara",
    year: "2011",
    industry: "bollywood",
    industryLabel: "Bollywood",
    overview: "Three friends decide to turn their fantasy bachelor road trip across Spain into reality, facing fears and rediscovering friendship.",
    tagline: "Live life to the fullest.",
    genres: ["Adventure", "Comedy", "Drama"],
    leadActor: "Hrithik Roshan",
    director: "Zoya Akhtar",
    poster_path: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80",
    vote_average: 8.2,
  },
  {
    id: 108,
    title: "Gangs of Wasseypur",
    year: "2012",
    industry: "bollywood",
    industryLabel: "Bollywood",
    overview: "A clash between coal mafia factions leads to a multigenerational blood feud in the coal belt of Dhanbad.",
    tagline: "Kah ke lunga.",
    genres: ["Action", "Crime", "Drama"],
    leadActor: "Manoj Bajpayee",
    director: "Anurag Kashyap",
    poster_path: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=500&q=80",
    vote_average: 8.2,
  },
  {
    id: 109,
    title: "Andhadhun",
    year: "2018",
    industry: "bollywood",
    industryLabel: "Bollywood",
    overview: "A piano player pretending to be visually impaired unwittingly becomes entangled in the murder of a former film actor.",
    tagline: "He cannot see. But he sees everything.",
    genres: ["Crime", "Mystery", "Thriller"],
    leadActor: "Ayushmann Khurrana",
    director: "Sriram Raghavan",
    poster_path: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80",
    vote_average: 8.2,
  },
  {
    id: 110,
    title: "Dilwale Dulhania Le Jayenge",
    year: "1995",
    industry: "bollywood",
    industryLabel: "Bollywood",
    overview: "Raj and Simran meet on a European train journey, sparking a timeless romance that overcomes traditional family barriers.",
    tagline: "Come, fall in love.",
    genres: ["Drama", "Romance"],
    leadActor: "Shah Rukh Khan",
    director: "Aditya Chopra",
    poster_path: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=500&q=80",
    vote_average: 8.6,
  },
  {
    id: 111,
    title: "Tumbbad",
    year: "2018",
    industry: "bollywood",
    industryLabel: "Bollywood",
    overview: "A mythological gothic horror tale revolving around three generations corrupted by the boundless greed of a forbidden god.",
    tagline: "Greed has no limits.",
    genres: ["Drama", "Fantasy", "Horror"],
    leadActor: "Sohum Shah",
    director: "Rahi Anil Barve",
    poster_path: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80",
    vote_average: 8.2,
  },
  {
    id: 112,
    title: "Chak De India",
    year: "2007",
    industry: "bollywood",
    industryLabel: "Bollywood",
    overview: "A disgraced former hockey captain takes charge of the underdog women's national hockey team to lead them to world glory.",
    tagline: "One nation. One goal.",
    genres: ["Drama", "Sport"],
    leadActor: "Shah Rukh Khan",
    director: "Shimit Amin",
    poster_path: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80",
    vote_average: 8.1,
  },

  // ================= HOLLYWOOD =================
  {
    id: 201,
    title: "Inception",
    year: "2010",
    industry: "hollywood",
    industryLabel: "Hollywood",
    overview: "A skilled thief who steals corporate secrets through subconscious dream-sharing technology is offered a chance to erase his criminal past.",
    tagline: "Your mind is the scene of the crime.",
    genres: ["Action", "Sci-Fi", "Thriller"],
    leadActor: "Leonardo DiCaprio",
    director: "Christopher Nolan",
    poster_path: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    vote_average: 8.4,
  },
  {
    id: 202,
    title: "Interstellar",
    year: "2014",
    industry: "hollywood",
    industryLabel: "Hollywood",
    overview: "A team of explorers travels through a newly discovered wormhole in space in an attempt to ensure humanity's survival.",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    genres: ["Adventure", "Drama", "Sci-Fi"],
    leadActor: "Matthew McConaughey",
    director: "Christopher Nolan",
    poster_path: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    vote_average: 8.4,
  },
  {
    id: 203,
    title: "The Dark Knight",
    year: "2008",
    industry: "hollywood",
    industryLabel: "Hollywood",
    overview: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological tests.",
    tagline: "Why so serious?",
    genres: ["Action", "Crime", "Drama"],
    leadActor: "Christian Bale",
    director: "Christopher Nolan",
    poster_path: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    vote_average: 8.5,
  },
  {
    id: 204,
    title: "Gladiator",
    year: "2000",
    industry: "hollywood",
    industryLabel: "Hollywood",
    overview: "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.",
    tagline: "What we do in life echoes in eternity.",
    genres: ["Action", "Adventure", "Drama"],
    leadActor: "Russell Crowe",
    director: "Ridley Scott",
    poster_path: "https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg",
    vote_average: 8.2,
  },
  {
    id: 205,
    title: "The Matrix",
    year: "1999",
    industry: "hollywood",
    industryLabel: "Hollywood",
    overview: "When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence.",
    tagline: "Welcome to the real world.",
    genres: ["Action", "Sci-Fi"],
    leadActor: "Keanu Reeves",
    director: "Lana Wachowski",
    poster_path: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    vote_average: 8.2,
  },
  {
    id: 206,
    title: "Pulp Fiction",
    year: "1994",
    industry: "hollywood",
    industryLabel: "Hollywood",
    overview: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    tagline: "You won't know the facts until you've seen the fiction.",
    genres: ["Crime", "Drama"],
    leadActor: "John Travolta",
    director: "Quentin Tarantino",
    poster_path: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    vote_average: 8.5,
  },
  {
    id: 207,
    title: "Forrest Gump",
    year: "1994",
    industry: "hollywood",
    industryLabel: "Hollywood",
    overview: "The history of the United States from the 1950s to the '70s unfolds from the perspective of an Alabama man with an IQ of 75.",
    tagline: "Life is like a box of chocolates.",
    genres: ["Comedy", "Drama", "Romance"],
    leadActor: "Tom Hanks",
    director: "Robert Zemeckis",
    poster_path: "https://image.tmdb.org/t/p/w500/arw2VCBveWOVZr6pxd9XTd1TdQa.jpg",
    vote_average: 8.5,
  },
  {
    id: 208,
    title: "Oppenheimer",
    year: "2023",
    industry: "hollywood",
    industryLabel: "Hollywood",
    overview: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
    tagline: "The world forever changes.",
    genres: ["Biography", "Drama", "History"],
    leadActor: "Cillian Murphy",
    director: "Christopher Nolan",
    poster_path: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    vote_average: 8.1,
  },
  {
    id: 209,
    title: "Avatar",
    year: "2009",
    industry: "hollywood",
    industryLabel: "Hollywood",
    overview: "A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home.",
    tagline: "Enter the world of Pandora.",
    genres: ["Action", "Adventure", "Fantasy", "Sci-Fi"],
    leadActor: "Sam Worthington",
    director: "James Cameron",
    poster_path: "https://image.tmdb.org/t/p/w500/kyeqWdyUXW608qlYkRqosgbbnKR.jpg",
    vote_average: 7.6,
  },
  {
    id: 210,
    title: "The Prestige",
    year: "2006",
    industry: "hollywood",
    industryLabel: "Hollywood",
    overview: "After a tragic accident, two stage magicians in 1890s London engage in a battle to create the ultimate illusion while sacrificing everything they have.",
    tagline: "Are you watching closely?",
    genres: ["Drama", "Mystery", "Sci-Fi"],
    leadActor: "Hugh Jackman",
    director: "Christopher Nolan",
    poster_path: "https://image.tmdb.org/t/p/w500/tRNTLjtJyFp14F4w4X9u7k8q29r.jpg",
    vote_average: 8.2,
  },

  // ================= TOLLYWOOD =================
  {
    id: 301,
    title: "RRR",
    year: "2022",
    industry: "tollywood",
    industryLabel: "Tollywood",
    overview: "A fictional tale of two legendary revolutionaries and their journey away from home before they began fighting for their country in the 1920s.",
    tagline: "Rise, Roar, Revolt.",
    genres: ["Action", "Drama"],
    leadActor: "N. T. Rama Rao Jr.",
    director: "S. S. Rajamouli",
    poster_path: "https://image.tmdb.org/t/p/w500/nEufeZlyAOLqO2brrs0ye2xmgEO.jpg",
    vote_average: 8.0,
  },
  {
    id: 302,
    title: "Baahubali The Beginning",
    year: "2015",
    industry: "tollywood",
    industryLabel: "Tollywood",
    overview: "A young adventurous man finds out that he is the rightful heir to the powerful kingdom of Mahishmati and must fulfill his destiny.",
    tagline: "The beginning of a legend.",
    genres: ["Action", "Drama", "Fantasy"],
    leadActor: "Prabhas",
    director: "S. S. Rajamouli",
    poster_path: "https://image.tmdb.org/t/p/w500/9BAjt85amvlqv6WSvIO4LBE1Hgq.jpg",
    vote_average: 7.6,
  },
  {
    id: 303,
    title: "Baahubali The Conclusion",
    year: "2017",
    industry: "tollywood",
    industryLabel: "Tollywood",
    overview: "Shiva, the son of Bahubali, learns about his heritage and sets out to avenge his father's death and free his captive mother.",
    tagline: "Why Kattappa killed Baahubali?",
    genres: ["Action", "Drama", "Fantasy"],
    leadActor: "Prabhas",
    director: "S. S. Rajamouli",
    poster_path: "https://image.tmdb.org/t/p/w500/vJjScbB0XwN3tVqHqZz6j3g4k8P.jpg",
    vote_average: 7.8,
  },
  {
    id: 304,
    title: "Pushpa The Rise",
    year: "2021",
    industry: "tollywood",
    industryLabel: "Tollywood",
    overview: "A laborer rises through the ranks of a red sandalwood smuggling syndicate, sparking violent conflicts with police and rivals.",
    tagline: "Jhukega nahi saala.",
    genres: ["Action", "Crime", "Drama"],
    leadActor: "Allu Arjun",
    director: "Sukumar",
    poster_path: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4IRKS.jpg",
    vote_average: 7.6,
  },
  {
    id: 305,
    title: "Eega",
    year: "2012",
    industry: "tollywood",
    industryLabel: "Tollywood",
    overview: "A murdered man is reincarnated as a housefly and seeks to protect his lover and exact vengeance on his ruthless killer.",
    tagline: "Revenge of the housefly.",
    genres: ["Action", "Comedy", "Fantasy"],
    leadActor: "Nani",
    director: "S. S. Rajamouli",
    poster_path: "https://image.tmdb.org/t/p/w500/p3b3e2XW0C7s0K8XzYyV6KqGj6R.jpg",
    vote_average: 7.5,
  },
  {
    id: 306,
    title: "Jersey",
    year: "2019",
    industry: "tollywood",
    industryLabel: "Tollywood",
    overview: "A late thirty-something cricketer returns to the sport against all odds to fulfill his son's wish for an Indian team jersey.",
    tagline: "It's never too late to dream.",
    genres: ["Drama", "Sport"],
    leadActor: "Nani",
    director: "Gowtam Tinnanuri",
    poster_path: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80",
    vote_average: 8.3,
  },
  {
    id: 307,
    title: "Sita Ramam",
    year: "2022",
    industry: "tollywood",
    industryLabel: "Tollywood",
    overview: "An orphan soldier's life changes after he receives a letter from a girl named Sita, uncovering an emotional saga of true love.",
    tagline: "Letters that crossed borders.",
    genres: ["Drama", "Mystery", "Romance"],
    leadActor: "Dulquer Salmaan",
    director: "Hanu Raghavapudi",
    poster_path: "https://image.tmdb.org/t/p/w500/9b2N5HhVqfOQZ3f4q7hGjVbE7c.jpg",
    vote_average: 8.2,
  },
  {
    id: 308,
    title: "Kalki 2898 AD",
    year: "2024",
    industry: "tollywood",
    industryLabel: "Tollywood",
    overview: "In a dystopian futuristic world, an ancient mythological warrior fights to protect a prophesied unborn child carrying the hope of mankind.",
    tagline: "The dawn of a new era.",
    genres: ["Action", "Sci-Fi", "Mythology"],
    leadActor: "Prabhas",
    director: "Nag Ashwin",
    poster_path: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80",
    vote_average: 7.7,
  },

  // ================= KOLLYWOOD =================
  {
    id: 401,
    title: "Vikram",
    year: "2022",
    industry: "kollywood",
    industryLabel: "Kollywood",
    overview: "A special agent investigates a series of murders committed by a masked vigilante group, unraveling a high-stakes drug syndicate war.",
    tagline: "Once upon a time there lived a ghost.",
    genres: ["Action", "Crime", "Thriller"],
    leadActor: "Kamal Haasan",
    director: "Lokesh Kanagaraj",
    poster_path: "https://image.tmdb.org/t/p/w500/7aQ522WqJ1fV3s1n2t9Z3h6r4P.jpg",
    vote_average: 8.2,
  },
  {
    id: 402,
    title: "Jai Bhim",
    year: "2021",
    industry: "kollywood",
    industryLabel: "Kollywood",
    overview: "When a tribal man is arrested for alleged theft and goes missing from police custody, a righteous lawyer fights fearlessly for justice.",
    tagline: "Truth and justice shall prevail.",
    genres: ["Crime", "Drama", "Mystery"],
    leadActor: "Suriya",
    director: "T. J. Gnanavel",
    poster_path: "https://image.tmdb.org/t/p/w500/mXp0W8x7h4rP1K7f3Y8d9G4b5V.jpg",
    vote_average: 8.8,
  },
  {
    id: 403,
    title: "Kaithi",
    year: "2019",
    industry: "kollywood",
    industryLabel: "Kollywood",
    overview: "A recently released prisoner is recruited by an injured cop to drive unconscious officers through hostile cartel territory to save lives and see his daughter.",
    tagline: "One night. One truck. One mission.",
    genres: ["Action", "Crime", "Thriller"],
    leadActor: "Karthi",
    director: "Lokesh Kanagaraj",
    poster_path: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=500&q=80",
    vote_average: 8.4,
  },
  {
    id: 404,
    title: "Soorarai Pottru",
    year: "2020",
    industry: "kollywood",
    industryLabel: "Kollywood",
    overview: "Nedumaaran Rajangam sets out to make the common man fly and takes on the most capital-intensive industry with the help of his friends and family.",
    tagline: "Dream without limits.",
    genres: ["Action", "Drama"],
    leadActor: "Suriya",
    director: "Sudha Kongara",
    poster_path: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=500&q=80",
    vote_average: 8.6,
  },
  {
    id: 405,
    title: "Super Deluxe",
    year: "2019",
    industry: "kollywood",
    industryLabel: "Kollywood",
    overview: "An unfaithful wife, an estranged father, a priest, and a corrupt cop all face dilemmas across one surreal day in Chennai.",
    tagline: "Life is full of surprises.",
    genres: ["Action", "Comedy", "Crime", "Drama"],
    leadActor: "Vijay Sethupathi",
    director: "Thiagarajan Kumararaja",
    poster_path: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80",
    vote_average: 8.3,
  },
  {
    id: 406,
    title: "Asuran",
    year: "2019",
    industry: "kollywood",
    industryLabel: "Kollywood",
    overview: "A farmer with a violent past goes on the run to protect his hot-headed son who retaliated against an oppressive landlord.",
    tagline: "Knowledge is the only wealth they cannot steal.",
    genres: ["Action", "Drama"],
    leadActor: "Dhanush",
    director: "Vetrimaaran",
    poster_path: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80",
    vote_average: 8.4,
  },
  {
    id: 407,
    title: "Jailer",
    year: "2023",
    industry: "kollywood",
    industryLabel: "Kollywood",
    overview: "A retired prison officer embarks on a relentless manhunt when his honest police inspector son goes missing while investigating an idol smuggler.",
    tagline: "Hukum, Tiger ka hukum.",
    genres: ["Action", "Comedy", "Crime"],
    leadActor: "Rajinikanth",
    director: "Nelson Dilipkumar",
    poster_path: "https://image.tmdb.org/t/p/w500/1X9x0H8sYqJb3gWq5VbT8hL5n7.jpg",
    vote_average: 7.4,
  },
  {
    id: 408,
    title: "Leo",
    year: "2023",
    industry: "kollywood",
    industryLabel: "Kollywood",
    overview: "A mild-mannered cafe owner in Himachal Pradesh becomes a local hero after thwarting bandits, attracting dangerous figures from a forgotten past.",
    tagline: "Bloody sweet.",
    genres: ["Action", "Crime", "Drama"],
    leadActor: "Thalapathy Vijay",
    director: "Lokesh Kanagaraj",
    poster_path: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=500&q=80",
    vote_average: 7.2,
  },
];

/**
 * Fetch a movie using the TMDB API directly (or curated fallback).
 * Never touches or depends on a database table for movies!
 */
export async function getCinemaMovie(
  industry: CinemaIndustry = "all",
  excludeTitle?: string
): Promise<CinemaMovie> {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;

  if (apiKey) {
    try {
      const langMap: Record<CinemaIndustry, string | undefined> = {
        bollywood: "hi",
        tollywood: "te",
        kollywood: "ta",
        hollywood: "en",
        all: undefined,
      };

      const lang = langMap[industry];
      const page = Math.floor(Math.random() * 4) + 1; // page 1-4 for popular candidates
      const url = new URL("https://api.themoviedb.org/3/discover/movie");
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("language", "en-US");
      url.searchParams.set("sort_by", "popularity.desc");
      url.searchParams.set("page", String(page));
      url.searchParams.set("vote_count.gte", "50");
      if (lang) {
        url.searchParams.set("with_original_language", lang);
      }

      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        const results: any[] = json.results || [];
        const valid = results.filter((m) => {
          if (!m.title || m.title.length < 3) return false;
          const alpha = m.title.replace(/[^a-zA-Z]/g, "");
          if (alpha.length < 3) return false;
          if (excludeTitle && m.title.toLowerCase() === excludeTitle.toLowerCase()) return false;
          return true;
        });

        if (valid.length > 0) {
          const picked = valid[Math.floor(Math.random() * valid.length)];
          // Try fetching credits for director & lead actor
          let leadActor = "Leading Star";
          let director = "Acclaimed Director";
          let tagline = "";
          let genres: string[] = ["Cinema"];

          try {
            const detailUrl = new URL(`https://api.themoviedb.org/3/movie/${picked.id}`);
            detailUrl.searchParams.set("api_key", apiKey);
            detailUrl.searchParams.set("append_to_response", "credits");
            const dRes = await fetch(detailUrl.toString());
            if (dRes.ok) {
              const dJson = await dRes.json();
              tagline = dJson.tagline || "";
              if (dJson.genres && Array.isArray(dJson.genres)) {
                genres = dJson.genres.map((g: any) => g.name);
              }
              const cast = dJson.credits?.cast;
              if (Array.isArray(cast) && cast[0]?.name) {
                leadActor = cast[0].name;
              }
              const crew = dJson.credits?.crew;
              if (Array.isArray(crew)) {
                const dir = crew.find((c: any) => c.job === "Director");
                if (dir?.name) director = dir.name;
              }
            }
          } catch {
            // ignore detail fetch error
          }

          const ind: CinemaMovie["industry"] =
            industry === "all"
              ? lang === "hi"
                ? "bollywood"
                : lang === "te"
                ? "tollywood"
                : lang === "ta"
                ? "kollywood"
                : "hollywood"
              : industry;

          const poster = picked.poster_path
            ? `https://image.tmdb.org/t/p/w500${picked.poster_path}`
            : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80";

          return {
            id: picked.id,
            title: picked.title,
            year: picked.release_date?.slice(0, 4) || "2021",
            industry: ind,
            industryLabel: getCinemaCategoryLabel(ind),
            overview: picked.overview || "A remarkable cinema experience.",
            tagline: tagline || "An unforgettable journey.",
            genres: genres.length > 0 ? genres : ["Drama"],
            leadActor,
            director,
            poster_path: poster,
            vote_average: picked.vote_average || 7.5,
          };
        }
      }
    } catch (e) {
      console.warn("Direct TMDB API fetch note:", e);
    }
  }

  // Curated in-memory TMDB movie pool fallback (Zero DB dependency!)
  const pool = CURATED_MOVIES.filter((m) => {
    if (industry !== "all" && m.industry !== industry) return false;
    if (excludeTitle && m.title.toLowerCase() === excludeTitle.toLowerCase()) return false;
    return true;
  });

  const candidates = pool.length > 0 ? pool : CURATED_MOVIES;
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  return picked;
}

export function getCinemaCategoryLabel(industry: CinemaIndustry): string {
  const found = CINEMA_CATEGORIES.find((c) => c.id === industry);
  return found ? `${found.icon} ${found.label}` : "🎬 Cinema";
}

export function findCinemaMovie(identifier: string | number): CinemaMovie | undefined {
  if (typeof identifier === "number") {
    return CURATED_MOVIES.find((m) => m.id === identifier);
  }
  const clean = identifier.trim().toLowerCase();
  return CURATED_MOVIES.find((m) => m.title.toLowerCase() === clean);
}
