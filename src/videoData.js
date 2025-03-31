// src/videoData.js

// Fisher-Yates (Knuth) Shuffle algorithm
const shuffleArray = (array) => {
    const shuffled = [...array]; // Create a copy to avoid mutating the original
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
    }
    return shuffled;
};

// Original video data
const originalVideoData = [
    { src: 'videos/Porsche_911_GT3_RS_1.mp4', model: 'Porsche 911 GT3 RS' },
    { src: 'videos/Porsche_911_GT3_RS_2.mp4', model: 'Porsche 911 GT3 RS' },
    { src: 'videos/Porsche_911_GT3_RS_3.mp4', model: 'Porsche 911 GT3 RS' },
    { src: 'videos/Porsche_911_GT3_RS_4.mp4', model: 'Porsche 911 GT3 RS' },
    { src: 'videos/Porsche_911_GT3_RS_5.mp4', model: 'Porsche 911 GT3 RS' },
    { src: 'videos/Porsche_911_GT3_RS_6.mp4', model: 'Porsche 911 GT3 RS' },
    { src: 'videos/Porsche_911_GT3_RS_7.mp4', model: 'Porsche 911 GT3 RS' },
    { src: 'videos/Porsche_911_GT3_RS_10.mp4', model: 'Porsche 911 GT3 RS' },
    { src: 'videos/Porsche_911_GT3_RS_11.mp4', model: 'Porsche 911 GT3 RS' },
    { src: 'videos/Porsche_911_GT3_RS_12.mp4', model: 'Porsche 911 GT3 RS' },
    { src: 'videos/Porsche_911_GT3_RS_13.mp4', model: 'Porsche 911 GT3 RS' },
    { src: 'videos/Porsche_911_GT3_RS_14.mp4', model: 'Porsche 911 GT3 RS' },
    { src: 'videos/Porsche_911_GT3_RS_15.mp4', model: 'Porsche 911 GT3 RS' },
    { src: 'videos/Porsche_911_GT3_RS_17.mp4', model: 'Porsche 911 GT3 RS' },
    { src: 'videos/Porsche_911_GT3_RS_18.mp4', model: 'Porsche 911 GT3 RS' }
];

// Export shuffled videos
const videoData = shuffleArray(originalVideoData);

export default videoData;