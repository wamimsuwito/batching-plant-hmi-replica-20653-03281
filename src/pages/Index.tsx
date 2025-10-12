import { CementSilo } from "@/components/BatchPlant/CementSilo";
import { AggregateHopper } from "@/components/BatchPlant/AggregateHopper";
import { AdditiveTank } from "@/components/BatchPlant/AdditiveTank";
import { Mixer } from "@/components/BatchPlant/Mixer";
import { ConveyorBelt } from "@/components/BatchPlant/ConveyorBelt";
import { WeighHopper } from "@/components/BatchPlant/WeighHopper";
import { Pipe } from "@/components/BatchPlant/Pipe";

const Index = () => {
  return (
    <div className="min-h-screen bg-hmi-background flex flex-col">
      {/* Header */}
      <header className="bg-hmi-header text-white py-3 px-6 border-b-2 border-hmi-border">
        <h1 className="text-2xl font-bold text-center tracking-wide">
          BATCH PLANT CONTROL SYSTEM
        </h1>
      </header>

      {/* Main HMI Panel */}
      <main className="flex-1 p-4">
        <div className="w-full h-[calc(100vh-80px)] border-4 border-hmi-border bg-hmi-panel">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1100 600"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full"
          >
            {/* Aggregate Section - Left Side */}
            <g id="aggregate-section">
              {/* 4 Aggregate Hoppers */}
              <AggregateHopper x={60} y={50} fillLevel={75} />
              <AggregateHopper x={140} y={50} fillLevel={80} />
              <AggregateHopper x={220} y={50} fillLevel={65} />
              <AggregateHopper x={300} y={50} fillLevel={70} />

              {/* Conveyor Belt System */}
              <ConveyorBelt x={120} y={180} width={280} angle={30} isRunning={true} />
              
              {/* Collecting hopper at conveyor end */}
              <path
                d="M 320 90 L 360 90 L 350 110 L 330 110 Z"
                className="fill-equipment-aggregate stroke-hmi-border"
                strokeWidth="2"
              />
            </g>

            {/* Cement Silos Section - Center */}
            <g id="cement-section">
              {/* 4 Cement Silos */}
              <CementSilo x={480} y={50} fillLevel={70} />
              <CementSilo x={540} y={50} fillLevel={65} />
              <CementSilo x={600} y={50} fillLevel={75} />
              <CementSilo x={660} y={50} fillLevel={60} />

              {/* Weigh Hoppers below silos */}
              <WeighHopper x={480} y={250} fillLevel={35} />
              <WeighHopper x={540} y={250} fillLevel={40} />
              <WeighHopper x={600} y={250} fillLevel={30} />

              {/* Pipes from silos to weigh hoppers */}
              <Pipe points="500,205 500,250" type="material" />
              <Pipe points="560,205 560,250" type="material" />
              <Pipe points="620,205 620,250" type="material" />
            </g>

            {/* Additive Tanks Section - Right Side */}
            <g id="additive-section">
              {/* 3 Additive Tanks */}
              <AdditiveTank x={730} y={80} fillLevel={85} />
              <AdditiveTank x={780} y={80} fillLevel={75} />
              <AdditiveTank x={830} y={80} fillLevel={80} />

              {/* Intermediate tank */}
              <g transform="translate(730, 230)">
                <rect
                  x="0"
                  y="0"
                  width="35"
                  height="50"
                  className="fill-equipment-tank stroke-hmi-border"
                  strokeWidth="2"
                />
                <rect x="2" y="15" width="31" height="33" className="fill-equipment-siloFill" />
                <circle cx="17.5" cy="55" r="4" className="fill-valve-active stroke-hmi-border" strokeWidth="1" />
              </g>

              {/* Pipes from additive tanks */}
              <Pipe points="747,190 747,230" type="water" />
              <Pipe points="797,190 797,210 747,210" type="water" />
              <Pipe points="847,190 847,210" type="water" />
            </g>

            {/* Mixer Section - Center Bottom */}
            <g id="mixer-section">
              {/* Main Mixer */}
              <Mixer x={480} y={340} isRunning={true} />

              {/* Pipes to mixer from weigh hoppers */}
              <Pipe points="510,294 510,340" type="material" />
              <Pipe points="570,294 570,320 520,320 520,340" type="material" />
              <Pipe points="630,294 630,310 530,310 530,340" type="material" />
              
              {/* Pipe from aggregate */}
              <Pipe points="340,100 420,100 420,350 480,350" type="material" />
              
              {/* Pipe from additive intermediate tank */}
              <Pipe points="747,285 680,285 680,340 600,340" type="water" />
            </g>

            {/* Additional visual elements */}
            {/* Section divider on right */}
            <line x1="900" y1="40" x2="900" y2="560" className="stroke-hmi-border" strokeWidth="3" />
            
            {/* Bottom section divider */}
            <rect
              x="910"
              y="40"
              width="170"
              height="520"
              className="fill-hmi-panel stroke-hmi-border"
              strokeWidth="3"
            />
          </svg>
        </div>
      </main>
    </div>
  );
};

export default Index;
