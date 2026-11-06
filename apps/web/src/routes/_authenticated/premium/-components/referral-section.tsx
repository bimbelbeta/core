import { TicketIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { formatDateLong } from "@/lib/format-date";
import { useReferral } from "../-hooks/use-referral";

export function ReferralSection() {
	const { code, setCode, successData, setSuccessData, isPending, handleSubmit } = useReferral();

	return (
		<>
			<Card className="border-primary-100 from-primary-100/50 bg-gradient-to-br to-white p-6">
				<div className="flex items-start gap-4">
					<div className="bg-primary-100 hidden rounded-xl p-3 sm:block">
						<TicketIcon size={28} weight="duotone" className="text-primary" />
					</div>
					<div className="flex-1">
						<Typography variant="subtitle2" className="text-foreground">
							Punya kode referal?
						</Typography>
						<Typography tone="muted" className="mt-0.5">
							Masukkan kode referal untuk mendapatkan akses Premium secara gratis.
						</Typography>
						<form onSubmit={handleSubmit} className="mt-4 flex gap-2">
							<Input
								id="referral-code-input"
								className="max-w-xs font-mono tracking-widest uppercase"
								placeholder="PREM30DAYS"
								value={code}
								onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
								maxLength={20}
								autoComplete="off"
								disabled={isPending}
							/>
							<Button isPending={isPending} id="referral-submit-btn" type="submit" disabled={isPending || !code.trim()}>
								{"Tukarkan"}
							</Button>
						</form>
					</div>
				</div>
			</Card>

			<Dialog
				open={!!successData}
				onOpenChange={(open) => {
					if (!open) setSuccessData(null);
				}}
			>
				<DialogContent className="max-w-sm text-center">
					<div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-full bg-amber-100">
						<span className="text-3xl" aria-hidden>
							🏆
						</span>
					</div>
					<DialogHeader className="text-center">
						<DialogTitle asChild>
							<Typography variant="subtitle1">Selamat! Kamu Sekarang Premium 🎉</Typography>
						</DialogTitle>
						<DialogDescription className="mt-2">
							{successData && (
								<>
									Akun Premium kamu aktif hingga{" "}
									<strong>{formatDateLong(new Date(successData.premiumExpiresAt))}</strong>. Nikmati akses penuh ke
									semua fitur!
								</>
							)}
						</DialogDescription>
					</DialogHeader>
					<Button className="mt-2 w-full" onClick={() => setSuccessData(null)} id="referral-success-close-btn">
						Mantap, terima kasih!
					</Button>
				</DialogContent>
			</Dialog>
		</>
	);
}
