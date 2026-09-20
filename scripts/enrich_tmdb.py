import json, os, re, time, unicodedata, urllib.parse, urllib.request
from difflib import SequenceMatcher
from pathlib import Path
from datetime import date

TOKEN = os.environ.get("TMDB_API_TOKEN", "").strip()
SRC = Path("data/watchlist.js")
UNMATCHED = Path("data/watchlist_unmatched.json")

if not TOKEN:
    raise SystemExit("TMDB_API_TOKEN is not configured.")

def api(path, params=None):
    params = params or {}
    url = "https://api.themoviedb.org/3" + path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={
        "Authorization": "Bearer " + TOKEN,
        "accept": "application/json",
        "User-Agent": "cine-series-recomendaciones/1.0"
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def norm(s):
    s = unicodedata.normalize("NFD", str(s or ""))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()

def year_of(r):
    d = r.get("release_date") or r.get("first_air_date") or ""
    return int(d[:4]) if len(d) >= 4 and d[:4].isdigit() else None

def title_of(r):
    return r.get("title") or r.get("name") or ""

def original_of(r):
    return r.get("original_title") or r.get("original_name") or ""

def score_candidate(query, wanted_year, r):
    q = norm(query)
    names = [norm(title_of(r)), norm(original_of(r))]
    s = max([SequenceMatcher(None, q, n).ratio() for n in names if n] or [0])
    cy = year_of(r)
    if wanted_year and cy:
        delta = abs(int(wanted_year) - cy)
        if delta == 0: s += 0.12
        elif delta == 1: s += 0.05
        elif delta >= 4: s -= 0.12
    popularity = min(float(r.get("popularity") or 0) / 1000.0, 0.04)
    return s + popularity

def consensus(vote, count, genres):
    if not vote or count is None:
        return ""
    if count < 20:
        tone = "La valoración disponible todavía se basa en una muestra pequeña del público."
    elif vote >= 8.0:
        tone = "La recepción de la comunidad es muy positiva."
    elif vote >= 7.0:
        tone = "La recepción del público es positiva en términos generales."
    elif vote >= 6.0:
        tone = "La recepción del público es moderadamente positiva, aunque con opiniones divididas."
    else:
        tone = "La recepción del público es más irregular y las opiniones están divididas."
    if genres:
        return tone + " Puede interesar especialmente a quienes disfrutan " + ", ".join(genres[:3]).lower() + "."
    return tone

raw = SRC.read_text(encoding="utf-8").strip()
prefix = "window.WATCHLIST = "
if not raw.startswith(prefix):
    raise SystemExit("Unexpected watchlist.js format")
items = json.loads(raw[len(prefix):].rstrip(";\n "))

movie_genres = {x["id"]: x["name"] for x in api("/genre/movie/list", {"language":"es-MX"}).get("genres", [])}
tv_genres = {x["id"]: x["name"] for x in api("/genre/tv/list", {"language":"es-MX"}).get("genres", [])}

unmatched = []
matched = []
for i, item in enumerate(items, 1):
    query = item["title"]
    try:
        payload = api("/search/multi", {
            "query": query,
            "include_adult": "false",
            "language": "es-MX",
            "page": 1
        })
        results = [r for r in payload.get("results", []) if r.get("media_type") in ("movie","tv")]
        ranked = sorted(results, key=lambda r: score_candidate(query, item.get("year"), r), reverse=True)
        best = ranked[0] if ranked else None
        confidence = score_candidate(query, item.get("year"), best) if best else 0

        if not best or confidence < 0.60:
            item["matchStatus"] = "unmatched"
            item["matchConfidence"] = round(confidence, 3)
            unmatched.append({"title":query,"groups":item.get("groups",[]),"confidence":round(confidence,3)})
            matched.append(item)
            continue

        media = best["media_type"]
        genres_map = movie_genres if media == "movie" else tv_genres
        genres = [genres_map[g] for g in best.get("genre_ids", []) if g in genres_map]
        poster_path = best.get("poster_path")
        vote = best.get("vote_average")
        votes = best.get("vote_count")
        tmdb_id = best["id"]

        item["tmdb"] = {
            "id": tmdb_id,
            "mediaType": media,
            "title": title_of(best),
            "originalTitle": original_of(best),
            "url": f"https://www.themoviedb.org/{media}/{tmdb_id}",
            "genres": genres,
            "year": year_of(best),
            "voteCount": votes,
            "lastVerified": str(date.today())
        }
        item["poster"] = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else ""
        item["publicRating"] = round(float(vote),1) if vote is not None else None
        item["publicRatingSource"] = "TMDb"
        item["review"] = consensus(float(vote or 0), int(votes or 0), genres)
        item["matchStatus"] = "matched"
        item["matchConfidence"] = round(confidence,3)
        matched.append(item)
    except Exception as e:
        item["matchStatus"] = "error"
        item["matchError"] = type(e).__name__
        unmatched.append({"title":query,"groups":item.get("groups",[]),"error":type(e).__name__})
        matched.append(item)
    time.sleep(0.08)

# Merge aliases that resolve to the same TMDb entity.
merged = []
seen_tmdb = {}
for item in matched:
    t = item.get("tmdb")
    key = (t.get("mediaType"), t.get("id")) if t else None
    if key and key in seen_tmdb:
        target = seen_tmdb[key]
        aliases = target.setdefault("aliases", [])
        if item["title"] != target["title"] and item["title"] not in aliases:
            aliases.append(item["title"])
        for g in item.get("groups", []):
            if g not in target["groups"]:
                target["groups"].append(g)
        if item.get("status") == "vista":
            target["status"] = "vista"
        target["priority"] = target.get("priority") or item.get("priority")
        if item.get("note") and item["note"] not in target.get("note",""):
            target["note"] = (target.get("note","") + "; " + item["note"]).strip("; ")
    else:
        merged.append(item)
        if key:
            seen_tmdb[key] = item

SRC.write_text("window.WATCHLIST = " + json.dumps(merged, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
UNMATCHED.write_text(json.dumps(unmatched, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Enriched {sum(1 for x in merged if x.get('matchStatus') == 'matched')} entries")
print(f"Final catalogue: {len(merged)} entries; unmatched/errors: {len(unmatched)}")
