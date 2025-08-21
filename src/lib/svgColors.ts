import { parse } from 'svgson';
import { Vibrant } from 'node-vibrant/browser';

export interface ColorPalette {
  colors: string[];
  weights: number[];
}

/**
 * Extract dominant colors from SVG content using svgson parser
 * Falls back to rasterization + node-vibrant if fewer than 2 colors found
 */
export async function extractSvgColors(svgUrl: string): Promise<ColorPalette> {
  try {
    // Fetch SVG content
    const response = await fetch(svgUrl);
    const svgContent = await response.text();

    // Parse SVG with svgson
    const svgObject = await parse(svgContent);
    
    // Extract colors from SVG nodes
    const colorCounts = new Map<string, number>();
    
    function traverseNode(node: unknown) {
      const nodeObj = node as { attributes?: Record<string, string>; children?: unknown[] };
      // Extract fill and stroke colors
      const fill = nodeObj.attributes?.fill;
      const stroke = nodeObj.attributes?.stroke;
      
      if (fill && fill !== 'none' && fill !== 'transparent') {
        const normalizedColor = normalizeColor(fill);
        if (normalizedColor) {
          colorCounts.set(normalizedColor, (colorCounts.get(normalizedColor) || 0) + 1);
        }
      }
      
      if (stroke && stroke !== 'none' && stroke !== 'transparent') {
        const normalizedColor = normalizeColor(stroke);
        if (normalizedColor) {
          colorCounts.set(normalizedColor, (colorCounts.get(normalizedColor) || 0) + 1);
        }
      }

      // Traverse children
      if (nodeObj.children) {
        nodeObj.children.forEach(traverseNode);
      }
    }

    traverseNode(svgObject);

    // Convert to array and sort by frequency
    const colorEntries = Array.from(colorCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .filter(([color]) => color !== '#000000' && color !== '#ffffff'); // Filter out pure black/white

    // If we have enough colors from SVG parsing, use them
    if (colorEntries.length >= 2) {
      const totalCount = colorEntries.reduce((sum, [, count]) => sum + count, 0);
      const colors = colorEntries.map(([color]) => color);
      const weights = colorEntries.map(([, count]) => count / totalCount);
      
      return { colors, weights };
    }

    // Fallback to rasterization + node-vibrant
    return await extractColorsFromRaster(svgUrl);
    
  } catch (error) {
    console.warn('Failed to extract colors from SVG:', error);
    // Return default palette
    return {
      colors: ['#22c55e', '#38bdf8', '#6a5acd'],
      weights: [0.5, 0.3, 0.2]
    };
  }
}

/**
 * Fallback method using rasterization and node-vibrant
 */
async function extractColorsFromRaster(svgUrl: string): Promise<ColorPalette> {
  try {
    // Create a canvas to rasterize the SVG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        try {
          // Convert canvas to blob for node-vibrant
          canvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }
            
            const buffer = await blob.arrayBuffer();
            const vibrant = new Vibrant(Buffer.from(buffer));
            const palette = await vibrant.getPalette();
            
            const colors: string[] = [];
            const weights: number[] = [];
            
            // Extract colors in order of preference
            const swatches = [
              palette.Vibrant,
              palette.DarkVibrant,
              palette.LightVibrant,
              palette.Muted,
              palette.DarkMuted,
              palette.LightMuted
            ];
            
            swatches.forEach((swatch, index) => {
              if (swatch) {
                colors.push(swatch.hex);
                // Give higher weights to more vibrant colors
                weights.push(Math.max(0.1, 1 - (index * 0.15)));
              }
            });
            
            // Normalize weights
            const totalWeight = weights.reduce((sum, w) => sum + w, 0);
            const normalizedWeights = weights.map(w => w / totalWeight);
            
            resolve({ colors, weights: normalizedWeights });
          });
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = svgUrl;
    });
    
  } catch (error) {
    console.warn('Raster extraction failed:', error);
    // Return default palette
    return {
      colors: ['#22c55e', '#38bdf8', '#6a5acd'],
      weights: [0.5, 0.3, 0.2]
    };
  }
}

/**
 * Normalize color to hex format
 */
function normalizeColor(color: string): string | null {
  if (!color || color === 'none' || color === 'transparent') return null;
  
  // Already hex
  if (color.startsWith('#')) {
    return color.length === 4 ? expandHex(color) : color.toLowerCase();
  }
  
  // RGB format
  if (color.startsWith('rgb')) {
    return rgbToHex(color);
  }
  
  // Named colors - convert basic ones
  const namedColors: Record<string, string> = {
    'red': '#ff0000',
    'green': '#008000',
    'blue': '#0000ff',
    'white': '#ffffff',
    'black': '#000000',
    'yellow': '#ffff00',
    'cyan': '#00ffff',
    'magenta': '#ff00ff',
    'orange': '#ffa500',
    'purple': '#800080',
    'brown': '#a52a2a',
    'gray': '#808080',
    'grey': '#808080'
  };
  
  return namedColors[color.toLowerCase()] || null;
}

/**
 * Expand 3-digit hex to 6-digit hex
 */
function expandHex(hex: string): string {
  return '#' + hex.slice(1).split('').map(c => c + c).join('');
}

/**
 * Convert RGB string to hex
 */
function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return '#000000';
  
  const [, r, g, b] = match;
  return '#' + [r, g, b].map(x => {
    const hex = parseInt(x, 10).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}