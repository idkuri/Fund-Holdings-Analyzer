import os
import pytest
import tempfile
import shutil
from unittest.mock import patch, MagicMock

from server import app, delete_cache
from utils.utils import getSortedNPortFilings, getNPortFile, getHoldingsfromXML

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_hello_world(client):
    """Test root route returns expected message"""
    resp = client.get("/")
    assert resp.status_code == 200
    assert b"API for Prospect Take Home Assignment" in resp.data


@patch("server.getSortedNPortFilings")
@patch("server.getNPortFile")
@patch("server.getHoldingsfromXML")
def test_get_cik_success(mock_holdings, mock_getfile, mock_sorted, client):
    """Test /cik/<cik> returns holdings when everything works"""
    # Mocked return values
    mock_sorted.return_value = {
        "name": "Test Fund",
        "data": [("2025-08-01", "0000000000-25-000001")]
    }
    mock_getfile.return_value = "<xml>fake</xml>"
    mock_holdings.return_value = {"AAPL": {"title": "Apple", "value": 1000}}

    resp = client.get("/cik/12345")

    assert resp.status_code == 200
    data = resp.get_json()
    assert "fund_name" in data
    assert data["fund_name"] == "Test Fund"
    assert len(data["data"]) == 1
    assert data["data"][0]["title"] == "Apple"


@patch("server.getSortedNPortFilings")
def test_get_cik_no_filings(mock_sorted, client):
    """Test /cik/<cik> returns 404 when no filings are found"""
    mock_sorted.return_value = {"name": "Empty Fund", "data": []}

    resp = client.get("/cik/54321")

    assert resp.status_code == 404
    data = resp.get_json()
    assert data["error"] == "No NPORT-P filings found for the provided CIK."


def test_get_cik_invalid_format(client):
    """Test /cik/<cik> returns 400 when CIK is not numeric"""
    resp = client.get("/cik/notanumber")
    assert resp.status_code == 400
    data = resp.get_json()
    assert "Invalid CIK format" in data["error"]


@patch("server.getSortedNPortFilings", side_effect=Exception("Unexpected failure"))
def test_get_cik_unexpected_error(mock_sorted, client):
    """Test /cik/<cik> returns 500 on unexpected errors"""
    resp = client.get("/cik/11111")
    assert resp.status_code == 500
    data = resp.get_json()
    assert "unexpected error" in data["error"].lower()


def test_delete_cache(tmp_path):
    """Test delete_cache removes files and directory"""
    cache_dir = tmp_path / "cache"
    cache_dir.mkdir()
    f = cache_dir / "testfile.txt"
    f.write_text("dummy")

    # Patch os functions in server module
    with patch("server.os.path.exists", return_value=True), \
         patch("server.os.listdir", return_value=[f.name]), \
         patch("server.os.path.isfile", return_value=True), \
         patch("server.os.remove") as mock_remove, \
         patch("server.os.rmdir") as mock_rmdir:

        delete_cache()
        mock_remove.assert_called_once()
        mock_rmdir.assert_called_once()

