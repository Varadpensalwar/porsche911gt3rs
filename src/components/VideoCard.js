// src/components/VideoCard.js
import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

const VideoCard = ({ 
    videoData, 
    index, 
    currentVideoIndex, 
    setCurrentVideoIndex, 
    isMobile,
    autoplayEnabled
}) => {
    const cardRef = useRef(null);
    const videoRef = useRef(null);
    const progressRef = useRef(null);
    const [loaded, setLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showControls, setShowControls] = useState(false);
    
    // Check if this is the active card
    const isActive = currentVideoIndex === index;
    
    useEffect(() => {
        const video = videoRef.current;
        const card = cardRef.current;
        const progressBar = progressRef.current;
        
        // Function to update progress bar
        const updateProgress = () => {
            if (video && progressBar) {
                const progress = (video.currentTime / video.duration) * 100;
                progressBar.style.width = `${progress}%`;
            }
        };
        
        // Function to handle video end
        const handleVideoEnd = () => {
            if (card) {
                card.classList.remove('active');
                setIsPlaying(false);
                
                if (progressBar) {
                    progressBar.style.width = '0%';
                }
                
                if (isMobile) {
                    card.style.opacity = '0';
                    card.style.visibility = 'hidden';
                }
                
                // Only advance if autoplay is enabled
                if (autoplayEnabled) {
                    setTimeout(() => {
                        const nextIndex = (index + 1) % videoData.length;
                        setCurrentVideoIndex(nextIndex);
                    }, 500);
                }
            }
        };
        
        // Set up event listeners
        if (video) {
            video.addEventListener('timeupdate', updateProgress);
            video.addEventListener('ended', handleVideoEnd);
            video.addEventListener('play', () => {
                setIsPlaying(true);
                // Immediately hide controls when playback starts
                setShowControls(false);
            });
            video.addEventListener('pause', () => {
                setIsPlaying(false);
                setShowControls(true);
            });
            
            // Preload the video if it's the current one or the next one
            if (index === currentVideoIndex || index === (currentVideoIndex + 1) % videoData.length) {
                if (!loaded) {
                    video.src = videoData[index].src;
                    video.load();
                    setLoaded(true);
                }
            }
        }
        
        return () => {
            if (video) {
                video.removeEventListener('timeupdate', updateProgress);
                video.removeEventListener('ended', handleVideoEnd);
                video.removeEventListener('play', () => setIsPlaying(true));
                video.removeEventListener('pause', () => setIsPlaying(false));
            }
        };
    }, [index, currentVideoIndex, videoData, isMobile, loaded, autoplayEnabled, setCurrentVideoIndex]);
    
    // Handle when this card becomes active
    useEffect(() => {
        const video = videoRef.current;
        const card = cardRef.current;
        
        if (isActive && card && video) {
            // Make the card active
            card.classList.add('active');
            
            if (isMobile) {
                card.style.opacity = '1';
                card.style.visibility = 'visible';
                
                gsap.fromTo(card, 
                    { opacity: 0 },
                    { opacity: 1, duration: 0.5 }
                );
            }
            
            // Ensure video has loaded
            if (!loaded) {
                video.src = videoData[index].src;
                video.load();
                setLoaded(true);
            }
            
            // Play the video if autoplay is enabled
            if (autoplayEnabled) {
                video.currentTime = 0;
                const playPromise = video.play();
                
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error('Video playback error:', error);
                    });
                }
                // Hide controls when autoplaying
                setShowControls(false);
            } else {
                // Show controls if not autoplaying
                setShowControls(true);
            }
        } else if (!isActive && card) {
            // Remove active state
            card.classList.remove('active');
            setIsPlaying(false);
            
            if (isMobile) {
                card.style.opacity = '0';
                card.style.visibility = 'hidden';
            }
            
            // Pause the video if it's playing
            if (video && !video.paused) {
                video.pause();
            }
        }
    }, [isActive, index, videoData, isMobile, loaded, autoplayEnabled]);
    
    // Handle mouse enter/leave for controls
    const handleMouseEnter = () => {
        if (isActive) {
            setShowControls(true);
        }
    };
    
    const handleMouseLeave = () => {
        if (isActive && isPlaying) {
            setShowControls(false);
        }
    };
    
    // Handle click on video card
    const handleCardClick = (e) => {
        // Prevent default behavior
        e.preventDefault();
        
        const video = videoRef.current;
        
        if (isActive && video) {
            // Toggle play/pause for the active video
            if (video.paused) {
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        // Immediately hide controls when play is successful
                        setShowControls(false);
                        setIsPlaying(true);
                    }).catch(error => {
                        console.error('Video playback error:', error);
                    });
                }
            } else {
                video.pause();
                setShowControls(true);
                setIsPlaying(false);
            }
        } else if (!isMobile) {
            // Switch to this card if not on mobile
            setCurrentVideoIndex(index);
        }
    };
    
    return (
        <div 
            className={`video-card ${isActive ? 'active' : ''}`}
            ref={cardRef}
            onClick={handleCardClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                opacity: isMobile ? (isActive ? 1 : 0) : 1,
                visibility: isMobile ? (isActive ? 'visible' : 'hidden') : 'visible'
            }}
            data-index={index}
        >
            <div className="video-wrapper">
                <video 
                    ref={videoRef}
                    playsInline
                    preload="none"
                />
                <div className="card-overlay"></div>
                <div className="progress-bar" ref={progressRef}></div>
                <div className="model-info">{videoData[index].model}</div>
                
                {/* Play/Pause Button Overlay */}
                <div className={`play-pause-overlay ${showControls ? 'show-controls' : ''}`}>
                    <div className="play-pause-button">
                        {isPlaying ? (
                            <svg viewBox="0 0 24 24" width="100%" height="100%">
                                <rect x="6" y="4" width="4" height="16" fill="white" />
                                <rect x="14" y="4" width="4" height="16" fill="white" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="100%" height="100%">
                                <path d="M8 5v14l11-7z" fill="white" />
                            </svg>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoCard;