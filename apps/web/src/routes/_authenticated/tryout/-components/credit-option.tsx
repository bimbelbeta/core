import { CoinsIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { orpc } from "@/utils/orpc";

interface CreditOptionProps {
	onUseCredit?: () => void;
	isLoading?: boolean;
}

export function CreditOption({ onUseCredit, isLoading = false }: CreditOptionProps) {
	const { data, isLoading: isBalanceLoading } = useQuery(orpc.credit.balance.queryOptions());
	const balance = data?.balance ?? 0;
	const hasCredits = balance > 0;

	if (!hasCredits) return null;

	return (
		<div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
			<div className="flex items-center gap-3">
				<div className="rounded-full bg-amber-100 p-2">
					<CoinsIcon size={20} weight="fill" className="text-amber-600" />
				</div>
				<div className="flex-1">
					<p className="font-medium text-amber-900">Gunakan Kredit Tryout</p>
					<p className="text-amber-700 text-sm">
						Kamu punya <strong>{balance}</strong> kredit
					</p>
				</div>
			</div>
			<Button
				onClick={onUseCredit}
				disabled={isLoading || isBalanceLoading}
				className="mt-3 w-full bg-amber-600 hover:bg-amber-700"
			>
				{isLoading ? (
					<>
						<Spinner /> Memulai...
					</>
				) : (
					<>
						<CoinsIcon size={18} weight="fill" className="mr-1" />
						Gunakan 1 Kredit
					</>
				)}
			</Button>
		</div>
	);
}
