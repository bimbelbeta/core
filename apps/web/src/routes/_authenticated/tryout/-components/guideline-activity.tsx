import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { orpc } from "@/lib/orpc";
import { TryoutStartConfirmation } from "./tryout-start-confirmation";

const CATEGORY_LABELS = {
	sd: "SD",
	smp: "SMP",
	sma: "SMA",
	utbk: "UTBK",
} as const;

const LEVEL_CATEGORIES = {
	tka: ["sd", "smp", "sma"],
	utbk: ["utbk"],
} as const;

type TryoutLevel = keyof typeof LEVEL_CATEGORIES;

interface GuidelineActivityProps {
	level: TryoutLevel;
}

export function GuidelineActivity({ level }: GuidelineActivityProps) {
	const { data, isError, isPending } = useQuery({
		...orpc.tryout.featured.queryOptions(),
		retry: false,
		meta: { skipErrorToast: true },
	});
	const publishedTryouts = useQuery({
		...orpc.tryout.list.queryOptions({ input: { limit: 100 } }),
		retry: false,
		meta: { skipErrorToast: true },
	});
	const queryClient = useQueryClient();

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
						<Button
							size={"icon"}
							onClick={() => {
								queryClient.invalidateQueries({ queryKey: orpc.tryout.featured.queryKey() });
							}}
							asChild
						>
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

			<section className="space-y-4">
				<div className="space-y-1">
					<h2 className="font-semibold text-lg">Tryout yang tersedia</h2>
					<p className="text-muted-foreground text-sm">Pilih TO publik lalu masukkan kode akses seperti biasa.</p>
				</div>
				{(() => {
					const allowedCategories = LEVEL_CATEGORIES[level];
					const visibleTryouts = publishedTryouts.data?.items.filter((tryout) => allowedCategories.includes(tryout.category));

					if (publishedTryouts.isPending) {
						return (
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
								<PublishedTryoutSkeleton />
								<PublishedTryoutSkeleton />
								<PublishedTryoutSkeleton />
							</div>
						);
					}

					if (!visibleTryouts || visibleTryouts.length === 0) {
						return (
							<Card className="flex items-center justify-between gap-3 p-4">
								<div>
									<p className="font-medium">Belum ada Try Out publik</p>
									<p className="text-muted-foreground text-sm">
										Saat admin mempublikasikan TO baru, judul dan kategorinya akan muncul di sini.
									</p>
								</div>
							</Card>
						);
					}

					return (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{visibleTryouts.map((tryout) => (
								<Card key={tryout.id} className="flex flex-col gap-4 p-4">
									<div className="space-y-2">
										<div className="flex items-start justify-between gap-3">
											<div className="space-y-1">
												<h3 className="font-semibold text-base leading-tight">{tryout.title}</h3>
												<p className="text-muted-foreground text-sm">{CATEGORY_LABELS[tryout.category]}</p>
											</div>
											<Badge variant={tryout.isOpen ? "default" : "secondary"} className="shrink-0">
												{tryout.isOpen ? "Published" : "Belum dibuka"}
											</Badge>
										</div>
										<Separator />
										<p className="text-muted-foreground text-sm">
											{tryout.isOpen ? "Siap dipilih dan dimulai dengan kode akses." : "Tryout ini sudah dipublikasikan, tetapi jadwalnya belum dibuka."}
										</p>
									</div>
									<TryoutStartConfirmation tryoutId={tryout.id} disabled={!tryout.isOpen}>
										<Button className="w-full" disabled={!tryout.isOpen}>
											Pilih Tryout
										</Button>
									</TryoutStartConfirmation>
								</Card>
							))}
						</div>
					);
				})()}
			</section>

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

function PublishedTryoutSkeleton() {
	return (
		<Card className="flex flex-col gap-4 p-4">
			<div className="space-y-2">
				<Skeleton className="h-5 w-3/4" />
				<Skeleton className="h-4 w-20" />
				<Skeleton className="h-px w-full" />
				<Skeleton className="h-4 w-full" />
			</div>
			<Skeleton className="h-9 w-full" />
		</Card>
	);
}
