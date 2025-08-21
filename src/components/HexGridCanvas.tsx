import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { 
  allocateColorsToHexes, 
  calculateOptimalHexSize, 
  generateHexGrid, 
  getHexCorners,
  type HexCell 
} from '@/lib/hexgrid';
import { teamPaletteAtom, themeAtom } from '@/state/themeAtoms';

interface HexGridCanvasProps {
  className?: string;
}

/**
 * Responsive canvas component that renders a weighted hexagonal grid background
 * Colors are allocated based on team palette weights
 * Uses Red Blob Games axial coordinate math for pointy-topped hexes
 */
export default function HexGridCanvas({ className = '' }: HexGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const theme = useAtomValue(themeAtom);
  const teamPalette = useAtomValue(teamPaletteAtom);

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Render hexagonal grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !teamPalette || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    const { colors, weights } = teamPalette;
    if (colors.length === 0) return;

    // Calculate hex size based on viewport
    const hexSize = calculateOptimalHexSize(dimensions.width, dimensions.height, 120);
    
    // Generate hex grid coordinates
    const coordinates = generateHexGrid(
      dimensions.width,
      dimensions.height,
      hexSize,
      dimensions.width / 2,
      dimensions.height / 2
    );

    // Allocate colors to hexes based on weights
    const hexCells = allocateColorsToHexes(coordinates, colors, weights, hexSize);

    // Draw hexagons
    hexCells.forEach((cell: HexCell) => {
      drawHexagon(ctx, cell, hexSize);
    });

  }, [dimensions, teamPalette]);

  // Only render for team theme
  if (theme !== 'team' || !teamPalette) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 -z-10 pointer-events-none ${className}`}
      style={{
        width: '100%',
        height: '100%'
      }}
    />
  );
}

/**
 * Draw a single hexagon on the canvas
 */
function drawHexagon(ctx: CanvasRenderingContext2D, cell: HexCell, size: number) {
  const corners = getHexCorners(cell.center, size);
  
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  
  for (let i = 1; i < corners.length; i++) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  
  ctx.closePath();
  
  // Fill with color and slight transparency
  ctx.fillStyle = cell.color + '40'; // Add 25% opacity
  ctx.fill();
  
  // Optional: Add subtle border
  ctx.strokeStyle = cell.color + '20'; // Add 12.5% opacity
  ctx.lineWidth = 0.5;
  ctx.stroke();
}