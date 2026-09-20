import json, os, re, time, unicodedata, urllib.parse, urllib.request
from difflib import SequenceMatcher
from pathlib import Path

TOKEN=os.environ.get("TMDB_API_TOKEN","").strip()
USE_V3_KEY=bool(re.fullmatch(r"[0-9a-fA-F]{32}",TOKEN))
SRC=Path("data/top-all-time.js")

if not TOKEN:
    raise SystemExit("TMDB_API_TOKEN is not configured.")

def api(path,params=None):
    params=dict(params or {})
    headers={"accept":"application/json","User-Agent":"cine-series-recomendaciones/1.0"}
    if USE_V3_KEY: params["api_key"]=TOKEN
    else: headers["Authorization"]="Bearer "+TOKEN
    url="https://api.themoviedb.org/3"+path
    if params: url+="?"+urllib.parse.urlencode(params)
    req=urllib.request.Request(url,headers=headers)
    with urllib.request.urlopen(req,timeout=30) as r:
        return json.load(r)

def norm(s):
    s=unicodedata.normalize("NFD",str(s or ""))
    s="".join(c for c in s if unicodedata.category(c)!="Mn")
    return re.sub(r"[^a-z0-9]+"," ",s.lower()).strip()

def score(query,result):
    names=[result.get("title"),result.get("original_title"),result.get("name"),result.get("original_name")]
    return max([SequenceMatcher(None,norm(query),norm(n)).ratio() for n in names if n] or [0])

raw=SRC.read_text(encoding="utf-8").strip()
prefix="window.TOP_ALL_TIME = "
items=json.loads(raw[len(prefix):].rstrip(";\n "))

movie_genres={x["id"]:x["name"] for x in api("/genre/movie/list",{"language":"es-MX"}).get("genres",[])}
tv_genres={x["id"]:x["name"] for x in api("/genre/tv/list",{"language":"es-MX"}).get("genres",[])}

matched=0
for item in items:
    is_movie=item["type"]=="Película"
    path="/search/movie" if is_movie else "/search/tv"
    params={"query":item["title"],"language":"es-MX","include_adult":"false","page":1}
    if item.get("year"):
        if is_movie: params["year"]=item["year"]
        else: params["first_air_date_year"]=item["year"]
    try:
        results=api(path,params).get("results",[])
        if not results:
            params.pop("year",None);params.pop("first_air_date_year",None)
            results=api(path,params).get("results",[])
        ranked=sorted(results,key=lambda r:score(item["title"],r),reverse=True)
        best=ranked[0] if ranked else None
        if not best or score(item["title"],best)<0.58:
            item["matchStatus"]="unmatched"
            continue
        genres_map=movie_genres if is_movie else tv_genres
        item["genres"]=[genres_map[g] for g in best.get("genre_ids",[]) if g in genres_map]
        item["poster"]="https://image.tmdb.org/t/p/w500"+best["poster_path"] if best.get("poster_path") else ""
        item["publicRating"]=round(float(best.get("vote_average") or 0),1)
        media="movie" if is_movie else "tv"
        item["tmdb"]={"id":best["id"],"url":f"https://www.themoviedb.org/{media}/{best['id']}","mediaType":media}
        gs=item["genres"][:2]
        genre_text=" y ".join(g.lower() for g in gs)
        if item["rank"]<=10:
            item["blurb"]="Una obra fundamental del canon audiovisual, destacada de forma recurrente por crítica, industria y público."
        elif genre_text:
            item["blurb"]=f"Una referencia esencial de {genre_text}, reconocida por su influencia y permanencia cultural."
        else:
            item["blurb"]="Una obra esencial para ampliar cualquier recorrido por la historia del cine y la televisión."
        item["matchStatus"]="matched"
        matched+=1
    except Exception as e:
        item["matchStatus"]="error"
        item["matchError"]=type(e).__name__
    time.sleep(0.08)

SRC.write_text(prefix+json.dumps(items,ensure_ascii=False,indent=2)+";\n",encoding="utf-8")
print(f"Enriched {matched}/{len(items)} all-time titles")
