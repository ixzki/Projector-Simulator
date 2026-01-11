import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { SimulationState } from "@/types";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ControlPanelProps {
  state: SimulationState;
  onChange: (newState: SimulationState) => void;
}

const NumberInput = ({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step = 1,
  unit = "",
  tooltip = ""
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void; 
  min?: number; 
  max?: number;
  step?: number;
  unit?: string;
  tooltip?: string;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3 h-3 text-muted-foreground/50 hover:text-primary transition-colors" />
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <span className="text-xs font-mono text-primary">{value}{unit}</span>
    </div>
    <div className="flex items-center gap-3">
      <Slider 
        value={[value]} 
        min={min} 
        max={max} 
        step={step} 
        onValueChange={(vals) => onChange(vals[0])} 
        className="flex-1"
      />
      <Input 
        type="number" 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 h-7 text-xs px-1 text-right font-mono"
      />
    </div>
  </div>
);

export function ControlPanel({ state, onChange }: ControlPanelProps) {
  
  const updateRoom = (key: keyof typeof state.room.dimensions, val: number) => {
    onChange({
      ...state,
      room: { ...state.room, dimensions: { ...state.room.dimensions, [key]: val } }
    });
  };

  const updateScreen = (key: keyof typeof state.screen | 'positionX' | 'positionY', val: number) => {
    if (key === 'positionX') {
       onChange({ ...state, screen: { ...state.screen, position: { ...state.screen.position, x: val } } });
    } else if (key === 'positionY') {
       onChange({ ...state, screen: { ...state.screen, position: { ...state.screen.position, y: val } } });
    } else {
       // @ts-ignore
       onChange({ ...state, screen: { ...state.screen, [key]: val } });
    }
  };

  const updateProjector = (key: string, val: any) => {
     // Deep merge helper could be better, but manual for now
     const newProj = { ...state.projector };
     if (key === 'throwRatio') newProj.throwRatio = val;
     if (key === 'shiftH') newProj.lensShift = { ...newProj.lensShift, horizontal: val };
     if (key === 'shiftV') newProj.lensShift = { ...newProj.lensShift, vertical: val };
     if (key === 'posX') newProj.position = { ...newProj.position, x: val };
     if (key === 'posY') newProj.position = { ...newProj.position, y: val };
     if (key === 'posZ') newProj.position = { ...newProj.position, z: val }; // Distance
     if (key === 'autoKeystone') newProj.autoKeystone = val;
     if (key === 'targetLookAt') newProj.targetLookAtScreenCenter = val;
     if (key === 'yaw') newProj.rotation = { ...newProj.rotation, yaw: val };
     if (key === 'pitch') newProj.rotation = { ...newProj.rotation, pitch: val };
     
     onChange({ ...state, projector: newProj });
  };

  return (
    <Accordion type="multiple" defaultValue={["room", "projector_pos"]} className="w-full space-y-2">
      
      <AccordionItem value="room" className="border border-border/50 bg-card/30 rounded-lg px-3">
        <AccordionTrigger className="hover:no-underline py-3 text-sm font-semibold">
          空间与幕布
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          <NumberInput 
            label="房间宽度" value={state.room.dimensions.width} 
            min={2000} max={10000} unit="mm"
            onChange={(v) => updateRoom("width", v)} 
          />
          <NumberInput 
            label="房间深度" value={state.room.dimensions.depth} 
            min={2000} max={10000} unit="mm"
            onChange={(v) => updateRoom("depth", v)} 
          />
          <NumberInput 
            label="房间高度" value={state.room.dimensions.height} 
            min={2000} max={5000} unit="mm"
            onChange={(v) => updateRoom("height", v)} 
          />
          <div className="h-px bg-border/50 my-2" />
          <NumberInput 
            label="幕布宽度" value={state.screen.width} 
            min={1000} max={5000} unit="mm"
            tooltip="100英寸16:9幕布宽约2214mm"
            onChange={(v) => updateScreen("width", v)} 
          />
           <NumberInput 
            label="幕布离左墙距离" value={state.screen.position.x} 
            min={0} max={state.room.dimensions.width} unit="mm"
            onChange={(v) => updateScreen("positionX", v)} 
          />
           <NumberInput 
            label="幕布中心高度" value={state.screen.position.y} 
            min={0} max={state.room.dimensions.height} unit="mm"
            onChange={(v) => updateScreen("positionY", v)} 
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="projector_spec" className="border border-border/50 bg-card/30 rounded-lg px-3">
        <AccordionTrigger className="hover:no-underline py-3 text-sm font-semibold">
          投影仪规格
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
           <NumberInput 
            label="投射比 (Throw Ratio)" value={state.projector.throwRatio} 
            min={0.1} max={3.0} step={0.01}
            tooltip="投射距离 / 画面宽度"
            onChange={(v) => updateProjector("throwRatio", v)} 
          />
          <NumberInput 
            label="水平移轴 (Lens Shift H)" value={state.projector.lensShift.horizontal} 
            min={-50} max={50} unit="%"
            onChange={(v) => updateProjector("shiftH", v)} 
          />
          <NumberInput 
            label="垂直移轴 (Lens Shift V)" value={state.projector.lensShift.vertical} 
            min={-100} max={100} unit="%"
            onChange={(v) => updateProjector("shiftV", v)} 
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="projector_pos" className="border border-border/50 bg-card/30 rounded-lg px-3">
        <AccordionTrigger className="hover:no-underline py-3 text-sm font-semibold">
          投影仪摆放位置
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          <NumberInput 
            label="离幕布距离 (Distance)" value={state.projector.position.z} 
            min={500} max={state.room.dimensions.depth} unit="mm"
            onChange={(v) => updateProjector("posZ", v)} 
          />
          <NumberInput 
            label="左右位置 (X)" value={state.projector.position.x} 
            min={0} max={state.room.dimensions.width} unit="mm"
            onChange={(v) => updateProjector("posX", v)} 
          />
          <NumberInput 
            label="上下高度 (Y)" value={state.projector.position.y} 
            min={0} max={state.room.dimensions.height} unit="mm"
            onChange={(v) => updateProjector("posY", v)} 
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="settings" className="border border-border/50 bg-card/30 rounded-lg px-3">
        <AccordionTrigger className="hover:no-underline py-3 text-sm font-semibold">
          功能开关
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
           <div className="flex items-center justify-between">
            <Label className="flex flex-col gap-1">
              <span>自动对准幕布中心</span>
              <span className="text-[10px] text-muted-foreground font-normal">模拟用户扭头看屏幕</span>
            </Label>
            <Switch 
              checked={state.projector.targetLookAtScreenCenter}
              onCheckedChange={(v) => updateProjector("targetLookAt", v)}
            />
          </div>

          {!state.projector.targetLookAtScreenCenter && (
            <div className="space-y-4 pl-2 border-l-2 border-primary/20 mt-2">
              <NumberInput 
                label="偏航角 (Yaw)" value={state.projector.rotation.yaw} 
                min={-60} max={60} step={1} unit="°"
                onChange={(v) => updateProjector("yaw", v)} 
              />
              <NumberInput 
                label="俯仰角 (Pitch)" value={state.projector.rotation.pitch} 
                min={-45} max={45} step={1} unit="°"
                onChange={(v) => updateProjector("pitch", v)} 
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label className="flex flex-col gap-1">
              <span>自动梯形校正</span>
              <span className="text-[10px] text-muted-foreground font-normal">显示校正后有效画面</span>
            </Label>
            <Switch 
              checked={state.projector.autoKeystone}
              onCheckedChange={(v) => updateProjector("autoKeystone", v)}
            />
          </div>
        </AccordionContent>
      </AccordionItem>

    </Accordion>
  );
}
