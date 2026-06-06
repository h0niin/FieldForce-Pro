"""Tests for chatbot API endpoints."""


def test_send_message_unauthorized(client):
    response = client.post("/api/chat/message", json={
        "message": "Hello",
    })
    assert response.status_code in (401, 403)


def test_send_message_success(client, auth_headers):
    response = client.post(
        "/api/chat/message",
        json={"message": "Hello, how can I create a work order?"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert "reply" in data["data"]
    assert "session_id" in data["data"]
    assert len(data["data"]["session_id"]) > 0


def test_send_message_with_session_id(client, auth_headers):
    response = client.post(
        "/api/chat/message",
        json={"message": "Follow up", "session_id": "my-session-123"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["session_id"] == "my-session-123"


def test_get_chat_history_unauthorized(client):
    response = client.get("/api/chat/history/session-1")
    assert response.status_code in (401, 403)


def test_get_chat_history_success(client, auth_headers):
    response = client.get(
        "/api/chat/history/session-1",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert "session_id" in data["data"]
    assert "history" in data["data"]
    assert "message_count" in data["data"]


def test_clear_session_unauthorized(client):
    response = client.delete("/api/chat/session/session-1")
    assert response.status_code in (401, 403)


def test_clear_session_success(client, auth_headers):
    # First send a message to create a session
    client.post(
        "/api/chat/message",
        json={"message": "Hello", "session_id": "clear-me"},
        headers=auth_headers,
    )
    # Then clear it
    response = client.delete(
        "/api/chat/session/clear-me",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert data["data"]["cleared"] is True


def test_knowledge_ingest_unauthorized(client):
    response = client.post("/api/chat/knowledge/ingest", json={
        "documents": [{"content": "test"}],
    })
    assert response.status_code in (401, 403)


def test_knowledge_ingest_success(client, auth_headers):
    response = client.post(
        "/api/chat/knowledge/ingest",
        json={
            "documents": [
                {"content": "Work orders can be created from the main menu", "title": "Help"},
            ],
            "collection": "test_collection",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] is True
    assert "ingested" in data["data"]
    assert "total" in data["data"]
    assert data["data"]["collection"] == "test_collection"
