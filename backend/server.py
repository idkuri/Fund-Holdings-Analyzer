import re
import requests
from bs4 import BeautifulSoup
from flask import Flask, request, jsonify, abort
from utils.utils import (
    getSortedNPortFilings,
    getNPortFile,
    getHoldingsfromXML,
    getSubmissions,
    getFundLookupTickerByCik,
    searchFunds,
)
import logging
from flask_cors import CORS
import os
import atexit
import html
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.exceptions import HTTPException

# Configure logging
logging.basicConfig(
    filename='app.log',       # Log file name
    level=logging.INFO,       # Minimum log level to capture
    format='%(asctime)s - %(levelname)s - %(message)s'  # Log format
)

app = Flask(__name__)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"]  # global default
)

CORS(app, resources={r"/*": {"origins": [
    "http://localhost:3500",
    "http://localhost:5173",
    "https://prospect.idkuri.com"
]}})


if not os.path.exists("cache"):
    os.mkdir("cache")

@app.route("/")
def hello_world():
    return "<p>You have reached API for Prospect Take Home Assignment</p>"

@app.route("/cik/<cik>", methods=['GET'])
@limiter.limit ("50 per minute")
def get_cik(cik):
    try:
        cik = html.escape(cik) # Escaped HTML for security and sanitizes input
        cik = cik.zfill(10)
        logging.info("Getting NPORT-P filings for CIK: %s", cik)
        fetch_data = getSortedNPortFilings(cik)
        fund_name = fetch_data["name"]
        nport_filings_sorted = fetch_data["data"]
        if not nport_filings_sorted:
            logging.warning("No NPORT-P filings found for CIK: %s", cik)
            return jsonify({"error": "No NPORT-P filings found for the provided CIK."}), 404

        latest_date, latest_accession = nport_filings_sorted[0]
        logging.info("Most recent NPORT-P: %s filed on %s", latest_accession, latest_date)

        n_port_file_xml = getNPortFile(cik, latest_accession)
        holdings = getHoldingsfromXML(n_port_file_xml)
        logging.info("Holdings extracted from XML: %s", holdings)

        submissions = getSubmissions(cik)
        tickers = submissions.get('tickers', [])
        if not tickers:
            fallback_ticker = getFundLookupTickerByCik(cik)
            if fallback_ticker:
                tickers = [fallback_ticker]

        return jsonify({
            "fund_name": fund_name,
            "data": list(holdings.values()),
            "tickers": tickers,
            "ticker": tickers[0] if tickers else None,
        })
    
    except HTTPException as he:
        logging.error("HTTP error: %s", he.description)
        return jsonify({"error": "CIK not found. Please enter a valid CIK"}), 404
    except AssertionError:
        logging.error("Invalid CIK format for CIK %s", cik)
        return jsonify({"error": "Invalid CIK format. Please enter a numeric CIK."}), 400
    except Exception as e:
        logging.error("Error occurred while processing CIK %s: %s", cik, e)
        return jsonify({"error": "An unexpected error occurred."}), 500

@app.route("/ticker/<cik>", methods=['GET'])
@limiter.limit("50 per minute")
def get_ticker(cik):
    try:
        cik = html.escape(cik)
        cik = cik.zfill(10)
        submissions = getSubmissions(cik)
        tickers = submissions.get('tickers', [])
        if not tickers:
            fallback_ticker = getFundLookupTickerByCik(cik)
            if fallback_ticker:
                tickers = [fallback_ticker]
        return jsonify({"tickers": tickers})
    except HTTPException as he:
        logging.error("HTTP error fetching ticker for CIK %s: %s", cik, he.description)
        return jsonify({"error": "CIK not found"}), 404
    except AssertionError:
        return jsonify({"error": "Invalid CIK format"}), 400
    except Exception as e:
        logging.error("Error fetching ticker for CIK %s: %s", cik, e)
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.route("/chart/<ticker>", methods=['GET'])
@limiter.limit("30 per minute")
def get_chart_data(ticker):
    try:
        ticker = html.escape(ticker).upper()
        assert re.match(r'^[A-Z0-9.\-\^=]{1,20}$', ticker), "Invalid ticker format"

        range_ = request.args.get('range', '1y')
        interval = request.args.get('interval', '1d')
        valid_ranges = {'1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max'}
        valid_intervals = {'1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo'}
        assert range_ in valid_ranges, "Invalid range parameter"
        assert interval in valid_intervals, "Invalid interval parameter"

        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9",
        }
        resp = requests.get(url, headers=headers, params={"range": range_, "interval": interval}, timeout=10)
        resp.raise_for_status()
        return jsonify(resp.json())
    except AssertionError as e:
        return jsonify({"error": str(e)}), 400
    except requests.exceptions.HTTPError:
        return jsonify({"error": "Ticker not found or Yahoo Finance unavailable"}), 502
    except Exception as e:
        logging.error("Error fetching chart data for ticker %s: %s", ticker, e)
        return jsonify({"error": "Failed to fetch chart data"}), 500

@app.route("/lookup", methods=['GET'])
@limiter.limit("60 per minute")
def lookup_funds():
    try:
        query = html.escape(request.args.get("q", ""))
        if len(query.strip()) < 2:
            return jsonify({"matches": []})
        matches = searchFunds(query, limit=20)
        return jsonify({"matches": matches})
    except Exception as e:
        logging.error("Error searching funds for query '%s': %s", query, e)
        return jsonify({"error": "Failed to search funds"}), 500

@atexit.register
def delete_cache():
    cache_dir = "cache"
    if os.path.exists(cache_dir):
        for filename in os.listdir(cache_dir):
            file_path = os.path.join(cache_dir, filename)
            try:
                if os.path.isfile(file_path):
                    os.remove(file_path)
                    logging.info(f"Deleted cache file: {file_path}")
            except Exception as e:
                logging.error(f"Error deleting file {file_path}: {e}")
        os.rmdir(cache_dir)

atexit.register(logging.shutdown)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)