import React, { useState, useCallback, useRef } from 'react';
import { ImageFile } from './types';
import { editImage } from './services/geminiService';
import MagicWandIcon from './components/icons/MagicWandIcon';
import UploadIcon from './components/icons/UploadIcon';
import Spinner from './components/Spinner';
import RedoIcon from './components/icons/RedoIcon';
import DownloadIcon from './components/icons/DownloadIcon';

const Header: React.FC = () => (
  <header className="w-full max-w-5xl mx-auto py-6 px-4">
    <h1 className="text-4xl md:text-5xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
      AI Photo Editor
    </h1>
    <p className="text-center text-gray-400 mt-2">
      Built with Gemini Nano Banana
    </p>
  </header>
);

interface ImageUploaderProps {
  onImageUpload: (imageFile: ImageFile) => void;
  imageFile: ImageFile | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imageFile }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload({ file, previewUrl: URL.createObjectURL(file) });
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
       onImageUpload({ file, previewUrl: URL.createObjectURL(file) });
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="w-full">
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        htmlFor="image-upload"
        className="cursor-pointer w-full h-64 flex flex-col justify-center items-center border-2 border-dashed border-gray-600 rounded-lg hover:border-indigo-500 transition-colors bg-white/5 relative overflow-hidden"
      >
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          ref={inputRef}
        />
        {imageFile ? (
          <img src={imageFile.previewUrl} alt="Preview" className="h-full w-full object-contain rounded-lg p-2 transition-transform duration-300 hover:scale-105" />
        ) : (
          <div className="text-center text-gray-400 p-4">
            <UploadIcon className="mx-auto h-12 w-12" />
            <p className="mt-2 font-semibold">Click to upload or drag & drop</p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        )}
      </label>
    </div>
  );
};

const promptSuggestions = [
  "Change the background to a futuristic cityscape at night.",
  "Add a pair of sunglasses to the person in the photo.",
  "Make it look like a vintage film photograph.",
  "Turn the season into a snowy winter scene.",
  "Apply a vibrant, pop-art style.",
  "Add a majestic dragon flying in the sky.",
  "Make the lighting dramatic, like a film noir movie.",
  "Give the photo a watercolor painting effect.",
];


const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  const handleImageUpload = useCallback((file: ImageFile) => {
    setImageFile(file);
    setEditedImageUrl(null);
    setError(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!imageFile || !prompt) {
      setError('Please upload an image and enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImageUrl(null);

    try {
      const resultUrl = await editImage(imageFile.file, prompt);
      setEditedImageUrl(resultUrl);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, prompt]);

  const handleDownload = () => {
    if (!editedImageUrl) return;
    const link = document.createElement('a');
    link.href = editedImageUrl;
    // Generate a filename
    const fileName = `edited-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePromptSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
    setShowSuggestions(false);
  };
  
  const handleTextareaBlur = () => {
    // We need a small delay to allow the click on a suggestion to register
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <Header />
      <main className="w-full max-w-5xl mx-auto flex flex-col items-center gap-8">
        <div className="w-full max-w-2xl bg-gray-800/50 p-6 rounded-xl shadow-2xl border border-gray-700 space-y-6">
          <ImageUploader onImageUpload={handleImageUpload} imageFile={imageFile} />
          
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={handleTextareaBlur}
              placeholder="Describe your edit, e.g., 'make the sky a vibrant sunset'..."
              rows={3}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-200 placeholder-gray-500"
              disabled={!imageFile}
            />
             {showSuggestions && imageFile && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-700/95 backdrop-blur-sm border border-gray-600 rounded-lg p-2 z-10 animate-fadeIn shadow-lg">
                <p className="text-xs text-gray-400 px-2 pb-1 font-medium">Try a suggestion:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {promptSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handlePromptSuggestion(suggestion)}
                      className="text-left text-sm p-2 rounded-md hover:bg-indigo-500/50 transition-colors duration-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={!imageFile || !prompt || isLoading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-indigo-500/50"
          >
            {isLoading ? (
              <>
                <Spinner />
                <span>Generating...</span>
              </>
            ) : (
               <>
                <MagicWandIcon className="h-5 w-5" />
                <span>Generate Edit</span>
               </>
            )}
          </button>
        </div>

        {error && (
          <div className="w-full max-w-2xl p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg animate-fadeIn">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {imageFile && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 animate-fadeIn">
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Original</h3>
              <div className="aspect-square w-full bg-black/20 rounded-xl overflow-hidden border border-gray-700">
                <img src={imageFile.previewUrl} alt="Original" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="w-full">
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Edited</h3>
                <div className="aspect-square w-full bg-black/20 rounded-xl overflow-hidden border border-gray-700 flex items-center justify-center relative group">
                  {isLoading ? (
                    <div className="flex flex-col items-center text-gray-400 animate-pulse-subtle">
                      <Spinner />
                      <p className="mt-2">AI is working its magic...</p>
                    </div>
                  ) : editedImageUrl ? (
                    <img src={editedImageUrl} alt="Edited" className="w-full h-full object-contain animate-fadeIn" />
                  ) : (
                    <p className="text-gray-500 px-4 text-center">Your edited image will appear here</p>
                  )}
                </div>
              </div>
               {editedImageUrl && !isLoading && (
                 <div className="flex items-center gap-4 animate-fadeIn">
                   <button
                     onClick={handleGenerate}
                     className="flex items-center gap-2 bg-gray-700 text-white font-medium py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                     title="Regenerate"
                   >
                     <RedoIcon className="h-5 w-5" />
                     <span>Regenerate</span>
                   </button>
                   <button
                     onClick={handleDownload}
                     className="flex items-center gap-2 bg-green-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                     title="Download Image"
                   >
                     <DownloadIcon className="h-5 w-5" />
                     <span>Download</span>
                   </button>
                 </div>
               )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;