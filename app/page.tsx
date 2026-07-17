'use client';

import { useRef } from "react";
import Hero from "./sct/Hero";
import Scene1 from "./sct/Scene1";
import Scene2 from "./sct/Scene2";
import Scene3 from "./sct/Scene3";
import Scene4 from "./sct/Scene4";
import SceneConnector from "./sct/SceneConnector";


export default function Home() {
  const scene1Ref = useRef<HTMLDivElement>(null);
  const scene2Ref = useRef<HTMLDivElement>(null);

  return (
    <main className="relative flex justify-center items-center min-h-screen w-full flex-col overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.16),_transparent_30%),linear-gradient(135deg,_#040404_0%,_#0a0a0a_45%,_#020202_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-float absolute left-[-8%] top-24 h-56 w-56 rounded-full bg-yellow-500/20 blur-3xl" />
        <div className="animate-float absolute bottom-24 right-[-5%] h-44 w-44 rounded-full bg-white/10 blur-3xl" />
      </div>
      <div className="relative z-10">
        <Hero />
        <div className="relative w-full">
          <Scene1 ref={scene1Ref} />
          <Scene2 ref={scene2Ref} />
          <SceneConnector startRef={scene1Ref} endRef={scene2Ref} />
        </div>
        <Scene3 />
        <Scene4 />
      </div>
    </main>
  );
}
