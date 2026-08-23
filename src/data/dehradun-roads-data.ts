// Hand-crafted hero road network for the Dehradun map.
// Visual reference: Dehradun street layout / Google Maps.
// Coordinates are already in the existing 400×380 SVG viewBox.
// The existing DEHRADUN_BOUNDARY_PATH must remain unchanged.

export type DehradunRoad = {
  name: string;
  type: "primary" | "secondary" | "tertiary";
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

  // ─────────────────────────────────────────────────────────────
  // TERTIARY CITY STREETS
  // ─────────────────────────────────────────────────────────────

  {
    name: "Western City Street",
    type: "tertiary",
    path: "M 113,224 Q 116,235 121,245 Q 127,256 137,263 Q 147,270 158,273",
  },
  {
    name: "Clement Town Link",
    type: "tertiary",
    path: "M 84,238 Q 88,249 95,258 Q 102,268 113,276 Q 123,284 132,291",
  },
  {
    name: "Southwest Link",
    type: "tertiary",
    path: "M 105,300 Q 116,306 128,313 Q 140,320 153,326 Q 166,332 178,335",
  },
  {
    name: "Southern Ring",
    type: "tertiary",
    path: "M 158,273 Q 174,268 190,270 Q 207,273 222,282 Q 238,292 251,306 Q 264,320 278,329",
  },
  {
    name: "Banjara Road",
    type: "tertiary",
    path: "M 160,281 Q 164,291 171,300 Q 179,309 189,315 Q 199,321 210,325",
  },
  {
    name: "Harrawala Link",
    type: "tertiary",
    path: "M 269,279 Q 279,273 290,271 Q 302,269 314,273 Q 325,277 337,285",
  },
  {
    name: "Raipur East Link",
    type: "tertiary",
    path: "M 295,249 Q 306,241 316,235 Q 327,229 338,230 Q 348,231 356,237",
  },
  {
    name: "Northern Connector",
    type: "tertiary",
    path: "M 237,153 Q 232,143 233,133 Q 235,123 243,116 Q 251,109 260,105",
  },
  {
    name: "Zoo Approach",
    type: "tertiary",
    path: "M 268,113 Q 277,107 286,103 Q 297,99 307,101 Q 317,103 326,109",
  },
  {
    name: "Tapkeshwar Link",
    type: "tertiary",
    path: "M 172,198 Q 170,187 172,177 Q 175,167 183,160 Q 191,153 201,150",
  },
  {
    name: "FRI East Link",
    type: "tertiary",
    path: "M 128,214 Q 134,205 140,197 Q 146,189 154,184 Q 162,180 171,177",
  },

] as const;

// NOTE: a "local" road tier (22 hand-drawn streets, rendered at 0.02-0.08
// opacity) was intentionally removed for the hero. They were near-invisible
// but doubled the SVG node/path count, which is the single biggest perf cost
// of this illustration on low-end devices. Primary/secondary/tertiary carry
// the visual, so the map reads the same without them.