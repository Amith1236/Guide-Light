#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ESP32Servo.h> // Use ESP32Servo instead of Servo

// Button Pins
#define BUTTON_LEFT_PIN 12
#define BUTTON_RIGHT_PIN 13
#define BUTTON_BRAKE_PIN 14

// LED Pins
#define LED_LEFT_PIN 16
#define LED_RIGHT_PIN 17
#define LED_BRAKE_PIN 18

// Servo Pin
#define SERVO_PIN 19

// Servo Positions (adjust as needed)
#define SERVO_LEFT 45
#define SERVO_NEUTRAL 90
#define SERVO_RIGHT 135
#define SERVO_UTURN 180

// Define custom service and characteristic UUIDs
#define SERVICE_UUID        "0000abcd-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID "00001234-0000-1000-8000-00805f9b34fb" // Valid hexadecimal UUID

// BLE variables
BLECharacteristic *pCharacteristic;
bool deviceConnected = false;

// Struct for button-controlled LEDs
typedef struct {
  uint8_t leftIndicator : 1;
  uint8_t rightIndicator : 1;
  uint8_t brake : 1;
  uint8_t reserved : 5; // Reserved for future use
} LightData;

LightData lightData = {0, 0, 0};

// Servo instance
Servo myServo;

// Consolidated LED control
void controlLED(uint8_t pin, bool state) {
  digitalWrite(pin, state ? HIGH : LOW);
}

// BLE callback class
class MyCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String value = pCharacteristic->getValue().c_str(); // Convert BLE data to Arduino String

    if (value.length() > 0) {
      Serial.println("Received instruction: " + value); // Debug output

      // Control servo based on BLE instructions
      if (value.indexOf("LEFT") != -1) {
        myServo.write(SERVO_LEFT);
        Serial.println("Servo: Turning LEFT");
      } else if (value.indexOf("RIGHT") != -1) {
        myServo.write(SERVO_RIGHT);
        Serial.println("Servo: Turning RIGHT");
      } else if (value.indexOf("UTURN") != -1) {
        myServo.write(SERVO_UTURN);
        Serial.println("Servo: U-TURN");
      } else {
        myServo.write(SERVO_NEUTRAL);
        Serial.println("Servo: Neutral position");
      }
    }
  }
};

void setup() {
  // Start Serial for debugging
  Serial.begin(9600);

  // Initialize button pins
  pinMode(BUTTON_LEFT_PIN, INPUT_PULLUP);
  pinMode(BUTTON_RIGHT_PIN, INPUT_PULLUP);
  pinMode(BUTTON_BRAKE_PIN, INPUT_PULLUP);

  // Initialize LED pins
  pinMode(LED_LEFT_PIN, OUTPUT);
  pinMode(LED_RIGHT_PIN, OUTPUT);
  pinMode(LED_BRAKE_PIN, OUTPUT);

  // Turn off all LEDs initially
  controlLED(LED_LEFT_PIN, false);
  controlLED(LED_RIGHT_PIN, false);
  controlLED(LED_BRAKE_PIN, false);

  // Attach servo to pin
  myServo.attach(SERVO_PIN);
  myServo.write(SERVO_NEUTRAL); // Set servo to neutral position initially

  // Initialize BLE
  BLEDevice::init("ESP32-BikeLight-BLE");
  BLEServer *pServer = BLEDevice::createServer();

  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE
  );

  pCharacteristic->setCallbacks(new MyCallbacks());
  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->start();
  Serial.println("BLE initialized and advertising");
}
// Variables to track the timer for left and right indicators
int leftIndicatorCounter = 0;
int rightIndicatorCounter = 0;

void loop() {
  // Read button states
  lightData.leftIndicator = !digitalRead(BUTTON_LEFT_PIN);
  lightData.rightIndicator = !digitalRead(BUTTON_RIGHT_PIN);
  lightData.brake = !digitalRead(BUTTON_BRAKE_PIN);

  // Check and update left indicator state
  if (lightData.leftIndicator) {
    leftIndicatorCounter = 20; // Set counter to keep the LED on for 2 seconds
  }
  if (leftIndicatorCounter > 0) {
    controlLED(LED_LEFT_PIN, HIGH);
    leftIndicatorCounter--; // Decrease counter each loop
  } else {
    controlLED(LED_LEFT_PIN, LOW);
  }

  // Check and update right indicator state
  if (lightData.rightIndicator) {
    rightIndicatorCounter = 20; // Set counter to keep the LED on for 2 seconds
  }
  if (rightIndicatorCounter > 0) {
    controlLED(LED_RIGHT_PIN, HIGH);
    rightIndicatorCounter--; // Decrease counter each loop
  } else {
    controlLED(LED_RIGHT_PIN, LOW);
  }

  // Control brake LED (immediate response)
  controlLED(LED_BRAKE_PIN, lightData.brake);

  // Debugging: Print button and LED states
  Serial.print("Left Button: ");
  Serial.print(lightData.leftIndicator);
  Serial.print(" | Right Button: ");
  Serial.print(lightData.rightIndicator);
  Serial.print(" | Brake Button: ");
  Serial.println(lightData.brake);

  Serial.print("Left LED: ");
  Serial.print(digitalRead(LED_LEFT_PIN));
  Serial.print(" | Right LED: ");
  Serial.print(digitalRead(LED_RIGHT_PIN));
  Serial.print(" | Brake LED: ");
  Serial.println(digitalRead(LED_BRAKE_PIN));

  delay(100); // Loop delay for stability
}



