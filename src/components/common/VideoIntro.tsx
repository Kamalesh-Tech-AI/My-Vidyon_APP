import { useState, useEffect, useRef } from 'react';

interface VideoIntroProps {
    onComplete: () => void;
    showOnce?: boolean; // If true, video will only play once per session
}

const VideoIntro = ({ onComplete, showOnce = false }: VideoIntroProps) => {
    const [isVideoEnded, setIsVideoEnded] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Check if video should be skipped (if it was already shown this session and showOnce is true)
        if (showOnce && sessionStorage.getItem('videoPlayed') === 'true') {
            onComplete();
            return;
        }

        // Auto-play the video when component mounts
        if (videoRef.current) {
            videoRef.current.play().catch(error => {
                console.error('Video autoplay failed:', error);
                // If autoplay fails, skip the video after a short delay
                setTimeout(() => {
                    handleVideoEnd();
                }, 500);
            });
        }
    }, [onComplete, showOnce]);

    const handleVideoEnd = () => {
        setFadeOut(true);

        // Mark video as played in session storage
        if (showOnce) {
            sessionStorage.setItem('videoPlayed', 'true');
        }

        // Wait for fade-out animation to complete before calling onComplete
        setTimeout(() => {
            setIsVideoEnded(true);
            onComplete();
        }, 800); // Match the CSS transition duration
    };

    const handleSkip = () => {
        if (videoRef.current) {
            videoRef.current.pause();
        }
        handleVideoEnd();
    };

    const handleVideoLoaded = () => {
        setIsVideoLoaded(true);
    };

    if (isVideoEnded) {
        return null;
    }

    return (
        <div
            className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-800 ${fadeOut ? 'opacity-0' : 'opacity-100'
                }`}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                className={`w-full h-full object-contain transition-opacity duration-500 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                onEnded={handleVideoEnd}
                onLoadedData={handleVideoLoaded}
                playsInline
                muted
                preload="auto"
            >
                <source src="/Final_1.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Skip Button - appears after video starts loading */}
            {isVideoLoaded && (
                <button
                    onClick={handleSkip}
                    className="absolute bottom-8 right-8 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20 shadow-lg animate-fade-in"
                >
                    <span className="flex items-center gap-2 font-medium">
                        Skip
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polygon points="5 4 15 12 5 20 5 4" />
                            <line x1="19" y1="5" x2="19" y2="19" />
                        </svg>
                    </span>
                </button>
            )}

            {/* Loading indicator while video loads */}
            {!isVideoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                        <span className="text-white/80 text-sm font-medium">Loading video...</span>
                    </div>
                </div>
            )}

            <style>{`
        .duration-800 {
          transition-duration: 800ms;
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
        </div>
    );
};

export default VideoIntro;
