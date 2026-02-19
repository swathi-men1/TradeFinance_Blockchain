/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface FileIngestAreaProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    maxSize?: number; // in MB
}

export function FileIngestArea({ onFileSelect, accept = '*', maxSize = 10 }: FileIngestAreaProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleFile = (file: File) => {
        // Check file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSize) {
            toast.warning(`File size exceeds ${maxSize}MB limit`);
            return;
        }

        onFileSelect(file);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div
            className={`file-ingest-area ${isDragging ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileInput}
                className="hidden"
            />

            <div className="text-6xl mb-4 text-primary"><UploadCloud className="w-16 h-16" /></div>

            <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Drop your file here
            </h3>

            <p className="text-secondary mb-4">
                or click to browse
            </p>

            <p className="text-sm text-muted">
                Maximum file size: {maxSize}MB
            </p>
        </div>
    );
}
