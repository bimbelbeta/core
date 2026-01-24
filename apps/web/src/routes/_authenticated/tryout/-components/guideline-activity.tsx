import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { orpc } from "@/utils/orpc";
import { TryoutStartConfirmation } from "./tryout-start-confirmation";

export function GuidelineActivity() {
	const { data, isError, isPending } = useQuery(orpc.tryout.featured.queryOptions());

	return (
		<section className="flex flex-col gap-6">
			<Card className="border border-secondary-500 bg-secondary-500/20">
				<CardHeader className="flex items-center justify-between gap-4">
					<CardTitle className="font-semibold text-primary-800 sm:text-2xl">
						{data?.status === "finished"
							? "Lihat Hasil"
							: data?.status === "ongoing"
								? "Lanjutkan Pengerjaan Tryout"
								: "Mulai Tryout Sekarang"}
					</CardTitle>
					{data?.status === "finished" && data.attemptId ? (
						<Button size={"icon"} asChild>
							<Link
								to="/tryout/results/$attemptId"
								params={{
									attemptId: data.attemptId.toString(),
								}}
								search={{ tab: "results" }}
							>
								<ArrowUpRightIcon weight="bold" />
							</Link>
						</Button>
					) : data?.status === "ongoing" ? (
						<Button size={"icon"} asChild>
							<Link
								to="/tryout/$tryoutId"
								params={{
									tryoutId: data.id.toString(),
								}}
							>
								<ArrowUpRightIcon weight="bold" />
							</Link>
						</Button>
					) : isPending ? (
						<Button size={"icon"} disabled={isPending}>
							<Spinner />
						</Button>
					) : (
						<CardAction className="mt-auto">
							<TryoutStartConfirmation disabled={data === undefined || isError || isPending}>
								<Button size={"icon"} disabled={data === undefined || isError || isPending}>
									<ArrowUpRightIcon weight="bold" />
								</Button>
							</TryoutStartConfirmation>
						</CardAction>
					)}
				</CardHeader>
			</Card>

			<Card>
				<CardContent className="space-y-4 text-sm">
					<h2 className="mb-4 font-bold text-lg">Petunjuk Pengerjaan Try Out</h2>

					<div className="space-y-2">
						<h3 className="flex items-center gap-2 font-bold">
							<span>🔒</span> Aturan Pengerjaan
						</h3>
						<ul className="list-disc space-y-1 pl-5">
							<li>Setiap subtes hanya bisa dikerjakan sekali selama masa aktif tryout berlangsung.</li>
							<li>Setelah kamu menekan “Selesai / Kumpulkan” atau timer habis, subtes tersebut nggak bisa diulang.</li>
							<li>Pembahasan soal baru terbuka setelah seluruh subtes dalam tryout ini rampung kamu kerjakan.</li>
							<li>
								Kalau tiba-tiba keluar dari halaman atau koneksi terputus, kamu masih bisa lanjut. Cukup kembali ke
								halaman tryout dan pilih “Lanjutkan” — tapi ingat ya, timer tetap berjalan!
							</li>
						</ul>
					</div>

					<div className="space-y-2">
						<h3 className="flex items-center gap-2 font-bold">
							<span>💡</span> Tips
						</h3>
						<ul className="list-disc space-y-1 pl-5">
							<li>Pastikan baterai perangkat dan koneksi internet dalam kondisi aman dan stabil.</li>
							<li>Cek dulu jumlah soal & durasi, biar kamu bisa ngatur ritme ngerjainnya.</li>
							<li>Perhatikan masa aktif tryout, jangan ditunda sampai kedaluwarsa.</li>
							<li>Siapkan alat tulis atau kertas buat coret-coret hitungan.</li>
							<li>Kalau ada soal yang bikin ragu, tandai dulu aja—nanti bisa balik lagi kalau masih ada waktu.</li>
							<li>Setelah tryout selesai, sempetin lihat pembahasan dan perbaiki topik yang masih lemah.</li>
							<li>Coba kerjain dalam posisi & suasana kayak ujian asli biar makin kebiasa.</li>
						</ul>
					</div>

					<p className="pt-2 font-medium">Siap? Yuk mulai tryoutnya! Semangat 💪🔥</p>
				</CardContent>
			</Card>

			<Card className="border border-secondary-500 bg-secondary-500/20">
				<CardHeader className="flex items-center justify-between gap-4">
					<CardTitle className="font-normal sm:text-2xl">
						Akses Pembahasan Dengan <span className="font-semibold">Tryout Premium</span>
					</CardTitle>
					<CardAction className="mt-auto">
						<Button size={"icon"} asChild>
							<Link to="/premium">
								<ArrowUpRightIcon weight="bold" />
							</Link>
						</Button>
					</CardAction>
				</CardHeader>
			</Card>
		</section>
	);
}
