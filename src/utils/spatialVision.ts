// Spatial Vision Utility: Ported and Refactored from chromanumber-ai
// Provides geometric positioning and alignment logic for high-fidelity handwriting analysis.

export interface Point {
  u: number;
  v: number;
  p: number;
  t: number;
}

export interface Bounds {
  u: [number, number];
  v: [number, number];
}

export interface Centroid {
  u: number;
  v: number;
}

/**
 * Calculates the bounding box of a set of strokes.
 */
export const calculateBounds = (strokes: Point[][]): Bounds => {
  let uMin = 1, uMax = 0, vMin = 1, vMax = 0;
  
  strokes.forEach(stroke => {
    stroke.forEach(pt => {
      uMin = Math.min(uMin, pt.u);
      uMax = Math.max(uMax, pt.u);
      vMin = Math.min(vMin, pt.v);
      vMax = Math.max(vMax, pt.v);
    });
  });

  return { u: [uMin, uMax], v: [vMin, vMax] };
};

/**
 * Calculates the geometric centroid (center of mass) of the handwriting specimen.
 */
export const calculateCentroid = (strokes: Point[][]): Centroid => {
  let sumU = 0, sumV = 0, count = 0;
  
  strokes.forEach(stroke => {
    stroke.forEach(pt => {
      sumU += pt.u;
      sumV += pt.v;
      count++;
    });
  });

  return count > 0 ? { u: sumU / count, v: sumV / count } : { u: 0.5, v: 0.5 };
};

/**
 * Computes the "Spatial Alignment" score between a student's specimen and a target reference.
 * Refactored from Chroma's region-matching logic.
 */
export const calculateAlignment = (userCentroid: Centroid, userBounds: Bounds, targetCentroid: Centroid): number => {
  const du = userCentroid.u - targetCentroid.u;
  const dv = userCentroid.v - targetCentroid.v;
  const distance = Math.sqrt(du * du + dv * dv);
  
  // Alignment Score: 100% at same centroid, drops as drift increases.
  const score = Math.max(0, 100 - (distance * 200)); 
  return parseFloat(score.toFixed(2));
};

/**
 * Transform an ideal SVG path (0-100 scale) to fit a specific U/V bounding box.
 * This is the "Spatial Anchoring" logic for guided correctiveness.
 */
export const anchorPathToBounds = (svgPath: string, bounds: Bounds): string => {
  // Extract coordinates and transform them to fit the student's actual drawing box
  // (Simplified placeholder for full SVG parsing)
  return svgPath; // More advanced logic would parse 'M/L/C' and scale/offset here
};
