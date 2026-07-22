"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";

// =====================================================================
// URL Web App diambil dari environment variable, bukan hardcode.
// Isi di file .env.local (lihat catatan setup di bawah file ini):
//   NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/xxx/exec
// Harus pakai prefix NEXT_PUBLIC_ karena dipanggil dari client component
// ("use client"), kalau tidak, value-nya undefined di browser.
// =====================================================================
const SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ?? "";

type FormState = {
  fullName: string;
  instansi: string;
  whatsapp: string;
  angkatan: string;
  deskripsiDiri: string;
  pengalamanOrganisasi: string;
  pengalamanLomba: string;
  reasonDivision1: string;
  reasonDivision2: string;
};

type FileState = {
  portfolioFile: File | null;
  photoFile: File | null;
  followIgFile: File | null;
  followTiktokFile: File | null;
  shareStoryFile: File | null;
};

type DivisionRow = {
  id: number;
  value: string;
};

const createDivisionRow = (id: number): DivisionRow => ({
  id,
  value: "",
});

const divisionOptionsByBatch: Record<string, string[]> = {
  "2025": ["ACARA", "HUMAS", "PDD", "SARPRAS", "SPONSOR", "KONSUMSI"],
  "2026": [
    "ACARA",
    "HUMAS",
    "PDD",
    "SARPRAS",
    "SPONSOR",
    "KONSUMSI",
    "SEKRETARIS 2",
    "BENDAHARA 2",
    "WAKIL KETUA 2",
  ],
};

const batchOptions = ["2025", "2026"];
const batch2026OnlyDivisions = ["SEKRETARIS 2", "BENDAHARA 2", "WAKIL KETUA 2"];

// Konstanta kompresi gambar
const IMAGE_MAX_PX = 1280;   // sisi terpanjang, px
const IMAGE_QUALITY = 0.75;  // JPEG quality 0–1

/**
 * prepareFile — satu-satunya fungsi yang mengubah File ke payload JSON.
 *
 * JPG/PNG  → resize (jika > IMAGE_MAX_PX) + re-encode JPEG via canvas.
 *            Ukuran biasanya turun 70–90 % dibanding file asli.
 * PDF      → langsung base64 tanpa modifikasi (canvas tidak bisa baca PDF).
 *
 * Output selalu { name, mimeType, base64 } agar kompatibel dengan
 * Apps Script yang sudah ada tanpa perlu ubah doPost().
 */
const prepareFile = (
  file: File,
): Promise<{ name: string; mimeType: string; base64: string }> => {
  // PDF — tidak bisa dikompresi di browser, kirim apa adanya
  if (file.type === "application/pdf") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve({
          name: file.name,
          mimeType: file.type,
          base64: result.split(",")[1] ?? "",
        });
      };
      reader.onerror = () => reject(new Error("Gagal membaca file PDF"));
      reader.readAsDataURL(file);
    });
  }

  // JPG / PNG — resize + compress via canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl); // bebaskan memori segera

      // Hitung dimensi output — pertahankan aspect ratio
      let { width, height } = img;
      if (width > IMAGE_MAX_PX || height > IMAGE_MAX_PX) {
        if (width >= height) {
          height = Math.round((height / width) * IMAGE_MAX_PX);
          width = IMAGE_MAX_PX;
        } else {
          width = Math.round((width / height) * IMAGE_MAX_PX);
          height = IMAGE_MAX_PX;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context tidak tersedia"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Selalu output JPEG — lebih kecil dari PNG untuk foto
      const dataUrl = canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
      resolve({
        // Ganti ekstensi ke .jpg supaya Apps Script tidak bingung
        name: file.name.replace(/\.[^.]+$/, ".jpg"),
        mimeType: "image/jpeg",
        base64: dataUrl.split(",")[1] ?? "",
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Gagal memuat gambar untuk kompresi"));
    };

    img.src = objectUrl;
  });
};

export default function Page() {
  const [form, setForm] = useState<FormState>({
    fullName: "",
    instansi: "",
    whatsapp: "",
    angkatan: "",
    deskripsiDiri: "",
    pengalamanOrganisasi: "",
    pengalamanLomba: "",
    reasonDivision1: "",
    reasonDivision2: "",
  });
  const [files, setFiles] = useState<FileState>({
    portfolioFile: null,
    photoFile: null,
    followIgFile: null,
    followTiktokFile: null,
    shareStoryFile: null,
  });
  const [divisionRows, setDivisionRows] = useState<DivisionRow[]>([
    createDivisionRow(1),
    createDivisionRow(2),
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const visibleDivisionOptions = useMemo(() => {
    if (form.angkatan === "2026") {
      return divisionOptionsByBatch["2026"];
    }

    return divisionOptionsByBatch["2025"];
  }, [form.angkatan]);

  const isPddSelected = useMemo(
    () => divisionRows.some((row) => row.value === "PDD"),
    [divisionRows],
  );

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "angkatan") {
      setDivisionRows((prev) =>
        prev.map((row) => {
          if (value === "2025" && batch2026OnlyDivisions.includes(row.value)) {
            return { ...row, value: "" };
          }

          return row;
        }),
      );
    }
  };

  const validateFile = (file: File | null, allowedTypes: string[], maxSize: number) => {
    if (!file) return null;
    if (!allowedTypes.includes(file.type)) {
      return `Tipe file harus ${allowedTypes.join(" atau ")}.`;
    }
    if (file.size > maxSize) {
      return `Ukuran file maksimal ${maxSize / 1024 / 1024}MB.`;
    }
    return null;
  };

  const handleFileChange = (
    field: keyof FileState,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    setFiles((prev) => ({ ...prev, [field]: file }));
  };

  const updateDivisionValue = (id: number, value: string) => {
    setDivisionRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, value } : row)),
    );
  };

  const moveDivisionRow = (id: number, direction: -1 | 1) => {
    setDivisionRows((prev) => {
      const index = prev.findIndex((row) => row.id === id);
      if (index < 0) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(index, 1);
      updated.splice(nextIndex, 0, moved);
      return updated;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const selectedDivisions = divisionRows
      .map((row) => row.value)
      .filter((value) => value.trim() !== "");
    const uniqueDivisions = new Set(selectedDivisions);
    const duplicateDivisions = selectedDivisions.filter(
      (value, index) => selectedDivisions.indexOf(value) !== index,
    );

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Nama lengkap wajib diisi.";
    }

    if (!form.instansi.trim()) {
      nextErrors.instansi = "Instansi wajib diisi.";
    }

    if (!form.whatsapp.trim()) {
      nextErrors.whatsapp = "Nomor WhatsApp wajib diisi.";
    }

    if (!form.angkatan) {
      nextErrors.angkatan = "Pilih angkatan terlebih dahulu.";
    }

    if (!form.deskripsiDiri.trim()) {
      nextErrors.deskripsiDiri = "Deskripsi diri wajib diisi.";
    }

    if (!form.pengalamanOrganisasi.trim()) {
      nextErrors.pengalamanOrganisasi = "Pengalaman organisasi wajib diisi.";
    }

    if (!form.pengalamanLomba.trim()) {
      nextErrors.pengalamanLomba = "Pengalaman lomba wajib diisi.";
    }

    if (!form.reasonDivision1.trim()) {
      nextErrors.reasonDivision1 = "Alasan memilih divisi 1 wajib diisi.";
    }

    if (!form.reasonDivision2.trim()) {
      nextErrors.reasonDivision2 = "Alasan memilih divisi 2 wajib diisi.";
    }

    if (!files.photoFile) {
      nextErrors.photoFile = "Foto diri wajib diunggah.";
    }

    if (!files.followIgFile) {
      nextErrors.followIgFile = "Bukti follow IG wajib diunggah.";
    }

    if (!files.followTiktokFile) {
      nextErrors.followTiktokFile = "Bukti follow TikTok wajib diunggah.";
    }

    if (!files.shareStoryFile) {
      nextErrors.shareStoryFile = "Bukti share poster di Story IG wajib diunggah.";
    }

    if (duplicateDivisions.length > 0) {
      nextErrors.divisions = "Setiap divisi hanya boleh dipilih satu kali.";
    } else if (selectedDivisions.length < 2 || uniqueDivisions.size < 2) {
      nextErrors.divisions = "Pilih 2 divisi yang berbeda.";
    }

    if (isPddSelected && !files.portfolioFile) {
      nextErrors.portfolioFile = "Portofolio desain wajib diunggah untuk divisi PDD.";
    }

    const fileValidationPairs: Array<[
      keyof FileState,
      string[],
      number,
      string,
    ]> = [
      ["photoFile", ["application/pdf", "image/jpeg", "image/png"], 20 * 1024 * 1024, "Foto diri"],
      ["followIgFile", ["application/pdf", "image/jpeg", "image/png"], 20 * 1024 * 1024, "Bukti follow IG"],
      ["followTiktokFile", ["application/pdf", "image/jpeg", "image/png"], 20 * 1024 * 1024, "Bukti follow TikTok"],
      ["shareStoryFile", ["application/pdf", "image/jpeg", "image/png"], 20 * 1024 * 1024, "Bukti share poster di Story IG"],
      ["portfolioFile", ["application/pdf", "image/jpeg", "image/png"], 20 * 1024 * 1024, "Portofolio desain"],
    ];

    fileValidationPairs.forEach(([field, allowedTypes, maxSize, label]) => {
      const error = validateFile(files[field], allowedTypes, maxSize);
      if (error) {
        nextErrors[field] = `${label}: ${error}`;
      }
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitted(false);
      return;
    }

    if (!SCRIPT_URL) {
      setErrors({ submit: "NEXT_PUBLIC_APPS_SCRIPT_URL belum diset di .env.local." });
      return;
    }

    setIsSubmitting(true);

    try {
      // Tahap 1: compress semua gambar paralel (canvas, di client)
      setIsCompressing(true);
      const [photoData, followIgData, followTiktokData, shareStoryData, portfolioData] = await Promise.all([
        files.photoFile ? prepareFile(files.photoFile) : null,
        files.followIgFile ? prepareFile(files.followIgFile) : null,
        files.followTiktokFile ? prepareFile(files.followTiktokFile) : null,
        files.shareStoryFile ? prepareFile(files.shareStoryFile) : null,
        files.portfolioFile ? prepareFile(files.portfolioFile) : null,
      ]);
      setIsCompressing(false);

      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        // text/plain sengaja dipakai supaya tidak kena CORS preflight
        // yang sering bermasalah dengan Google Apps Script Web App.
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          fullName: form.fullName,
          instansi: form.instansi,
          whatsapp: form.whatsapp,
          angkatan: form.angkatan,
          deskripsiDiri: form.deskripsiDiri,
          pengalamanOrganisasi: form.pengalamanOrganisasi,
          pengalamanLomba: form.pengalamanLomba,
          reasonDivision1: form.reasonDivision1,
          reasonDivision2: form.reasonDivision2,
          divisions: selectedDivisions,
          photoFile: photoData,
          followIgFile: followIgData,
          followTiktokFile: followTiktokData,
          shareStoryFile: shareStoryData,
          portfolioFile: portfolioData,
        }),
      });

      const result = await response.json();

      if (result.status !== "success") {
        throw new Error(result.message || "Server menolak data tanpa detail error.");
      }

      setSubmittedName(form.fullName);
      setSubmitted(true);
      setForm({
        fullName: "",
        instansi: "",
        whatsapp: "",
        angkatan: "",
        deskripsiDiri: "",
        pengalamanOrganisasi: "",
        pengalamanLomba: "",
        reasonDivision1: "",
        reasonDivision2: "",
      });
      setFiles({
        portfolioFile: null,
        photoFile: null,
        followIgFile: null,
        followTiktokFile: null,
        shareStoryFile: null,
      });
      setDivisionRows([createDivisionRow(1), createDivisionRow(2)]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kesalahan tidak diketahui.";
      setErrors({ submit: `Gagal mengirim data: ${message}` });
      setSubmitted(false);
    } finally {
      setIsCompressing(false);
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.16),_transparent_30%),linear-gradient(135deg,_#040404_0%,_#0a0a0a_45%,_#020202_100%)] px-3 py-6 text-slate-100 sm:px-6 sm:py-10 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-8%] top-24 h-56 w-56 rounded-full bg-yellow-500/20 blur-3xl" />
          <div className="absolute bottom-24 right-[-5%] h-44 w-44 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative mx-auto flex max-w-md flex-col items-center gap-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:rounded-[2rem] sm:p-10" style={{ marginTop: "10vh" }}>
          {/* Ikon centang */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <svg className="h-10 w-10 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          {/* Pesan utama */}
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">Data Anda Terkirim!</h1>
            <p className="text-sm leading-6 text-zinc-400">
              Terima kasih,{" "}
              <span className="font-medium text-yellow-300">{submittedName}</span>!
              {" "}Pendaftaran kamu sudah kami terima. Bergabunglah ke grup WhatsApp untuk informasi selanjutnya.
            </p>
          </div>

          {/* Tombol aksi */}
          <div className="flex w-full flex-col gap-3">
            <a
              href="https://chat.whatsapp.com/CUxK4PidRXNHUZIbKxjEVm"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Bergabung ke Grup WhatsApp
            </a>
            <a
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
            >
              Kembali ke Beranda
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.16),_transparent_30%),linear-gradient(135deg,_#040404_0%,_#0a0a0a_45%,_#020202_100%)] px-3 py-6 text-slate-100 sm:px-6 sm:py-10 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8%] top-24 h-56 w-56 rounded-full bg-yellow-500/20 blur-3xl" />
        <div className="absolute bottom-24 right-[-5%] h-44 w-44 rounded-full bg-white/10 blur-3xl" />
      </div>
      <div className="relative mx-auto flex max-w-4xl flex-col gap-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:gap-6 sm:rounded-[2rem] sm:p-6 lg:p-8">
        <div className="space-y-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-400 sm:text-sm">
                Pendaftaran Anggota
              </p>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">Form Pendaftaran</h1>
            </div>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-300 transition hover:bg-yellow-500/20"
            >
              Kembali ke Beranda
            </a>
          </div>
          <p className="text-sm leading-6 text-zinc-400">
            Semua field wajib diisi, kecuali portofolio desain yang hanya diwajibkan untuk divisi PDD.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7 font-poppins sm:space-y-8">
          {/* Nama + Instansi */}
          <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">
                Nama Lengkap <span className="text-rose-400">*</span>
              </span>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleInputChange}
                className="w-full min-w-0 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none ring-0 transition focus:border-yellow-400"
                placeholder="Contoh: Budi Santoso"
              />
              {errors.fullName ? <p className="text-sm text-rose-400">{errors.fullName}</p> : null}
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">
                Instansi <span className="text-rose-400">*</span>
              </span>
              <input
                type="text"
                name="instansi"
                value={form.instansi}
                onChange={handleInputChange}
                className="w-full min-w-0 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none transition focus:border-yellow-400"
                placeholder="Contoh: Universitas XYZ"
              />
              {errors.instansi ? <p className="text-sm text-rose-400">{errors.instansi}</p> : null}
            </label>
          </div>

          {/* WhatsApp + Angkatan */}
          <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">
                Nomor WhatsApp <span className="text-rose-400">*</span>
              </span>
              <input
                type="tel"
                name="whatsapp"
                value={form.whatsapp}
                onChange={handleInputChange}
                className="w-full min-w-0 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none transition focus:border-yellow-400"
                placeholder="08xxxxxxxxxx"
              />
              {errors.whatsapp ? <p className="text-sm text-rose-400">{errors.whatsapp}</p> : null}
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">
                Angkatan <span className="text-rose-400">*</span>
              </span>
              <select
                name="angkatan"
                value={form.angkatan}
                onChange={handleInputChange}
                className="w-full min-w-0 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none transition focus:border-yellow-400"
              >
                <option value="">Pilih angkatan</option>
                {batchOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.angkatan ? <p className="text-sm text-rose-400">{errors.angkatan}</p> : null}
            </label>
          </div>

          {/* Deskripsi Diri */}
          <label className="space-y-2 text-sm">
            <span className="font-medium">
              Deskripsi Diri <span className="text-rose-400">*</span>
            </span>
            <textarea
              name="deskripsiDiri"
              value={form.deskripsiDiri}
              onChange={handleInputChange}
              rows={4}
              className="w-full min-w-0 resize-y rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none transition focus:border-yellow-400"
              placeholder="Ceritakan tentang dirimu secara singkat..."
            />
            {errors.deskripsiDiri ? <p className="text-sm text-rose-400">{errors.deskripsiDiri}</p> : null}
          </label>

          {/* Pengalaman Organisasi + Pengalaman Lomba */}
          <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">
                Pengalaman Organisasi <span className="text-rose-400">*</span>
              </span>
              <textarea
                name="pengalamanOrganisasi"
                value={form.pengalamanOrganisasi}
                onChange={handleInputChange}
                rows={4}
                className="w-full min-w-0 resize-y rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none transition focus:border-yellow-400"
                placeholder="Contoh: Ketua OSIS SMA XYZ 2023–2024, Anggota BEM..."
              />
              {errors.pengalamanOrganisasi ? <p className="text-sm text-rose-400">{errors.pengalamanOrganisasi}</p> : null}
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">
                Pengalaman Lomba <span className="text-rose-400">*</span>
              </span>
              <textarea
                name="pengalamanLomba"
                value={form.pengalamanLomba}
                onChange={handleInputChange}
                rows={4}
                className="w-full min-w-0 resize-y rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none transition focus:border-yellow-400"
                placeholder="Contoh: Juara 2 LCC Kabupaten 2023, Finalis OSN Matematika..."
              />
              {errors.pengalamanLomba ? <p className="text-sm text-rose-400">{errors.pengalamanLomba}</p> : null}
            </label>
          </div>

          {/* Foto Diri */}
          <label className="space-y-2 text-sm">
            <span className="font-medium">
              Foto Diri <span className="text-rose-400">*</span>
            </span>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={(event) => handleFileChange("photoFile", event)}
              className="w-full min-w-0 rounded-xl border border-dashed border-white/20 bg-black/40 px-4 py-3 text-sm text-zinc-300 file:mr-3 file:rounded-full file:border-0 file:bg-yellow-500/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-yellow-300"
            />
            {files.photoFile ? (
              <p className="text-xs text-slate-400">Terpilih: {files.photoFile.name}</p>
            ) : null}
            {errors.photoFile ? <p className="text-sm text-rose-400">{errors.photoFile}</p> : null}
            <p className="text-xs text-slate-400">PDF/JPG/PNG, maksimal 20MB.</p>
          </label>

          {/* Bukti Sosmed */}
          <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  Bukti Follow IG <span className="text-rose-400">*</span>
                </span>
                <a
                  href="https://instagram.com/excamp_smapa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-pink-500/40 bg-pink-500/10 px-3 py-1 text-xs font-medium text-pink-300 transition hover:bg-pink-500/20"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Buka Instagram
                </a>
              </div>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(event) => handleFileChange("followIgFile", event)}
                className="w-full min-w-0 rounded-xl border border-dashed border-white/20 bg-black/40 px-4 py-3 text-sm text-zinc-300 file:mr-3 file:rounded-full file:border-0 file:bg-yellow-500/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-yellow-300"
              />
              {files.followIgFile ? (
                <p className="text-xs text-slate-400">Terpilih: {files.followIgFile.name}</p>
              ) : null}
              {errors.followIgFile ? <p className="text-sm text-rose-400">{errors.followIgFile}</p> : null}
              <p className="text-xs text-slate-400">Follow lalu screenshot · PDF/JPG/PNG maks. 20MB.</p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  Bukti Follow TikTok <span className="text-rose-400">*</span>
                </span>
                <a
                  href="https://tiktok.com/@excamp_smapa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-300 transition hover:bg-sky-400/20"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.22 8.22 0 0 0 4.81 1.54V6.78a4.85 4.85 0 0 1-1.04-.09z"/>
                  </svg>
                  Buka TikTok
                </a>
              </div>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(event) => handleFileChange("followTiktokFile", event)}
                className="w-full min-w-0 rounded-xl border border-dashed border-white/20 bg-black/40 px-4 py-3 text-sm text-zinc-300 file:mr-3 file:rounded-full file:border-0 file:bg-yellow-500/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-yellow-300"
              />
              {files.followTiktokFile ? (
                <p className="text-xs text-slate-400">Terpilih: {files.followTiktokFile.name}</p>
              ) : null}
              {errors.followTiktokFile ? <p className="text-sm text-rose-400">{errors.followTiktokFile}</p> : null}
              <p className="text-xs text-slate-400">Follow lalu screenshot · PDF/JPG/PNG maks. 20MB.</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">
                Bukti Share Poster di Story IG <span className="text-rose-400">*</span>
              </span>
              <a
                href="https://drive.google.com/drive/folders/1TdtC2rhhJ4JeI_86Rq4v_jJ0SDkQ0kKI?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-300 transition hover:bg-yellow-500/20"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                Unduh Poster
              </a>
            </div>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={(event) => handleFileChange("shareStoryFile", event)}
              className="w-full min-w-0 rounded-xl border border-dashed border-white/20 bg-black/40 px-4 py-3 text-sm text-zinc-300 file:mr-3 file:rounded-full file:border-0 file:bg-yellow-500/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-yellow-300"
            />
            {files.shareStoryFile ? (
              <p className="text-xs text-slate-400">Terpilih: {files.shareStoryFile.name}</p>
            ) : null}
            {errors.shareStoryFile ? <p className="text-sm text-rose-400">{errors.shareStoryFile}</p> : null}
            <p className="text-xs text-slate-400">Unduh poster → share ke Story IG → screenshot · PDF/JPG/PNG maks. 20MB.</p>
          </div>

          {/* Pilihan Divisi */}
          {form.angkatan ? (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-3 sm:p-4">
              <div className="min-w-0">
                <h2 className="font-medium">Pilihan Divisi Berdasarkan Prioritas</h2>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Pilih 2 divisi yang berbeda. Divisi khusus angkatan 2026 akan disembunyikan saat memilih 2025.
                </p>
              </div>

              <div className="space-y-3">
                {divisionRows.map((row, index) => {
                  const usedValues = divisionRows
                    .filter((item) => item.id !== row.id)
                    .map((item) => item.value);

                  return (
                    <div key={row.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-end">
                      <label className="flex-1 min-w-0 space-y-2 text-sm">
                        <span className="font-medium">Prioritas {index + 1}</span>
                        <select
                          value={row.value}
                          onChange={(event) => updateDivisionValue(row.id, event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-yellow-400"
                        >
                          <option value="">Pilih divisi</option>
                          {visibleDivisionOptions.map((option) => (
                            <option
                              key={option}
                              value={option}
                              disabled={usedValues.includes(option)}
                            >
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => moveDivisionRow(row.id, -1)}
                          disabled={index === 0}
                          className="rounded-lg border border-slate-700 px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDivisionRow(row.id, 1)}
                          disabled={index === divisionRows.length - 1}
                          className="rounded-lg border border-slate-700 px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {errors.divisions ? <p className="text-sm text-rose-400">{errors.divisions}</p> : null}
            </div>
          ) : null}

          {/* Alasan Divisi */}
          <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Alasan Memilih Divisi 1 <span className="text-rose-400">*</span></span>
              <input
                type="text"
                name="reasonDivision1"
                value={form.reasonDivision1}
                onChange={handleInputChange}
                className="w-full min-w-0 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none transition focus:border-yellow-400"
                placeholder="Jelaskan mengapa memilih divisi pertama"
              />
              {errors.reasonDivision1 ? <p className="text-sm text-rose-400">{errors.reasonDivision1}</p> : null}
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Alasan Memilih Divisi 2 <span className="text-rose-400">*</span></span>
              <input
                type="text"
                name="reasonDivision2"
                value={form.reasonDivision2}
                onChange={handleInputChange}
                className="w-full min-w-0 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none transition focus:border-yellow-400"
                placeholder="Jelaskan mengapa memilih divisi kedua"
              />
              {errors.reasonDivision2 ? <p className="text-sm text-rose-400">{errors.reasonDivision2}</p> : null}
            </label>
          </div>

          {/* Portofolio PDD */}
          {isPddSelected ? (
            <label className="space-y-2 text-sm">
              <span className="font-medium">Portofolio Desain (Opsional)</span>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(event) => handleFileChange("portfolioFile", event)}
                className="w-full min-w-0 rounded-xl border border-dashed border-white/20 bg-black/40 px-4 py-3 text-sm text-zinc-300 file:mr-3 file:rounded-full file:border-0 file:bg-yellow-500/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-yellow-300"
              />
              {files.portfolioFile ? (
                <p className="text-xs text-slate-400">Terpilih: {files.portfolioFile.name}</p>
              ) : null}
              {errors.portfolioFile ? <p className="text-sm text-rose-400">{errors.portfolioFile}</p> : null}
              <p className="text-xs text-slate-400">
                Portofolio desain wajib diunggah karena divisi PDD dipilih.
              </p>
            </label>
          ) : null}

          {/* Submit */}
          <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {submitted ? (
                <p className="text-sm font-medium text-emerald-400">
                  Form berhasil disubmit. Data sudah dikirim ke tim.
                </p>
              ) : null}
              {errors.submit ? <p className="text-sm text-rose-400">{errors.submit}</p> : null}
            </div>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className="w-full cursor-pointer rounded-full border border-yellow-500 bg-yellow-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0 sm:w-auto"
            >
              {isCompressing ? "Mengompresi file..." : isSubmitting ? "Mengirim..." : "Kirim Pendaftaran"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

/*
=======================================================================
CATATAN SETUP GOOGLE APPS SCRIPT (backend penerima data)
=======================================================================
1. Buat Google Sheet baru. Header row (urutan bebas, baca berdasarkan
   nama header):
     Timestamp | Nama | Instansi | Whatsapp | Angkatan | Deskripsi Diri |
     Pengalaman Organisasi | Pengalaman Lomba | Divisi |
     Alasan Memilih Divisi 1 | Alasan Memilih Divisi 2 | Foto Diri Url |
     Portofolio URL | Bukti Follow IG | Bukti Follow Tiktok | Bukti Share Poster
2. Buat folder di Google Drive untuk menyimpan file upload, catat
   Folder ID-nya (dari URL folder).
3. Catat Sheet ID (dari URL spreadsheet).
4. Di Sheet: Extensions -> Apps Script, paste kode doPost() terbaru
   (lihat file apps-script-doPost.js terpisah).
5. Project Settings (ikon gear) -> Script Properties -> Add script
   property. Tambahkan SHEET_ID (isi Sheet ID) dan FOLDER_ID (isi
   Folder ID). Ini lebih aman daripada hardcode di source code.
6. Deploy -> New deployment -> type "Web app" -> Execute as "Me",
   Access "Anyone" -> Deploy. Copy URL-nya.
7. PENTING: buka folder Drive dari langkah 2 lewat browser -> klik
   kanan -> Share -> tambahkan email siapa saja (panitia/pengurus)
   yang perlu lihat file CV/Foto/Portofolio/dll hasil submission. Ini
   diperlukan karena akun institusi (misal Google Workspace kampus)
   sering memblokir "Anyone with link" di level admin, jadi file tidak
   di-share otomatis per file lewat script -- cukup share folder-nya
   sekali di sini.
8. Di root project (sejajar package.json), buat file .env.local:
     NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/xxx/exec
   Pastikan .env.local ada di .gitignore (default-nya sudah, tapi cek
   ulang) supaya URL tidak ikut ke-commit ke repo publik.
9. Restart dev server (next dev) setelah nambah/ubah .env.local, karena
   Next.js hanya baca env variable saat startup.
=======================================================================
*/