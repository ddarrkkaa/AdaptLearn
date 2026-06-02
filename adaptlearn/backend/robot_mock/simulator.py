import asyncio
import json
import os
import random
from datetime import datetime, timezone

import paho.mqtt.client as mqtt

PHYSICS_TERMS = [
    "velocity", "acceleration", "force", "mass", "energy",
    "momentum", "gravity", "friction", "inertia", "pressure",
    "temperature", "wave", "frequency", "amplitude", "electric field",
    "magnetic field", "charge", "current", "voltage", "resistance",
]

_client: mqtt.Client | None = None


def _connect() -> mqtt.Client:
    host = os.getenv("MQTT_HOST", "localhost")
    port = int(os.getenv("MQTT_PORT", 1883))
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.connect(host, port, 60)
    client.loop_start()
    print(f"[Robot] Connected to MQTT at {host}:{port}")
    return client


def _publish(client: mqtt.Client, topic: str, payload: dict):
    client.publish(topic, json.dumps(payload))


def _video_payload() -> dict:
    keywords = random.sample(PHYSICS_TERMS, random.randint(2, 3))
    return {
        "keywords": keywords,
        "confidence": round(random.uniform(0.7, 0.99), 3),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def _audio_payload() -> dict:
    return {
        "student_id": random.randint(1, 30),
        "duration_sec": random.randint(1, 8),
        "type": random.choice(["answer", "question", "noise"]),
        "volume": round(random.uniform(0.3, 0.9), 3),
    }


def _thermal_payload() -> dict:
    return {
        "attention_scores": [round(random.uniform(20.0, 100.0), 1) for _ in range(30)],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


async def run():
    global _client
    retries = 0
    while retries < 10:
        try:
            _client = _connect()
            break
        except Exception as e:
            retries += 1
            print(f"[Robot] MQTT connection failed ({retries}/10): {e}")
            await asyncio.sleep(5)

    if _client is None:
        print("[Robot] Could not connect to MQTT broker. Exiting.")
        return

    print("[Robot] Starting data simulation loop...")
    while True:
        _publish(_client, "/robot/video", _video_payload())
        _publish(_client, "/robot/audio", _audio_payload())
        _publish(_client, "/robot/thermal", _thermal_payload())
        await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(run())
