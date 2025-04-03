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
    
    // Track Konami Code for Easter Egg
    // Using useMemo to prevent recreation on each render
    const konamiCodeSequence = useMemo(() => 
        ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'], 
        []
    );
    const [konamiCodePosition, setKonamiCodePosition] = useState(0);
    
    // Check if mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        // Initial check
        checkMobile();
        
        // Add listener for window resize
        window.addEventListener('resize', checkMobile);
        
        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);
    
    // Handle Previous Video
    const handlePrevVideo = useCallback(() => {
        const prevIndex = (currentVideoIndex - 1 + videoData.length) % videoData.length;
        setCurrentVideoIndex(prevIndex);
    }, [currentVideoIndex]);
    
    // Handle Next Video
    const handleNextVideo = useCallback(() => {
        const nextIndex = (currentVideoIndex + 1) % videoData.length;
        setCurrentVideoIndex(nextIndex);
    }, [currentVideoIndex]);
    
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
    }, [easterEggActive]);
    
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
        };
        
        // Add listener for first interaction
        document.addEventListener('click', handleUserInteraction);
        
        return () => {
            document.removeEventListener('click', handleUserInteraction);
        };
    }, []);
    
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