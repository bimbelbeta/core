import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Typography } from "@/components/ui/typography";

export default function NotFound() {
	return (
		<Container className="flex h-screen items-center justify-center">
			<div className="flex flex-col items-center text-center">
				<Image
					src="/avatar/confused-avatar.webp"
					alt="Not Found"
					width={250}
					height={250}
					className="pointer-events-none select-none"
				/>
				<Typography variant="display" className="text-neutral-1000 mt-4">
					Halaman Tidak Ditemukan
				</Typography>
				<Typography variant="body" tone="muted" className="mt-2">
					Ups! Sepertinya halaman yang kamu cari sudah pindah atau tidak ada.
				</Typography>
				<Button className="mt-8" asChild>
					<Link to="/">Kembali ke Beranda</Link>
				</Button>
			</div>
		</Container>
	);
}
