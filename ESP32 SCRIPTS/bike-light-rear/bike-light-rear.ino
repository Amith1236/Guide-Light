#include <BLEDevice.h>
#include <BLEServer.h>

// Define LED pins
#define LED_LEFT_PIN 16
#define LED_RIGHT_PIN 17
#define LED_BRAKE_PIN 18

// Struct for receiving data
typedef struct {
  uint8_t leftIndicator : 1;
  uint8_t rightIndicator : 1;
  uint8_t brake : 1;
  uint8_t reserved : 5; // Reserved for future use
} LightData;

LightData lightData;

// BLE Characteristics
BLECharacteristic *pCharacteristic;
bool newDataReceived = false;

// Callback for BLE writes
class MyCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    // Handle value as an Arduino String
    String value = pCharacteristic->getValue().c_str(); // Convert to String
    if (value.length() == sizeof(LightData)) {
      memcpy(&lightData, value.c_str(), sizeof(LightData)); // Use c_str() for raw data
      newDataReceived = true;
    }
  }
};

void setup() {
  Serial.begin(115200);

  // Initialize LED pins
  pinMode(LED_LEFT_PIN, OUTPUT);
  pinMode(LED_RIGHT_PIN, OUTPUT);
  pinMode(LED_BRAKE_PIN, OUTPUT);

  // Turn off all LEDs initially
  digitalWrite(LED_LEFT_PIN, LOW);
  digitalWrite(LED_RIGHT_PIN, LOW);
  digitalWrite(LED_BRAKE_PIN, LOW);

  // Initialize BLE
  BLEDevice::init("ESP32-BikeLight-Server");
  BLEServer *pServer = BLEDevice::createServer();
  BLEService *pService = pServer->createService(BLEUUID("12345678-1234-1234-1234-123456789abc"));

  pCharacteristic = pService->createCharacteristic(
      BLEUUID("87654321-4321-4321-4321-abcdefabcdef"),
      BLECharacteristic::PROPERTY_WRITE
  );

  pCharacteristic->setCallbacks(new MyCallbacks());
  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->start();

  Serial.println("BLE server started");
}

void loop() {
  if (newDataReceived) {
    // Control LEDs based on received data
    digitalWrite(LED_LEFT_PIN, lightData.leftIndicator ? HIGH : LOW);
    digitalWrite(LED_RIGHT_PIN, lightData.rightIndicator ? HIGH : LOW);
    digitalWrite(LED_BRAKE_PIN, lightData.brake ? HIGH : LOW);

    newDataReceived = false;
  }
}


