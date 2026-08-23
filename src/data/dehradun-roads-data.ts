// Hand-crafted hero road network for the Dehradun map.
// Visual reference: Dehradun street layout / Google Maps.
// Coordinates are already in the existing 400×380 SVG viewBox.
// The existing DEHRADUN_BOUNDARY_PATH must remain unchanged.

export type DehradunRoad = {
  name: string;
  type: "primary" | "secondary";
  path: string;
};

export const DEHRADUN_ROADS = [
  // ─────────────────────────────────────────────────────────────
  // PRIMARY CORRIDORS
  // ─────────────────────────────────────────────────────────────

  {
    name: "Rajpur Road",
    type: "primary",
    path: "M 198,198 Q 210,188 222,176 Q 235,160 247,145 Q 258,130 268,113 Q 277,99 286,82",
  },
  {
    name: "Chakrata Road",
    type: "primary",
    path: "M 198,198 Q 185,196 172,198 Q 157,201 143,207 Q 128,214 113,224 Q 98,233 84,238",
  },
  {
    name: "Saharanpur Road",
    type: "primary",
    path: "M 198,198 Q 193,210 184,220 Q 173,232 160,244 Q 145,257 132,272 Q 119,286 105,300",
  },
  {
    name: "Haridwar Road",
    type: "primary",
    path: "M 198,198 Q 204,212 212,225 Q 222,240 236,252 Q 252,266 269,279 Q 285,291 301,302",
  },

  // ─────────────────────────────────────────────────────────────
  // SECONDARY CORRIDORS
  // ─────────────────────────────────────────────────────────────

  {
    name: "Sahastradhara Road",
    type: "secondary",
    path: "M 198,198 Q 205,186 214,175 Q 225,163 237,153 Q 249,142 260,132 Q 272,121 282,110",
  },
  {
    name: "Raipur Road",
    type: "secondary",
    path: "M 198,198 Q 214,203 229,210 Q 245,218 261,228 Q 278,238 295,249 Q 311,260 327,270",
  },
  {
    name: "Ballupur Road",
    type: "secondary",
    path: "M 198,198 Q 183,190 167,185 Q 151,180 135,177 Q 119,174 102,175 Q 88,176 76,181",
  },
  {
    name: "EC Road",
    type: "secondary",
    path: "M 198,198 Q 205,205 211,214 Q 219,224 225,236 Q 231,248 234,261 Q 237,274 240,289",
  },
  {
    name: "Rajpur Connector",
    type: "secondary",
    path: "M 222,176 Q 230,180 238,184 Q 248,190 257,197 Q 266,204 276,211 Q 287,219 300,224",
  },
  {
    name: "Prem Nagar Connector",
    type: "secondary",
    path: "M 128,214 Q 119,207 110,200 Q 100,193 89,190 Q 78,187 67,190 Q 58,194 51,202",
  },
  {
    name: "Jakhan Connector",
    type: "secondary",
    path: "M 247,145 Q 258,148 270,151 Q 282,155 293,162 Q 304,169 314,178",
  },
  {
    name: "ISBT Corridor",
    type: "secondary",
    path: "M 132,272 Q 146,276 160,281 Q 175,287 189,296 Q 203,305 217,316",
  },

] as const;

// NOTE: both the "local" tier (22 streets) and the "tertiary" tier (11
// streets) were removed for the hero. Only primary (4) + secondary (8) = 12
// roads remain. This SVG illustration replaced a single hero photo, so the
// target is to match or beat that photo's render cost — every extra path
// is DOM/paint weight a static <Image> never had. Primary + secondary
// corridors alone still read clearly as a city road network.