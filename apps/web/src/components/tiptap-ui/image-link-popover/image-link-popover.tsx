import { forwardRef } from "react";
import { CornerDownLeftIcon } from "@/components/tiptap-icons/corner-down-left-icon";
import { ImagePlusIcon } from "@/components/tiptap-icons/image-plus-icon";
import type { UseImageLinkPopoverConfig } from "@/components/tiptap-ui/image-link-popover/use-image-link-popover";
import { useImageLinkPopover } from "@/components/tiptap-ui/image-link-popover/use-image-link-popover";
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button } from "@/components/tiptap-ui-primitive/button";
import { Card, CardBody, CardItemGroup } from "@/components/tiptap-ui-primitive/card";
import { Input, InputGroup } from "@/components/tiptap-ui-primitive/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/tiptap-ui-primitive/popover";

export interface ImageLinkPopoverProps extends Omit<ButtonProps, "type">, UseImageLinkPopoverConfig {}

export const ImageLinkButton = forwardRef<HTMLButtonElement, ButtonProps>(({ className, children, ...props }, ref) => {
	return (
		<Button
			type="button"
			className={className}
			data-style="ghost"
			role="button"
			tabIndex={-1}
			aria-label="Add image"
			tooltip="Add image"
			ref={ref}
			{...props}
		>
			{children || <ImagePlusIcon className="tiptap-button-icon" />}
		</Button>
	);
});

ImageLinkButton.displayName = "ImageLinkButton";

export const ImageLinkPopover = forwardRef<HTMLButtonElement, ImageLinkPopoverProps>(
	({ editor: providedEditor, onClick, onOpenChange, children, ...buttonProps }, ref) => {
		const { isOpen, setIsOpen, url, setUrl, handleSetImage, handleToggleOpen, handleKeyDown } = useImageLinkPopover({
			editor: providedEditor,
			onOpenChange,
		});

		return (
			<Popover open={isOpen} onOpenChange={setIsOpen}>
				<PopoverTrigger asChild>
					<ImageLinkButton
						onClick={(event) => {
							onClick?.(event);
							handleToggleOpen(event);
						}}
						{...buttonProps}
						ref={ref}
					>
						{children ?? <ImagePlusIcon className="tiptap-button-icon" />}
					</ImageLinkButton>
				</PopoverTrigger>

				<PopoverContent>
					<Card>
						<CardBody>
							<CardItemGroup orientation="horizontal">
								<InputGroup>
									<Input
										type="url"
										placeholder="Paste image URL..."
										value={url}
										onChange={(e) => setUrl(e.target.value)}
										onKeyDown={handleKeyDown}
										autoFocus
										autoComplete="off"
										autoCorrect="off"
										autoCapitalize="off"
									/>
								</InputGroup>

								<Button type="button" onClick={handleSetImage} title="Add image" disabled={!url} data-style="ghost">
									<CornerDownLeftIcon className="tiptap-button-icon" />
								</Button>
							</CardItemGroup>
						</CardBody>
					</Card>
				</PopoverContent>
			</Popover>
		);
	},
);

ImageLinkPopover.displayName = "ImageLinkPopover";

export default ImageLinkPopover;
