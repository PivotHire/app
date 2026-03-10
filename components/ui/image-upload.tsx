import { useState, useRef } from 'react';
import { UploadCloud, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
    value?: string | null;
    onChange: (url: string) => void;
    disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Optional: add basic client-side validation for file size (e.g. 5MB limit)
        const MAX_FILE_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            toast.error('Image is too large. Max size is 5MB.');
            if (inputRef.current) inputRef.current.value = '';
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            // Let it generate a name automatically or you could customize it here

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();

            // Openinary returns { success: true, files: [{ url: '...' }] }
            if (result.success && result.files && result.files.length > 0) {
                onChange(result.files[0].url);
                toast.success('Image uploaded successfully');
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image');
        } finally {
            setIsUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.preventDefault();
        onChange('');
    };

    return (
        <div className="flex flex-col items-center justify-center w-full">
            {value ? (
                <div className="relative group w-full flex justify-center">
                    <div className="relative h-32 w-32 rounded-full overflow-hidden border-2 border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={value}
                            alt="Uploaded avatar"
                            className="object-cover w-full h-full"
                        />
                        {!disabled && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    className="bg-destructive text-destructive-foreground p-1.5 rounded-full hover:bg-destructive/90 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <label className={`
          flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed
          ${disabled ? 'opacity-50 cursor-not-allowed border-border/50 bg-muted/20' : 'cursor-pointer border-input bg-card hover:bg-accent/50'}
          transition-colors
        `}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {isUploading ? (
                            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                        ) : (
                            <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                        )}
                        <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG or GIF (max. 5MB)</p>
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif, image/webp"
                        onChange={handleFileChange}
                        disabled={disabled || isUploading}
                    />
                </label>
            )}
        </div>
    );
}
