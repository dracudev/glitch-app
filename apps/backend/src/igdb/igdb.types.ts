export interface IgdbImage {
  id: number;
  image_id: string;
}

export interface IgdbGenre {
  id: number;
  name: string;
  slug: string;
}

export interface IgdbPlatform {
  id: number;
  name: string;
  slug: string;
  abbreviation?: string;
}

export interface IgdbCompany {
  id: number;
  name: string;
  slug: string;
}

export interface IgdbCompanyDetail extends IgdbCompany {
  description?: string;
  logo?: IgdbImage;
}

export interface IgdbInvolvedCompany {
  id: number;
  company: IgdbCompany;
  developer: boolean;
  publisher: boolean;
}

export interface IgdbVideo {
  id: number;
  name: string;
  video_id: string;
}

export interface IgdbGame {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  storyline?: string;
  first_release_date?: number;
  cover?: IgdbImage;
  screenshots?: IgdbImage[];
  videos?: IgdbVideo[];
  genres?: IgdbGenre[];
  platforms?: IgdbPlatform[];
  involved_companies?: IgdbInvolvedCompany[];
  total_rating?: number;
  rating?: number;
  rating_count?: number;
  aggregated_rating?: number;
  status?: number;
  category?: number;
}
