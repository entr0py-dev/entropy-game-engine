'use client';
import { useState, useEffect } from 'react';

export default function ModifierTimer({ expiry }: { expiry: string }) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date().getTime();
            const end = new Date(expiry).getTime();
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft(""); // Expired
                return;
            }

            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        };

        // Update every second
        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [expiry]);

    if (!timeLeft) return null;

    return (
        <div style={{ 
            marginTop: '10px', padding: '8px', 
            backgroundColor: '#1e1e1e', border: '1px solid #00FF99', 
            color: '#00FF99', fontFamily: 'monospace', fontSize: '10px',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 0 5px rgba(0, 255, 153, 0.3)'
        }}>
            {/* Glitch Icon */}
            <div style={{ fontSize: '14px' }}>👾</div>
            
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '8px', color: '#888' }}>
                    DUPLICATION GLITCH
                </div>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    {timeLeft}
                </div>
            </div>
            
            <div style={{ color: '#fbbf24', fontWeight: 'bold' }}>2x</div>
        </div>
    );
}
