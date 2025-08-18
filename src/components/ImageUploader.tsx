import { useState, useEffect, useRef } from 'react';
import { UploadCloud, X, Star } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onFilesChange: (files: File[]) => void;
  onPrimaryIndexChange: (index: number | null) => void;
}

export const ImageUploader = ({ onFilesChange, onPrimaryIndexChange }: ImageUploaderProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onFilesChange(files);
  }, [files, onFilesChange]);

  useEffect(() => {
    onPrimaryIndexChange(primaryIndex);
  }, [primaryIndex, onPrimaryIndexChange]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const allFiles = [...files, ...newFiles];
      setFiles(allFiles);

      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);

      if (primaryIndex === null && allFiles.length > 0) {
        setPrimaryIndex(0);
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);

    if (primaryIndex === index) {
      setPrimaryIndex(newFiles.length > 0 ? 0 : null);
    } else if (primaryIndex !== null && primaryIndex > index) {
      setPrimaryIndex(primaryIndex - 1);
    }
  };

  const setAsPrimary = (index: number) => {
    setPrimaryIndex(index);
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-rose-400 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Trascina le foto qui o clicca per selezionarle
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={preview}
                alt={`Preview ${index}`}
                className={cn(
                  "w-full h-full object-cover rounded-md transition-all",
                  primaryIndex === index && "ring-4 ring-offset-2 ring-rose-500"
                )}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                  onClick={() => setAsPrimary(index)}
                  disabled={primaryIndex === index}
                >
                  <Star className={cn("h-4 w-4", primaryIndex === index && "text-yellow-400 fill-current")} />
                </Button>
              </div>
              {primaryIndex === index && (
                <div className="absolute top-1 right-1 bg-rose-500 text-white text-xs px-2 py-1 rounded-full">
                  Principale
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};