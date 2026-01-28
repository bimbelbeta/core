import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/back-button";
import { NextButton } from "@/components/next-button";
import { PremiumGateModal } from "@/components/premium/premium-gate-modal";
import { Container } from "@/components/ui/container";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_authenticated/classes/$subjectId/$contentId")({
	component: RouteComponent,
});

function RouteComponent() {
	const { subjectId, contentId } = Route.useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const queryClient = useQueryClient();
	const [showPremiumModal, setShowPremiumModal] = useState(false);

	const content = useQuery({
		...orpc.subject.getContentById.queryOptions({
			input: { contentId: Number(contentId) },
		}),
		// Don't retry on 403 FORBIDDEN - user doesn't have access
		retry: (failureCount, error) => {
			// Don't retry if it's a forbidden/premium error
			if (error?.message?.includes("premium") || error?.message?.includes("FORBIDDEN")) {
				return false;
			}
			// Default retry behavior for other errors (max 3 retries)
			return failureCount < 3;
		},
	});

	const trackViewMutation = useMutation(orpc.subject.trackView.mutationOptions());

	// Check if error is FORBIDDEN (premium content)
	const isForbiddenError = content.isError && content.error?.message?.includes("premium");

	// Show premium modal when accessing premium content
	useEffect(() => {
		if (isForbiddenError) {
			setShowPremiumModal(true);
		}
	}, [isForbiddenError]);

	// Track view when content is viewed
	// Always track to update viewedAt timestamp, even if already tracked in this session
	useEffect(() => {
		if (!content.data) return;

		// Use a debounce mechanism to avoid multiple rapid calls
		const storageKey = `tracking_content_${contentId}`;
		const lastTracked = sessionStorage.getItem(storageKey);
		const now = Date.now();
		const DEBOUNCE_MS = 2000; // Track at most once per 2 seconds per content

		if (!lastTracked || now - Number(lastTracked) > DEBOUNCE_MS) {
			trackViewMutation.mutate(
				{ id: Number(contentId) },
				{
					onSuccess: () => {
						// Update last tracked timestamp
						sessionStorage.setItem(storageKey, now.toString());
						queryClient.invalidateQueries({
							queryKey: orpc.subject.getRecentViews.key(),
						});
					},
				},
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [content.data, contentId, queryClient.invalidateQueries, trackViewMutation.mutate]);

	// Handle premium modal close - redirect back to class list
	const handlePremiumModalClose = () => {
		setShowPremiumModal(false);
		navigate({ to: `/classes/${subjectId}` });
	};

	// Show premium modal for forbidden content
	if (isForbiddenError) {
		return (
			<Container className="min-h-screen border-neutral-200 border-x bg-white pt-28 sm:gap-6">
				<PremiumGateModal isOpen={showPremiumModal} onClose={handlePremiumModalClose} contentType="content" />
			</Container>
		);
	}

	const currentPath = location.pathname;
	const currentTab: "video" | "notes" | "latihan-soal" = currentPath.endsWith("/latihan-soal")
		? "latihan-soal"
		: currentPath.endsWith("/notes")
			? "notes"
			: "video";

	const handleTabChange = (value: string) => {
		navigate({
			to:
				value === "video"
					? `/classes/${subjectId}/${contentId}/video`
					: value === "notes"
						? `/classes/${subjectId}/${contentId}/notes`
						: `/classes/${subjectId}/${contentId}/latihan-soal`,
			params: { subjectId, contentId },
		});
	};

	return (
		<Container className="min-h-screen border-neutral-200 border-x bg-white pt-28 sm:gap-6">
			<div className="flex justify-between">
				<BackButton
					to={currentTab === "video" ? `/classes/${subjectId}` : `/classes/${subjectId}/${contentId}/video`}
				/>
				{currentTab === "video" && (
					<NextButton
						to={`/classes/${subjectId}/${contentId}/notes`}
						className={!location.pathname.includes("/video") ? "hidden" : ""}
					/>
				)}
				{currentTab === "notes" && (
					<NextButton
						to={`/classes/${subjectId}/${contentId}/latihan-soal`}
						className={!location.pathname.includes("/notes") ? "hidden" : ""}
					/>
				)}
			</div>

			<Tabs value={currentTab} onValueChange={handleTabChange}>
				<TabsContent value={currentTab}>
					<Outlet />
				</TabsContent>
			</Tabs>
		</Container>
	);
}
