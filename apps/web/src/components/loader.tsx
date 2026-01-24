import { BookOpen, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const LOADING_TEXTS = [
	"Sharpening pencils...",
	"Brewing coffee for the brain cells...",
	"Summoning the knowledge spirits...",
	"Loading wisdom...",
	"Organizing the library...",
	"Reviewing notes...",
	"Checking the syllabus...",
	"Preparing the classroom...",
];

export default function Loader() {
	const [currentText, setCurrentText] = useState(LOADING_TEXTS[0]);

	useEffect(() => {
		// Set initial random text
		setCurrentText(LOADING_TEXTS[Math.floor(Math.random() * LOADING_TEXTS.length)]);

		const interval = setInterval(() => {
			setCurrentText(LOADING_TEXTS[Math.floor(Math.random() * LOADING_TEXTS.length)]);
		}, 2500);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="flex h-screen w-full flex-col items-center justify-center gap-8 p-8">
			<div className="relative flex items-center justify-center">
				{/* Book Icon */}
				<motion.div
					animate={{
						y: [-8, 8, -8],
						rotate: [-3, 3, -3],
					}}
					transition={{
						duration: 4,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
					className="relative z-10 text-primary"
				>
					<BookOpen size={64} strokeWidth={1.5} />
				</motion.div>

				{/* Floating Particles */}
				{[...Array(5)].map((i) => (
					<motion.div
						key={i}
						className="absolute text-yellow-500/80 dark:text-yellow-400/80"
						initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
						animate={{
							opacity: [0, 1, 0],
							scale: [0, 1, 0.5],
							x: (Math.random() - 0.5) * 80,
							y: -40 - Math.random() * 40,
							rotate: Math.random() * 360,
						}}
						transition={{
							duration: 2 + Math.random(),
							repeat: Number.POSITIVE_INFINITY,
							delay: Math.random() * 2,
							ease: "easeOut",
						}}
					>
						<Sparkles size={16} />
					</motion.div>
				))}

				{/* Glow effect */}
				<motion.div
					className="absolute -z-10 h-24 w-24 rounded-full bg-primary/20 blur-xl"
					animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
					transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
				/>
			</div>

			{/* Loading Text */}
			<div className="flex flex-col items-center gap-3">
				<div className="h-8 min-w-50">
					<AnimatePresence mode="wait">
						<motion.p
							key={currentText}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.3 }}
							className="text-center font-medium text-lg text-muted-foreground"
						>
							{currentText}
						</motion.p>
					</AnimatePresence>
				</div>

				{/* Progress Dots */}
				<div className="flex gap-1.5">
					{[0, 1, 2].map((i) => (
						<motion.div
							key={i}
							className="h-2 w-2 rounded-full bg-primary"
							animate={{
								scale: [1, 1.5, 1],
								opacity: [0.4, 1, 0.4],
							}}
							transition={{
								duration: 1,
								repeat: Number.POSITIVE_INFINITY,
								delay: i * 0.2,
								ease: "easeInOut",
							}}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
