// src/App.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    const [vibrationIntensity, setVibrationIntensity] = useState('medium'); // 'low', 'medium', 'high'
    const [vibrationIntervalId, setVibrationIntervalId] = useState(null);
    
    // Track Konami Code for Easter Egg
    // Using useMemo to prevent recreation on each render
    const konamiCodeSequence = useMemo(() => 
        ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'], 
        []
    );
    const [konamiCodePosition, setKonamiCodePosition] = useState(0);
    
    // Create vibration patterns based on intensity
    const getVibrationPattern = useCallback(() => {
        // Generate a random variation within the current intensity
        const randomVariation = () => Math.floor(Math.random() * 30) - 15; // -15 to +15 variation
        
        switch(vibrationIntensity) {
            case 'low':
                return [
                    30 + randomVariation(), 
                    150 + randomVariation(), 
                    30 + randomVariation()
                ];
            case 'high':
                return [
                    70 + randomVariation(), 
                    50 + randomVariation(), 
                    70 + randomVariation(), 
                    50 + randomVariation(),
                    40 + randomVariation()
                ];
            case 'medium':
            default:
                return [
                    50 + randomVariation(), 
                    100 + randomVariation(), 
                    50 + randomVariation()
                ];
        }
    }, [vibrationIntensity]);
    
    // Create a dynamic interval time based on intensity
    const getVibrationInterval = useCallback(() => {
        const baseInterval = {
            'low': 3000,
            'medium': 2000,
            'high': 1500
        }[vibrationIntensity];
        
        // Add some randomness to the interval
        return baseInterval + Math.floor(Math.random() * 1000) - 500; // +/- 500ms variation
    }, [vibrationIntensity]);
    
    // Change vibration intensity randomly
    const changeVibrationIntensity = useCallback(() => {
        const intensities = ['low', 'medium', 'high'];
        
        // Get a new intensity that's different from the current one
        let newIntensity;
        do {
            newIntensity = intensities[Math.floor(Math.random() * intensities.length)];
        } while (newIntensity === vibrationIntensity);
        
        setVibrationIntensity(newIntensity);
    }, [vibrationIntensity]);
    
    // Setup vibration management for mobile
    const setupVibration = useCallback(() => {
        // Clear any existing intervals
        if (vibrationIntervalId) {
            clearInterval(vibrationIntervalId);
        }
        
        if (isMobile && 'vibrate' in navigator) {
            // Initially vibrate to give immediate feedback
            navigator.vibrate(getVibrationPattern());
            
            // Setup dynamic vibration that changes patterns over time
            const intervalId = setInterval(() => {
                navigator.vibrate(getVibrationPattern());
                
                // Occasionally change the vibration intensity (roughly 20% chance)
                if (Math.random() < 0.2) {
                    changeVibrationIntensity();
                }
            }, getVibrationInterval());
            
            setVibrationIntervalId(intervalId);
            
            return () => {
                clearInterval(intervalId);
                setVibrationIntervalId(null);
            };
        }
    }, [isMobile, getVibrationPattern, getVibrationInterval, changeVibrationIntensity, vibrationIntervalId]);
    
    // Check if mobile and setup initial vibration
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
    
    // Setup vibration when mobile status or intensity changes
    useEffect(() => {
        return setupVibration();
    }, [isMobile, vibrationIntensity, setupVibration]);
    
    // Handle Previous Video
    const handlePrevVideo = useCallback(() => {
        const prevIndex = (currentVideoIndex - 1 + videoData.length) % videoData.length;
        setCurrentVideoIndex(prevIndex);
        
        // Add a special vibration feedback on video change for mobile
        if (isMobile && 'vibrate' in navigator) {
            // Create a pattern that feels like a "swipe backward"
            navigator.vibrate([80, 40, 120]);
            
            // Higher chance of intensity change on interaction
            if (Math.random() < 0.3) {
                changeVibrationIntensity();
            }
        }
    }, [currentVideoIndex, isMobile, changeVibrationIntensity]);
    
    // Handle Next Video
    const handleNextVideo = useCallback(() => {
        const nextIndex = (currentVideoIndex + 1) % videoData.length;
        setCurrentVideoIndex(nextIndex);
        
        // Add a special vibration feedback on video change for mobile
        if (isMobile && 'vibrate' in navigator) {
            // Create a pattern that feels like a "swipe forward"
            navigator.vibrate([120, 40, 80]);
            
            // Higher chance of intensity change on interaction
            if (Math.random() < 0.3) {
                changeVibrationIntensity();
            }
        }
    }, [currentVideoIndex, isMobile, changeVibrationIntensity]);
    
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
        
        // Add a special vibration effect when easter egg is activated on mobile
        if (isMobile && 'vibrate' in navigator) {
            if (newState) {
                // Create an escalating vibration to signal easter egg activation
                navigator.vibrate([50, 30, 70, 30, 100, 30, 150, 30, 200]);
                
                // Force high intensity when easter egg is active
                setVibrationIntensity('high');
            } else {
                // Return to normal with a gentle fade-out vibration
                navigator.vibrate([200, 50, 150, 50, 100, 50, 70, 50, 50]);
                
                // Return to medium intensity when easter egg is deactivated
                setVibrationIntensity('medium');
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
    
    // Handle user interaction check for autoplay
    useEffect(() => {
        const handleUserInteraction = () => {
            setAutoplayEnabled(true);
            document.removeEventListener('click', handleUserInteraction);
            
            // Vibrate once when user first interacts, if on mobile
            if (isMobile && 'vibrate' in navigator) {
                // A welcoming vibration pattern
                navigator.vibrate([100, 50, 150]);
            }
        };
        
        // Add listener for first interaction
        document.addEventListener('click', handleUserInteraction);
        
        return () => {
            document.removeEventListener('click', handleUserInteraction);
        };
    }, [isMobile]);
    
    // Add video content-specific vibration patterns
    useEffect(() => {
        if (!isMobile || !('vibrate' in navigator)) return;
        
        // Get current video data to tailor vibration to content
        const currentVideo = videoData[currentVideoIndex];
        
        // You could analyze the currentVideo object and set different
        // vibration intensities based on the content type, energy level, etc.
        if (currentVideo) {
            // Example logic: tailor vibration based on video properties
            // This is just an example - adjust based on your videoData structure
            const videoEnergy = currentVideo.energy || 'medium'; // Assuming there's an 'energy' property
            
            // Set vibration intensity based on video content
            if (videoEnergy === 'high') {
                setVibrationIntensity('high');
            } else if (videoEnergy === 'low') {
                setVibrationIntensity('low');
            } else {
                setVibrationIntensity('medium');
            }
            
            // Provide immediate feedback when switching videos
            navigator.vibrate(getVibrationPattern());
        }
    }, [currentVideoIndex, isMobile, getVibrationPattern]);
    
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