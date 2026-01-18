import { Image } from "@unpic/react";
import { useIsAdmin } from "@/utils/is-admin";

export function SubtestHeader() {
	const isAdmin = useIsAdmin();

	const title = isAdmin ? "Hi Min, ini Subtest-Subtest UTBK" : "Kelas-Kelas UTBK";

	const description = isAdmin
		? "Pilih subtest-subtest UTBK yang ingin diubah, dihapus, atau ditambahkan"
		: "Yuk belajar bersama untuk sukses dalam UTBK!";

	return (
		<div className="relative overflow-hidden rounded-[10px] bg-tertiary-200">
			<div className="grid grid-cols-1 gap-6 px-6 pt-8 pb-0 sm:grid-cols-2 sm:items-center sm:px-10 sm:py-10">
				{/* TEXT — mobile top, desktop LEFT */}
				<div className="relative z-10 max-w-xl">
					<h1 className="font-bold text-[24px] text-neutral-1000 leading-tight sm:text-[30px]">{title}</h1>
					<p className="mt-2 text-[14px] text-neutral-1000 leading-5">{description}</p>
				</div>

				{/* VISUAL */}
				<div className="relative -mx-6 h-27.5 overflow-hidden sm:mx-0 sm:h-auto sm:overflow-visible">
					{/* Ellipse */}
					<div className="absolute top-10 right-4 bottom-0 size-45 rounded-full bg-tertiary-400 sm:top-2" />

					{/* Avatar */}
					<Image
						src="/avatar/subtest-header-avatar.webp"
						alt="Subtest Header Avatar"
						width={260}
						height={260}
						className="absolute right-0 size-52.5 -translate-y-10 select-none object-cover sm:bottom-0 sm:translate-y-1/2"
					/>
				</div>
			</div>
		</div>
	);
}
