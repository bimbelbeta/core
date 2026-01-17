import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Container } from "@/components/ui/container";
import { Heading } from "./-componenets/heading";
import { DATA } from "./data";

export function FAQ() {
	const midPoint = Math.ceil(DATA.faq.length / 2);

	return (
		<Container>
			<Heading className="mb-2">
				Paling <span className="font-semibold text-secondary-700">Sering</span> Ditanyakan
			</Heading>
			<Accordion type="single" collapsible>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:gap-6">
					<div className="space-y-4 xl:space-y-6">
						{DATA.faq.slice(0, midPoint).map((item) => (
							<AccordionItem key={item.id} value={item.id.toString()} className="border-border border-b">
								<AccordionTrigger className="group">
									<span className="text-base">{item.question}</span>
								</AccordionTrigger>
								<AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
							</AccordionItem>
						))}
					</div>
					<div className="space-y-4 xl:space-y-6">
						{DATA.faq.slice(midPoint).map((item) => (
							<AccordionItem key={item.id} value={item.id.toString()} className="border-border border-b">
								<AccordionTrigger className="group">
									<span className="text-base">{item.question}</span>
								</AccordionTrigger>
								<AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
							</AccordionItem>
						))}
					</div>
				</div>
			</Accordion>
		</Container>
	);
}
