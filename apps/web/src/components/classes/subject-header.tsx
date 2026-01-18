import { useIsAdmin } from "@/utils/is-admin";

export function SubjectHeader() {
	const isAdmin = useIsAdmin();

	const title = isAdmin ? "Hi Min, ini Subject-Subject Bimbel Beta" : "Kelas-Kelas Bimbel Beta";

	const description = isAdmin
		? "Pilih subject-subject yang ingin diubah, dihapus, atau ditambahkan"
		: "Ikuti kelas belajar untuk meningkatkan pengetahuan";

	return (
		<div className="relative flex items-center justify-start overflow-hidden rounded-default bg-linear-to-l from-secondary-500 to-primary-600 p-6 sm:p-8">
			{/* TEXT — mobile top, desktop LEFT */}
			<div className="relative z-10">
				<h1 className="font-bold text-[24px] text-neutral-100 leading-tight sm:text-[30px]">{title}</h1>
				<p className="mt-2 text-[14px] text-neutral-100 leading-5">{description}</p>
			</div>
			{/*<div className="absolute right-0 bottom-0 size-45 translate-x-1/2 translate-y-1/2 rounded-full bg-neutral-100 lg:size-56" />*/}
		</div>
	);
}
