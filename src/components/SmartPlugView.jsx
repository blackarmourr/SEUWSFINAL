import React, { useState, useEffect } from "react";
import { getDatabase, ref, onValue, set } from "firebase/database";
import "./SmartPlugView.css"; 
import { app } from "../firebase"; // Import Firebase config

const SmartPlugView = () => {
    const [plugReadings, setPlugReadings] = useState(null);
    const [error, setError] = useState("");

    // States for user input (device details)
    const [deviceVoltage, setDeviceVoltage] = useState("");
    const [devicePower, setDevicePower] = useState("");

    // State for fault detection
    const [isFaulty, setIsFaulty] = useState(false);
    const [faultMessage, setFaultMessage] = useState("");

    // State for relay control (ON/OFF)
    const [isRelayOn, setIsRelayOn] = useState(false);

    // Initialize Firebase database
    const db = getDatabase(app);

    // Function to fetch data from Firebase
    useEffect(() => {
        const readingsRef = ref(db, "/SEUWS/PlugMeter/");
        
        const unsubscribe = onValue(readingsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setPlugReadings(data);
                setIsRelayOn(data.RelayStatus); // Set relay status
            }
        }, (error) => {
            setError(error.message);
        });

        return () => unsubscribe();
    }, []);

    // Function to toggle relay (Turn ON or OFF)
    const toggleRelay = async () => {
        try {
            const newState = !isRelayOn;
            await set(ref(db, "/SEUWS/PlugMeter/RelayStatus"), newState);
            setIsRelayOn(newState);
        } catch (err) {
            setError("Failed to update relay status");
        }
    };

    // ✅ Function to reset energy counter
    const resetEnergy = async () => {
        try {
            await set(ref(db, "/SEUWS/PlugMeter/EnergyUsage"), 0);
            
            // ✅ After resetting, listen for energy updates
            const energyRef = ref(db, "/SEUWS/PlugMeter/EnergyUsage");
            onValue(energyRef, (snapshot) => {
                setPlugReadings(prev => ({ ...prev, EnergyUsage: snapshot.val() }));
            });

            alert("Energy counter reset successfully!");
        } catch (err) {
            setError("Failed to reset energy");
        }
    };

    // Calculate current based on device voltage and power
    const calculateCurrent = () => {
        if (deviceVoltage && devicePower) {
            const current = devicePower / deviceVoltage;  
            return current.toFixed(2);
        }
        return 0;
    };

    // Handle form submission to check for device fault
    const handleSubmit = (e) => {
        e.preventDefault();
        if (plugReadings) {
            if (plugReadings.Power > devicePower) {
                setIsFaulty(true);
                setFaultMessage("The device seems to be faulty! Power reading exceeds the rated power.");
            } else {
                setIsFaulty(false);
                setFaultMessage("The device is functioning within expected power consumption.");
            }
        }
    };

    return (
        <div className="smart-plug-container">
            <h1>Smart Plug</h1>
            {error && <p className="error-message">Error: {error}</p>}

            {/* Device details form */}
            <form onSubmit={handleSubmit} className="device-details-form">
                <label>
                    Device Voltage (V):
                    <input 
                        type="number" 
                        value={deviceVoltage}
                        onChange={(e) => setDeviceVoltage(e.target.value)}
                        required 
                    />
                </label>
                <label>
                    Device Power (W):
                    <input 
                        type="number" 
                        value={devicePower}
                        onChange={(e) => setDevicePower(e.target.value)}
                        required 
                    />
                </label>
                <button type="submit">Check Device Fault</button>
            </form>

            {/* Display calculated current */}
            {deviceVoltage && devicePower && (
                <div className="calculated-current">
                    <p><strong>Calculated Current:</strong> {calculateCurrent()} A</p>
                </div>
            )}

            {/* Display plug meter readings */}
            {plugReadings ? (
                <div className="readings-card">
                    <p><strong>Voltage:</strong> {Math.round(plugReadings.Voltage)} V</p>
                    <p><strong>Current:</strong> {plugReadings.Current} A</p>
                    <p><strong>Power:</strong> {plugReadings.Power} W</p>
                    <p><strong>Energy:</strong> {plugReadings.EnergyUsage} kWh</p>
                </div>
            ) : (
                <p className="loading-message">Loading...</p>
            )}

            {/* Fault detection message */}
            {isFaulty && <p className="fault-message">{faultMessage}</p>}
            {!isFaulty && faultMessage && <p className="success-message">{faultMessage}</p>}

            {/* Relay control & Energy reset */}
            <div className="relay-controls">
                <button onClick={toggleRelay}>
                    {isRelayOn ? "Turn ON Plug" : "Turn OFF Plug"}
                </button>
                <button onClick={resetEnergy}>Reset Energy</button>
            </div>
        </div>
    );
};

export default SmartPlugView;