import pytest
from httpx import AsyncClient
from main import app


@pytest.mark.asyncio
async def test_root():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code in [200, 404]


@pytest.mark.asyncio
async def test_student_opportunities():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/students/opportunities")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
