import type { Position3D, ProjectorParams, ScreenParams } from "@/types";

export interface Point2D {
  x: number;
  y: number;
}

export interface ProjectionResult {
  corners: [Point2D, Point2D, Point2D, Point2D]; // TL, TR, BR, BL order on the wall
  correctedCorners?: [Point2D, Point2D, Point2D, Point2D]; 
  rotation: { yaw: number; pitch: number }; 
  coverage: number; 
  efficiency: number; // % of pixels used after correction
  isValid: boolean;
}

// Vector operations helper
const sub = (a: Position3D, b: Position3D) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const normalize = (v: Position3D) => {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  return len === 0 ? v : { x: v.x / len, y: v.y / len, z: v.z / len };
};
const cross = (a: Position3D, b: Position3D) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const dot = (a: Position3D, b: Position3D) => a.x * b.x + a.y * b.y + a.z * b.z;

// Helper to check if point P is inside convex polygon V
function isPointInPolygon(p: Point2D, v: Point2D[]) {
  // Ray casting algo or cross product check for convex
  // For convex, cross product of all edges should have same sign
  let positive = false;
  let negative = false;
  for (let i = 0; i < v.length; i++) {
    const p1 = v[i];
    const p2 = v[(i + 1) % v.length];
    const cross = (p.x - p1.x) * (p2.y - p1.y) - (p.y - p1.y) * (p2.x - p1.x);
    if (cross > 0) positive = true;
    if (cross < 0) negative = true;
    if (positive && negative) return false;
  }
  return true;
}

export function calculateProjection(
  projector: ProjectorParams,
  screen: ScreenParams
): ProjectionResult {
  const { position, throwRatio, lensShift, autoKeystone, targetLookAtScreenCenter } = projector;

  // 1. Determine Orientation (Basis Vectors: Right, Up, Forward)
  let forward: Position3D; // Local -Z axis usually
  let up: Position3D = { x: 0, y: 1, z: 0 };
  let right: Position3D;

  let displayYaw = 0;
  let displayPitch = 0;

  if (targetLookAtScreenCenter) {
    // Look at screen center
    const target = screen.position;
    // Direction from Projector to Target
    const dir = sub(target, position); // (tx-px, ty-py, 0-pz)
    forward = normalize(dir);
    
    // Calculate Right and Up
    // Handle edge case where forward is vertical
    if (Math.abs(forward.x) < 0.001 && Math.abs(forward.z) < 0.001) {
       right = { x: 1, y: 0, z: 0 };
    } else {
       right = normalize(cross(forward, up));
    }
    // Re-calculate pure Up
    up = normalize(cross(right, forward));

    // Calculate Euler angles for display from forward vector
    // Pitch: angle between forward and horizontal plane (XZ)
    displayPitch = Math.asin(forward.y); 
    // Yaw: angle of projection on XZ plane relative to -Z axis
    // forward.z is -cos(yaw)*cos(pitch), forward.x is sin(yaw)*cos(pitch)
    // atan2(x, -z) should give angle from -Z axis?
    // standard atan2(y, x) gives angle from +X.
    // We want 0 at -Z (0,0,-1). 
    // If x=0, z=-1 => atan2(0, 1) = 0. Wait, atan2(x, z). 
    // Let's stick to standard: atan2(x, z). 
    // If x=0, z=-1 (forward), atan2(0, -1) = PI (180 deg). 
    // If x=1, z=0 (right), atan2(1, 0) = PI/2 (90 deg).
    // We want 0 at -Z. So maybe atan2(x, -z)?
    // x=0, z=-1 => -z=1 => atan2(0, 1) = 0. Correct.
    // x=1, z=0 => -z=0 => atan2(1, 0) = 90. Correct (Right).
    displayYaw = Math.atan2(forward.x, -forward.z);

  } else {
    // Use manual rotation (Yaw/Pitch) from params
    // Yaw: 0 = -Z, + = Right (rotate around Y)
    // Pitch: 0 = Horizon, + = Up (rotate around Local X)
    
    const yawRad = projector.rotation.yaw * Math.PI / 180;
    const pitchRad = projector.rotation.pitch * Math.PI / 180;

    // Calculate Forward vector
    // Assume Yaw rotates around global Y first
    // Then Pitch rotates around local Right? 
    // Or just spherical coords:
    // y = sin(pitch)
    // h = cos(pitch)
    // x = h * sin(yaw)
    // z = h * -cos(yaw) (since 0 is -Z)
    
    forward = {
      x: Math.cos(pitchRad) * Math.sin(yawRad),
      y: Math.sin(pitchRad),
      z: -Math.cos(pitchRad) * Math.cos(yawRad)
    };
    
    // Recalculate Right and Up
    if (Math.abs(forward.x) < 0.001 && Math.abs(forward.z) < 0.001) {
       // Gimbal lock looking straight up/down
       // If up, forward=(0,1,0). Right=(1,0,0).
       right = { x: 1, y: 0, z: 0 };
    } else {
       // Global Up (0,1,0)
       right = normalize(cross(forward, { x: 0, y: 1, z: 0 }));
    }
    up = normalize(cross(right, forward));

    displayYaw = yawRad;
    displayPitch = pitchRad;
  }

  // Angles are calculated above

  // 2. Define Image Plane in Local Space
  // Assume image plane is at distance 1 unit from lens along the Forward vector
  // The 'image' on the sensor is centered at (0,0) usually, but Lens Shift moves the optical axis.
  // Actually, Lens Shift moves the Sensor relative to the Lens.
  // Visual Model: Ray = Forward + (u * Right + v * Up)
  // Throw Ratio TR = Distance / Width. 
  // At distance 1, Width = 1 / TR.
  const sensorWidthAtUnitDist = 1.0 / throwRatio;
  const sensorHeightAtUnitDist = sensorWidthAtUnitDist * (9.0 / 16.0);

  // Lens Shift Offsets the "Center of the Image" relative to the "Forward Vector"
  // Positive Shift H -> Image moves Right -> Rays turn Right
  const shiftX = sensorWidthAtUnitDist * (lensShift.horizontal / 100.0);
  const shiftY = sensorHeightAtUnitDist * (lensShift.vertical / 100.0);

  // 4 Corners in Local Sensor Plane (relative to Forward vector tip)
  // Standard Projector: (0,0) is center.
  // Corners: Center +/- Size/2
  const cornersLocal = [
    { u: shiftX - sensorWidthAtUnitDist / 2, v: shiftY + sensorHeightAtUnitDist / 2 }, // TL (Top-Left in image = Up-Left)
    { u: shiftX + sensorWidthAtUnitDist / 2, v: shiftY + sensorHeightAtUnitDist / 2 }, // TR
    { u: shiftX + sensorWidthAtUnitDist / 2, v: shiftY - sensorHeightAtUnitDist / 2 }, // BR
    { u: shiftX - sensorWidthAtUnitDist / 2, v: shiftY - sensorHeightAtUnitDist / 2 }, // BL
  ];

  // 3. Ray Casting to Wall (Plane Z = 0)
  const wallCorners: Point2D[] = [];
  let allValid = true;

  for (const c of cornersLocal) {
    // Ray Direction = Forward + u*Right + v*Up
    const rayDir = {
      x: forward.x + c.u * right.x + c.v * up.x,
      y: forward.y + c.u * right.y + c.v * up.y,
      z: forward.z + c.u * right.z + c.v * up.z,
    };

    // Intersection with Plane Z = 0
    // P = Origin + t * Dir
    // P.z = Origin.z + t * Dir.z = 0 => t = -Origin.z / Dir.z
    if (Math.abs(rayDir.z) < 0.0001) {
      allValid = false;
      break; // Parallel to wall
    }

    const t = -position.z / rayDir.z;
    if (t < 0) {
       // Intersection is behind the projector
       allValid = false; 
    }

    const hitPoint = {
      x: position.x + t * rayDir.x,
      y: position.y + t * rayDir.y,
      z: 0 // Should be 0
    };
    
    wallCorners.push({ x: hitPoint.x, y: hitPoint.y });
  }

  // If rays go backwards (e.g. projector behind wall or pointing away), handle error
  if (!allValid || wallCorners.length < 4) {
    return {
      corners: [{x:0,y:0}, {x:0,y:0}, {x:0,y:0}, {x:0,y:0}],
      rotation: { yaw: displayYaw * 180/Math.PI, pitch: displayPitch * 180 / Math.PI },
      coverage: 0,
      efficiency: 0,
      isValid: false
    };
  }

    let correctedCorners: [Point2D, Point2D, Point2D, Point2D] | undefined;
  
  if (autoKeystone && allValid) {
    // Calculate largest inscribed 16:9 rectangle
    // Algorithm: Binary search for max scale centered at polygon centroid
    const centroid = wallCorners.reduce((acc, p) => ({ x: acc.x + p.x/4, y: acc.y + p.y/4 }), {x:0, y:0});
    
    // Max possible width/height based on bounding box is safe upper bound
    // But we use binary search from 0 to huge
    let minH = 0;
    let maxH = 5000; // 5 meters half-height is enough
    let bestH = 0;

    const ASPECT = 16/9;

    for (let i = 0; i < 20; i++) {
       const h = (minH + maxH) / 2;
       const w = h * ASPECT;
       
       const rect = [
         { x: centroid.x - w, y: centroid.y + h }, // TL
         { x: centroid.x + w, y: centroid.y + h }, // TR
         { x: centroid.x + w, y: centroid.y - h }, // BR
         { x: centroid.x - w, y: centroid.y - h }, // BL
       ];
       
       const allInside = rect.every(p => isPointInPolygon(p, wallCorners));
       
       if (allInside) {
         bestH = h;
         minH = h;
       } else {
         maxH = h;
       }
    }
    
    const w = bestH * ASPECT;
    const h = bestH;
    correctedCorners = [
       { x: centroid.x - w, y: centroid.y + h },
       { x: centroid.x + w, y: centroid.y + h },
       { x: centroid.x + w, y: centroid.y - h },
       { x: centroid.x - w, y: centroid.y - h },
    ];
  }

  // Calc Efficiency
  let efficiency = 0;
  if (allValid && wallCorners.length === 4) {
      // Shoelace area of poly
      let polyArea = 0;
      for (let i = 0; i < 4; i++) {
          polyArea += (wallCorners[i].x * wallCorners[(i+1)%4].y - wallCorners[(i+1)%4].x * wallCorners[i].y);
      }
      polyArea = Math.abs(polyArea) / 2;

      // Area of corrected rect
      let rectArea = 0;
      if (correctedCorners) {
          rectArea = (correctedCorners[1].x - correctedCorners[0].x) * (correctedCorners[0].y - correctedCorners[3].y);
      } else {
          // If no correction needed (perfect rect), assume 100? No, this is "Simulated Correction".
          // If autoKeystone is off, efficiency is not applicable in this context (or 100% of raw).
          // Let's just say 0 if off for now or calculate raw rect?
          // If off, we don't know the target rect size.
      }
      
      if (polyArea > 0) efficiency = (rectArea / polyArea) * 100;
  }

  return {
    corners: wallCorners as [Point2D, Point2D, Point2D, Point2D],
    correctedCorners,
    rotation: { 
      yaw: displayYaw * 180 / Math.PI, 
      pitch: displayPitch * 180 / Math.PI 
    },
    coverage: 100,
    efficiency,
    isValid: true
  };
}
