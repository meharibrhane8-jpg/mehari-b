import React, { useState, useRef, useEffect } from "react";
import { 
  Paperclip, 
  Camera, 
  File as FileIcon, 
  Image, 
  FileText, 
  X, 
  Search, 
  Loader2, 
  AlertCircle, 
  Folder, 
  ExternalLink, 
  LogOut, 
  CheckCircle,
  Video,
  Monitor,
  RefreshCw,
  Plus,
  Sparkles,
  BrainCircuit,
  Globe,
  Zap,
  Pin
} from "lucide-react";
import { googleSignIn, logout, getAccessToken } from "../services/firebaseAuthService";
import { AttachedFile } from "../types";
import { User } from "firebase/auth";

interface FileAttachmentModuleProps {
  attachedFiles: AttachedFile[];
  onAddAttachment: (file: AttachedFile) => void;
  onRemoveAttachment: (id: string) => void;
  currentTheme: { isDark: boolean };
  mode?: "preview" | "trigger" | "both";
  aiModelMode?: 'general' | 'lite' | 'thinking' | 'search' | 'maps';
  setAiModelMode?: (mode: 'general' | 'lite' | 'thinking' | 'search' | 'maps') => void;
}

export const FileAttachmentModule: React.FC<FileAttachmentModuleProps> = ({
  attachedFiles,
  onAddAttachment,
  onRemoveAttachment,
  currentTheme,
  mode = "both",
  aiModelMode,
  setAiModelMode
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  
  // Camera specific states
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraInputFallbackRef = useRef<HTMLInputElement | null>(null);

  // Google Drive specific states
  const [driveUser, setDriveUser] = useState<User | null>(null);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveSearchQuery, setDriveSearchQuery] = useState("");
  const [driveError, setDriveError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const optionsRef = useRef<HTMLDivElement | null>(null);

  // Close options dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Handle local file picking
  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      processAndAddFile(file, "local");
    });
    
    // reset input value so user can pick the same file again
    e.target.value = "";
    setShowOptions(false);
  };

  // Shared file processing pipeline
  const processAndAddFile = (file: File, source: "local" | "camera" | "drive", driveFileId?: string) => {
    const reader = new FileReader();

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const isText = 
      file.type.startsWith("text/") || 
      file.name.endsWith(".json") || 
      file.name.endsWith(".csv") || 
      file.name.endsWith(".md") ||
      file.name.endsWith(".xml") ||
      file.name.endsWith(".ts") ||
      file.name.endsWith(".js") ||
      file.name.endsWith(".txt");

    if (isImage || isVideo) {
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const base64 = dataUrl.split(",")[1];
        onAddAttachment({
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          mimeType: file.type || (isImage ? "image/jpeg" : "video/mp4"),
          size: file.size,
          dataUrl,
          base64,
          source,
          driveFileId
        });
      };
      reader.readAsDataURL(file);
    } else if (isText) {
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onAddAttachment({
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          mimeType: file.type || "text/plain",
          size: file.size,
          textAlternative: content,
          source,
          driveFileId
        });
      };
      reader.readAsText(file);
    } else {
      // For general binary docs/PDF, notify and attach metadata (could try loading as base64 but mainly text info)
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const base64 = dataUrl.split(",")[1];
        onAddAttachment({
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          dataUrl,
          base64,
          source,
          driveFileId
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // --- CAMERA MODULE ---
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Camera streaming failed, providing fallback", err);
      setCameraError("Webcam stream access failed. You can capture or upload photos using your device camera instead.");
    }
  };

  useEffect(() => {
    if (showCameraModal) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [showCameraModal, facingMode]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const base64 = dataUrl.split(",")[1];
        
        onAddAttachment({
          id: `cam_${Date.now()}`,
          name: `camera_capture_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "_")}.jpg`,
          mimeType: "image/jpeg",
          size: Math.round((dataUrl.length * 3) / 4), // Approximate byte size from dataURL
          dataUrl,
          base64,
          source: "camera"
        });
        
        setShowCameraModal(false);
        setShowOptions(false);
      }
    } catch (err) {
      console.error("Capture photo failed", err);
    }
  };

  const triggerCameraFallback = () => {
    cameraInputFallbackRef.current?.click();
  };

  const handleCameraFallbackSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processAndAddFile(files[0], "camera");
    setShowCameraModal(false);
    setShowOptions(false);
    e.target.value = "";
  };

  // --- GOOGLE DRIVE MODULE ---
  const handleDriveConnect = async () => {
    setDriveLoading(true);
    setDriveError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setDriveUser(res.user);
        setDriveToken(res.accessToken);
        fetchDriveFiles(res.accessToken);
      } else {
        setDriveError("Failed to authenticate Google account.");
      }
    } catch (err: any) {
      setDriveError(err?.message || "Authentication aborted or failed.");
    } finally {
      setDriveLoading(false);
    }
  };

  const handleDriveDisconnect = async () => {
    await logout();
    setDriveUser(null);
    setDriveToken(null);
    setDriveFiles([]);
  };

  const fetchDriveFiles = async (token: string, search: string = "") => {
    setDriveLoading(true);
    setDriveError(null);
    try {
      let url = "https://www.googleapis.com/drive/v3/files?q=trashed%3Dfalse&fields=files(id,name,mimeType,size,iconLink)&pageSize=50";
      if (search.trim()) {
        url = `https://www.googleapis.com/drive/v3/files?q=name+contains+'${encodeURIComponent(search)}'+and+trashed%3Dfalse&fields=files(id,name,mimeType,size,iconLink)&pageSize=50`;
      }
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`Google Drive API responded with status ${res.status}`);
      }
      
      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch (err: any) {
      console.error("Fetch drive error:", err);
      setDriveError("Failed to fetch Google Drive file list. Try reconnecting.");
    } finally {
      setDriveLoading(false);
    }
  };

  useEffect(() => {
    const existingToken = getAccessToken();
    if (showDriveModal && existingToken) {
      setDriveToken(existingToken);
      fetchDriveFiles(existingToken);
    }
  }, [showDriveModal]);

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && driveToken) {
      fetchDriveFiles(driveToken, driveSearchQuery);
    }
  };

  // Import file content from Google Drive
  const handleImportDriveFile = async (driveFile: any) => {
    if (!driveToken) return;
    setDriveLoading(true);
    setDriveError(null);
    try {
      const isImg = driveFile.mimeType.startsWith("image/");
      const isGoogleDoc = driveFile.mimeType === "application/vnd.google-apps.document";
      const isGoogleSheet = driveFile.mimeType === "application/vnd.google-apps.spreadsheet";
      
      let downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}?alt=media`;
      
      if (isGoogleDoc) {
        downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}/export?mimeType=text/plain`;
      } else if (isGoogleSheet) {
        downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}/export?mimeType=text/csv`;
      }

      const res = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${driveToken}` }
      });

      if (!res.ok) {
        throw new Error(`Failed to download Drive file content. Status: ${res.status}`);
      }

      if (isImg) {
        const blob = await res.blob();
        const fileObj = new File([blob], driveFile.name, { type: driveFile.mimeType });
        processAndAddFile(fileObj, "drive", driveFile.id);
      } else if (isGoogleDoc || isGoogleSheet || driveFile.mimeType.startsWith("text/") || driveFile.name.endsWith(".txt") || driveFile.name.endsWith(".md") || driveFile.name.endsWith(".csv") || driveFile.name.endsWith(".json")) {
        const text = await res.text();
        onAddAttachment({
          id: `drive_${driveFile.id}_${Date.now()}`,
          name: driveFile.name,
          mimeType: isGoogleDoc ? "text/plain" : (isGoogleSheet ? "text/csv" : driveFile.mimeType),
          size: driveFile.size || text.length,
          textAlternative: text,
          source: "drive",
          driveFileId: driveFile.id
        });
      } else {
        // Assume fallback binary file, read as data URL
        const blob = await res.blob();
        const fileObj = new File([blob], driveFile.name, { type: driveFile.mimeType });
        processAndAddFile(fileObj, "drive", driveFile.id);
      }
      
      setShowDriveModal(false);
      setShowOptions(false);
    } catch (err: any) {
      console.error("Drive import error:", err);
      setDriveError(`Could not access file content: ${err?.message || "Permission restricted."}`);
    } finally {
      setDriveLoading(false);
    }
  };

  const getFileIcon = (mimeType: string, name: string) => {
    if (mimeType.startsWith("image/")) return <Image className="w-5 h-5 text-indigo-500" />;
    if (mimeType.startsWith("video/")) return <Video className="w-5 h-5 text-rose-500" />;
    if (name.endsWith(".csv") || name.endsWith(".json") || mimeType.includes("sheet") || mimeType.includes("excel")) {
      return <FileText className="w-5 h-5 text-emerald-500" />;
    }
    return <FileIcon className="w-5 h-5 text-sky-400" />;
  };

  const bytesToSize = (bytes?: number) => {
    if (!bytes) return "";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  if (mode === "preview") {
    if (attachedFiles.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mb-4 max-w-full px-2">
        {attachedFiles.map((file) => (
          <div 
            key={file.id} 
            className={`flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl text-xs font-semibold border ${
              currentTheme.isDark 
                ? "bg-[#181818]/90 border-white/5 text-white/90" 
                : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          >
            {file.mimeType.startsWith("image/") && file.dataUrl ? (
              <img 
                src={file.dataUrl} 
                alt={file.name} 
                className="w-5 h-5 rounded object-cover border border-white/10" 
                referrerPolicy="no-referrer"
              />
            ) : (
              getFileIcon(file.mimeType, file.name)
            )}
            
            <div className="flex flex-col max-w-[120px] truncate">
              <span className="truncate">{file.name}</span>
              {file.size && <span className="text-[10px] text-zinc-500 font-mono mt-[-2px]">{bytesToSize(file.size)}</span>}
            </div>

            <button 
              onClick={() => onRemoveAttachment(file.id)}
              className={`p-1 rounded-full transition-all ${
                currentTheme.isDark ? "hover:bg-white/10 text-white/40 hover:text-white" : "hover:bg-slate-200 text-slate-400 hover:text-slate-800"
              }`}
              title="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative z-40">
      
      {/* ATTACHED FILES LIST PREVIEW */}
      {mode === "both" && attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 max-w-full px-2">
          {attachedFiles.map((file) => (
            <div 
              key={file.id} 
              className={`flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl text-xs font-semibold border ${
                currentTheme.isDark 
                  ? "bg-[#181818]/90 border-white/5 text-white/90" 
                  : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            >
              {file.mimeType.startsWith("image/") && file.dataUrl ? (
                <img 
                  src={file.dataUrl} 
                  alt={file.name} 
                  className="w-5 h-5 rounded object-cover border border-white/10" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                getFileIcon(file.mimeType, file.name)
              )}
              
              <div className="flex flex-col max-w-[120px] truncate">
                <span className="truncate">{file.name}</span>
                {file.size && <span className="text-[10px] text-zinc-500 font-mono mt-[-2px]">{bytesToSize(file.size)}</span>}
              </div>

              <button 
                onClick={() => onRemoveAttachment(file.id)}
                className={`p-1 rounded-full transition-all ${
                  currentTheme.isDark ? "hover:bg-white/10 text-white/40 hover:text-white" : "hover:bg-slate-200 text-slate-400 hover:text-slate-800"
                }`}
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FLOATING ACTION TRIGGER BAR */}
      <div className="flex gap-1 items-center shrink-0">
        <div className="relative" ref={optionsRef}>
          <button 
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
              showOptions || attachedFiles.length > 0
                ? "bg-indigo-500/20 text-indigo-400" 
                : (currentTheme.isDark ? "text-white/40 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700")
            }`}
            title="Add tools (Files, Camera, Models)"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* ATTACH OPTIONS EXPANDABLE POPOVER */}
          {showOptions && (
            <div className={`absolute bottom-14 left-0 w-64 py-2 rounded-2xl border ${
              currentTheme.isDark 
                ? "bg-[#1b1b1b] border-white/10 shadow-2xl text-white" 
                : "bg-white border-zinc-200 shadow-xl text-zinc-800"
            } overflow-hidden flex flex-col z-[150] transition-all`}>
              
              {/* Model Selection Section */}
              {setAiModelMode && aiModelMode && (
                <div className={`px-4 py-2 mb-2 border-b ${currentTheme.isDark ? 'border-white/5' : 'border-slate-100'}`}>
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 block mb-2">Select Model</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { mode: 'general' as const, label: 'Standard', icon: Sparkles, color: 'text-indigo-500' },
                      { mode: 'thinking' as const, label: 'Thinking', icon: BrainCircuit, color: 'text-amber-500' },
                      { mode: 'search' as const, label: 'Search', icon: Globe, color: 'text-teal-500' },
                      { mode: 'maps' as const, label: 'Maps', icon: Pin, color: 'text-rose-500' },
                      { mode: 'lite' as const, label: 'Lite', icon: Zap, color: 'text-slate-400' }
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = aiModelMode === item.mode;
                      return (
                        <button
                          key={item.mode}
                          onClick={() => {
                            setAiModelMode(item.mode);
                            setShowOptions(false);
                          }}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-xl transition-all border ${
                            isActive 
                              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' 
                              : (currentTheme.isDark ? 'border-transparent hover:bg-white/5 text-zinc-400' : 'border-transparent hover:bg-slate-50 text-slate-600')
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : item.color}`} />
                          <span className="text-xs font-semibold">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <span className="px-4 py-1 text-[10px] uppercase tracking-widest font-bold opacity-40 block">Attach Files</span>
              
              <button 
                type="button"
                onClick={() => { fileInputRef.current?.click(); }}
                className={`px-4 py-2.5 flex items-center gap-3 text-sm transition-all text-left ${
                  currentTheme.isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
                }`}
              >
                <FileIcon className="w-4 h-4 text-emerald-500" />
                <span>Upload Local File</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* HIDDEN INPUT FOR LOCAL FILES */}
      <input 
        type="file" 
        multiple 
        accept="image/*,video/*,text/*,application/pdf,application/json,application/xml,text/csv"
        ref={fileInputRef}
        onChange={handleLocalFileSelect}
        className="hidden"
      />

      {/* --- CAMERA DIALOG MODAL --- */}
      {showCameraModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCameraModal(false)} />
          <div className={`relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border ${
            currentTheme.isDark ? "bg-[#131313] border-white/10" : "bg-white border-zinc-200"
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              currentTheme.isDark ? "border-white/5" : "border-slate-100"
            }`}>
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-500" />
                <h3 className={`font-semibold text-base ${currentTheme.isDark ? "text-white" : "text-zinc-900"}`}>
                  Camera Snapshot
                </h3>
              </div>
              <button 
                onClick={() => setShowCameraModal(false)}
                className={`p-1.5 rounded-full ${
                  currentTheme.isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-slate-100 text-zinc-600"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex flex-col items-center gap-4">
              {/* VIDEO VIEWER */}
              {!cameraError ? (
                <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/5">
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button 
                      onClick={toggleCameraFacing}
                      className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur transition-all"
                      title="Flip Camera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-video bg-zinc-900 rounded-2xl flex flex-col items-center justify-center text-center p-6 gap-3">
                  <AlertCircle className="w-12 h-12 text-zinc-500" />
                  <p className="text-xs text-zinc-400 max-w-xs">{cameraError}</p>
                  <button 
                    onClick={triggerCameraFallback}
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-500 transition-all flex items-center gap-2"
                  >
                    <Image className="w-4 h-4" />
                    Attach from Photos
                  </button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    ref={cameraInputFallbackRef}
                    onChange={handleCameraFallbackSelect}
                    className="hidden"
                  />
                </div>
              )}

              {/* ACTION CONTROL */}
              {!cameraError && (
                <div className="flex gap-3 justify-center w-full mt-2">
                  <button 
                    onClick={captureCameraPhoto}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-red-500 animate-pulse border border-white" />
                    Snap Photo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- GOOGLE DRIVE SELECTOR DIALOG MODAL --- */}
      {showDriveModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowDriveModal(false)} />
          <div className={`relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border h-[80vh] flex flex-col ${
            currentTheme.isDark ? "bg-[#131313] border-white/10" : "bg-white border-zinc-200"
          }`}>
            
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
              currentTheme.isDark ? "border-white/5" : "border-slate-100"
            }`}>
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-amber-500" />
                <h3 className={`font-semibold text-base ${currentTheme.isDark ? "text-white" : "text-zinc-900"}`}>
                  Google Drive Selector
                </h3>
              </div>
              <button 
                onClick={() => setShowDriveModal(false)}
                className={`p-1.5 rounded-full ${
                  currentTheme.isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-slate-100 text-zinc-600"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Interactive Grid */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">
              
              {/* Authenticate Check */}
              {!driveToken ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                    <Folder className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className={`font-bold text-lg ${currentTheme.isDark ? "text-white" : "text-zinc-800"}`}>
                      Select files from your Google Drive
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                      Access and attach photos and document contents securely with your permission. 
                    </p>
                  </div>
                  
                  {/* Google Authenticate Button */}
                  <button 
                    onClick={handleDriveConnect}
                    disabled={driveLoading}
                    className="gsi-material-button hover:scale-105 transition-transform"
                    style={{ margin: "1rem 0" }}
                  >
                    <div className="gsi-material-button-state"></div>
                    <div className="gsi-material-button-content-wrapper">
                      <div className="gsi-material-button-icon">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        </svg>
                      </div>
                      <span className="gsi-material-button-contents" style={{ fontSize: "14px", fontWeight: "600", fontFamily: "sans-serif" }}>Connect Google Drive</span>
                    </div>
                  </button>

                  {typeof window !== 'undefined' && window.self !== window.top && (
                    <button
                      type="button"
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="py-2 px-4 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors flex items-center justify-center gap-1.5 mb-2"
                    >
                      <span>↗️ Open in New Tab to Connect</span>
                    </button>
                  )}

                  {driveLoading && <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mt-2" />}
                  {driveError && <div className="text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {driveError}</div>}
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-3 min-h-0">
                  
                  {/* Account detail bar & Search input */}
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-zinc-400 font-medium">Google Drive connected</span>
                    </div>
                    <button 
                      onClick={handleDriveDisconnect}
                      className="text-rose-500 hover:text-rose-400 font-bold flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className={`flex items-center px-3 py-1.5 rounded-2xl border ${
                    currentTheme.isDark ? "bg-[#1e1e1e] border-white/10" : "bg-slate-50 border-zinc-200"
                  }`}>
                    <Search className="w-4 h-4 text-zinc-500 shrink-0" />
                    <input 
                      type="text"
                      placeholder="Search files in Drive (Press Enter)"
                      value={driveSearchQuery}
                      onChange={(e) => setDriveSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyPress}
                      className="ml-2 w-full bg-transparent text-sm outline-none border-none py-1.5 text-white placeholder-zinc-500"
                    />
                    {driveLoading && <Loader2 className="w-4 h-4 animate-spin text-indigo-500 shrink-0" />}
                  </div>

                  {driveError && (
                    <div className="text-xs text-rose-500 flex items-center gap-1 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                      <AlertCircle className="w-4 h-4 shrink-0" /> 
                      <p>{driveError}</p>
                    </div>
                  )}

                  {/* Files Browser Listing Area */}
                  <div className={`flex-1 overflow-y-auto border rounded-2xl min-h-0 ${
                    currentTheme.isDark ? "bg-[#171717]/50 border-white/5" : "bg-slate-50/50 border-zinc-200"
                  }`}>
                    {driveLoading && driveFiles.length === 0 ? (
                      <div className="h-full flex items-center justify-center p-6 text-zinc-500 text-sm gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Fetching Drive folder...
                      </div>
                    ) : driveFiles.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 text-sm">
                        <Folder className="w-10 h-10 text-zinc-600 mb-2" />
                        No files or folders found.
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {driveFiles.map((driveFile) => (
                          <button 
                            key={driveFile.id}
                            onClick={() => handleImportDriveFile(driveFile)}
                            className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-all ${
                              currentTheme.isDark ? "hover:bg-white/5 text-white" : "hover:bg-slate-100 text-zinc-800"
                            }`}
                          >
                            <div className="shrink-0 p-2 rounded-xl bg-white/5">
                              {getFileIcon(driveFile.mimeType, driveFile.name)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-sm truncate">{driveFile.name}</h5>
                              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                {(driveFile.mimeType || "").split(".").pop()} {driveFile.size ? `• ${bytesToSize(driveFile.size)}` : ""}
                              </p>
                            </div>

                            <div className="shrink-0 text-zinc-500 text-xs">
                              Import
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM GOOGLE SIGN IN BUTTON GLOBAL STYLES */}
      <style>{`
        .gsi-material-button {
          -moz-user-select: none;
          -webkit-user-select: none;
          -ms-user-select: none;
          -webkit-appearance: none;
          background-color: #131314;
          background-image: none;
          border: 1px solid #747775;
          -webkit-border-radius: 20px;
          border-radius: 20px;
          -webkit-box-sizing: border-box;
          box-sizing: border-box;
          color: #e3e3e3;
          cursor: pointer;
          font-family: 'Roboto', arial, sans-serif;
          font-size: 14px;
          height: 40px;
          letter-spacing: 0.25px;
          outline: none;
          overflow: hidden;
          padding: 0 12px;
          position: relative;
          text-align: center;
          -webkit-transition: background-color .218s, border-color .218s, box-shadow .218s;
          transition: background-color .218s, border-color .218s, box-shadow .218s;
          vertical-align: middle;
          white-space: nowrap;
          width: auto;
          max-width: 400px;
          min-width: min-content;
        }

        .gsi-material-button .gsi-material-button-icon {
          height: 20px;
          margin-right: 12px;
          min-width: 20px;
          width: 20px;
        }

        .gsi-material-button .gsi-material-button-content-wrapper {
          align-items: center;
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          height: 100%;
          justify-content: space-between;
          position: relative;
          width: 100%;
        }

        .gsi-material-button .gsi-material-button-contents {
          flex-grow: 1;
          font-family: 'Google Sans', arial, sans-serif;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          vertical-align: middle;
        }

        .gsi-material-button .gsi-material-button-state {
          -webkit-transition: opacity .15s linear;
          transition: opacity .15s linear;
          background-color: #303030;
          opacity: 0;
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
        }

        .gsi-material-button:hover .gsi-material-button-state {
          opacity: 0.08;
        }
      `}</style>
    </div>
  );
};
