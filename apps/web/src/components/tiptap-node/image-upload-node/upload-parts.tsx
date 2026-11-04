import { useState } from "react";
import { CloseIcon } from "@/components/tiptap-icons/close-icon";
import { Button } from "@/components/tiptap-ui-primitive/button";
import { CloudUploadIcon, FileCornerIcon, FileIcon } from "./icons";
import type { FileItem } from "./use-file-upload";

interface ImageUploadDragAreaProps {
	/**
	 * Callback function triggered when files are dropped or selected
	 * @param {File[]} files - Array of File objects that were dropped or selected
	 */
	onFile: (files: File[]) => void;
	/**
	 * Optional child elements to render inside the drag area
	 * @optional
	 * @default undefined
	 */
	children?: React.ReactNode;
}

/**
 * A component that creates a drag-and-drop area for image uploads
 */
const ImageUploadDragArea: React.FC<ImageUploadDragAreaProps> = ({ onFile, children }) => {
	const [isDragOver, setIsDragOver] = useState(false);
	const [isDragActive, setIsDragActive] = useState(false);

	const handleDragEnter = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!e.currentTarget.contains(e.relatedTarget instanceof Node ? e.relatedTarget : null)) {
			setIsDragActive(false);
			setIsDragOver(false);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(true);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(false);
		setIsDragOver(false);

		const files = Array.from(e.dataTransfer.files);
		if (files.length > 0) {
			onFile(files);
		}
	};

	return (
		<div
			aria-hidden="true"
			className={`tiptap-image-upload-drag-area ${isDragActive ? "drag-active" : ""} ${isDragOver ? "drag-over" : ""}`}
			onDragEnter={handleDragEnter}
			onDragLeave={handleDragLeave}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
		>
			{children}
		</div>
	);
};

interface ImageUploadPreviewProps {
	/**
	 * The file item to preview
	 */
	fileItem: FileItem;
	/**
	 * Callback to remove this file from upload queue
	 */
	onRemove: () => void;
}

/**
 * Component that displays a preview of an uploading file with progress
 */
const ImageUploadPreview: React.FC<ImageUploadPreviewProps> = ({ fileItem, onRemove }) => {
	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	return (
		<div className="tiptap-image-upload-preview">
			{fileItem.status === "uploading" && (
				<div className="tiptap-image-upload-progress" style={{ width: `${fileItem.progress}%` }} />
			)}

			<div className="tiptap-image-upload-preview-content">
				<div className="tiptap-image-upload-file-info">
					<div className="tiptap-image-upload-file-icon">
						<CloudUploadIcon />
					</div>
					<div className="tiptap-image-upload-details">
						<span className="tiptap-image-upload-text">{fileItem.file.name}</span>
						<span className="tiptap-image-upload-subtext">{formatFileSize(fileItem.file.size)}</span>
					</div>
				</div>
				<div className="tiptap-image-upload-actions">
					{fileItem.status === "uploading" && (
						<span className="tiptap-image-upload-progress-text">{fileItem.progress}%</span>
					)}
					<Button
						type="button"
						data-style="ghost"
						onClick={(e) => {
							e.stopPropagation();
							onRemove();
						}}
					>
						<CloseIcon className="tiptap-button-icon" />
					</Button>
				</div>
			</div>
		</div>
	);
};

const DropZoneContent: React.FC<{ maxSize: number; limit: number }> = ({ maxSize, limit }) => (
	<>
		<div className="tiptap-image-upload-dropzone">
			<FileIcon />
			<FileCornerIcon />
			<div className="tiptap-image-upload-icon-container">
				<CloudUploadIcon />
			</div>
		</div>

		<div className="tiptap-image-upload-content">
			<span className="tiptap-image-upload-text">
				<em>Click to upload</em> or drag and drop
			</span>
			<span className="tiptap-image-upload-subtext">
				Maximum {limit} file{limit === 1 ? "" : "s"}, {maxSize / 1024 / 1024}MB each.
			</span>
		</div>
	</>
);

export { DropZoneContent, ImageUploadDragArea, ImageUploadPreview };
