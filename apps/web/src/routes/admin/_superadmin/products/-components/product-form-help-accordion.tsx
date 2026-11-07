import { Info, Warning } from "@phosphor-icons/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function ProductFormHelpAccordion() {
	return (
		<Accordion type="single" collapsible defaultValue="variant-guide" className="flex flex-col gap-2">
			<AccordionItem value="variant-guide">
				<AccordionTrigger className="px-3 py-2.5 [&>svg]:hidden">
					<span className="flex items-start gap-2">
						<Info className="mt-0.5 size-3.5 shrink-0" />
						Panduan Varian Produk
					</span>
				</AccordionTrigger>
				<AccordionContent className="px-3 pb-3 text-[0.8125rem] leading-relaxed">
					<div className="space-y-2">
						<p>
							<strong>Fixed Date:</strong> Premium berakhir pada tanggal tetap setiap tahun (contoh: 31 Mei). Berapa pun
							tanggal pembeliannya, akses selalu berakhir di tanggal tersebut.
						</p>
						<p>
							<strong>Monthly:</strong> Premium berlangsung sesuai durasi yang ditentukan (contoh: 30 hari), dihitung
							sejak tanggal pembelian.
						</p>
						<p>
							<strong>Credits:</strong> Hanya menambah saldo credits untuk mengerjakan tryout. Tidak memberikan akses
							premium, dan credits tidak pernah kedaluwarsa.
						</p>
					</div>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="transaction-processing" className="border-destructive/30 bg-destructive/5">
				<AccordionTrigger className="px-3 py-2.5 [&>svg]:hidden">
					<span className="flex items-start gap-2">
						<Warning className="text-destructive mt-0.5 size-3.5 shrink-0" />
						Penting: Pemrosesan Transaksi
					</span>
				</AccordionTrigger>
				<AccordionContent className="px-3 pb-3 text-[0.8125rem] leading-relaxed">
					<div className="space-y-2">
						<p>Setelah transaksi berhasil, manfaat diberikan otomatis sesuai varian produk:</p>
						<p>
							<strong>Fixed Date &amp; Monthly:</strong> Status premium pelanggan langsung aktif, dan tanggal
							berakhirnya dihitung otomatis sesuai varian.
						</p>
						<p>
							<strong>Credits:</strong> Saldo credits pelanggan langsung bertambah, tanpa mengubah status premiumnya.
						</p>
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}
