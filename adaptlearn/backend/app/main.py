import asyncio
import json
import os
from contextlib import asynccontextmanager

import redis.asyncio as aioredis
import paho.mqtt.client as mqtt
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, AsyncSessionLocal
from app.api.students import router as students_router
from app.api.lessons import router as lessons_router
from app.api.tests import router as tests_router
from app.api.trajectory import router as trajectory_router
from app.api.content import router as content_router
from app.api.auth import router as auth_router, _do_seed
from app.api.admin import router as admin_router

_redis: aioredis.Redis | None = None
_mqtt_client: mqtt.Client | None = None


def _on_mqtt_message(client, userdata, message):
    try:
        payload = json.loads(message.payload.decode())
        topic = message.topic
        print(f"[MQTT] {topic}: {payload}")
    except Exception as e:
        print(f"[MQTT] parse error: {e}")


def _start_mqtt():
    global _mqtt_client
    host = os.getenv("MQTT_HOST", "localhost")
    port = int(os.getenv("MQTT_PORT", 1883))
    _mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    _mqtt_client.on_message = _on_mqtt_message
    try:
        _mqtt_client.connect(host, port, 60)
        _mqtt_client.subscribe("#")
        _mqtt_client.loop_start()
        print(f"[MQTT] Connected to {host}:{port}")
    except Exception as e:
        print(f"[MQTT] Connection failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _redis
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        from sqlalchemy import text
        try:
            await conn.execute(text(
                "ALTER TABLE cognitive_profiles "
                "ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '{}'::jsonb"
            ))
            print("[Migration] skills column ensured on cognitive_profiles")
        except Exception as e:
            print(f"[Migration] skip skills column: {e}")

    redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
    _redis = await aioredis.from_url(redis_url, decode_responses=True)
    print("[Redis] Connected")

    _start_mqtt()

    async with AsyncSessionLocal() as db:
        try:
            await _do_seed(db)
        except Exception as e:
            print(f"[Seed] skipped: {e}")

    async with AsyncSessionLocal() as db:
        try:
            from app.services.static_seed import seed_all_static
            await seed_all_static(db)
        except Exception as e:
            print(f"[StaticSeed] failed: {e}")

    yield

    if _redis:
        await _redis.aclose()
    if _mqtt_client:
        _mqtt_client.loop_stop()
        _mqtt_client.disconnect()


app = FastAPI(title="AdaptLearn API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(students_router, prefix="/api")
app.include_router(lessons_router, prefix="/api")
app.include_router(tests_router, prefix="/api")
app.include_router(trajectory_router, prefix="/api")
app.include_router(content_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
