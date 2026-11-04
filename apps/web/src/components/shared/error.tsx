import { WarningOctagonIcon } from "@phosphor-icons/react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function ErrorComponent({ error }: { error: unknown }) {
	const message = error instanceof Error ? error.message : String(error);

	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<Container className="flex h-screen items-center justify-center">
			<div className="flex flex-col items-center text-center">
				<div className="bg-destructive/10 rounded-full p-4">
					<WarningOctagonIcon className="text-destructive size-12" weight="fill" />
				</div>
				<h1 className="text-neutral-1000 mt-4 text-3xl font-bold">Terjadi Kesalahan</h1>
				<p className="mt-2 max-w-md text-neutral-600">
					Maaf, sepertinya terjadi masalah saat memuat halaman ini. Silakan coba lagi nanti atau hubungi bantuan jika
					masalah berlanjut.
				</p>
				<pre className="mt-4 line-clamp-6 max-w-full overflow-auto rounded-lg bg-neutral-100 p-4 text-left text-xs">
					{message}
				</pre>
				<div className="mt-8 flex gap-4">
					<Button
						variant="outline"
						onClick={() => {
							window.location.reload();
						}}
					>
						Coba Lagi
					</Button>
					<Button
						onClick={() => {
							window.location.href = "/";
						}}
					>
						Kembali ke Beranda
					</Button>
				</div>
			</div>
		</Container>
	);
}
