// services/arduinoService.ts

// Type definition for Web Serial API
interface SerialPort {
    open(options: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
    writable: WritableStream;
}

interface NavigatorWithSerial extends Navigator {
    serial: {
        requestPort(options?: { filters: any[] }): Promise<SerialPort>;
    };
}

let port: SerialPort | null = null;
let writer: WritableStreamDefaultWriter | null = null;
let isSimulationMode = false;

// Mapping based on provided Arduino Sketch
// int pumpPins[7] = { 3, 5, 6, 9, 10, 11, 12 };
const PIN_MAPPING = [3, 5, 6, 9, 10, 11, 12];

export const connectToArduino = async (): Promise<boolean> => {
    // Reset state
    isSimulationMode = false;
    port = null;
    writer = null;

    try {
        const nav = navigator as unknown as NavigatorWithSerial;
        if (!nav.serial) {
            console.warn("Web Serial API not supported in this browser. Switching to SIMULATION MODE.");
            isSimulationMode = true;
            return true;
        }

        // Request a port.
        // This prompts the user to select a device.
        console.log("Requesting Serial Port...");
        try {
             port = await nav.serial.requestPort();
        } catch (reqError: any) {
             // User cancelled the selection dialog
             if (reqError.name === 'NotFoundError') {
                 return false;
             }
             throw reqError;
        }

        // Try to open the connection
        try {
            // 9600 must match Arduino Serial.begin(9600)
            await port.open({ baudRate: 9600 });
        } catch (openError: any) {
            console.warn("⚠️ Port selected but failed to open (likely busy or permission denied). Switching to SIMULATION MODE.");
            console.error("Original Open Error:", openError);
            
            // Clean up the port object if open failed
            port = null; 
            isSimulationMode = true;
            return true; // Return success so UI shows connected (simulated)
        }
        
        // Setup the writer
        if (port.writable) {
            writer = port.writable.getWriter();
            return true;
        }
        return false;

    } catch (error: any) {
        console.error("Arduino Connection Error:", error);

        // Global fallback for any other unexpected errors (SecurityError, Permissions Policy, etc.)
        if (error.name !== 'NotFoundError') {
            console.warn("⚠️ Web Serial blocked by environment. Falling back to SIMULATION MODE.");
            isSimulationMode = true;
            return true;
        }

        return false;
    }
};

export const disconnectArduino = async () => {
    try {
        if (writer) {
            writer.releaseLock();
            writer = null;
        }
        if (port) {
            await port.close();
            port = null;
        }
        isSimulationMode = false;
    } catch (error) {
        console.error("Error closing port:", error);
    }
};

export const sendPourCommand = async (amounts: number[]): Promise<boolean> => {
    // Format: "ml1,ml2,ml3,ml4,ml5,ml6,ml7\n"
    const dataString = amounts.join(',') + '\n';

    // 1. Handle Simulation Mode
    if (isSimulationMode) {
        console.log("%c[ARDUINO SIMULATION]", "color: #C5A059; font-weight: bold; font-size: 12px; border: 1px solid #C5A059; padding: 4px;");
        console.log(`Payload: ${dataString.trim()}`);
        console.log("------------------------------------------------");
        
        const labels = ["Sour", "Sweet", "Bitter", "Fruit", "Vodka", "Whisky", "Soda"];
        
        amounts.forEach((ml, index) => {
            if (ml > 0) {
                const pin = PIN_MAPPING[index];
                console.log(`➤ Pump ${index + 1} (PIN ${pin}) | ${labels[index]}: ${ml}ml`);
            }
        });
        
        console.log("------------------------------------------------");
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
    }

    // 2. Handle Real Hardware
    if (!writer) {
        console.error("Arduino not connected");
        return false;
    }

    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(dataString);
        
        await writer.write(data);
        console.log("Sent to Real Arduino (Pins 3,5,6,9,10,11,12):", dataString);
        return true;
    } catch (error) {
        console.error("Error writing to serial:", error);
        return false;
    }
};

export const isArduinoConnected = (): boolean => {
    return (port !== null && writer !== null) || isSimulationMode;
};

export const isSimulating = (): boolean => {
    return isSimulationMode;
};