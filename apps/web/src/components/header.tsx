import { Link } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";

export default function Header() {
	const session = authClient.useSession();

	return (
		<div className="fixed inset-x-0 top-0 z-50 mx-auto flex h-20 max-w-7xl flex-row items-center justify-between gap-8 rounded-lg bg-transparent px-6 backdrop-blur-lg md:px-8">
			<Link to="/" className="font-bold leading-none">
				<span className="text-secondary-900">Bimbel</span>
				<span className="text-tertiary-1000">Beta</span>
			</Link>
			<div className="flex items-center gap-2">
				{session.data?.user ? (
					<>
						{(session.data?.user.role === "admin" || session.data?.user.role === "superadmin") && (
							<Button variant={"default"} asChild>
								<Link to="/admin">Sini, min!</Link>
							</Button>
						)}
						<Button variant={"outline"} asChild>
							<Link to="/dashboard">Lanjut Belajar</Link>
						</Button>
					</>
				) : (
					<Button variant={"default"} asChild>
						<Link to="/login">Coba Gratis</Link>
					</Button>
				)}
			</div>
		</div>
	);
}
