/**
 * Hexagonal grid math utilities
 * Based on Red Blob Games axial coordinate system for pointy-topped hexagons
 * Reference: https://www.redblobgames.com/grids/hexagons/
 */

export interface AxialCoordinate {
  q: number; // column
  r: number; // row
}

export interface Point {
  x: number;
  y: number;
}

export interface HexCell {
  coordinate: AxialCoordinate;
  center: Point;
  color: string;
}

/**
 * Calculate the center point of a hex in pixel coordinates
 * For pointy-topped hexagons
 */
export function axialToPixel(coord: AxialCoordinate, size: number): Point {
  const x = size * (Math.sqrt(3) * coord.q + (Math.sqrt(3) / 2) * coord.r);
  const y = size * ((3 / 2) * coord.r);
  return { x, y };
}

/**
 * Convert pixel coordinates to axial coordinates
 */
export function pixelToAxial(point: Point, size: number): AxialCoordinate {
  const q = ((Math.sqrt(3) / 3) * point.x - (1 / 3) * point.y) / size;
  const r = ((2 / 3) * point.y) / size;
  return roundAxial({ q, r });
}

/**
 * Round fractional axial coordinates to nearest hex
 */
export function roundAxial(coord: AxialCoordinate): AxialCoordinate {
  const s = -coord.q - coord.r; // third coordinate
  let rq = Math.round(coord.q);
  let rr = Math.round(coord.r);
  const rs = Math.round(s);

  const qDiff = Math.abs(rq - coord.q);
  const rDiff = Math.abs(rr - coord.r);
  const sDiff = Math.abs(rs - s);

  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }

  return { q: rq, r: rr };
}

/**
 * Get the 6 corner points of a hexagon for drawing
 */
export function getHexCorners(center: Point, size: number): Point[] {
  const corners: Point[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30); // pointy-topped
    const x = center.x + size * Math.cos(angle);
    const y = center.y + size * Math.sin(angle);
    corners.push({ x, y });
  }
  return corners;
}

/**
 * Generate hex coordinates for a rectangular region
 */
export function generateHexGrid(
  width: number,
  height: number,
  hexSize: number,
  offsetX = 0,
  offsetY = 0
): AxialCoordinate[] {
  const coordinates: AxialCoordinate[] = [];
  
  // Calculate the rough bounds in hex coordinates
  const minQ = Math.floor((-width / 2 - offsetX) / (hexSize * Math.sqrt(3))) - 1;
  const maxQ = Math.ceil((width / 2 - offsetX) / (hexSize * Math.sqrt(3))) + 1;
  const minR = Math.floor((-height / 2 - offsetY) / (hexSize * 1.5)) - 1;
  const maxR = Math.ceil((height / 2 - offsetY) / (hexSize * 1.5)) + 1;

  for (let q = minQ; q <= maxQ; q++) {
    for (let r = minR; r <= maxR; r++) {
      const pixel = axialToPixel({ q, r }, hexSize);
      
      // Check if hex is within the viewport bounds (with some margin)
      if (
        pixel.x >= -hexSize - offsetX &&
        pixel.x <= width + hexSize - offsetX &&
        pixel.y >= -hexSize - offsetY &&
        pixel.y <= height + hexSize - offsetY
      ) {
        coordinates.push({ q, r });
      }
    }
  }

  return coordinates;
}

/**
 * Shuffle array in place using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Allocate colors to hex cells based on palette weights
 */
export function allocateColorsToHexes(
  coordinates: AxialCoordinate[],
  colors: string[],
  weights: number[],
  hexSize: number
): HexCell[] {
  if (colors.length === 0) return [];
  
  const totalHexes = coordinates.length;
  const colorCounts: number[] = [];
  
  // Calculate how many hexes each color should get
  let totalAllocated = 0;
  for (let i = 0; i < colors.length; i++) {
    const count = Math.round(weights[i] * totalHexes);
    colorCounts.push(count);
    totalAllocated += count;
  }
  
  // Fix rounding drift by adjusting the largest weight
  const drift = totalHexes - totalAllocated;
  if (drift !== 0) {
    const maxWeightIndex = weights.indexOf(Math.max(...weights));
    colorCounts[maxWeightIndex] += drift;
  }
  
  // Create array of colors based on counts
  const colorArray: string[] = [];
  for (let i = 0; i < colors.length; i++) {
    for (let j = 0; j < colorCounts[i]; j++) {
      colorArray.push(colors[i]);
    }
  }
  
  // Shuffle colors for random distribution
  const shuffledColors = shuffleArray(colorArray);
  
  // Create hex cells
  return coordinates.map((coord, index) => ({
    coordinate: coord,
    center: axialToPixel(coord, hexSize),
    color: shuffledColors[index] || colors[0] // fallback to first color
  }));
}

/**
 * Calculate optimal hex size to fit viewport
 */
export function calculateOptimalHexSize(
  viewportWidth: number,
  viewportHeight: number,
  targetHexCount = 100
): number {
  // Approximate area per hex for pointy-topped hexagons
  const hexArea = (3 * Math.sqrt(3) / 2);
  const totalArea = viewportWidth * viewportHeight;
  const targetArea = totalArea / targetHexCount;
  
  // Calculate size from area: area = 3 * sqrt(3) / 2 * size^2
  const size = Math.sqrt(targetArea / hexArea);
  
  // Clamp between reasonable bounds
  return Math.max(20, Math.min(60, size));
}