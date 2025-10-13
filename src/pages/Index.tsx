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
              <AggregateHopper x={60} y={160} fillLevel={75} />
              <AggregateHopper x={140} y={160} fillLevel={80} />
              <AggregateHopper x={220} y={160} fillLevel={65} />
              <AggregateHopper x={300} y={160} fillLevel={70} />

              {/* Conveyor Belt 1 - Below hoppers (horizontal) */}
              <ConveyorBelt x={60} y={260} width={290} angle={0} isRunning={true} />

              {/* Conveyor Belt 2 - From bottom, angled upward directly to mixer */}
              <ConveyorBelt x={200} y={450} width={240} angle={35} isRunning={true} />
              
              {/* Collecting hopper at conveyor 2 end (right at mixer entrance) */}
              <path
                d="M 400 345 L 430 345 L 425 365 L 405 365 Z"
                className="fill-equipment-aggregate stroke-hmi-border"
                strokeWidth="2"
              />
            </g>

            {/* Cement Silos Section - Center */}
            <g id="cement-section">
              {/* 6 Cement Silos */}
              <CementSilo x={460} y={50} fillLevel={70} label="SILO 1" />
              <CementSilo x={510} y={50} fillLevel={65} label="SILO 2" />
              <CementSilo x={560} y={50} fillLevel={75} label="SILO 3" />
              <CementSilo x={610} y={50} fillLevel={60} label="SILO 4" />
              <CementSilo x={660} y={50} fillLevel={68} label="SILO 5" />
              <CementSilo x={710} y={50} fillLevel={72} label="SILO 6" />

              {/* Single Weigh Hopper below silos */}
              <WeighHopper x={570} y={250} fillLevel={45} />

              {/* Pipes from silos to single weigh hopper with elbows */}
              <Pipe points="480,220 480,235 590,235 590,250" type="material" />
              <Pipe points="530,220 530,240 590,240 590,250" type="material" />
              <Pipe points="580,220 580,250" type="material" />
              <Pipe points="630,220 630,240 600,240 600,250" type="material" />
              <Pipe points="680,220 680,235 600,235 600,250" type="material" />
              <Pipe points="730,220 730,230 600,230 600,250" type="material" />
            </g>

            {/* Additive Tanks Section - Right Side */}
            <g id="additive-section">
              {/* 2 Additive Tanks */}
              <AdditiveTank x={780} y={80} fillLevel={85} label="AIR" />
              <AdditiveTank x={840} y={80} fillLevel={75} label="ADDITIVE" />

              {/* Intermediate tank */}
              <g transform="translate(780, 230)">
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
              <Pipe points="797,205 797,230" type="water" />
              <Pipe points="857,205 857,220 797,220" type="water" />
            </g>

            {/* Mixer Section - Center Bottom */}
            <g id="mixer-section">
              {/* Main Mixer - Twin Shaft Horizontal */}
              <Mixer x={455} y={350} isRunning={true} />

              {/* Pipe to mixer from single weigh hopper */}
              <Pipe points="600,294 600,340 530,340 530,360" type="material" />
              
              {/* Pipe from aggregate collecting hopper directly to mixer */}
              <Pipe points="415,365 415,375 445,375 445,365 455,365" type="material" />
              
              {/* Pipe from additive intermediate tank */}
              <Pipe points="797,285 720,285 720,360 605,360" type="water" />
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
