import requests
from bs4 import BeautifulSoup
from flask import Flask, request, jsonify
from utils.utils import getSortedNPortFilings, getNPortFile, getHoldingsfromXML
import logging

# Configure logging
logging.basicConfig(
    filename='app.log',       # Log file name
    level=logging.INFO,       # Minimum log level to capture
    format='%(asctime)s - %(levelname)s - %(message)s'  # Log format
)

app = Flask(__name__)


@app.route("/")
def llo_world():
    return "<p>Hello, World!</p>"


@app.route("/api/cik/<cik>", methods=['GET'])
def get_cik(cik):
    try:
        logging.info("Getting NPORT-P filings for CIK: %s", cik)
        nport_filings_sorted = getSortedNPortFilings(cik)
        latest_date, latest_accession = nport_filings_sorted[0]
        logging.info("Most recent NPORT-P: %s filed on %s", latest_accession, latest_date)
        n_port_file_xml = getNPortFile(cik, latest_accession)
        logging.info("NPORT-P XML content retrieved from: %s", f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{latest_accession.replace('-', '')}/primary_doc.xml")
        holdings = getHoldingsfromXML(n_port_file_xml)
        logging.info("Holdings extracted from XML: %s", holdings)
        return jsonify(holdings)
    except AssertionError:
        logging.error("Invalid CIK format for CIK %s", cik)
        return "<p>Invalid CIK format. Please enter a numeric CIK.</p>"
    except Exception as e:
        logging.error("Error occurred while processing CIK %s: %s", cik, e)
        return "<p>An error occurred while processing your request.</p>"


if __name__ == "__main__":
    app.run(debug=True)