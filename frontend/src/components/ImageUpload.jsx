import { useState } from "react";

export default function ImageUpload({ onUploadSuccess, currentImage }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || "");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    
    // Create a preview instantly
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    const formData = new FormData();
    formData.append("file", file);
    
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Cloudinary environment variables are missing.");
      setUploading(false);
      return;
    }

    formData.append("upload_preset", uploadPreset);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      
      if (data.secure_url) {
        onUploadSuccess(data.secure_url); // Send URL back to parent form
      } else {
        alert(`Upload failed: ${data.error?.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Image Preview Circle */}
      <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative">
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <i className="fas fa-camera text-slate-400 text-2xl"></i>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <i className="fas fa-spinner fa-spin text-white"></i>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap justify-center">
        {/* 👇 Button 1: Open Camera Directly (capture="environment") */}
        <label className={`cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <i className="fas fa-camera"></i> Camera
          <input
            type="file"
            accept="image/*"
            capture="environment" // 👈 Forces camera on mobile
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>

        {/* 👇 Button 2: Choose from Gallery */}
        <label className={`cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <i className="fas fa-images"></i> Gallery
          <input
            type="file"
            accept="image/*" // 👈 No capture attribute = opens gallery
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}
