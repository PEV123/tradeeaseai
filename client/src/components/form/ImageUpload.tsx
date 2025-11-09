import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  disabled?: boolean;
  brandColor?: string;
}

export default function ImageUpload({ images, onImagesChange, disabled = false, brandColor = "#E8764B" }: ImageUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onImagesChange([...images, ...acceptedFiles]);
  }, [images, onImagesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    },
    disabled,
    multiple: true,
  });

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={isDragActive ? { borderColor: brandColor, backgroundColor: `${brandColor}10` } : undefined}
        data-testid="dropzone-images"
      >
        <input {...getInputProps()} data-testid="input-file-upload" />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-lg font-medium" style={{ color: brandColor }}>Drop photos here...</p>
        ) : (
          <>
            <p className="text-lg font-medium mb-2">Drag & drop site photos here</p>
            <p className="text-sm text-muted-foreground">or click to browse your files</p>
            <p className="text-xs text-muted-foreground mt-2">PNG, JPG, WEBP up to 10MB each</p>
          </>
        )}
      </div>

      {images.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-3">
            {images.length} {images.length === 1 ? 'photo' : 'photos'} selected
          </p>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                  data-testid={`img-preview-${index}`}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    disabled={disabled}
                    data-testid={`button-remove-image-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute top-2 left-2">
                  <div className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No photos uploaded yet</p>
        </div>
      )}
    </div>
  );
}
