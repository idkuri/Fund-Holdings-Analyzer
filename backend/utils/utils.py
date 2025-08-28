import requests
from bs4 import BeautifulSoup
import logging
import os

def getSubmissions(cik):
    assert cik.isdigit(), "CIK must be numeric"
    assert len(cik) <= 10, "CIK must be at most 10 digits"
    request_url = f"https://data.sec.gov/submissions/CIK{cik}.json"
    HEADERS = {
        "User-Agent": "MyApp/1.0 acaoy2@gmail.com"
    }
    resp = requests.get(request_url, headers=HEADERS)
    resp.raise_for_status()
    return resp.json()

def getSortedNPortFilings(cik):
    assert cik.isdigit(), "CIK must be numeric"
    assert len(cik) <= 10, "CIK must be at most 10 digits"
    submissions = getSubmissions(cik)
    name = submissions['name']
    logging.info("Fund name for CIK %s: %s", cik, name)
    forms = submissions['filings']['recent']['form']
    accessions = submissions['filings']['recent']['accessionNumber']
    dates = submissions['filings']['recent']['filingDate']

    nport_filings = [
        (dates[i], accessions[i])
        for i, f in enumerate(forms)
        if f == "NPORT-P"
    ]

    nport_filings_sorted = sorted(
        nport_filings,
        key=lambda x: (x[0], x[1]),
        reverse=True
    )

    return {"name": name, "data":nport_filings_sorted}

def getNPortFile(cik, accession):
    assert cik.isdigit(), "CIK must be numeric"
    assert len(cik) <= 10, "CIK must be at most 10 digits"
    assert type(accession) == str, "Accession must be a string"
    HEADERS = {
        "User-Agent": "MyApp/1.0 acaoy2@gmail.com"
    }
    accession_nodash = accession.replace("-", "")

    if os.path.exists(f'cache/{cik}-{accession_nodash}.xml'):
        logging.info(f"Loading from {f"cache/{cik}-{accession_nodash}.xml"} cache")
        return open(f'cache/{cik}-{accession_nodash}.xml', 'rb').read()
        
    request_url = f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{accession_nodash}/primary_doc.xml"
    logging.info("Requesting NPORT-P file from URL: %s", request_url)
    n_port_file = requests.get(request_url, headers=HEADERS)

    files = [os.path.join("cache", f) for f in os.listdir("cache") if os.path.isfile(os.path.join("cache", f))]
    if len(files) >= 5:
        print("Removing oldest cache file")
        removeOldestCacheFile()
    open(f'cache/{cik}-{accession_nodash}.xml', 'wb').write(n_port_file.content)

    return n_port_file.content

def removeOldestCacheFile():
    cache_dir = "cache"
    if not os.path.exists(cache_dir):
        os.makedirs(cache_dir)
        return
    files = [os.path.join(cache_dir, f) for f in os.listdir(cache_dir) if os.path.isfile(os.path.join(cache_dir, f))]
    files.sort(key=lambda x: os.path.getmtime(x))
    logging.info(f"Removing oldest cache file: {files[0]}")
    os.remove(files[0])
    return

def getHoldingsfromXML(content):
    soup = BeautifulSoup(content,'xml')
    holdings = soup.find('invstOrSecs')
    holdings_dict = {}
    for i, holding in enumerate(holdings.find_all('invstOrSec')):
        title = holding.find('title').text
        cusip = holding.find('cusip').text
        balance = holding.find('balance').text
        value = holding.find("valUSD").text
        holdings_dict[i] = {
            'title': title,
            'cusip': cusip,
            'units': float(balance),
            'value': float(value),
        }
    return holdings_dict
