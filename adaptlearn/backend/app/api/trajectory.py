from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Trajectory, CognitiveProfile
from app.schemas import TrajectoryOut
from app.services.trajectory_engine import TrajectoryEngine

router = APIRouter(prefix="/trajectory", tags=["trajectory"])
_engine = TrajectoryEngine()


@router.get("/{student_id}", response_model=TrajectoryOut)
async def get_trajectory(student_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Trajectory).where(Trajectory.student_id == student_id)
    )
    trajectory = result.scalar_one_or_none()
    if not trajectory:
        profile_result = await db.execute(
            select(CognitiveProfile).where(CognitiveProfile.student_id == student_id)
        )
        profile = profile_result.scalar_one_or_none()
        if not profile:
            raise HTTPException(status_code=404, detail="Student profile not found")
        trajectory = await _engine.update(db, student_id, profile)
    return trajectory


@router.post("/{student_id}/refresh", response_model=TrajectoryOut)
async def refresh_trajectory(student_id: int, db: AsyncSession = Depends(get_db)):
    profile_result = await db.execute(
        select(CognitiveProfile).where(CognitiveProfile.student_id == student_id)
    )
    profile = profile_result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    trajectory = await _engine.update(db, student_id, profile)
    return trajectory
