/**
 * Maps unit titles from the database to their corresponding "good mood" 3D images.
 * If no image is found, returns a high-quality placeholder.
 */

const TITLE_TO_IMAGE_MAP: Record<string, string> = {
  // Intro & Welcome
  "Hello!": "/media/units/intro.png",
  "Welcome Back": "/media/units/intro.png",
  "What do you remember?": "/media/units/intro.png",
  "Looking back": "/media/units/intro.png",
  "The Alphabet and Numbers": "/media/units/intro.png",

  // Travel & Abroad
  "Air Travel": "/media/units/travel.png",
  "Living abroad": "/media/units/travel.png",
  "Holidays": "/media/units/travel.png",

  // Nature & Activities
  "Animals": "/media/units/nature.png",
  "Let's Go Camping": "/media/units/nature.png",

  // Town & Logistics
  "Around Town": "/media/units/town.png",
  "Buildings and Activities": "/media/units/town.png",
  "Getting to School": "/media/units/school_basics.png",

  // Food & Shopping
  "Food and Drink": "/media/units/food.png",
  "Food and Shopping": "/media/units/food.png",

  // School Basics
  "Unit 1": "/media/units/school_basics.png",
  "Unit 2": "/media/units/school_basics.png",

  // Careers & Work
  "Jobs": "/media/units/careers.png",
  "Work": "/media/units/careers.png",
  "Looking for a job": "/media/units/careers.png",
  "Serving the people": "/media/units/careers.png",
  "People Who Help Others": "/media/units/careers.png",

  // Health & Body
  "Staying healthy": "/media/units/health.png",
  "My Body and Clothes": "/media/units/health.png",
  "What Do They Look Like?": "/media/units/health.png",
  "Safety": "/media/units/health.png",

  // Media & Comm
  "Newspapers": "/media/units/media.png",
  "Signs and Messages": "/media/units/media.png",
  "Pen-friends": "/media/units/media.png",

  // World & Culture
  "English-speaking countries": "/media/units/culture.png",
  "Other countries, other customs": "/media/units/culture.png",
  "The United Kingdom": "/media/units/culture.png",

  // Specific Subjects
  "Sport": "/media/units/sport.png",
  "Future Developments": "/media/units/future.png",
  "Tables, flow charts and diagrams": "/media/units/logic.png",
  "Working it out": "/media/units/logic.png",

  // Home & Life
  "Daily Life": "/media/units/daily-life.png",
  "My Family": "/media/units/daily-life.png",
  "Can I Help You?": "/media/units/daily-life.png",

  // Weather
  "Weather and Seasons": "/media/units/weather.png",

  // Revision
  "Revision": "/media/units/revision.png",
};

export function getUnitImage(title: string): string {
  // Normalize title for mapping
  for (const [key, value] of Object.entries(TITLE_TO_IMAGE_MAP)) {
    if (title.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Stylish default placeholder
  return "/media/units/default-unit.png";
}
