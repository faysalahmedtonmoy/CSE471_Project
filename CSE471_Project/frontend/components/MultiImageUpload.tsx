'use client';

import { useState } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { useUser } from '@clerk/nextjs';


interface MultiImageUploadProps {
  onUpload: (urls: string[]) => void;
  maxFiles?: number;
}

export default function MultiImageUpload({ onUpload, maxFiles = 5 }: MultiImageUploadProps) {
  const { isLoaded, isSignedIn } = useUser();
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Do not render anything if the user is not authenticated
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 bg-gray-50">
        You must be logged in to upload images.
      </div>
    );
  }

  const handleUploadSuccess = (result: any) => {
    if (result.event === 'success') {
      const url = result.info.secure_url;
      const newUrls = [...imageUrls, url];
      setImageUrls(newUrls);
      // Use setTimeout to ensure parent update happens outside of current render cycle if any
      setTimeout(() => onUpload(newUrls), 0);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const newUrls = imageUrls.filter((_, index) => index !== indexToRemove);
    setImageUrls(newUrls);
    setTimeout(() => onUpload(newUrls), 0);
  };

  return (
    <div className="w-full space-y-4">
      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {imageUrls.map((url, index) => (
            <div key={index} className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
              <img 
                src={url} 
                alt={`Uploaded preview ${index + 1}`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-sm"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {imageUrls.length < maxFiles && (
        <CldUploadWidget 
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          onSuccess={handleUploadSuccess}
          options={{
            maxFiles: maxFiles - imageUrls.length,
            resourceType: 'image',
            clientAllowedFormats: ['jpeg', 'png', 'jpg', 'webp'],
          }}
        >
          {({ open }) => {
            return (
              <div 
                onClick={() => open()}
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  <p className="mb-1 text-sm text-gray-500"><span className="font-semibold">Add Image</span></p>
                  <p className="text-xs text-gray-400">{imageUrls.length} / {maxFiles} uploaded</p>
                </div>
              </div>
            );
          }}
        </CldUploadWidget>
      )}
    </div>
  );
}
