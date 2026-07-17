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
  whatsapp: string;
  angkatan: string;
};

type FileState = {
  ktmFile: File | null;
  portfolioFile: File | null;
  photoFile: File | null;
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

// Ubah File jadi base64 supaya bisa dikirim sebagai JSON ke Apps Script
const fileToBase64 = (
  file: File,
): Promise<{ name: string; mimeType: string; base64: string }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        base64: result.split(",")[1] ?? "",
      });
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });

export default function Page() {
  const [form, setForm] = useState<FormState>({
    fullName: "",
    whatsapp: "",
    angkatan: "",
  });
  const [files, setFiles] = useState<FileState>({
    ktmFile: null,
    portfolioFile: null,
    photoFile: null,
  });
  const [divisionRows, setDivisionRows] = useState<DivisionRow[]>([
    createDivisionRow(1),
    createDivisionRow(2),
    createDivisionRow(3),
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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

  const addDivisionRow = () => {
    setDivisionRows((prev) => {
      if (prev.length >= visibleDivisionOptions.length) {
        return prev;
      }

      return [...prev, createDivisionRow(Date.now() + Math.random())];
    });
  };

  const removeDivisionRow = (id: number) => {
    setDivisionRows((prev) => {
      if (prev.length <= 3) return prev;
      return prev.filter((row) => row.id !== id);
    });
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

    if (!form.whatsapp.trim()) {
      nextErrors.whatsapp = "Nomor WhatsApp wajib diisi.";
    }

    if (!form.angkatan) {
      nextErrors.angkatan = "Pilih angkatan terlebih dahulu.";
    }

    if (!files.ktmFile) {
      nextErrors.ktmFile = "KTM atau bukti diterima wajib diunggah.";
    }

    if (!files.photoFile) {
      nextErrors.photoFile = "Foto diri wajib diunggah.";
    }

    if (duplicateDivisions.length > 0) {
      nextErrors.divisions = "Setiap divisi hanya boleh dipilih satu kali.";
    } else if (uniqueDivisions.size < 3) {
      nextErrors.divisions = "Pilih minimal 3 divisi yang berbeda.";
    }

    if (isPddSelected && !files.portfolioFile) {
      nextErrors.portfolioFile = "Portofolio desain wajib diunggah untuk divisi PDD.";
    }

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
      const [ktmData, photoData, portfolioData] = await Promise.all([
        files.ktmFile ? fileToBase64(files.ktmFile) : null,
        files.photoFile ? fileToBase64(files.photoFile) : null,
        files.portfolioFile ? fileToBase64(files.portfolioFile) : null,
      ]);

      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        // text/plain sengaja dipakai supaya tidak kena CORS preflight
        // yang sering bermasalah dengan Google Apps Script Web App.
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          fullName: form.fullName,
          whatsapp: form.whatsapp,
          angkatan: form.angkatan,
          divisions: selectedDivisions,
          ktmFile: ktmData,
          photoFile: photoData,
          portfolioFile: portfolioData,
        }),
      });

      const result = await response.json();

      if (result.status !== "success") {
        throw new Error(result.message || "Server menolak data tanpa detail error.");
      }

      setSubmitted(true);
      setForm({ fullName: "", whatsapp: "", angkatan: "" });
      setFiles({ ktmFile: null, portfolioFile: null, photoFile: null });
      setDivisionRows([createDivisionRow(1), createDivisionRow(2), createDivisionRow(3)]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kesalahan tidak diketahui.";
      setErrors({ submit: `Gagal mengirim data: ${message}` });
      setSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.16),_transparent_30%),linear-gradient(135deg,_#040404_0%,_#0a0a0a_45%,_#020202_100%)] px-3 py-6 text-slate-100 sm:px-6 sm:py-10 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8%] top-24 h-56 w-56 rounded-full bg-yellow-500/20 blur-3xl" />
        <div className="absolute bottom-24 right-[-5%] h-44 w-44 rounded-full bg-white/10 blur-3xl" />
      </div>
      <div className="relative mx-auto flex max-w-4xl flex-col gap-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:gap-6 sm:rounded-[2rem] sm:p-6 lg:p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-400 sm:text-sm">
            Pendaftaran Anggota
          </p>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Form Pendaftaran</h1>
          <p className="text-sm leading-6 text-zinc-400">
            Semua field wajib diisi, kecuali portofolio desain yang hanya diwajibkan untuk divisi PDD.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 font-poppins sm:space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-medium">
              Angkatan <span className="text-rose-400">*</span>
            </span>
            <select
              name="angkatan"
              value={form.angkatan}
              onChange={handleInputChange}
              className="mb-2 w-full min-w-0 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none transition focus:border-yellow-400"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">
                KTM / Bukti Diterima di Perguruan Tinggi <span className="text-rose-400">*</span>
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleFileChange("ktmFile", event)}
                className="w-full min-w-0 rounded-xl border border-dashed border-white/20 bg-black/40 px-4 py-3 text-sm text-zinc-300 file:mr-3 file:rounded-full file:border-0 file:bg-yellow-500/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-yellow-300"
              />
              {files.ktmFile ? (
                <p className="text-xs text-slate-400">Terpilih: {files.ktmFile.name}</p>
              ) : null}
              {errors.ktmFile ? <p className="text-sm text-rose-400">{errors.ktmFile}</p> : null}
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">
                Foto Diri <span className="text-rose-400">*</span>
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleFileChange("photoFile", event)}
                className="w-full min-w-0 rounded-xl border border-dashed border-white/20 bg-black/40 px-4 py-3 text-sm text-zinc-300 file:mr-3 file:rounded-full file:border-0 file:bg-yellow-500/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-yellow-300"
              />
              {files.photoFile ? (
                <p className="text-xs text-slate-400">Terpilih: {files.photoFile.name}</p>
              ) : null}
              {errors.photoFile ? <p className="text-sm text-rose-400">{errors.photoFile}</p> : null}
            </label>
          </div>

          {form.angkatan ? (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-medium">Pilihan Divisi Berdasarkan Prioritas</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Pilih minimal 3 divisi, urutkan dari prioritas tertinggi ke terendah. Divisi khusus angkatan 2026 akan disembunyikan saat memilih 2025.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addDivisionRow}
                  disabled={divisionRows.length >= visibleDivisionOptions.length}
                  className="w-full rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm font-medium text-yellow-300 transition hover:bg-yellow-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  + Tambah divisi
                </button>
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
                        <button
                          type="button"
                          onClick={() => removeDivisionRow(row.id)}
                          disabled={divisionRows.length <= 3}
                          className="rounded-lg border border-rose-500/30 px-3 py-2 text-sm text-rose-300 transition disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {errors.divisions ? <p className="text-sm text-rose-400">{errors.divisions}</p> : null}
            </div>
          ) : null}

          <label className="space-y-2 text-sm">
            <span className="font-medium">
              Portofolio Desain {isPddSelected ? <span className="text-rose-400">*</span> : null}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleFileChange("portfolioFile", event)}
              className="w-full min-w-0 rounded-xl border border-dashed border-white/20 bg-black/40 px-4 py-3 text-sm text-zinc-300 file:mr-3 file:rounded-full file:border-0 file:bg-yellow-500/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-yellow-300"
            />
            {files.portfolioFile ? (
              <p className="text-xs text-slate-400">Terpilih: {files.portfolioFile.name}</p>
            ) : null}
            {errors.portfolioFile ? <p className="text-sm text-rose-400">{errors.portfolioFile}</p> : null}
            <p className="text-xs text-slate-400">
              {isPddSelected
                ? "Portofolio desain wajib diunggah karena divisi PDD dipilih."
                : "Portofolio desain opsional jika divisi PDD tidak dipilih."}
            </p>
          </label>

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
              disabled={isSubmitting}
              className="w-full cursor-pointer rounded-full border border-yellow-500 bg-yellow-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0 sm:w-auto"
            >
              {isSubmitting ? "Mengirim..." : "Kirim Pendaftaran"}
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
1. Buat Google Sheet baru. Header row: Timestamp | Nama | WhatsApp |
   Angkatan | Divisi | KTM URL | Foto URL | Portofolio URL
2. Buat folder di Google Drive untuk menyimpan file upload, catat
   Folder ID-nya (dari URL folder).
3. Catat Sheet ID (dari URL spreadsheet).
4. Di Sheet: Extensions -> Apps Script, paste kode di bawah ini.
5. Project Settings (ikon gear) -> Script Properties -> Add script
   property. Tambahkan SHEET_ID (isi Sheet ID) dan FOLDER_ID (isi
   Folder ID). Ini lebih aman daripada hardcode di source code.
6. Deploy -> New deployment -> type "Web app" -> Execute as "Me",
   Access "Anyone" -> Deploy. Copy URL-nya.
7. PENTING: buka folder Drive dari langkah 2 lewat browser -> klik
   kanan -> Share -> tambahkan email siapa saja (panitia/pengurus)
   yang perlu lihat file KTM/Foto/Portofolio hasil submission. Ini
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

function doPost(e) {
  try {
    const props = PropertiesService.getScriptProperties();
    const sheetId = props.getProperty('SHEET_ID');
    const folderId = props.getProperty('FOLDER_ID');

    if (!sheetId || !folderId) {
      throw new Error('SHEET_ID atau FOLDER_ID belum diset di Script Properties');
    }

    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
    const folder = DriveApp.getFolderById(folderId);

    function saveFile(fileData, prefix) {
      if (!fileData) return '';
      const blob = Utilities.newBlob(
        Utilities.base64Decode(fileData.base64),
        fileData.mimeType,
        prefix + '_' + fileData.name
      );
      const file = folder.createFile(blob);
      // setSharing() sengaja TIDAK dipakai karena kebijakan domain
      // Google Workspace institusi kadang memblokir "Anyone with link"
      // (error: "Access denied: DriveApp"). File tetap tersimpan dan
      // linknya tetap valid untuk siapapun yang sudah diberi akses ke
      // FOLDER-nya secara manual (lihat langkah share folder di bawah).
      return file.getUrl();
    }

    const ktmUrl = saveFile(data.ktmFile, 'KTM');
    const photoUrl = saveFile(data.photoFile, 'FOTO');
    const portfolioUrl = saveFile(data.portfolioFile, 'PORTOFOLIO');

    sheet.appendRow([
      new Date(),
      data.fullName,
      data.whatsapp,
      data.angkatan,
      data.divisions.join(', '),
      ktmUrl,
      photoUrl,
      portfolioUrl,
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
=======================================================================
*/