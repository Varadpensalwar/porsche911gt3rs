// src/components/EasterEggButton.js
import React from 'react';
// Remove the unused gsap import
// import { gsap } from 'gsap';

const EasterEggButton = ({ activateEasterEgg }) => {
    return (
        <div className="easter-egg-button" onClick={activateEasterEgg}>
            <span>🏎️</span>
        </div>
    );
};

export default EasterEggButton;