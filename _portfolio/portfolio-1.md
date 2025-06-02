---
title: "Morse to Code"
excerpt: "Read Morse code and convert it to 7-segment LED display"
collection: portfolio
---

📌 Overview
---
This project converts Morse code into numerical values and visualizes them using a 7-segment LED display. It integrates various sensors (optical and vibration), embedded programming with Arduino, and hardware components like LEDs and resistors. The design highlights real-time signal acquisition and mapping to LED patterns.
- Project Duration: Nov 12, 2017 - Dec 10, 2017
- Tools: Arduino IDE, Oscilloscope, Redboard

🧰 Tools and Technologies
---
- Microcontroller: SparkFun RedBoard (Arduino-compatible)
- Sensors: QRD1114 Reflective Object Sensors, Vibration Sensor
- Output Devices: Common Anode 7-Segment Display, LEDs
- Development: Arduino IDE, Serial Monitor

🔍 Key Features
---
1. Signal Acquisition
- Optical sensors distinguish 'Dit' and 'Dah' based on reflected infrared light.
- Vibration sensor used for manual mode when optical inputs are ambiguous.
2. LED Mapping
- A 5-bit Morse signal is mapped to digits 0–9.
- Custom logic determines the digit based on pattern matching.
3. Error Handling
- Unrecognized signals trigger a fallback dot indicator.
- Manual mode allows user-triggered dot display via vibration.
4. Timing Control
- Delays and millis() ensure non-blocking behavior.
- Pulse width detection via pulseIn().

🎨 Design
---
- Schematics  
    <p align="center">
        <img src="/images/portfolio/portfolio-1-1.png" alt="Schematic" width="80%">
    </p>