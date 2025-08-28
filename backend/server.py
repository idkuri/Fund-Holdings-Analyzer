import requests
from bs4 import BeautifulSoup
from flask import Flask, request, jsonify, abort
from utils.utils import getSortedNPortFilings, getNPortFile, getHoldingsfromXML
import logging
from flask_cors import CORS
import os
import atexit

# Configure logging
logging.basicConfig(
    filename='app.log',       # Log file name
    level=logging.INFO,       # Minimum log level to capture
    format='%(asctime)s - %(levelname)s - %(message)s'  # Log format
)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": {"http://localhost:3500", "https://prospect.idkuri.com", "http://localhost:5173"}}})

if not os.path.exists("cache"):
    os.mkdir("cache")

@app.route("/")
def hello_world():
    return "<p>You have reached idkuri API for Prospect Take Home Assignment</p>"

@app.route("/api/cik/<cik>", methods=['GET'])
def get_cik(cik):
    try:
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

        return jsonify({"fund_name": fund_name, "data":list(holdings.values())})
    
    except AssertionError:
        logging.error("Invalid CIK format for CIK %s", cik)
        return jsonify({"error": "Invalid CIK format. Please enter a numeric CIK."}), 400
    except Exception as e:
        logging.error("Error occurred while processing CIK %s: %s", cik, e)
        return jsonify({"error": "An unexpected error occurred."}), 500

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