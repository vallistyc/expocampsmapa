import Hero from "./sct/Hero";
import Scene1 from "./sct/Scene1";
import Scene2 from "./sct/Scene2";
import Scene3 from "./sct/Scene3";
import Scene4 from "./sct/Scene4";


export default function Home() {
  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.16),_transparent_30%),linear-gradient(135deg,_#040404_0%,_#0a0a0a_45%,_#020202_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-float absolute left-[-8%] top-24 h-56 w-56 rounded-full bg-yellow-500/20 blur-3xl" />
        <div className="animate-float absolute bottom-24 right-[-5%] h-44 w-44 rounded-full bg-white/10 blur-3xl" />
      </div>
      <div className="relative z-10">
        <Hero />
        <Scene1 />
        <Scene2 />
        <Scene3 />
        <Scene4 />
      </div>
    </main>
  );
}
