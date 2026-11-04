import { Typography } from "@/components/ui/typography";
import { useIsAdmin } from "@/hooks/use-is-admin";

export function SubjectHeader() {
	const isAdmin = useIsAdmin();

	const title = isAdmin ? "Hi Min, ini Subject-Subject Bimbel Beta" : "Kelas-Kelas Bimbel Beta";

	const description = isAdmin
		? "Pilih subject-subject yang ingin diubah, dihapus, atau ditambahkan"
		: "Ikuti kelas belajar untuk meningkatkan pengetahuan";

	return (
		<div className="rounded-default from-secondary-500 to-primary-600 relative flex items-center justify-start overflow-hidden bg-linear-to-l p-6 sm:p-8">
			{/* TEXT — mobile top, desktop LEFT */}
			<div className="relative z-10">
				<Typography variant="title" className="text-neutral-100">
					{title}
				</Typography>
				<Typography variant="body" className="mt-2 text-neutral-100">
					{description}
				</Typography>
			</div>
			{/*<div className="absolute right-0 bottom-0 size-45 translate-x-1/2 translate-y-1/2 rounded-full bg-neutral-100 lg:size-56" />*/}
		</div>
	);
}
