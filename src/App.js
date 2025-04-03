// src/App.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// Remove or comment out the unused gsap import
// import { gsap } from 'gsap';
import './App.css';
import videoData from './videoData';
import BackgroundAnimation from './components/BackgroundAnimation';
import VideoCard from './components/VideoCard';
import EasterEggButton from './components/EasterEggButton';

function App() {
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [autoplayEnabled, setAutoplayEnabled] = useState(true);
    const [easterEggActive, setEasterEggActive] = useState(false);
    const [vibrationIntensity, setVibrationIntensity] = useState('medium');
    const [isVibrating, setIsVibrating] = useState(false);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const animationFrameRef = useRef(null);
    const currentVideoRef = useRef(null);
    
    // Track Konami Code for Easter Egg
    // Using useMemo to prevent recreation on each render
    const konamiCodeSequence = useMemo(() => 
        ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'], 
        []
    );
    const [konamiCodePosition, setKonamiCodePosition] = useState(0);
    
    // Initialize audio analyzer - with the startAudioMonitoring function moved inside
    const setupAudioAnalyzer = useCallback(() => {
        if (!isMobile || !('vibrate' in navigator)) return;
        
        try {
            // Create audio context if it doesn't exist
            if (!audioContextRef.current) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioContextRef.current = new AudioContext();
            }
            
            // Create analyzer node if it doesn't exist
            if (!analyserRef.current) {
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 32; // Small size for efficiency
                analyserRef.current.smoothingTimeConstant = 0.5; // Smooth transitions
            }
            
            // Find the current video element
            const videoElement = document.querySelector('.video-current video');
            if (!videoElement) return;
            
            // Save reference to current video
            currentVideoRef.current = videoElement;
            
            // Clean up previous source if it exists
            if (sourceNodeRef.current) {
                sourceNodeRef.current.disconnect();
            }
            
            // Create a new source node from the video element
            sourceNodeRef.current = audioContextRef.current.createMediaElementSource(videoElement);
            
            // Connect the source to the analyzer and then to the destination
            sourceNodeRef.current.connect(analyserRef.current);
            analyserRef.current.connect(audioContextRef.current.destination);
            
            // Define startAudioMonitoring here (locally within setupAudioAnalyzer)
            const startAudioMonitoring = () => {
                if (!analyserRef.current || !isMobile || !('vibrate' in navigator)) return;
                
                const bufferLength = analyserRef.current.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                
                const analyzeAudio = () => {
                    // Cancel any previous animation frame
                    if (animationFrameRef.current) {
                        cancelAnimationFrame(animationFrameRef.current);
                    }
                    
                    // Get frequency data
                    analyserRef.current.getByteFrequencyData(dataArray);
                    
                    // Calculate average volume level (0-255)
                    let sum = 0;
                    for (let i = 0; i < bufferLength; i++) {
                        sum += dataArray[i];
                    }
                    const averageVolume = sum / bufferLength;
                    
                    // Set vibration intensity based on volume
                    let newIntensity;
                    if (averageVolume < 50) {
                        newIntensity = 'low';
                    } else if (averageVolume < 120) {
                        newIntensity = 'medium';
                    } else {
                        newIntensity = 'high';
                    }
                    
                    // Only update and vibrate if intensity changed or not currently vibrating
                    if (newIntensity !== vibrationIntensity || !isVibrating) {
                        setVibrationIntensity(newIntensity);
                        
                        // Create vibration pattern based on audio intensity
                        if (averageVolume > 20) { // Threshold to avoid constant vibration on silence
                            setIsVibrating(true);
                            
                            // Create a pattern that mimics the audio intensity
                            const duration = Math.min(Math.floor(averageVolume), 200); // Cap at 200ms
                            
                            // For beat-like feeling, create short bursts for high intensity
                            let pattern;
                            if (newIntensity === 'high') {
                                pattern = [duration, duration / 2];
                            } else if (newIntensity === 'medium') {
                                pattern = [duration, duration];
                            } else {
                                pattern = [duration / 2];
                            }
                            
                            // Add subtle variations to prevent monotony
                            if (Math.random() < 0.2) {
                                pattern = pattern.map(p => p + Math.floor(Math.random() * 20 - 10));
                            }
                            
                            navigator.vibrate(pattern);
                            
                            // Reset vibration state after the pattern completes
                            const totalDuration = pattern.reduce((sum, val) => sum + val, 0);
                            setTimeout(() => {
                                setIsVibrating(false);
                            }, totalDuration + 10);
                        }
                    }
                    
                    // Continue monitoring
                    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
                };
                
                // Start the analysis loop
                analyzeAudio();
            };
            
            // Start monitoring audio levels
            startAudioMonitoring();
        } catch (error) {
            console.error("Error setting up audio analyzer:", error);
        }
    }, [isMobile, vibrationIntensity, isVibrating]);
    
    // Check if mobile
    useEffect(() => {
        const checkMobile = () => {
            const isMobileDevice = window.innerWidth <= 768;
            setIsMobile(isMobileDevice);
        };
        
        // Initial check
        checkMobile();
        
        // Add listener for window resize
        window.addEventListener('resize', checkMobile);
        
        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);
    
    // Setup audio analyzer when videos change
    useEffect(() => {
        if (isMobile) {
            // Add a slight delay to ensure the video element is ready
            const timeoutId = setTimeout(() => {
                setupAudioAnalyzer();
            }, 500);
            
            return () => clearTimeout(timeoutId);
        }
    }, [currentVideoIndex, isMobile, setupAudioAnalyzer]);
    
    // Clean up audio context on component unmount
    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                if (sourceNodeRef.current) {
                    sourceNodeRef.current.disconnect();
                }
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                audioContextRef.current.close().catch(err => console.error(err));
            }
        };
    }, []);
    
    // Handle Previous Video
    const handlePrevVideo = useCallback(() => {
        const prevIndex = (currentVideoIndex - 1 + videoData.length) % videoData.length;
        setCurrentVideoIndex(prevIndex);
        
        // Add a special vibration feedback on video change
        if (isMobile && 'vibrate' in navigator) {
            navigator.vibrate([80, 40, 120]);
        }
    }, [currentVideoIndex, isMobile]);
    
    // Handle Next Video
    const handleNextVideo = useCallback(() => {
        const nextIndex = (currentVideoIndex + 1) % videoData.length;
        setCurrentVideoIndex(nextIndex);
        
        // Add a special vibration feedback on video change
        if (isMobile && 'vibrate' in navigator) {
            navigator.vibrate([120, 40, 80]);
        }
    }, [currentVideoIndex, isMobile]);
    
    // Touch swipe handlers
    useEffect(() => {
        let touchStartY = 0;
        let touchEndY = 0;
        
        const handleTouchStart = (e) => {
            touchStartY = e.changedTouches[0].screenY;
        };
        
        const handleTouchEnd = (e) => {
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        };
        
        const handleSwipe = () => {
            const swipeThreshold = 50;
            if (touchStartY - touchEndY > swipeThreshold) {
                // Swipe up - next video
                handleNextVideo();
            } else if (touchEndY - touchStartY > swipeThreshold) {
                // Swipe down - previous video
                handlePrevVideo();
            }
        };
        
        // Add event listeners for mobile
        if (isMobile) {
            document.addEventListener('touchstart', handleTouchStart, false);
            document.addEventListener('touchend', handleTouchEnd, false);
        }
        
        return () => {
            document.removeEventListener('touchstart', handleTouchStart, false);
            document.removeEventListener('touchend', handleTouchEnd, false);
        };
    }, [isMobile, handleNextVideo, handlePrevVideo]);
    
    // Disable pull-to-refresh on mobile within the app container
    useEffect(() => {
        if (!isMobile) return;
        
        const appElement = document.querySelector('.App');
        if (!appElement) return;
        
        let touchStartY = 0;
        
        const handleTouchStart = (e) => {
            touchStartY = e.touches[0].screenY;
        };
        
        const handleTouchMove = (e) => {
            // Only prevent default if pulling down when already at the top of the app container
            if (appElement.scrollTop === 0 && e.touches[0].screenY > touchStartY) {
                e.preventDefault();
            }
        };
        
        // Add event listeners specifically to the app container
        appElement.addEventListener('touchstart', handleTouchStart, { passive: false });
        appElement.addEventListener('touchmove', handleTouchMove, { passive: false });
        
        return () => {
            if (appElement) {
                appElement.removeEventListener('touchstart', handleTouchStart);
                appElement.removeEventListener('touchmove', handleTouchMove);
            }
        };
    }, [isMobile]);
    
    // Easter Egg Function
    const activateEasterEgg = useCallback(() => {
        const newState = !easterEggActive;
        setEasterEggActive(newState);
        
        // Add a special vibration effect when easter egg is activated
        if (isMobile && 'vibrate' in navigator) {
            if (newState) {
                // Create an escalating vibration to signal easter egg activation
                navigator.vibrate([50, 30, 70, 30, 100, 30, 150, 30, 200]);
            } else {
                // Return to normal with a gentle fade-out vibration
                navigator.vibrate([200, 50, 150, 50, 100, 50, 70, 50, 50]);
            }
        }
        
        if (newState) {
            // Show message
            const easterEggMessage = document.createElement('div');
            easterEggMessage.style.position = 'fixed';
            easterEggMessage.style.top = '10%';
            easterEggMessage.style.left = '50%';
            easterEggMessage.style.transform = 'translateX(-50%)';
            easterEggMessage.style.color = 'white';
            easterEggMessage.style.background = 'rgba(0,0,0,0.7)';
            easterEggMessage.style.padding = '20px';
            easterEggMessage.style.borderRadius = '10px';
            easterEggMessage.style.zIndex = '1000';
            easterEggMessage.style.fontSize = '20px';
            easterEggMessage.style.fontWeight = 'bold';
            easterEggMessage.style.textAlign = 'center';
            easterEggMessage.style.boxShadow = '0 0 20px var(--neon-pink)';
            easterEggMessage.innerHTML = '🏎️ Turbo Mode Activated! 🏎️<br>Life is too short to drive slowly.';
            
            document.body.appendChild(easterEggMessage);
            
            setTimeout(() => {
                document.body.removeChild(easterEggMessage);
            }, 3000);
        }
    }, [easterEggActive, isMobile]);
    
    // Konami Code Handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Check if key matches expected key in sequence
            if (e.code === konamiCodeSequence[konamiCodePosition]) {
                const newPosition = konamiCodePosition + 1;
                setKonamiCodePosition(newPosition);
                
                // If entire sequence is entered correctly
                if (newPosition === konamiCodeSequence.length) {
                    activateEasterEgg();
                    setKonamiCodePosition(0); // Reset
                }
            } else {
                setKonamiCodePosition(0); // Reset if wrong key
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [konamiCodePosition, konamiCodeSequence, activateEasterEgg]);
    
    // Handle first user interaction to enable audio context
    useEffect(() => {
        const handleUserInteraction = () => {
            setAutoplayEnabled(true);
            
            // Initialize audio context on first interaction (required by browsers)
            if (isMobile && !audioContextRef.current) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioContextRef.current = new AudioContext();
                
                // Resume audio context if it's suspended
                if (audioContextRef.current.state === 'suspended') {
                    audioContextRef.current.resume().then(() => {
                        console.log('AudioContext resumed');
                        setupAudioAnalyzer();
                    }).catch(err => console.error('Failed to resume AudioContext', err));
                } else {
                    setupAudioAnalyzer();
                }
            }
            
            // Vibrate once when user first interacts
            if (isMobile && 'vibrate' in navigator) {
                navigator.vibrate([100, 50, 150]);
            }
            
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
        };
        
        // Add listeners for first interaction
        document.addEventListener('click', handleUserInteraction);
        document.addEventListener('touchstart', handleUserInteraction);
        
        return () => {
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
        };
    }, [isMobile, setupAudioAnalyzer]);
    
    return (
        <div className={`App ${easterEggActive ? 'easter-egg-active' : ''}`}>
            <BackgroundAnimation />
            
            <div className="video-wall">
                {videoData.map((data, index) => (
                    <VideoCard
                        key={index}
                        videoData={videoData}
                        index={index}
                        currentVideoIndex={currentVideoIndex}
                        setCurrentVideoIndex={setCurrentVideoIndex}
                        isMobile={isMobile}
                        autoplayEnabled={autoplayEnabled}
                    />
                ))}
            </div>
            
            <EasterEggButton activateEasterEgg={activateEasterEgg} />
        </div>
    );
}

export default App;