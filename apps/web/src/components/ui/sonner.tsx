import { CheckCircleIcon, CircleNotchIcon, InfoIcon, WarningOctagonIcon, XCircleIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

function useResolvedTheme(): "light" | "dark" | "system" {
	const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
		if (typeof document === "undefined") return "system";
		return document.documentElement.classList.contains("dark") ? "dark" : "light";
	});

	useEffect(() => {
		const observer = new MutationObserver(() => {
			setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
		return () => observer.disconnect();
	}, []);

	return theme;
}

const Toaster = ({ ...props }: ToasterProps) => {
	const theme = useResolvedTheme();

	return (
		<Sonner
			theme={theme}
			className="toaster group"
			icons={{
				success: <CheckCircleIcon className="size-4" />,
				info: <InfoIcon className="size-4" />,
				warning: <WarningOctagonIcon className="size-4" />,
				error: <XCircleIcon className="size-4" />,
				loading: <CircleNotchIcon className="size-4 animate-spin" />,
			}}
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
