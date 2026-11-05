import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/lib/orpc";
import { TryoutStartConfirmation } from "./tryout-start-confirmation";

const CATEGORY_LABELS = {
	sd: "SD",
	smp: "SMP",
	sma: "SMA",
	utbk: "UTBK",
} as const;

const AVAILABILITY = {
	upcoming: { label: "Belum dibuka", description: "Tryout ini sudah dipublikasikan, tetapi jadwalnya belum dibuka." },
	open: { label: "Tersedia", description: "Siap dipilih dan dimulai dengan kode akses." },
	expired: { label: "Sudah berakhir", description: "Jadwal tryout ini sudah berakhir." },
} as const;

interface GuidelineActivityProps {
	level: "tka" | "utbk";
}

export function GuidelineActivity({ level }: GuidelineActivityProps) {
	const publishedTryouts = useInfiniteQuery(
		orpc.tryout.list.infiniteOptions({
			input: (after) => ({ level, limit: 20, after }),
			initialPageParam: undefined as string | undefined,
			getNextPageParam: (page) => (page.pageInfo.hasNextPage ? page.pageInfo.endCursor : undefined),
		}),
	);

	return (
		<section className="flex flex-col gap-6">
			{/*
			<Card className="border border-secondary-500 bg-secondary-500/20">
				<CardHeader className="flex items-center justify-between gap-4">
					<CardTitle className="font-semibold text-primary-800 sm:text-2xl">Mulai Tryout Sekarang</CardTitle>
				</CardHeader>
			</Card>
			*/}

			<section className="space-y-4">
				<div className="space-y-1">
					<h2 className="text-lg font-semibold">Tryout yang tersedia</h2>
					<p className="text-muted-foreground text-sm">Pilih TO publik lalu masukkan kode akses seperti biasa.</p>
				</div>
				{(() => {
					const visibleTryouts = publishedTryouts.data?.pages.flatMap((page) => page.items) ?? [];

					if (publishedTryouts.isPending) {
						return (
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
								<PublishedTryoutSkeleton />
								<PublishedTryoutSkeleton />
								<PublishedTryoutSkeleton />
							</div>
						);
					}

					if (publishedTryouts.isError && visibleTryouts.length === 0) {
						return <p className="text-destructive text-sm">Gagal memuat tryout. Silakan coba lagi.</p>;
					}

					if (visibleTryouts.length === 0) {
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
						<>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{visibleTryouts.map((tryout) => {
									const availability = AVAILABILITY[tryout.availability];
									return (
										<Card key={tryout.id} className="flex flex-col gap-4 p-4">
											<div className="space-y-2">
												<div className="flex items-start justify-between gap-3">
													<div className="space-y-1">
														<h3 className="text-base leading-tight font-semibold">{tryout.title}</h3>
														<p className="text-muted-foreground text-sm">{CATEGORY_LABELS[tryout.category]}</p>
													</div>
													<Badge
														variant={tryout.availability === "open" ? "default" : "secondary"}
														className="shrink-0"
													>
														{availability.label}
													</Badge>
												</div>
												<Separator />
												<p className="text-muted-foreground text-sm">{availability.description}</p>
											</div>
											<TryoutStartConfirmation tryoutId={tryout.id} disabled={tryout.availability !== "open"}>
												<Button className="w-full" disabled={tryout.availability !== "open"}>
													Pilih Tryout
												</Button>
											</TryoutStartConfirmation>
										</Card>
									);
								})}
							</div>
							{publishedTryouts.hasNextPage && (
								<Button
									variant="outline"
									onClick={() => publishedTryouts.fetchNextPage()}
									disabled={publishedTryouts.isFetchingNextPage}
								>
									{publishedTryouts.isFetchingNextPage ? "Memuat..." : "Muat lebih banyak"}
								</Button>
							)}
						</>
					);
				})()}
			</section>

			<Card>
				<CardContent className="space-y-4 text-sm">
					<h2 className="mb-4 text-lg font-bold">Petunjuk Pengerjaan Try Out</h2>

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

			<Card className="border-secondary-500 bg-secondary-500/20 border">
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
