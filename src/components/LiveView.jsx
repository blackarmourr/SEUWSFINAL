import React, { useState, useEffect } from 'react';
import { realtimeDb } from '../firebase'; // Corrected import
import { ref, onValue, set } from 'firebase/database';
import './LiveView.css';

const LiveView = () => {
    const [readings, setReadings] = useState({
        voltage: 0,
        current: 0,
        power: 0,
        energy: 0,
    });
    const [error, setError] = useState(null);
    const [warning, setWarning] = useState(null);
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        const readingsRef = ref(realtimeDb, '/SEUWS/SmartMeter'); // Firebase path

        // Subscribe to Firebase real-time updates
        const unsubscribe = onValue(readingsRef, (snapshot) => {
            if (snapshot.exists()) {
                setReadings(snapshot.val());
                setError(null);
            } else {
                setError("No data available from Firebase.");
            }
        }, (error) => {
            setError("Error fetching data from Firebase.");
        });

        return () => unsubscribe(); // Cleanup on unmount
    }, []);

    useEffect(() => {
        const totalDailyConsumption = localStorage.getItem("totalDailyConsumption") || 0;
        if (readings.energy > totalDailyConsumption) {
            setWarning("Warning: Smart meter reading exceeds the total daily energy usage!");
        } else {
            setWarning(null);
        }
    }, [readings]);

    // Function to reset energy reading in Firebase
    const handleResetEnergy = async () => {
        setResetting(true);
        try {
            console.log("Sending reset command to ESP32...");
            
            // Set EnergyReset flag in Firebase
            await set(ref(realtimeDb, "/SEUWS/SmartMeter/EnergyReset"), 1);
    
            console.log("Reset command sent successfully!");
    
            setReadings(prev => ({ ...prev, energy: 0.0 })); // Update UI
            setWarning(null);
        } catch (err) {
            console.error("Error resetting energy:", err);
            setError("Failed to reset energy reading.");
        }
        setResetting(false);
    };


    return (
        <div className="live-view-container">
            <h2>Live Energy Readings</h2>
            {error ? (
                <p className="error-message">{error}</p>
            ) : (
                <div className="readings-card">
                    <p><strong>Voltage:</strong> {Math.round(readings.Voltage)} V</p>
                    <p><strong>Current:</strong> {readings.Current} A</p>
                    <p><strong>Power:</strong> {readings.Power} W</p>
                    <p><strong>Energy:</strong> {readings.EnergyUsage} kWh</p>
                </div>
            )}

            {warning && <div className="warning-message"><strong>{warning}</strong></div>}

            {/* Reset Energy Button */}
            <button onClick={handleResetEnergy} disabled={resetting} className="reset-button">
                {resetting ? "Resetting..." : "Reset Energy"}
            </button>
        </div>
    );
};

export default LiveView;