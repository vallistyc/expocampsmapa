import Link from "next/link";
import Image from "next/image";

const Hero = () => {
  const Holders = [
    { label: "smapa", img: "/smapa.png" },
    { label: "ikasmapa", img: "/ikasmapa.png" },
  ];

  return (
    <section className="px-4 py-5 sm:py-25 lg:py-35">
      <div className="fixed bottom-8 right-4 z-50 flex flex-col gap-2 pb-4">
        <Link
          href="https://instagram.com/excamp_smapa"
          target="_blank"
          rel="noreferrer"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-violet-600 text-white shadow-lg backdrop-blur transition-transform duration-200 hover:scale-105"
          aria-label="Instagram"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5Zm5.25-3.25a1.25 1.25 0 1 1-1.25 1.25 1.25 1.25 0 0 1 1.25-1.25Z" />
          </svg>
        </Link>
        <Link
          href="https://wa.me/62895379832080"
          target="_blank"
          rel="noreferrer"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-emerald-600 text-white shadow-lg backdrop-blur transition-transform duration-200 hover:scale-105"
          aria-label="WhatsApp"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="M16.75 14.29c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.29-.77.97-.95 1.17-.17.2-.35.23-.65.08-.3-.15-1.27-.47-2.42-1.52-.89-.8-1.49-1.79-1.67-2.09-.18-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.61-.92-2.21-.24-.57-.49-.49-.67-.49-.17 0-.37-.02-.56-.02s-.52.07-.8.38c-.27.3-1.04 1.01-1.04 2.47s1.06 2.87 1.21 3.08c.15.2 2.09 3.19 5.06 4.47.71.3 1.26.48 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.43-.08-.12-.27-.2-.57-.35Z" />
          </svg>
        </Link>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="animate-fade-up flex flex-col items-center justify-items-center gap-5 text-left">
          <span className="inline-flex text-center w-fit items-center rounded-full border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-yellow-400">
            Registrasi Panitia Expo Campus 2027
          </span>
          <div className="relative my-10 w-full">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-[80%] w-[80%] rounded-full bg-white/40 blur-[120px]" />
              <div className="absolute h-[60%] w-[60%] rounded-full bg-yellow-400/20 blur-[80px]" />
            </div>
            <Image 
            src="/hero.png"
            width={500}
            height={100}
            alt="panitia Expo Campus"
            className="relative h-auto w-full"
            />
            <h1 className="absolute top-3 w-full text-center font-fraunces text-4xl font-bold text-white">
              Let's Join
            </h1>
            <h1 className="-z-10 absolute top-10 w-full text-center font-fraunces text-6xl font-bold text-yellow-500">
              The Team
            </h1>
          </div>
          <h1 className="text-center max-w-3xl text-4xl font-black italic leading-none sm:text-5xl lg:text-7xl">
            <span className="block font-poppins text-white">Menjadi</span>
            <span className="mt-2 block font-fraunces text-yellow-400">Bagian dari Kisah</span>
            <span className="mt-2 block text-white">Expo Campus</span>
          </h1>
          <p className="text-center max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg pb-5">
            Tahun lalu, <span className="font-semibold text-white">Expo Campus</span> hadir sebagai jawaban atas keresahanmu dalam meniti masa AGIT. Kini, giliranmu menjadi bagian dari perjalanan itu dan membantu <span className="font-semibold text-white">Adik Kelasmu</span> menemukan arah.
          </p>
          <div className="flex flex-row gap-4 pb-10">
            <Link
              href="/daftar"
              className="rounded-full border border-yellow-500 bg-yellow-500 px-6 py-3 text-lg font-semibold text-black transition duration-300 hover:text-zinc-800 hover:-translate-y-1 hover:bg-yellow-400"
            >
              Daftar Sekarang
            </Link>
            <div className="flex bg-none justify-center items-center rounded-full border border-yellow-500 px-4 py-3 text-sm font-medium text-yellow-500 transition duration-300 hover:bg-yellow-500 cursor-pointer hover:text-black text-lg font-bold hover:-translate-y-1">
              Guidebook
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4 rounded-full border border-white/10 bg-black/20 px-6 py-4">
        <h2 className="text-sm uppercase tracking-[0.35em] text-zinc-400">Supported by</h2>
        {Holders.map((item) => (
          <Image
            key={item.label}
            src={item.img}
            alt={item.label}
            width={80}
            height={80}
            className="h-auto w-16"
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;