#include <WiFi.h>
#include <WebSocketsServer.h>
#include <DHT.h>

const char* ssid = "";
const char* password = "";

#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

const int mqPin = 32;

WebSocketsServer webSocket = WebSocketsServer(81);

void setup() {
  Serial.begin(9600);
  dht.begin();
  
  pinMode(mqPin, INPUT);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.print("Connected, IP address: ");
  Serial.println(WiFi.localIP());

  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop(); 
  
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  int mqValue = analogRead(mqPin);

  if (!isnan(temperature) && !isnan(humidity)) {
    String data = String("Temperature: ") + temperature + " C, Humidity: " + humidity + 
                  "%, MQ-135 Gas Sensor: " + mqValue;
    
    webSocket.broadcastTXT(data);
  }

  delay(10000); 
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_TEXT) {
    Serial.printf("[%u] get Text: %s\n", num, payload);
  }
}
