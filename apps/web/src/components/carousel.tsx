import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { Image } from "@unpic/react";
import type React from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Container } from "./ui/container";

export interface CarouselItem {
	id: string | number;
	desc: string;
	name: string;
	title: string;
	[key: string]: unknown;
	avatar: string;
}

interface CarouselProps {
	items: CarouselItem[];
	cardWidth?: number;
	cardHeight?: number;
	gap?: number;
	responsiveGap?: boolean;
	className?: string;
	showNavigation?: boolean;
	showDots?: boolean;
	autoPlay?: boolean;
	autoPlayInterval?: number;
	onItemClick?: (item: CarouselItem, index: number) => void;
	renderCard?: (item: CarouselItem, index?: number, isActive?: boolean) => React.ReactNode;
}

// --- Hooks ---

function useResponsiveGap(gap: number, responsiveGap: boolean): number {
	const [currentGap, setCurrentGap] = useState(gap);

	useEffect(() => {
		if (!responsiveGap) {
			setCurrentGap(gap);
			return;
		}

		const updateGap = () => {
			const width = window.innerWidth;
			let newGap: number;
			if (width < 640) newGap = Math.min(16, gap * 0.5);
			else if (width < 768) newGap = Math.max(24, gap * 0.75);
			else if (width < 1024) newGap = gap;
			else if (width < 1280) newGap = gap * 1.25;
			else newGap = gap * 1.5;
			setCurrentGap(newGap);
		};

		updateGap();
		window.addEventListener("resize", updateGap);
		return () => window.removeEventListener("resize", updateGap);
	}, [gap, responsiveGap]);

	return currentGap;
}

function useInfiniteScroll(itemCount: number, extendedLength: number) {
	const [currentIndex, setCurrentIndex] = useState(1);
	const [isTransitioning, setIsTransitioning] = useState(false);

	const next = () => {
		if (isTransitioning) return;
		setIsTransitioning(true);
		setCurrentIndex((prev) => prev + 1);
	};

	const prev = () => {
		if (isTransitioning) return;
		setIsTransitioning(true);
		setCurrentIndex((prev) => prev - 1);
	};

	const goTo = (index: number) => {
		if (isTransitioning) return;
		setIsTransitioning(true);
		setCurrentIndex(index + 1);
	};

	// Reset to real position after transition ends
	useEffect(() => {
		const timer = setTimeout(
			() => {
				if (currentIndex === 0) setCurrentIndex(itemCount);
				else if (currentIndex === extendedLength - 1) setCurrentIndex(1);
				setIsTransitioning(false);
			},
			isTransitioning ? 500 : 0,
		);
		return () => clearTimeout(timer);
	}, [currentIndex, itemCount, extendedLength, isTransitioning]);

	return { currentIndex, isTransitioning, next, prev, goTo };
}

function useAutoPlay(enabled: boolean, interval: number, isTransitioning: boolean, next: () => void) {
	useEffect(() => {
		if (!enabled) return;
		const id = setInterval(() => {
			if (!isTransitioning) next();
		}, interval);
		return () => clearInterval(id);
	}, [enabled, interval, isTransitioning, next]);
}

// --- Sub-components ---

function CarouselNavButtons({
	onPrev,
	onNext,
	disabled,
}: {
	onPrev: () => void;
	onNext: () => void;
	disabled: boolean;
}) {
	return (
		<>
			<button
				type="button"
				onClick={onPrev}
				disabled={disabled}
				className="absolute top-1/2 z-30 hidden -translate-x-49.5 -translate-y-1/2 rounded-[10px] bg-secondary-800 p-2.5 text-neutral-100 shadow transition-all duration-300 ease-out hover:scale-105 hover:bg-secondary-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 lg:flex xl:-translate-x-53.75"
			>
				<ArrowLeftIcon size={24} />
			</button>
			<button
				type="button"
				onClick={onNext}
				disabled={disabled}
				className="absolute top-1/2 z-30 hidden translate-x-49.5 -translate-y-1/2 rounded-[10px] bg-secondary-800 p-2.5 text-neutral-100 shadow transition-all duration-300 ease-out hover:scale-105 hover:bg-secondary-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 lg:flex xl:translate-x-53.75"
			>
				<ArrowRightIcon size={24} />
			</button>
		</>
	);
}

function CarouselMobileNav({
	onPrev,
	onNext,
	disabled,
}: {
	onPrev: () => void;
	onNext: () => void;
	disabled: boolean;
}) {
	return (
		<Container className="pt-5 pb-0">
			<div className="mb-6 flex w-full items-center justify-between gap-8 lg:hidden">
				<button
					type="button"
					onClick={onPrev}
					disabled={disabled}
					className="z-30 rounded-[10px] bg-secondary-800 p-2.5 text-neutral-100 transition-all duration-300 hover:scale-110 hover:bg-secondary-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<ArrowLeftIcon size={24} />
				</button>
				<button
					type="button"
					onClick={onNext}
					disabled={disabled}
					className="z-30 rounded-[10px] bg-secondary-800 p-2.5 text-neutral-100 transition-all duration-300 hover:scale-110 hover:bg-secondary-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<ArrowRightIcon size={24} />
				</button>
			</div>
		</Container>
	);
}

function CarouselDots({
	items,
	currentIndex,
	isTransitioning,
	onGoTo,
}: {
	items: CarouselItem[];
	currentIndex: number;
	isTransitioning: boolean;
	onGoTo: (index: number) => void;
}) {
	let activeIndex = currentIndex - 1;
	if (activeIndex < 0) activeIndex = items.length - 1;
	if (activeIndex >= items.length) activeIndex = 0;

	return (
		<div className="-mt-13 flex gap-2 lg:mt-8">
			{items.map((item, index) => (
				<button
					key={item.id}
					type="button"
					onClick={() => onGoTo(index)}
					disabled={isTransitioning}
					className={`size-2 rounded-full transition-all duration-200 disabled:cursor-not-allowed ${
						index === activeIndex ? "scale-125 bg-dot-active" : "scale-125 bg-dot-inactive"
					}`}
				/>
			))}
		</div>
	);
}

function DefaultCard({ item }: { item: CarouselItem }) {
	const itemId = typeof item.id === "number" ? item.id : Number.parseInt(item.id as string, 10) || 0;
	const bgColor =
		itemId % 2 === 0
			? "bg-neutral-100 border-neutral-200 *:text-black "
			: "bg-primary-300 *:text-neutral-1000 border-primary-400";

	return (
		<div
			className={`mx-auto flex aspect-video w-full max-w-[90vw] flex-col overflow-hidden rounded-[20px] border shadow-sm transition sm:max-w-none ${bgColor}`}
		>
			<div className="flex flex-1 flex-col justify-between text-pretty p-4 text-left">
				<div className="flex items-center space-x-2">
					<div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 lg:size-13">
						<Image src={item.avatar} alt="Avatar" width={100} height={100} className="h-full w-full" />
					</div>
					<div>
						<h3 className={cn("font-medium text-sm lg:text-base")}>{item.name}</h3>
						<h4 className="line-clamp-2 text-xs lg:text-sm">{item.title}</h4>
					</div>
				</div>
				<p className="max-h-full overflow-y-auto font-light text-xs lg:text-base">{item.desc}</p>
			</div>
		</div>
	);
}

// --- Main Component ---

const Carousel: React.FC<CarouselProps> = ({
	items,
	cardWidth = 360,
	cardHeight = 211,
	gap = 32,
	responsiveGap = false,
	className = "",
	showNavigation = true,
	showDots = true,
	autoPlay = false,
	autoPlayInterval = 3000,
	onItemClick,
	renderCard,
}) => {
	const extendedItems = items.length > 0 ? [items[items.length - 1], ...items, items[0]] : [];

	const currentGap = useResponsiveGap(gap, responsiveGap);
	const { currentIndex, isTransitioning, next, prev, goTo } = useInfiniteScroll(items.length, extendedItems.length);
	useAutoPlay(autoPlay, autoPlayInterval, isTransitioning, next);

	const getCardStyle = (index: number) => {
		const position = index - currentIndex;
		const translateX = position * (cardWidth + currentGap);
		const isVisible = Math.abs(position) <= 1;
		const isCenter = position === 0;
		const isAdjacent = Math.abs(position) === 1;

		return {
			transform: `translateX(${translateX}px) scale(${isCenter ? 1 : isAdjacent ? 0.9 : 1})`,
			filter: "blur(0px)",
			opacity: isVisible ? 1 : 0,
			zIndex: isCenter ? 10 : isAdjacent ? 5 : 1,
			visibility: isVisible ? ("visible" as const) : ("hidden" as const),
			transition:
				isTransitioning &&
				!((currentIndex === 0 && index === items.length) || (currentIndex === extendedItems.length - 1 && index === 1))
					? "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
					: "none",
		};
	};

	return (
		<div className={`flex flex-col items-center justify-center ${className}`}>
			<div className="relative z-30 flex h-54 w-full max-w-280 items-center justify-center overflow-visible">
				{showNavigation && <CarouselNavButtons onPrev={prev} onNext={next} disabled={isTransitioning} />}

				<div className="relative flex items-center justify-center">
					{extendedItems.map((item, index) => {
						if (!item) return null;
						return (
							<button
								key={`${item.id}`}
								type="button"
								className="absolute cursor-pointer"
								style={{ width: cardWidth, height: cardHeight, ...getCardStyle(index) }}
								onClick={() => {
									const actualIndex = index - 1;
									if (actualIndex >= 0 && actualIndex < items.length && actualIndex !== currentIndex - 1) {
										goTo(actualIndex);
									}
									onItemClick?.(item, actualIndex);
								}}
							>
								{renderCard ? renderCard(item, index, index === currentIndex) : <DefaultCard item={item} />}
							</button>
						);
					})}
				</div>
			</div>

			{showNavigation && <CarouselMobileNav onPrev={prev} onNext={next} disabled={isTransitioning} />}

			{showDots && (
				<CarouselDots items={items} currentIndex={currentIndex} isTransitioning={isTransitioning} onGoTo={goTo} />
			)}
		</div>
	);
};

export default Carousel;
