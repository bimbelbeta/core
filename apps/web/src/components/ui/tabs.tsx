import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
	return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props} />;
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			className={cn(
				"border-border flex w-full [scrollbar-width:none] gap-2 overflow-x-auto border-b sm:gap-5 [&::-webkit-scrollbar]:hidden",
				"sm:data-[orientation=vertical]:w-36 sm:data-[orientation=vertical]:shrink-0 sm:data-[orientation=vertical]:flex-col sm:data-[orientation=vertical]:gap-0 sm:data-[orientation=vertical]:overflow-visible sm:data-[orientation=vertical]:border-b-0 sm:data-[orientation=vertical]:border-l",
				className,
			)}
			{...props}
		/>
	);
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			className={cn(
				"focus-visible:ring-ring/50 text-muted-foreground hover:text-foreground -mb-px inline-flex items-center justify-center gap-2 rounded-none border-b-[3px] border-transparent pt-1 pb-1.5 text-sm font-normal whitespace-nowrap transition-colors outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
				"data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:font-medium",
				"sm:data-[orientation=vertical]:mb-0 sm:data-[orientation=vertical]:-ml-px sm:data-[orientation=vertical]:justify-start sm:data-[orientation=vertical]:border-b-0 sm:data-[orientation=vertical]:border-l-2 sm:data-[orientation=vertical]:py-2 sm:data-[orientation=vertical]:pr-3 sm:data-[orientation=vertical]:pl-3",
				"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		/>
	);
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />;
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
