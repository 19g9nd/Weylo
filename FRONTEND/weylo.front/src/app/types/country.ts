export interface SupportedCountry {
  id: number;
  name: string;
  code: string;
  northBound: number;
  southBound: number;
  eastBound: number;
  westBound: number;
  googlePlaceId: string;
}

export interface CountryBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface BulkCreateResult {
  successCount: number;
  createdCountries: SupportedCountry[];
  errors: string[];
}