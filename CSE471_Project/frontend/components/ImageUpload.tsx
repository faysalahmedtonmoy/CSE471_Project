'use client';

import { useState } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';

interface ImageUploadProps {
  onUpload: (url: string) => void;
}

export default function ImageUpload({ onUpload }: ImageUploadProps) {
  const { isLoaded, isSignedIn } = useUser();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

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
      setImageUrl(url);
      onUpload(url);
    }
  };

  return (
    <div className="w-full">
      <CldUploadWidget 
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
        onSuccess={handleUploadSuccess}
        options={{
          maxFiles: 1,
          resourceType: 'image',
          clientAllowedFormats: ['jpeg', 'png', 'jpg', 'webp'],
        }}
      >
        {({ open }) => {
          return (
            <div 
              onClick={() => open()}
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              {imageUrl ? (
                <div className="relative w-full h-full p-2">
                  <div className="relative w-full h-full rounded-md overflow-hidden">
                    <Image 
                      src={imageUrl} 
                      alt="Uploaded preview" 
                      fill 
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity rounded-md">
                    <p className="text-white font-semibold">Click to replace image</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500">SVG, PNG, JPG or WEBP (Max. 1 file)</p>
                </div>
              )}
            </div>
          );
        }}
      </CldUploadWidget>
    </div>
  );
}
