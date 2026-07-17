import Image from "next/image";

const Scene3 = () => {
  const Kampus = [
    { label: "UI", img: "/ui.png" },
    { label: "UGM", img: "/ugm.png" },
    { label: "UNAIR", img: "/unair.png" },
    { label: "ITB", img: "/itb.png" },
    { label: "ITS", img: "/its.png" },
    { label: "UB", img: "/ub.png" },
  ];

  return (
    <section className="section-shell">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="font-fraunces italic rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.3em] text-yellow-400">
          Sekarang
        </span>
        <h2 className="font-poppins max-w-3xl text-3xl font-semibold sm:text-4xl">
          Almamater Impian telah Berhasil kau Dapatkan
        </h2>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Kampus.map((item, index) => (
          <div
            key={item.label}
            className="animate-fade-up flex flex-col items-center justify-center gap-4 rounded-[1.5rem] border border-white/10 p-6 transition duration-300 hover:-translate-y-2 hover:border-yellow-400/50 hover:bg-yellow-500/10"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="font-fraunces text-center italic flex h-auto w-16 items-center justify-center px-20 py-3  bg-gradient-to-br from-yellow-500/80 to-amber-400/30 text-2xl font-semibold text-white">
              {item.label}
            </div>
            <Image
              src={item.img}
              alt={item.label}
              width={100}
              height={100}
              className="h-auto w-1/2 object-contain grayscale transition duration-300 hover:grayscale-0"
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default Scene3;