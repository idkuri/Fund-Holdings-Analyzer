import requests
from bs4 import BeautifulSoup
import logging
import os
import json
import time
from flask import abort

SEC_HEADERS = {"User-Agent": "MyApp/1.0 acaoy2@gmail.com"}
FUND_LOOKUP_CACHE_PATH = os.path.join("cache", "fund-lookup-index.json")
FUND_NAME_CACHE_PATH = os.path.join("cache", "fund-name-by-cik.json")
FUND_LOOKUP_CACHE_TTL_SECONDS = 60 * 60 * 24
SEC_FUND_LOOKUP_URL = "https://www.sec.gov/files/company_tickers_mf.json"
SEC_NAME_SEARCH_URL = "https://efts.sec.gov/LATEST/search-index"

_fund_name_cache = None

def getSubmissions(cik):
    assert cik.isdigit(), "CIK must be numeric"
    assert len(cik) <= 10, "CIK must be at most 10 digits"
    request_url = f"https://data.sec.gov/submissions/CIK{cik}.json"
    resp = requests.get(request_url, headers=SEC_HEADERS)
    if resp.status_code != 200:
        abort(404, description="CIK not found")
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
    accession_nodash = accession.replace("-", "")

    if os.path.exists(f'cache/{cik}-{accession_nodash}.xml'):
        logging.info(f"Loading from cache/{cik}-{accession_nodash}.xml cache")
        return open(f'cache/{cik}-{accession_nodash}.xml', 'rb').read()
        
    request_url = f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{accession_nodash}/primary_doc.xml"
    logging.info("Requesting NPORT-P file from URL: %s", request_url)
    n_port_file = requests.get(request_url, headers=SEC_HEADERS)

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

def _read_cached_fund_lookup():
    if not os.path.exists(FUND_LOOKUP_CACHE_PATH):
        return None
    try:
        with open(FUND_LOOKUP_CACHE_PATH, "r", encoding="utf-8") as f:
            payload = json.load(f)
        if (
            time.time() - float(payload.get("fetched_at", 0))
            > FUND_LOOKUP_CACHE_TTL_SECONDS
        ):
            return None
        records = payload.get("records", [])
        if not isinstance(records, list):
            return None
        # Guard against earlier buggy cache format.
        if records and not isinstance(records[0], dict):
            return None
        # Empty cache is treated as invalid so we can recover automatically.
        if len(records) == 0:
            return None
        return records
    except Exception:
        return None

def _write_cached_fund_lookup(records):
    os.makedirs("cache", exist_ok=True)
    with open(FUND_LOOKUP_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump({"fetched_at": time.time(), "records": records}, f)

def _read_cached_fund_names():
    global _fund_name_cache
    if _fund_name_cache is not None:
        return _fund_name_cache
    if not os.path.exists(FUND_NAME_CACHE_PATH):
        _fund_name_cache = {}
        return _fund_name_cache
    try:
        with open(FUND_NAME_CACHE_PATH, "r", encoding="utf-8") as f:
            payload = json.load(f)
        if isinstance(payload, dict):
            _fund_name_cache = payload
        else:
            _fund_name_cache = {}
    except Exception:
        _fund_name_cache = {}
    return _fund_name_cache

def _write_cached_fund_names():
    global _fund_name_cache
    os.makedirs("cache", exist_ok=True)
    with open(FUND_NAME_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(_fund_name_cache or {}, f)

def _resolve_fund_name(cik):
    cache = _read_cached_fund_names()
    if cik in cache and cache[cik]:
        return cache[cik]
    name = ""
    try:
        submissions = getSubmissions(cik)
        name = str(submissions.get("name") or "").strip()
    except Exception:
        name = ""
    cache[cik] = name
    _write_cached_fund_names()
    return name

def loadFundLookupRecords():
    cached = _read_cached_fund_lookup()
    if cached is not None:
        return cached

    resp = requests.get(SEC_FUND_LOOKUP_URL, headers=SEC_HEADERS, timeout=12)
    resp.raise_for_status()
    raw = resp.json()

    records = []

    # SEC mutual-fund table format:
    # { "0": ["cik","seriesId","classId","symbol"], "1": [<cik>, ...], ... }
    # or list-equivalent. Handle both row-object and row-array structures.
    if isinstance(raw, dict) and isinstance(raw.get("fields"), list) and isinstance(raw.get("data"), list):
        headers = [str(h) for h in raw.get("fields", [])]
        rows = raw.get("data", [])
    elif isinstance(raw, dict):
        rows = list(raw.values())
        headers = None
    elif isinstance(raw, list):
        rows = raw
        headers = None
    else:
        rows = []

    if headers is None and rows and isinstance(rows[0], list):
        headers = [str(h) for h in rows[0]]
        rows = rows[1:]

    for entry in rows:
        if isinstance(entry, dict):
            cik_raw = str(entry.get("cik") or entry.get("cik_str") or "").strip()
            ticker = str(entry.get("ticker") or entry.get("symbol") or "").strip().upper()
            name = str(entry.get("title") or entry.get("name") or "").strip()
        elif isinstance(entry, list) and headers:
            row_map = {headers[i]: entry[i] for i in range(min(len(headers), len(entry)))}
            cik_raw = str(row_map.get("cik") or row_map.get("cik_str") or "").strip()
            ticker = str(row_map.get("ticker") or row_map.get("symbol") or "").strip().upper()
            # MF table does not include fund name; keep an empty name here.
            name = str(row_map.get("title") or row_map.get("name") or "").strip()
        else:
            continue

        if not cik_raw:
            continue
        try:
            cik = str(int(cik_raw)).zfill(10)
        except ValueError:
            continue

        records.append({"cik": cik, "name": name, "ticker": ticker})

    _write_cached_fund_lookup(records)
    return records

def getFundLookupTickerByCik(cik):
    normalized = str(cik or "").strip()
    if not normalized:
        return ""
    records = loadFundLookupRecords()
    for record in records:
        if str(record.get("cik") or "").strip() != normalized:
            continue
        ticker = str(record.get("ticker") or "").strip().upper()
        if ticker:
            return ticker
    return ""

def _search_funds_by_name_from_sec(query, limit):
    q = str(query or "").strip()
    if len(q) < 4:
        return []

    ticker_by_cik = {}
    for record in loadFundLookupRecords():
        cik = str(record.get("cik") or "").strip()
        ticker = str(record.get("ticker") or "").strip().upper()
        if cik and ticker and cik not in ticker_by_cik:
            ticker_by_cik[cik] = ticker

    resp = requests.get(
        SEC_NAME_SEARCH_URL,
        headers=SEC_HEADERS,
        params={"q": q, "category": "custom", "startdt": "", "enddt": ""},
        timeout=12,
    )
    resp.raise_for_status()
    payload = resp.json()
    hits = (
        payload.get("hits", {})
        .get("hits", [])
    )

    results = []
    seen = set()
    for hit in hits:
        source = hit.get("_source") or {}
        ciks = source.get("ciks") or []
        display_names = source.get("display_names") or []
        raw_name = str(display_names[0] if display_names else "").strip()
        clean_name = raw_name.split(" (CIK ", 1)[0].strip() if raw_name else ""

        for cik_raw in ciks:
            try:
                cik = str(int(str(cik_raw))).zfill(10)
            except ValueError:
                continue
            if cik in seen:
                continue
            results.append({
                "cik": cik,
                "name": clean_name,
                "ticker": ticker_by_cik.get(cik, ""),
            })
            seen.add(cik)
            if len(results) >= limit:
                return results

    return results

def searchFunds(query, limit=20):
    q = query.strip().lower()
    if not q:
        return []

    records = loadFundLookupRecords()
    def score_record(record):
        name = (record.get("name") or "").lower()
        ticker = (record.get("ticker") or "").lower()
        cik = (record.get("cik") or "").lower()

        if ticker and ticker == q:
            return 0
        if cik.startswith(q):
            return 1
        if name.startswith(q):
            return 2
        if q in name:
            return 3
        if ticker and q in ticker:
            return 4
        return None

    def add_scored_entry(record, scored, seen_ciks):
        cik = str(record.get("cik") or "").strip()
        if not cik or cik in seen_ciks:
            return
        score = score_record(record)
        if score is None:
            return
        scored.append((score, record))
        seen_ciks.add(cik)

    scored = []
    seen_ciks = set()
    for record in records:
        add_scored_entry(record, scored, seen_ciks)

    # MF lookup feed generally lacks names; resolve a bounded set lazily for name queries.
    has_name_like_query = any(ch.isalpha() for ch in q)
    if has_name_like_query and len(scored) < limit:
        lookups = 0
        max_lookups = 80
        for record in records:
            if len(scored) >= limit or lookups >= max_lookups:
                break
            if record.get("name"):
                continue

            cik = str(record.get("cik") or "").strip()
            if not cik:
                continue

            resolved = _resolve_fund_name(cik)
            lookups += 1
            if not resolved:
                continue

            record["name"] = resolved
            add_scored_entry(record, scored, seen_ciks)

    scored.sort(key=lambda item: (item[0], item[1]["name"], item[1]["ticker"]))
    top = [dict(record) for _, record in scored[:limit]]

    # SEC mutual fund symbol feed lacks names; enrich top hits lazily by CIK.
    for record in top:
        if record.get("name"):
            continue
        cik = str(record.get("cik") or "").strip()
        if not cik:
            continue
        resolved = _resolve_fund_name(cik)
        if resolved:
            record["name"] = resolved

    if has_name_like_query and len(top) < limit:
        try:
            fallback = _search_funds_by_name_from_sec(query, limit=limit)
        except Exception:
            fallback = []
        if fallback:
            by_cik = {str(item.get("cik") or "").strip(): item for item in top}
            for item in fallback:
                cik = str(item.get("cik") or "").strip()
                if not cik:
                    continue
                if cik in by_cik:
                    existing = by_cik[cik]
                    if not existing.get("name") and item.get("name"):
                        existing["name"] = item["name"]
                    if not existing.get("ticker") and item.get("ticker"):
                        existing["ticker"] = item["ticker"]
                    continue
                top.append(item)
                by_cik[cik] = item
                if len(top) >= limit:
                    break

    return top
