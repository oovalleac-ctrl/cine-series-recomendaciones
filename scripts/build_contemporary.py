import json, math, os, re, time, urllib.parse, urllib.request
from datetime import date
from pathlib import Path

TOKEN=os.environ.get("TMDB_API_TOKEN","").strip()
USE_V3_KEY=bool(re.fullmatch(r"[0-9a-fA-F]{32}",TOKEN))
OUT=Path("data/contemporary.js")
START_DATE="2000-01-01"
END_DATE=date.today().isoformat()
TARGET=240

if not TOKEN:
    raise SystemExit("TMDB_API_TOKEN is not configured.")

def api(path,params=None):
    params=dict(params or {})
    headers={"accept":"application/json","User-Agent":"cine-series-recomendaciones/1.0"}
    if USE_V3_KEY:
        params["api_key"]=TOKEN
    else:
        headers["Authorization"]="Bearer "+TOKEN
    url="https://api.themoviedb.org/3"+path
    if params:
        url+="?"+urllib.parse.urlencode(params)
    req=urllib.request.Request(url,headers=headers)
    with urllib.request.urlopen(req,timeout=30) as r:
        return json.load(r)

genres={g["id"]:g["name"] for g in api("/genre/movie/list",{"language":"es-MX"}).get("genres",[])}

candidates={}
queries=[
    {
        "sort_by":"vote_average.desc",
        "vote_count.gte":250,
        "primary_release_date.gte":START_DATE,
        "primary_release_date.lte":END_DATE,
        "include_adult":"false",
        "include_video":"false",
        "language":"es-MX"
    },
    {
        "sort_by":"vote_count.desc",
        "vote_average.gte":6.8,
        "primary_release_date.gte":START_DATE,
        "primary_release_date.lte":END_DATE,
        "include_adult":"false",
        "include_video":"false",
        "language":"es-MX"
    }
]

for base in queries:
    for page in range(1,31):
        params=dict(base)
        params["page"]=page
        payload=api("/discover/movie",params)
        for r in payload.get("results",[]):
            if not r.get("poster_path"): 
                continue
            if not r.get("release_date"):
                continue
            if int(r.get("vote_count") or 0) < 250:
                continue
            candidates[r["id"]]=r
        time.sleep(0.05)

vals=[float(r.get("vote_average") or 0) for r in candidates.values() if r.get("vote_average")]
C=sum(vals)/len(vals) if vals else 7.0
M=800.0

def weighted(r):
    v=float(r.get("vote_count") or 0)
    R=float(r.get("vote_average") or 0)
    return (v/(v+M))*R + (M/(v+M))*C

ranked=sorted(candidates.values(),key=lambda r:(weighted(r),float(r.get("vote_average") or 0),int(r.get("vote_count") or 0)),reverse=True)

items=[]
for rank,r in enumerate(ranked[:TARGET],1):
    year=int(r["release_date"][:4])
    gs=[genres[g] for g in r.get("genre_ids",[]) if g in genres]
    rating=round(float(r.get("vote_average") or 0),1)
    votes=int(r.get("vote_count") or 0)
    w=round(weighted(r),3)

    if rating>=8.2 and votes>=1000:
        blurb="Una de las películas contemporáneas con recepción pública más sólida y sostenida."
    elif rating>=7.8:
        blurb="Muy bien valorada por el público y una referencia destacada dentro de su género."
    else:
        blurb="Una película contemporánea con valoración sólida y una audiencia amplia."

    items.append({
        "rank":rank,
        "tmdbId":r["id"],
        "title":r.get("title") or r.get("original_title") or "",
        "originalTitle":r.get("original_title") or "",
        "year":year,
        "releaseDate":r.get("release_date"),
        "genres":gs,
        "poster":"https://image.tmdb.org/t/p/w500"+r["poster_path"],
        "publicRating":rating,
        "voteCount":votes,
        "weightedScore":w,
        "popularity":round(float(r.get("popularity") or 0),1),
        "tmdbUrl":f"https://www.themoviedb.org/movie/{r['id']}",
        "blurb":blurb
    })

OUT.write_text("window.CONTEMPORARY_MOVIES = "+json.dumps(items,ensure_ascii=False,indent=2)+";\n",encoding="utf-8")
print(f"Generated {len(items)} contemporary movies from {len(candidates)} candidates")
print(f"Rating mean={C:.3f}; release window={START_DATE}..{END_DATE}")
