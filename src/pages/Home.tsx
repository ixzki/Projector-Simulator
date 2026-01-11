import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_STATE, type SimulationState } from "@/types";
import { Settings2, Monitor, Box, Scan, Download, RotateCcw, FileJson, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRef } from "react";
import html2canvas from "html2canvas";
import { ControlPanel } from "@/components/ControlPanel";
import { FrontView, TopView } from "@/components/Visualization";

export default function Home() {
  const [state, setState] = useState<SimulationState>(DEFAULT_STATE);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleExportImage = async () => {
    if (!exportRef.current) return;
    const toastId = toast.loading("正在生成图片...");
    try {
        // Wait a bit for render
        await new Promise(r => setTimeout(r, 100));
        const canvas = await html2canvas(exportRef.current, {
            backgroundColor: getComputedStyle(document.body).getPropertyValue('--background'),
            scale: 2,
            logging: false,
            useCORS: true
        });
        const url = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.download = `projector_config_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.png`;
        link.href = url;
        link.click();
        toast.dismiss(toastId);
        toast.success("图片已导出");
    } catch (e) {
        toast.dismiss(toastId);
        toast.error("导出失败");
        console.error(e);
    }
  };

  const loadPreset = (name: string) => {
    if (name === "default") {
       setState(DEFAULT_STATE);
       toast.success("已重置为默认设置");
    } else if (name === "bedroom_side") {
       setState({
         room: { dimensions: { width: 3500, height: 2600, depth: 3500 } },
         screen: { 
           width: 2000, 
           aspectRatio: 16/9, 
           position: { x: 1750, y: 1500, z: 0 } 
         },
         projector: {
           throwRatio: 1.2,
           lensShift: { horizontal: 0, vertical: 0 },
           // Bedside table: 500mm from right wall, 600mm high, 3000mm from screen
           position: { x: 3000, y: 600, z: 3000 }, 
           rotation: { yaw: 0, pitch: 0, roll: 0 },
           autoKeystone: true,
           targetLookAtScreenCenter: true,
         }
       });
       toast.success("已加载：卧室侧投场景");
    } else if (name === "meeting_ceiling") {
       setState({
         room: { dimensions: { width: 6000, height: 3000, depth: 8000 } },
         screen: { 
           width: 3000, 
           aspectRatio: 16/9, 
           position: { x: 3000, y: 1800, z: 0 } 
         },
         projector: {
           throwRatio: 1.5,
           lensShift: { horizontal: 0, vertical: -50 }, // Lens shift down
           position: { x: 3000, y: 2900, z: 4500 }, // Ceiling mount
           rotation: { yaw: 0, pitch: 0, roll: 0 },
           autoKeystone: true,
           targetLookAtScreenCenter: true,
         }
       });
       toast.success("已加载：会议室吊装场景");
    }
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center px-6 bg-card shrink-0">
        <Monitor className="w-5 h-5 text-primary mr-3" />
        <h1 className="font-bold text-lg tracking-tight">投影仪侧投模拟器 <span className="text-primary text-xs ml-1 font-normal border border-primary/30 px-1 rounded">PRO</span></h1>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FileJson className="w-4 h-4" />
                预设场景
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => loadPreset("default")}>
                客厅正投 (默认)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => loadPreset("bedroom_side")}>
                卧室床头侧投
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => loadPreset("meeting_ceiling")}>
                会议室吊装
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={() => loadPreset("default")} title="重置">
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button variant="default" size="sm" onClick={handleExportImage} className="gap-2">
            <ImageIcon className="w-4 h-4" />
            导出图片
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        
        {/* Left Sidebar: Controls */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="bg-card/50 border-r border-border">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-border flex items-center gap-2 font-medium text-sm text-primary">
              <Settings2 className="w-4 h-4" />
              参数配置
            </div>
            <ScrollArea className="flex-1 h-0">
              <div className="p-4 space-y-6">
                <ControlPanel state={state} onChange={setState} />
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Area: Visualization */}
        <ResizablePanel defaultSize={75}>
          <div className="h-full flex flex-col bg-background/50 relative">
             <Tabs defaultValue="front" className="flex-1 flex flex-col">
              <div className="px-4 pt-2 border-b border-border bg-card/30 flex items-center justify-between">
                <TabsList className="bg-transparent">
                  <TabsTrigger value="front" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4 pb-2 pt-1 h-9">
                    <Monitor className="w-4 h-4 mr-2" />
                    正面视图 (Front View)
                  </TabsTrigger>
                  <TabsTrigger value="top" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4 pb-2 pt-1 h-9">
                    <Box className="w-4 h-4 mr-2" />
                    俯视图 (Top View)
                  </TabsTrigger>
                </TabsList>
                <div className="text-xs text-muted-foreground font-mono">
                  Scale: 1px = 1mm
                </div>
              </div>

              <TabsContent value="front" className="flex-1 m-0 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <FrontView state={state} />
                </div>
              </TabsContent>
              
              <TabsContent value="top" className="flex-1 m-0 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                   <TopView state={state} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>

      </ResizablePanelGroup>

      {/* Hidden Export Template */}
      <div className="fixed top-0 left-0 w-[1000px] h-auto pointer-events-none opacity-0 overflow-hidden" style={{ zIndex: -1000 }}>
         <div ref={exportRef} className="w-full bg-background text-foreground p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
               <div>
                 <h1 className="text-2xl font-bold">投影仪侧投模拟器 PRO</h1>
                 <p className="text-muted-foreground text-sm">投影配置仿真报告</p>
               </div>
               <div className="text-right text-xs text-muted-foreground font-mono">
                 {new Date().toLocaleString()}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2 text-sm border p-4 rounded bg-card/30">
                  <h3 className="font-bold text-primary mb-2 border-b pb-1">空间 & 幕布</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                     <span className="text-muted-foreground">房间尺寸:</span>
                     <span className="font-mono text-right">{state.room.dimensions.width} x {state.room.dimensions.depth} x {state.room.dimensions.height}</span>
                     <span className="text-muted-foreground">幕布宽度:</span>
                     <span className="font-mono text-right">{state.screen.width}</span>
                     <span className="text-muted-foreground">幕布位置 (X,Y):</span>
                     <span className="font-mono text-right">{state.screen.position.x}, {state.screen.position.y}</span>
                  </div>
               </div>
               <div className="space-y-2 text-sm border p-4 rounded bg-card/30">
                  <h3 className="font-bold text-primary mb-2 border-b pb-1">投影仪</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                     <span className="text-muted-foreground">位置 (X,Y,Z):</span>
                     <span className="font-mono text-right">{state.projector.position.x}, {state.projector.position.y}, {state.projector.position.z}</span>
                     <span className="text-muted-foreground">投射比:</span>
                     <span className="font-mono text-right">{state.projector.throwRatio}</span>
                     <span className="text-muted-foreground">移轴 (H/V):</span>
                     <span className="font-mono text-right">{state.projector.lensShift.horizontal}%, {state.projector.lensShift.vertical}%</span>
                     <span className="text-muted-foreground">旋转 (Yaw/Pitch):</span>
                     <span className="font-mono text-right">{state.projector.rotation.yaw}°, {state.projector.rotation.pitch}°</span>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <div className="h-[500px] w-full border border-border rounded relative overflow-hidden bg-card/20">
                  <div className="absolute top-2 left-2 z-10 bg-background/80 px-2 py-1 text-xs font-bold rounded border">正面视图</div>
                  <FrontView state={state} />
               </div>
               <div className="h-[500px] w-full border border-border rounded relative overflow-hidden bg-card/20">
                  <div className="absolute top-2 left-2 z-10 bg-background/80 px-2 py-1 text-xs font-bold rounded border">俯视图</div>
                  <TopView state={state} />
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}
