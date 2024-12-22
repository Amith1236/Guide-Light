import React, { useState, useEffect } from "react";
import { Bluetooth } from "./Bluetooth";

const Navigation = () => {
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    // Fetch navigation instructions if needed
    if (instructions) {
      Bluetooth.sendNextInstruction(instructions);
    }
  }, [instructions]);

  return (
    <div>
      <h2>Next Instruction: {instructions}</h2>
    </div>
  );
};

export default Navigation;
