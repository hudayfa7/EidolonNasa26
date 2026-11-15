// generated, do not edit, npm run types

/** contracts/api/error.json */

export interface ApiError {
  detail:
    | {
        code: "warming_up" | "unknown_target" | "unsupported_purpose" | "unknown_purpose" | "no_dem" | "no_image";
        message?: string;
        [k: string]: unknown;
      }
    | unknown[];
  [k: string]: unknown;
}

/** contracts/api/search_request.json */

export interface SearchRequest {
  /**
   * Either name (IAU feature, fast) or lat+lon (any point, slower).
   */
  target: (
    | {
        name: string;
        [k: string]: unknown;
      }
    | {
        lat: number;
        lon: number;
        [k: string]: unknown;
      }
  ) & {
    body: "mars" | "moon";
    name?: string | null;
    lat?: number | null;
    lon?: number | null;
  };
  purpose?: "rover_mobility" | "drill_isru" | "eva_training" | "habitat_ops" | "astrobiology" | "education" | "thermal";
  k?: number;
  filters?: {
    sovereigns?: string[] | null;
    /**
     * [lon_min, lat_min, lon_max, lat_max]
     *
     * @minItems 4
     * @maxItems 4
     */
    bbox?: [number, number, number, number] | null;
    access?: ("partner" | "non_partner" | "antarctic_treaty" | "unknown")[] | null;
    exclude_polar?: boolean;
    surface?: "barren" | "any" | null;
  };
}

/** contracts/api/search_response.json */

export interface SearchResponse {
  query: {
    [k: string]: unknown;
  };
  target: TargetSummary;
  /**
   * cache = precomputed (ms); live = named target with custom filters (~0.2 s); remote = coordinates (DEM read, ~6-10 s)
   */
  source: "cache" | "live" | "remote";
  timing_ms: number;
  model: {
    api_version: string;
    matcher: string;
    judge: string;
    engine_commit?: string | null;
    [k: string]: unknown;
  };
  results: MatchResult[];
}

/** contracts/api/target_summary.json */

/**
 * A Mars/Moon target as returned by /targets and inside search responses. Coordinates planetocentric, east-positive, -180..180.
 */
export interface TargetSummary {
  /**
   * 'body:name' for named targets, 'body:lat,lon' for coordinates
   */
  target_id: string;
  body: "mars" | "moon";
  name?: string | null;
  /**
   * IAU descriptor, e.g. Crater, Vallis, Dorsum
   */
  type?: string | null;
  /**
   * IAU feature-type code (AA crater, VA vallis, ...)
   */
  code?: string | null;
  family?: "depression" | "linear" | "raised" | "other" | null;
  lat: number;
  lon: number;
  diameter_km?: number | null;
  coordinate_source?: string;
  /**
   * Production performance for this landform class in fresh blind tests (data/landform_capability_v2.csv). Show a caveat when tier is fair/weak.
   */
  capability?: {
    tier: "good" | "fair" | "weak" | "insufficient data";
    p_target_top3: number;
    n_targets: number;
    landform_class?: string;
  } | null;
  /**
   * Hillshade PNG of the 18.8 km search window
   */
  image_url?: string | null;
  relief_sd_m?: number;
  window?: {
    [k: string]: unknown;
  };
}

/** contracts/api/targets_list.json */

export interface TargetsList {
  total: number;
  offset: number;
  targets: TargetSummary[];
}

/** contracts/match_result.json */

/**
 * One ranked Earth site for a (target, purpose) query. Physical fidelity is per property and purpose-weighted; practical suitability comes from the site listing and is shown alongside, never blended.
 */
export interface MatchResult {
  target_id: string;
  purpose:
    | "rover_mobility"
    | "drill_isru"
    | "eva_training"
    | "habitat_ops"
    | "astrobiology"
    | "education"
    | "polar_lighting_geometry"
    | "thermal";
  site_id: string;
  rank: number;
  fidelity: {
    /**
     * Purpose-weighted mean of property scores.
     */
    score: number;
    /**
     * Area-weighted share of Earth candidates scoring lower (1 = best).
     */
    percentile_earth?: number;
    matcher?: string;
    /**
     * Landform-shape similarity tier (form cosine >= 0.90 high, >= 0.80 medium, else low; forced low for sub-resolution targets). NOT a calibrated probability: blind reviewer tests (CAL1/CAL2) found it does not predict expert analog grades. Show it as 'shape match'.
     */
    confidence?: "low" | "medium" | "high";
  };
  /**
   * Per-property breakdown (the bars on the card).
   */
  properties: {
    key: string;
    label?: string;
    /**
     * null when not measurable for this pair.
     */
    score: number | null;
    percentile_earth?: number | null;
    /**
     * Purpose weight used (0-3 prior, user-adjustable).
     */
    weight?: number;
    /**
     * gap = coverage gap ('lacks ground ice'); not_measurable = below data resolution or no layer.
     */
    status: "match" | "partial" | "gap" | "not_measurable";
    /**
     * Measurement baseline (e.g. 200 for slope at 200 m).
     */
    baseline_m?: number | null;
    note?: string;
  }[];
  explanation: {
    summary: string;
    strengths?: string[];
    gaps?: string[];
    caveats?: string[];
  };
  /**
   * Structured site location (optional; index v1.1+).
   */
  location?: {
    lat?: number;
    lon?: number;
    elevation_m?: number | null;
    country?: string | null;
    sovereign?: string | null;
    /**
     * partner | non_partner | antarctic_treaty | unknown
     */
    access?: string | null;
    surface?: "barren" | "rugged_extension";
  };
  /**
   * Unranked physical values for downstream decision layers (e.g. TOPSIS). Mismatches are target minus site; 0 = identical.
   */
  raw?: {
    ranking_score?: number;
    shape_cosine?: number;
    relief_ratio?: number;
    relief_mismatch_oct?: number;
    polarity_mismatch?: number;
    scale_mismatch_oct?: number;
    terrain_properties_pct?: number;
    /**
     * PAIR1 pair-judge P(partial-or-better analog); results are ordered by it
     */
    judge_p_good?: number | null;
    /**
     * rank before the pair judge reordered the top 20
     */
    f2s_rank?: number;
  };
  /**
   * Site climate at the centre point (optional).
   */
  environment?: {
    t_mean_c?: number | null;
    precip_mm?: number | null;
    aridity_index?: number | null;
    source?: string;
  } | null;
  /**
   * Optional side-by-side patches (Earth vs target) for the UI.
   */
  terrain_twins?: {
    earth_url?: string;
    target_url?: string;
  }[];
}

/** contracts/site_listing.json */

/**
 * An Earth operating area (the 'listing card'): where it is and how practical it is to test there. Physical fidelity to a target lives in match_result, never here.
 */
export interface SiteListing {
  site_id: string;
  /**
   * Nearest named place or feature; 'Unnamed area near <place>' if none.
   */
  name: string;
  country?: string;
  lat: number;
  lon: number;
  /**
   * Size of the scored operating area (2-10 km).
   */
  operating_radius_km: number;
  /**
   * Present if this area contains a literature-documented analog site.
   */
  known_analog?: {
    label_ids?: string[];
    citation?: string;
  };
  /**
   * Practical suitability, shown separately from physical fidelity (never blended into it).
   */
  practical: {
    score: number;
    access?: {
      nearest_road_km?: number;
      nearest_airport?: string;
      nearest_airport_km?: number;
      est_travel_hours_from_airport?: number;
    };
    barren_fraction?: number;
    human_footprint?: "very_low" | "low" | "moderate" | "high";
    /**
     * Protected areas are FLAGGED with a permit note, never excluded (many classic analogs are in parks).
     */
    protected_area?: {
      is_protected?: boolean;
      name?: string;
      permit_note?: string;
    };
    best_months?: number[];
    season_note?: string;
  };
  media?: {
    thumbnail_url?: string;
    hillshade_url?: string;
  };
}

/** contracts/target.json */

/**
 * A Moon or Mars location a user wants an Earth analog for (preset or user-picked).
 */
export interface Target {
  /**
   * Stable id, e.g. 'mars-jezero' or 'moon-artemis-haworth'.
   */
  target_id: string;
  body: "moon" | "mars";
  name: string;
  lat: number;
  /**
   * Planetocentric, east-positive, -180..180.
   */
  lon: number;
  /**
   * site = a landing point or feature; region = a broad area.
   */
  scope: "site" | "region";
  /**
   * Extent used to sample target terrain.
   */
  radius_km?: number;
  /**
   * e.g. 'Artemis candidate regions', 'Mars exploration zones'.
   */
  preset_group?: string;
  /**
   * Citation or URL the coordinate was taken from. Never guessed.
   */
  coordinate_source?: string;
  coordinate_approximate?: boolean;
  /**
   * Which target-side layers exist at this location (drives which properties can be scored).
   */
  data_available?: {
    terrain_dem?: string;
    thermal?: boolean;
    mineralogy?: boolean;
    ground_ice?: boolean;
    illumination?: boolean;
  };
  notes?: string;
}
