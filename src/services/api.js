export const fetchReadings = async () => {
    const response = await fetch('http://192.168.120.151/readings'); // Replace with ESP32 IP
    if (!response.ok) throw new Error("Failed to fetch readings");
    return await response.json();
};

// Function to reset energy readings
export const resetEnergy = async () => {
    const response = await fetch('http://192.168.120.151/reset-energy', { method: 'POST' });
    if (!response.ok) throw new Error("Failed to reset energy reading");
    return await response.json();
};
