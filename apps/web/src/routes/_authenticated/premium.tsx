import { createFileRoute } from "@tanstack/react-router";
import { createMeta } from "@/lib/seo-utils";
import { PremiumPage } from "./premium/-components/premium-page";

export const Route = createFileRoute("/_authenticated/premium")({
	head: () => ({
		meta: createMeta({
			title: "Premium & Paket Tryout",
			description: "Upgrade ke premium atau beli paket tryout untuk akses penuh ke semua fitur bimbelbeta.",
			noIndex: true,
		}),
	}),
	component: PremiumPage,
});
