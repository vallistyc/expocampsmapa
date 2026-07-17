'use client';

import { forwardRef } from "react";
import Image from "next/image"

const Scene2 = forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <section className="section-shell relative">
      <div ref={ref} className="glass-panel overflow-hidden rounded-[2rem] p-6 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="flex flex-col gap-4">
            <p className="text-sm uppercase tracking-[0.35em] font-fraunces italic text-yellow-400 pt-10">Lalu...</p>
            <h2 className="text-4xl font-outfit font-semibold sm:text-4xl">Expo Campus Hadir</h2>
            <p className="text-lg leading-8 text-zinc-300 font-poppins">
              Bak pahlawan di tengah ketidakpastian, Expo Campus membawa <span className="font-semibold text-white">kebutuhan</span> yang selama ini kamu harapkan:
            </p>
            <div className="font-poppins inline-flex w-fit rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-300">
              Informasi • Jawaban • Kepastian
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-br from-yellow-500/20 via-transparent to-white/10" />
            <Image 
            src="/s2.jpg"
            alt="expo campus"
            width={800}
            height={560}
            className="relative h-auto w-full rounded-[1.5rem] object-cover shadow-2xl"
            />
          </div>
        </div>
      </div>
      <Image
      src="/cam.png"
      alt="camera icon"
      width={150}
      height={150}
      className="absolute -top-1 -rotate-15 left-1/2 -translate-x-1/2 md:-left-10 md:-translate-x-0 md:w-1/6 md:-rotate-20 md:h-auto"
      />
    </section>
  )
});

Scene2.displayName = 'Scene2';

export default Scene2