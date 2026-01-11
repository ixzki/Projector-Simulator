import React, { useMemo } from "react";
import type { SimulationState } from "@/types";
import { calculateProjection } from "@/lib/geometry";

interface ViewProps {
  state: SimulationState;
}

export function FrontView({ state }: ViewProps) {
  const { room, screen, projector } = state;
  const result = useMemo(() => calculateProjection(projector, screen), [projector, screen]);
  
  // Coordinate transform: Wall origin is Bottom-Left (0,0) usually? 
  // No, let's assume standard math coords: (0,0) is bottom-left of the wall for drawing simplicity.
  // SVG: (0,0) is Top-Left.
  // Map: x -> x, y -> room.height - y.
  
  const toSvg = (x: number, y: number) => `${x},${room.dimensions.height - y}`;
  
  const screenPath = `
    M ${toSvg(screen.position.x - screen.width / 2, screen.position.y + (screen.width/screen.aspectRatio)/2)}
    L ${toSvg(screen.position.x + screen.width / 2, screen.position.y + (screen.width/screen.aspectRatio)/2)}
    L ${toSvg(screen.position.x + screen.width / 2, screen.position.y - (screen.width/screen.aspectRatio)/2)}
    L ${toSvg(screen.position.x - screen.width / 2, screen.position.y - (screen.width/screen.aspectRatio)/2)}
    Z
  `;

  const projPath = result.isValid ? `
    M ${toSvg(result.corners[0].x, result.corners[0].y)}
    L ${toSvg(result.corners[1].x, result.corners[1].y)}
    L ${toSvg(result.corners[2].x, result.corners[2].y)}
    L ${toSvg(result.corners[3].x, result.corners[3].y)}
    Z
  ` : "";

  const correctedPath = (result.isValid && result.correctedCorners) ? `
    M ${toSvg(result.correctedCorners[0].x, result.correctedCorners[0].y)}
    L ${toSvg(result.correctedCorners[1].x, result.correctedCorners[1].y)}
    L ${toSvg(result.correctedCorners[2].x, result.correctedCorners[2].y)}
    L ${toSvg(result.correctedCorners[3].x, result.correctedCorners[3].y)}
    Z
  ` : "";

  // Bounding box for ViewBox: Room dimensions
  const viewBox = `0 0 ${room.dimensions.width} ${room.dimensions.height}`;

  return (
    <div className="w-full h-full p-8 flex flex-col items-center justify-center">
      <div className="relative w-full h-full max-w-4xl max-h-[80vh] border border-sidebar-border bg-card/20 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden">
        <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          
          {/* Grid Background */}
          <defs>
            <pattern id="grid" width="500" height="500" patternUnits="userSpaceOnUse">
              <path d="M 500 0 L 0 0 0 500" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" className="text-muted-foreground/20" />

          {/* Wall Boundary */}
          <rect width={room.dimensions.width} height={room.dimensions.height} fill="none" stroke="currentColor" strokeWidth="4" className="text-sidebar-border" />

          {/* Screen Area */}
          <path d={screenPath} fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="4" strokeDasharray="10,5" className="text-muted-foreground" />
          <text 
            x={screen.position.x} 
            y={room.dimensions.height - screen.position.y} 
            textAnchor="middle" 
            dominantBaseline="middle" 
            className="text-[40px] fill-muted-foreground opacity-50 font-mono"
          >
            幕布
          </text>

          {/* Projected Area (Raw Trapezoid) */}
          {result.isValid && (
            <path 
              d={projPath} 
              fill={result.correctedCorners ? "var(--primary)" : "var(--primary)"} 
              fillOpacity={result.correctedCorners ? "0.1" : "0.2"} 
              stroke="var(--primary)" 
              strokeWidth="2" 
              strokeDasharray={result.correctedCorners ? "4,4" : "0"}
            />
          )}

          {/* Corrected Area (Rectangle) */}
          {result.isValid && correctedPath && (
             <g>
              <path 
                d={correctedPath} 
                fill="var(--primary)" 
                fillOpacity="0.3" 
                stroke="var(--primary)" 
                strokeWidth="4" 
              />
              {/* Show Size of Corrected Image */}
              <text 
                x={result.correctedCorners![2].x} 
                y={room.dimensions.height - result.correctedCorners![2].y + 100} 
                textAnchor="end"
                className="text-2xl fill-primary font-mono font-bold"
              >
                {Math.round((result.correctedCorners![1].x - result.correctedCorners![0].x))} x {Math.round((result.correctedCorners![0].y - result.correctedCorners![3].y))} mm
              </text>
            </g>
          )}

          {/* Projector Center Point Projection (Crosshair) */}
          {/* Optional: Show where the lens center points to */}
          
        </svg>

        {/* HUD Info */}
        <div className="absolute top-4 right-4 bg-card/90 border border-border p-3 rounded text-xs font-mono space-y-1 text-muted-foreground shadow-lg">
          <div className="text-primary font-bold mb-2">实时数据</div>
          <div>偏航角: {result.rotation.yaw.toFixed(1)}°</div>
          <div>俯仰角: {result.rotation.pitch.toFixed(1)}°</div>
          <div className={result.isValid ? "text-green-500" : "text-red-500"}>
            状态: {result.isValid ? "正常" : "无效"}
          </div>
          {result.correctedCorners && (
             <div className="pt-2 border-t border-border mt-2">
               <div className="text-muted-foreground text-[10px] uppercase">校正效率</div>
               <div className="text-xl font-bold text-primary">{result.efficiency.toFixed(1)}%</div>
               <div className="text-[10px] text-muted-foreground">像素保留</div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TopView({ state }: ViewProps) {
  const { room, screen, projector } = state;
  const result = useMemo(() => calculateProjection(projector, screen), [projector, screen]);

  // Map: x -> x, z -> z
  // SVG Origin (0,0) is Top-Left. 
  // Let's map Room (0,0,0) to Top-Left?
  // Room X is Width, Z is Depth. 
  // Z=0 is Wall. Z increases away from wall.
  // So Top of SVG is Wall (Z=0). Bottom is Room Depth.
  
  const toSvg = (x: number, z: number) => `${x},${z}`;

  const screenLine = `
    M ${toSvg(screen.position.x - screen.width / 2, 0)}
    L ${toSvg(screen.position.x + screen.width / 2, 0)}
  `;

  // Projector Position
  const projPos = projector.position;

  // Light Cone (Triangle from Projector to Wall Extents)
  // We use the projected corners X values at Z=0.
  // Actually, we should draw the cone to the 2 widest X points on wall.
  const xs = result.isValid ? result.corners.map(p => p.x) : [];
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  
  const conePath = result.isValid ? `
    M ${toSvg(projPos.x, projPos.z)}
    L ${toSvg(minX, 0)}
    L ${toSvg(maxX, 0)}
    Z
  ` : "";

  const viewBox = `0 0 ${room.dimensions.width} ${room.dimensions.depth}`;

  return (
    <div className="w-full h-full p-8 flex flex-col items-center justify-center">
      <div className="relative w-full h-full max-w-4xl max-h-[80vh] border border-sidebar-border bg-card/20 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden">
        <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          
          {/* Grid */}
          <defs>
             <pattern id="gridZ" width="500" height="500" patternUnits="userSpaceOnUse">
              <path d="M 500 0 L 0 0 0 500" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridZ)" className="text-muted-foreground/20" />

          {/* Screen Line */}
          <path d={screenLine} stroke="currentColor" strokeWidth="8" className="text-muted-foreground" />
          <text 
             x={screen.position.x} y={150} 
             textAnchor="middle" 
             className="text-[40px] fill-muted-foreground opacity-50 font-mono"
          >
            幕布 (墙面)
          </text>

          {/* Light Cone */}
          {result.isValid && (
            <path d={conePath} fill="var(--primary)" fillOpacity="0.1" stroke="var(--primary)" strokeWidth="2" strokeDasharray="5,5" />
          )}

          {/* Projector Body */}
          <circle cx={projPos.x} cy={projPos.z} r="100" fill="var(--card)" stroke="var(--primary)" strokeWidth="4" />
          <line 
            x1={projPos.x} y1={projPos.z} 
            x2={projPos.x + Math.sin(result.rotation.yaw * Math.PI / 180) * 300} 
            y2={projPos.z - Math.cos(result.rotation.yaw * Math.PI / 180) * 300} 
            stroke="var(--primary)" strokeWidth="4" 
            markerEnd="url(#arrow)"
          />

        </svg>
      </div>
    </div>
  );
}
