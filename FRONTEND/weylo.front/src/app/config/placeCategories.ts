// Category configuration
export interface PlaceCategory {
  id: string;
  name: string;
  icon: string;
  googleTypes: string[];
}

export const PLACE_CATEGORIES: PlaceCategory[] = [
  {
    id: "food",
    name: "Food & Drinks",
    icon: "🍽️",
    googleTypes: [
      "restaurant",
      "cafe",
      "bar",
      "bakery",
      "meal_takeaway",
      "meal_delivery",
      "food",
    ],
  },
  {
    id: "nature",
    name: "Nature",
    icon: "🌳",
    googleTypes: [
      "park",
      "natural_feature",
      "campground",
      "hiking_area",
      "national_park",
    ],
  },
  {
    id: "culture",
    name: "Culture",
    icon: "🏛️",
    googleTypes: [
      "museum",
      "art_gallery",
      "library",
      "church",
      "tourist_attraction",
      "landmark",
    ],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: "🎭",
    googleTypes: [
      "movie_theater",
      "amusement_park",
      "zoo",
      "aquarium",
      "bowling_alley",
      "night_club",
    ],
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: "🛍️",
    googleTypes: [
      "shopping_mall",
      "clothing_store",
      "store",
      "supermarket",
      "convenience_store",
    ],
  },
  {
    id: "accommodation",
    name: "Accommodation",
    icon: "🏨",
    googleTypes: ["lodging", "hotel", "hostel", "resort", "guest_house"],
  },
];