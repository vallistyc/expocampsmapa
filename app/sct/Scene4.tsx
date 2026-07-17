import Image from "next/image"
import Link from "next/link"

const Scene4 = () => {
  return (
    <section className="section-shell py-50">
      <div className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/10 p-8 text-center sm:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.16),_transparent_45%)]" />
        <div className="relative flex flex-col items-center gap-6">
          <span className="font-fraunces italic rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm uppercase tracking-[0.3em] text-yellow-400">
            Giliranmu!
          </span>
          <h2 className="font-poppins max-w-2xl text-3xl font-semibold sm:text-4xl">
            Kini, Giliranmu Membantu Adik Kelas mu
          </h2>
          <p className="pb-5 max-w-xl text-lg leading-8 text-zinc-300">
            Jadikan pengalamanmu sebagai cahaya untuk mereka yang sedang menempuh langkah yang sama.
          </p>
          <Link
            href="/daftar"
            className="mb-20 rounded-full border border-yellow-500 bg-yellow-500 px-8 py-3 text-lg font-semibold text-black transition duration-300 hover:-translate-y-1 hover:bg-yellow-400"
          >
            Daftar Sekarang
          </Link>
          <div className="mt-4 flex flex-col items-center gap-3">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">Website ini dibuat oleh</p>
            <Image
              src="/setyasa.png"
              alt="Setyasa Web Studio"
              width={180}
              height={180}
              className="h-auto w-36 rounded-full border border-white/10 bg-black/30 p-3"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Scene4