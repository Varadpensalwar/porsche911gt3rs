// src/components/BackgroundAnimation.js
import React, { useEffect, useRef } from 'react';

const BackgroundAnimation = () => {
    const bgRef = useRef(null);

    useEffect(() => {
        const bgAnimation = bgRef.current;
        
        // Clear any existing spans
        while (bgAnimation.firstChild) {
            bgAnimation.removeChild(bgAnimation.firstChild);
        }
        
        // Create animation elements
        for (let i = 0; i < 20; i++) {
            const span = document.createElement('span');
            const size = Math.random() * 30 + 10;
            
            span.style.width = `${size}px`;
            span.style.height = `${size}px`;
            span.style.top = `${Math.random() * 100}%`;
            span.style.left = `${Math.random() * 100}%`;
            span.style.animationDuration = `${Math.random() * 10 + 10}s`;
            span.style.animationDelay = `${Math.random() * 5}s`;
            
            bgAnimation.appendChild(span);
        }
        
        // Show animation on desktop only
        const isMobile = window.innerWidth <= 768;
        bgAnimation.style.display = isMobile ? 'none' : 'block';
        
        // Update on resize
        const handleResize = () => {
            const isMobile = window.innerWidth <= 768;
            bgAnimation.style.display = isMobile ? 'none' : 'block';
        };
        
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return <div className="bg-animation" id="bgAnimation" ref={bgRef}></div>;
};

export default BackgroundAnimation;