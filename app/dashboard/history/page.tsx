"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import Link from "next/link";
import { IconCalendarStats } from "@tabler/icons-react";

export default function HistoryPage() {
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const ref = collection(firestore, "tracking_logs");
        console.log("📌 Mengambil koleksi dari:", ref.path);

        const snapshot = await getDocs(ref);
        console.log("📥 Jumlah dokumen dalam tracking_logs:", snapshot.size);

        if (snapshot.empty) {
          console.warn("⚠️ Koleksi tracking_logs kosong");
        }

        const fetchedDates = snapshot.docs.map((doc) => {
          console.log("📄 Dokumen ID:", doc.id);
          return doc.id;
        });

        setDates(fetchedDates.sort((a, b) => b.localeCompare(a))); // descending
      } catch (error) {
        console.error("❌ Gagal mengambil data dari Firestore:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDates();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <IconCalendarStats className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Riwayat Perjalanan
          </h1>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status" aria-label="loading">
              <span className="sr-only">Loading...</span>
            </div>
            <div className="text-gray-500 font-medium">Memuat data...</div>
          </div>
        ) : dates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {dates.map((date, index) => (
              <div
                key={date}
                className="relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="absolute -top-3 -left-3 bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-sm">
                  {index + 1}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <IconCalendarStats className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-800">
                        {new Date(date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/history/${date}`}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all duration-200 hover:shadow-md group-hover:shadow-blue-100"
                  >
                    Lihat Detail
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="text-gray-400 mb-3">
              <IconCalendarStats className="w-12 h-12" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak ada data tersedia</h3>
            <p className="text-gray-500 text-center">
              Belum ada riwayat perjalanan yang tercatat dalam sistem.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}