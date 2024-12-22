export const Bluetooth = {
    device: null,
    characteristic: null,
  

    // const serviceUUID = "0000abcd-0000-1000-8000-00805f9b34fb";
    // const characteristicUUID = "00001234-0000-1000-8000-00805f9b34fb";

    async connectToBluetooth() {
        try {
          console.log("Requesting Bluetooth device...");
          this.device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ["0000abcd-0000-1000-8000-00805f9b34fb"], // Replace with your ESP32's service UUID
          });
          console.log("Device selected:", this.device);
      
          const server = await this.device.gatt.connect();
          console.log("GATT server connected:", server);
      
          const service = await server.getPrimaryService("0000abcd-0000-1000-8000-00805f9b34fb");
          console.log("Service found:", service);
      
          this.characteristic = await service.getCharacteristic("00001234-0000-1000-8000-00805f9b34fb"); // Replace with your ESP32's characteristic UUID
          console.log("Characteristic found:", this.characteristic);
      
          alert("Connected to ESP32!");
        } catch (error) {
          alert("Failed to connect to ESP32: " + error.message);
          console.error("Bluetooth connection error:", error);
        }
      },
      
  
    async sendNextInstruction(instruction) {
      console.log("Received instruction:", instruction); // Log the incoming instruction
      if (this.characteristic) {
        const encoder = new TextEncoder();
        
        // Log the instruction before calling getCommand
        console.log("Instruction before processing:", instruction);
  
        const command = this.getCommand(instruction);
        
        // Log the command after it's processed
        console.log("Processed command:", command);
  
        // Check if command is empty or invalid
        if (!command) {
          console.error("Invalid command:", command);
          return;
        }
  
        try {
          await this.characteristic.writeValue(encoder.encode(command));
          console.log("Command sent:", command); // Log the sent command
        } catch (error) {
          console.error("Failed to send command:", error);
        }
      } else {
        console.error("Characteristic is not defined, cannot send command.");
      }
    },
  
    getCommand(instruction) {
      console.log("Evaluating instruction:", instruction); // Log instruction for debugging
  
      if (instruction.includes("left")) {
        return "LEFT";
      } else if (instruction.includes("right")) {
        return "RIGHT";
      } else if (instruction.includes("U-turn")) {
        return "UTURN";
      }
  
      // If instruction does not match any known commands, return an empty string
      console.log("No matching command found for instruction:", instruction);
      return "";
    },
  };
  