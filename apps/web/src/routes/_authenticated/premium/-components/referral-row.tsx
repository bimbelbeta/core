import { CheckCircleIcon, TrophyIcon } from "@phosphor-icons/react";
import * as m from "motion/react-m";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputGroup, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Typography } from "@/components/ui/typography";
import { staggerChild, staggerContainer } from "@/lib/animation-variants";
import { formatDateLong } from "@/lib/format-date";
import { useReferral } from "../-hooks/use-referral";

const celebrationIcon = {
	initial: { opacity: 0, scale: 0.5 },
	animate: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 400, damping: 16 } },
} as const;

export function ReferralRow() {
	const { code, setCode, error, success, celebrate, dismissCelebration, isPending, handleSubmit } = useReferral();

	return (
		<>
			<form
				onSubmit={handleSubmit}
				className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
			>
				<div className="flex min-w-0 flex-col gap-0.5">
					<Typography as="p" className="text-row-title">
						Punya kode referal?
					</Typography>
					{error ? (
						<Typography variant="caption" role="alert" className="text-destructive">
							{error}
						</Typography>
					) : success ? (
						<Typography variant="caption" className="text-primary-800 flex items-center gap-1">
							<CheckCircleIcon className="size-3.5 shrink-0" weight="fill" />
							{success.premiumDays} hari ditambahkan · aktif hingga {formatDateLong(new Date(success.premiumExpiresAt))}
						</Typography>
					) : (
						<Typography variant="caption">Tukarkan kode untuk menambah masa aktif premium.</Typography>
					)}
				</div>

				<InputGroup className="w-full shrink-0 sm:w-72">
					<InputGroupInput
						aria-label="Kode referal"
						aria-invalid={!!error}
						className="tabular-nums"
						placeholder="Masukkan kode"
						value={code}
						onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
						maxLength={20}
						autoComplete="off"
						autoCapitalize="characters"
						spellCheck={false}
						disabled={isPending}
					/>
					<InputGroupButton
						variant="default"
						className="h-full shrink-0 rounded-l-none rounded-r-[calc(var(--radius-md)-1px)] px-3"
						isPending={isPending}
						type="submit"
						disabled={isPending || !code.trim()}
					>
						Tukarkan
					</InputGroupButton>
				</InputGroup>
			</form>

			<Dialog open={celebrate} onOpenChange={(open) => !open && dismissCelebration()}>
				<DialogContent size="sm" showCloseButton={false} className="text-center sm:max-w-xs">
					{success && (
						<m.div
							className="flex flex-col items-center gap-3 py-1"
							variants={staggerContainer}
							initial="initial"
							animate="animate"
						>
							<m.div
								variants={celebrationIcon}
								className="bg-primary-100 text-primary-800 flex size-12 items-center justify-center rounded-full"
							>
								<TrophyIcon className="size-6" weight="fill" />
							</m.div>

							<m.div variants={staggerChild}>
								<DialogHeader className="items-center gap-1 text-center sm:text-center">
									<DialogTitle asChild>
										<Typography variant="subtitle3" className="font-semibold">
											Kamu sekarang Premium
										</Typography>
									</DialogTitle>
									<DialogDescription asChild>
										<div className="flex flex-col gap-0.5 text-center">
											<Typography as="span" className="text-foreground text-[0.8125rem] font-medium">
												{success.premiumDays} hari ditambahkan
											</Typography>
											<Typography as="span" variant="caption">
												Aktif hingga {formatDateLong(new Date(success.premiumExpiresAt))}
											</Typography>
										</div>
									</DialogDescription>
								</DialogHeader>
							</m.div>

							<m.div variants={staggerChild} className="w-full">
								<Button size="sm" className="w-full" onClick={dismissCelebration}>
									Mantap
								</Button>
							</m.div>
						</m.div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
