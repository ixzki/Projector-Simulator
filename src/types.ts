export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface ProjectorParams {
  throwRatio: number; // 投射比
  brightness?: number; // 亮度（流明，可选，暂不模拟光照）
  lensShift: {
    horizontal: number; // %
    vertical: number; // %
  };
  position: Position3D; // 坐标 (相对于房间原点)
  rotation: {
    yaw: number; // 水平旋转
    pitch: number; // 垂直俯仰
    roll: number; // 翻滚（通常很少用，暂保留）
  };
  autoKeystone: boolean; // 是否开启自动梯形校正
  targetLookAtScreenCenter: boolean; // 是否自动对准幕布中心
}

export interface ScreenParams {
  width: number;
  aspectRatio: number; // 16/9
  position: Position3D; // 屏幕中心点位置
}

export interface RoomParams {
  dimensions: Dimensions;
}

export interface SimulationState {
  room: RoomParams;
  screen: ScreenParams;
  projector: ProjectorParams;
}

export const DEFAULT_STATE: SimulationState = {
  room: {
    dimensions: { width: 5000, height: 3000, depth: 4000 }, // mm
  },
  screen: {
    width: 2214, // 100 inches 16:9 width approx
    aspectRatio: 16 / 9,
    position: { x: 2500, y: 1500, z: 0 }, // Wall at z=0, center of wall
  },
  projector: {
    throwRatio: 1.2,
    lensShift: { horizontal: 0, vertical: 0 }, // 0% center
    position: { x: 2500, y: 1500, z: 3000 }, // 3m away
    rotation: { yaw: 0, pitch: 0, roll: 0 },
    autoKeystone: true,
    targetLookAtScreenCenter: true,
  },
};
