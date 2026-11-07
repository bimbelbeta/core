import { Coins } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Image } from "@unpic/react";
import { Typography } from "@/components/ui/typography";
import { orpc } from "@/lib/orpc";

export function PremiumHeader() {
	const creditBalanceQuery = useQuery(orpc.credit.balance.queryOptions());
	const creditBalance = creditBalanceQuery.data?.balance ?? 0;

	return (
		<div className="rounded-default bg-primary-800 relative overflow-hidden text-white">
			<div className="grid grid-cols-1 gap-6 px-6 pt-8 pb-0 sm:grid-cols-2 sm:items-center sm:px-10 sm:py-10">
				<div className="relative z-10 max-w-xl">
					<Typography variant="title" className="text-white">
						Premium & Paket Tryout
					</Typography>
					<Typography className="mt-2 text-white/90">
						Investasikan masa depanmu sekarang! Dapatkan akses penuh ke semua fitur atau beli paket tryout sesuai
						kebutuhanmu.
					</Typography>
					{creditBalance > 0 && (
						<div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-2">
							<Coins size={20} weight="fill" className="text-yellow-300" />
							<span className="text-sm font-medium">
								Kredit Tryout: <strong>{creditBalance}</strong>
							</span>
						</div>
					)}
				</div>

				<div className="relative -mx-6 h-27.5 overflow-hidden sm:mx-0 sm:h-auto sm:overflow-visible">
					<div className="bg-primary-400 absolute top-10 right-4 bottom-0 size-45 rounded-full sm:top-2" />
					<Image
						src="/images/main-card-kelas.webp"
						alt="Premium Avatar"
						width={260}
						height={260}
						className="absolute right-0 size-52.5 -translate-y-10 object-cover select-none sm:bottom-0 sm:translate-y-1/2"
					/>
				</div>
			</div>
		</div>
	);
}
