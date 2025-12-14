
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { EditMode, ImageFile } from './types';
import { editImage } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import { LogoIcon, TShirtIcon, WandIcon, SparklesIcon, BrushIcon, ExpandIcon, DownloadIcon } from './components/icons';

const SUGGESTED_PROMPTS = {
  [EditMode.General]: [
    "Cyberpunk neon style",
    "Vintage polaroid filter",
    "Make it snowy",
    "Studio lighting",
  ],
  [EditMode.Inpainting]: [
    "Remove object",
    "Blue shirt",
    "Wear a hat",
    "Sunglasses",
  ]
};

interface InpaintingCanvasProps {
  baseImage: ImageFile;
  onMaskReady: (mask: { base64: string; file: { type: string } } | null) => void;
}

const InpaintingCanvas: React.FC<InpaintingCanvasProps> = ({ baseImage, onMaskReady }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        // Handle scale if canvas display size differs from actual size
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if ('touches' in e) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY,
            };
        }
        return { 
            x: (e.clientX - rect.left) * scaleX, 
            y: (e.clientY - rect.top) * scaleY
        };
    }

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const coords = getCoords(e);
        if (!coords) return;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const coords = getCoords(e);
        if (!coords) return;
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.closePath();
        setIsDrawing(false);
        const maskBase64 = canvas.toDataURL('image/png');
        onMaskReady({ base64: maskBase64, file: { type: 'image/png' } });
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        const image = new Image();
        image.src = baseImage.base64;
        image.onload = () => {
            if (canvas && container) {
                // Set canvas resolution to match image natural resolution for high quality
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = 'black';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.strokeStyle = 'white';
                    // Scale brush size relative to image size
                    ctx.lineWidth = Math.max(20, Math.min(canvas.width, canvas.height) * 0.05);
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                }
                // Reset mask
                onMaskReady(null);
            }
        };
    }, [baseImage]);
    
    return (
        <div ref={containerRef} className="relative w-full rounded-xl overflow-hidden shadow-lg border border-border group">
            <img src={baseImage.base64} className="w-full h-auto block" alt="Base for inpainting" />
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full cursor-crosshair opacity-60 mix-blend-screen touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                Draw to mask
            </div>
        </div>
    );
};

const createOutpaintingData = (
  imageFile: ImageFile,
  aspectRatio: string
): Promise<{ newImage: string; mask: string } | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageFile.base64;
    img.onload = () => {
      const [w, h] = aspectRatio.split(':').map(Number);
      const targetRatio = w / h;
      const originalRatio = img.naturalWidth / img.naturalHeight;

      let newWidth: number, newHeight: number;

      if (targetRatio > originalRatio) {
        newHeight = img.naturalHeight;
        newWidth = Math.round(newHeight * targetRatio);
      } else {
        newWidth = img.naturalWidth;
        newHeight = Math.round(newWidth / targetRatio);
      }

      const imageCanvas = document.createElement('canvas');
      imageCanvas.width = newWidth;
      imageCanvas.height = newHeight;
      const imageCtx = imageCanvas.getContext('2d');
      if (!imageCtx) return resolve(null);
      
      const offsetX = (newWidth - img.naturalWidth) / 2;
      const offsetY = (newHeight - img.naturalHeight) / 2;
      imageCtx.drawImage(img, offsetX, offsetY);
      
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = newWidth;
      maskCanvas.height = newHeight;
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) return resolve(null);

      maskCtx.fillStyle = 'white';
      maskCtx.fillRect(0, 0, newWidth, newHeight);

      maskCtx.fillStyle = 'black';
      maskCtx.fillRect(offsetX, offsetY, img.naturalWidth, img.naturalHeight);

      resolve({
        newImage: imageCanvas.toDataURL('image/png'),
        mask: maskCanvas.toDataURL('image/png'),
      });
    };
    img.onerror = () => {
      resolve(null);
    };
  });
};


const App: React.FC = () => {
  const [mode, setMode] = useState<EditMode>(EditMode.General);
  const [baseImage, setBaseImage] = useState<ImageFile | null>(null);
  const [clothImage, setClothImage] = useState<ImageFile | null>(null);
  const [maskImage, setMaskImage] = useState<{base64: string, file: {type: string}} | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [outpaintRatio, setOutpaintRatio] = useState('16:9');
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleModeChange = (newMode: EditMode) => {
    setMode(newMode);
    setBaseImage(null);
    setClothImage(null);
    setEditedImage(null);
    setError(null);
    setPrompt('');
  };

  const isGenerateDisabled = 
    isLoading || 
    !baseImage || 
    (mode === EditMode.TryOn && !clothImage) ||
    ((mode === EditMode.General || mode === EditMode.Inpainting) && !prompt) ||
    (mode === EditMode.Inpainting && !maskImage);

  const handleGenerate = useCallback(async () => {
    if (isGenerateDisabled) return;

    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    let finalPrompt: string;
    const images: (ImageFile | { base64: string, file: {type: string} })[] = [];

    if (!baseImage) {
        setError("Please upload a base image.");
        setIsLoading(false);
        return;
    }


    switch(mode) {
        case EditMode.TryOn:
            images.push(baseImage);
            if(clothImage) images.push(clothImage);
            finalPrompt = `In the first image, there is a person. In the second image, there is an article of clothing. Your task is to realistically place the clothing from the second image onto the person in the first image. Preserve the person's original pose, the background, and the lighting of the first image. The clothing should fit naturally on the person.`;
            break;
        case EditMode.Inpainting:
            images.push(baseImage);
            if(maskImage) images.push(maskImage);
            finalPrompt = `You are an expert photo editor. Use the second image as a mask. The white area of the mask indicates the region to be edited in the first image. Perform the following edit ONLY in that region, blending it seamlessly with the rest of the image: ${prompt}`;
            break;
        case EditMode.Outpainting:
            const outpaintData = await createOutpaintingData(baseImage, outpaintRatio);
            if (!outpaintData) {
                setError("Failed to prepare image for outpainting.");
                setIsLoading(false);
                return;
            }
            images.push({ base64: outpaintData.newImage, file: { type: 'image/png' } });
            images.push({ base64: outpaintData.mask, file: { type: 'image/png' } });

            finalPrompt = `You are an expert photo editor. Use the second image as a mask. The white area of the mask indicates the region to be edited in the first image. Fill the white area, seamlessly blending it with the original content, maintaining the original style and subject matter of the central image.`;
            break;
        case EditMode.General:
        default:
            images.push(baseImage);
            finalPrompt = `Based on the provided image, perform the following edit: ${prompt}`;
            break;
    }

    try {
      const result = await editImage(finalPrompt, images);
      setEditedImage(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [baseImage, clothImage, prompt, mode, isGenerateDisabled, maskImage, outpaintRatio]);
  
  const handleDownload = () => {
    if (!editedImage) return;
    const link = document.createElement('a');
    link.href = editedImage;
    link.download = `img-master-${mode.toLowerCase()}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ToolButton = ({ label, icon, currentMode, targetMode, description }: { label:string, icon: React.ReactNode, currentMode: EditMode, targetMode: EditMode, description: string }) => (
    <button 
        onClick={() => handleModeChange(targetMode)} 
        className={`w-full p-4 rounded-xl transition-all duration-200 flex items-start space-x-4 border text-left group
            ${ currentMode === targetMode 
                ? 'bg-surface border-primary shadow-lg shadow-primary/10' 
                : 'bg-transparent border-transparent hover:bg-surface hover:border-border' 
            }`
        } 
    >
      <div className={`p-2 rounded-lg transition-colors flex-shrink-0 ${currentMode === targetMode ? 'bg-primary text-white' : 'bg-surface-hover text-gray-400 group-hover:text-white group-hover:bg-surface-hover'}`}>
        {icon}
      </div>
      <div>
        <h3 className={`font-semibold text-sm ${currentMode === targetMode ? 'text-white' : 'text-gray-300'}`}>{label}</h3>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed hidden sm:block lg:block">{description}</p>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-background font-sans text-gray-300 selection:bg-primary/30">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8">
                <LogoIcon className="w-full h-full drop-shadow-lg" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">IMG Master <span className="text-primary font-normal text-sm ml-2 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">Studio</span></h1>
          </div>
          <div className="text-xs font-mono text-gray-500">
             Powered by Gemini 2.5
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Navigation Sidebar */}
          {/* Changed: Removed sticky on mobile, added grid for better mobile layout, lg:sticky for desktop */}
          <nav className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-2 lg:flex lg:flex-col gap-2 relative lg:sticky lg:top-28 h-fit z-0">
            <h2 className="col-span-2 lg:col-span-1 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Tools</h2>
            <ToolButton 
                label="General Edit" 
                icon={<WandIcon className="w-5 h-5"/>} 
                currentMode={mode} 
                targetMode={EditMode.General} 
                description="Transform images with text prompts."
            />
            <ToolButton 
                label="Virtual Try-On" 
                icon={<TShirtIcon className="w-5 h-5"/>} 
                currentMode={mode} 
                targetMode={EditMode.TryOn} 
                description="Fit clothes onto people."
            />
            <ToolButton 
                label="Magic Fill" 
                icon={<BrushIcon className="w-5 h-5"/>} 
                currentMode={mode} 
                targetMode={EditMode.Inpainting} 
                description="Add or remove objects."
            />
            <ToolButton 
                label="Magic Expand" 
                icon={<ExpandIcon className="w-5 h-5"/>} 
                currentMode={mode} 
                targetMode={EditMode.Outpainting} 
                description="Extend images beyond borders."
            />
          </nav>
          
          {/* Configuration Panel */}
          {/* No sticky here, standard flow */}
          <div className="lg:col-span-4 flex flex-col gap-6 animate-fade-in z-10">
             <div className="bg-surface/50 border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-6">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    <h2 className="text-lg font-semibold text-white">Input</h2>
                </div>

                {/* Dynamic Inputs based on Mode */}
                <div className="space-y-6">
                    {mode === EditMode.General && (
                        <>
                            <ImageUploader id="base-image" title="Source Image" image={baseImage} onImageUpload={setBaseImage} />
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
                                <textarea 
                                    value={prompt} 
                                    onChange={(e) => setPrompt(e.target.value)} 
                                    placeholder="Describe the change..." 
                                    className="w-full p-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all resize-none text-sm leading-relaxed placeholder-gray-600" 
                                    rows={4} 
                                />
                                <div className="mt-3 flex flex-wrap gap-2">
                                {SUGGESTED_PROMPTS[EditMode.General].map((p) => (
                                    <button key={p} onClick={() => setPrompt(p)} className="px-3 py-1.5 text-xs font-medium bg-surface-hover hover:bg-primary/20 hover:text-primary rounded-full transition-colors border border-transparent hover:border-primary/20 text-gray-400">
                                        {p}
                                    </button>
                                ))}
                                </div>
                            </div>
                        </>
                    )}

                    {mode === EditMode.TryOn && (
                        <>
                            <ImageUploader id="person-image" title="Model Photo" image={baseImage} onImageUpload={setBaseImage} />
                            <div className="w-full h-px bg-border"></div>
                            <ImageUploader id="cloth-image" title="Garment Photo" image={clothImage} onImageUpload={setClothImage} />
                            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                                <p className="text-xs text-primary/80 leading-relaxed">
                                    <span className="font-semibold">Tip:</span> Ensure both images have good lighting and the full subject is visible for the best fit.
                                </p>
                            </div>
                        </>
                    )}

                    {mode === EditMode.Inpainting && (
                        <>
                            <ImageUploader 
                                id="base-image-inpainting" 
                                title="Source Image" 
                                image={baseImage} 
                                onImageUpload={(img) => { setBaseImage(img); setMaskImage(null); }} 
                            />
                            {baseImage && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-gray-300">Paint Mask</label>
                                        <span className="text-xs text-gray-500">Paint over area to edit</span>
                                    </div>
                                    <InpaintingCanvas baseImage={baseImage} onMaskReady={setMaskImage} />
                                </div>
                            )}
                            {maskImage && (
                                <div className="animate-fade-in">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Instructions</label>
                                    <textarea 
                                        value={prompt} 
                                        onChange={(e) => setPrompt(e.target.value)} 
                                        placeholder="What should fill this area?" 
                                        className="w-full p-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none transition-all resize-none text-sm" 
                                        rows={3} 
                                    />
                                     <div className="mt-3 flex flex-wrap gap-2">
                                        {SUGGESTED_PROMPTS[EditMode.Inpainting].map((p) => (
                                            <button key={p} onClick={() => setPrompt(p)} className="px-3 py-1.5 text-xs font-medium bg-surface-hover hover:bg-primary/20 hover:text-primary rounded-full transition-colors border border-transparent hover:border-primary/20 text-gray-400">
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {mode === EditMode.Outpainting && (
                         <>
                            <ImageUploader id="base-image-outpainting" title="Source Image" image={baseImage} onImageUpload={setBaseImage} />
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Target Aspect Ratio</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['16:9', '9:16', '4:3', '1:1'].map((ratio) => (
                                        <button
                                            key={ratio}
                                            onClick={() => setOutpaintRatio(ratio)}
                                            className={`py-3 px-4 rounded-lg text-sm font-medium border transition-all
                                                ${outpaintRatio === ratio 
                                                    ? 'bg-primary/10 border-primary text-primary' 
                                                    : 'bg-background border-border text-gray-400 hover:border-gray-600'
                                                }`}
                                        >
                                            {ratio}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerateDisabled}
                        className={`w-full group relative flex items-center justify-center py-4 px-6 text-sm font-bold tracking-wide rounded-xl transition-all duration-300 overflow-hidden
                            ${isGenerateDisabled
                            ? 'bg-surface-hover text-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-primary to-secondary text-white hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98]'
                            }`}
                    >
                        {!isLoading && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>}
                        <div className="relative flex items-center">
                            {isLoading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <SparklesIcon className="w-5 h-5 mr-2" />
                            )}
                            {isLoading ? 'PROCESSING...' : 'GENERATE'}
                        </div>
                    </button>
                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
                            {error}
                        </div>
                    )}
                </div>
             </div>
          </div>

          {/* Result Workspace */}
          {/* Changed: Removed sticky on mobile, kept on lg:desktop */}
          <div className="lg:col-span-5 relative lg:sticky lg:top-28">
            <div className={`bg-surface border border-border rounded-2xl p-2 min-h-[400px] lg:min-h-[600px] flex flex-col shadow-2xl transition-all duration-500 ${editedImage ? 'ring-2 ring-primary/50' : ''}`}>
               {/* Workspace Header */}
               <div className="px-4 py-3 border-b border-border flex justify-between items-center mb-2">
                   <h2 className="text-sm font-semibold text-gray-300">Canvas</h2>
                   {editedImage && (
                        <span className="text-xs text-primary font-medium px-2 py-1 bg-primary/10 rounded-full">
                            Generation Complete
                        </span>
                   )}
               </div>
               
               {/* Canvas Area */}
               <div className="flex-grow bg-background/50 rounded-lg overflow-hidden relative flex items-center justify-center m-2 min-h-[300px]">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center z-10">
                            <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-6"></div>
                            <p className="text-lg font-semibold text-white animate-pulse">Dreaming...</p>
                            <p className="text-sm text-gray-500 mt-2">AI is painting pixels</p>
                        </div>
                    ) : editedImage ? (
                        <div className="relative w-full h-full flex items-center justify-center group">
                            <img src={editedImage} alt="Edited result" className="max-w-full max-h-[500px] object-contain shadow-xl rounded-lg" />
                             <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                    onClick={handleDownload}
                                    className="bg-white text-black px-4 py-2 rounded-full font-bold shadow-lg hover:bg-gray-200 transition-colors flex items-center"
                                >
                                    <DownloadIcon className="w-4 h-4 mr-2" />
                                    Download
                                </button>
                             </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-600 z-10 p-8 max-w-xs">
                             <div className="w-20 h-20 bg-surface-hover rounded-full flex items-center justify-center mx-auto mb-4">
                                <WandIcon className="w-8 h-8 opacity-20" />
                             </div>
                             <h3 className="text-lg font-semibold text-gray-400 mb-2">Ready to Create</h3>
                             <p className="text-sm">Select a tool from the sidebar and configure your inputs to start editing.</p>
                        </div>
                    )}
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
