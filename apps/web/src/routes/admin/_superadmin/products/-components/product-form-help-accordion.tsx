import { Info, Warning } from "@phosphor-icons/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ProductFormHelpAccordion() {
	return (
		<Accordion type="single" collapsible className="flex flex-col gap-3">
			<AccordionItem value="variant-guide">
				<AccordionTrigger>
					<span className="flex items-center gap-2">
						<Info className="size-4" />
						Panduan Varian Produk
					</span>
				</AccordionTrigger>
				<AccordionContent>
					<Alert className="border-0 bg-transparent p-0 shadow-none">
						<AlertDescription className="space-y-3 text-sm">
							<p>
								<strong>Fixed Date:</strong> Berakhir pada tanggal kalender tetap setiap tahun (contoh: 31 Mei).
								Memberikan akses premium sampai tanggal tersebut tiap tahun. Jika dibeli setelah tanggal tersebut, akan
								berakhir tahun depan.
							</p>
							<p>
								<strong>Monthly:</strong> Berbasis durasi dari tanggal pembelian (contoh: 30 hari). Memberikan akses
								premium untuk durasi yang ditentukan dari tanggal pembelian.
							</p>
							<p>
								<strong>Credits:</strong> Hanya menambah credits ke akun user. TIDAK memberikan akses premium. Credits
								tidak pernah kadaluarsa.
							</p>
						</AlertDescription>
					</Alert>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="transaction-processing" className="border-destructive/30 bg-destructive/5">
				<AccordionTrigger>
					<span className="flex items-center gap-2">
						<Warning className="size-4" />
						Penting: Pemrosesan Transaksi
					</span>
				</AccordionTrigger>
				<AccordionContent>
					<Alert variant="destructive" className="border-0 bg-transparent p-0 shadow-none">
						<AlertDescription className="space-y-3 text-sm">
							<p>Ketika transaksi berhasil, sistem memproses benefit berdasarkan varian produk:</p>
							<ul className="list-disc space-y-1 pl-4">
								<li>
									<strong>Fixed Date &amp; Monthly:</strong> Men-set <code>isPremium = true</code> dan men-set
									<code>premiumExpiresAt</code> berdasarkan kalkulasi varian.
								</li>
								<li>
									<strong>Credits:</strong> Menambah credits ke balance <code>tryoutCredits</code>. Tidak ada perubahan
									status premium.
								</li>
							</ul>
							<p className="text-xs">
								Lihat <code>packages/api/src/lib/transaction-helpers.ts</code> untuk detail implementasi.
							</p>
						</AlertDescription>
					</Alert>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}
