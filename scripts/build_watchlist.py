import json, re, unicodedata
from pathlib import Path

RAW = Path("data/lista_personal_raw.txt")
OUT = Path("data/watchlist.js")

HEADING_MAP = {
    "Series y películas por ver:": "Lista general",
    "Francella:": "Francella",
    "Películas -series": "Películas y series",
    "Series coreanas / chinas": "Series coreanas / chinas",
    "Pelis coreanas:": "Películas coreanas",
    "Otras:": "Películas coreanas / otras",
    "Agatha Christie": "Agatha Christie",
    "Bélicas:": "Bélicas",
}

SKIP_PREFIXES = (
    "Antología de suspenso basada",
    "10 se encuentran disponibles",
    "Las mejores películas",
)

def norm(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "", s.lower())

def clean_title(line):
    original = line.strip()
    seen = "✓" in original
    priority = original.endswith("**") or original.endswith("*")
    s = original.replace("✓", "").strip()

    # Rankings / list numbers, without damaging numeric titles such as 1883, 1923, 13 vidas or 30 monedas.
    s = re.sub(r"^[0-9]+[️⃣]\s*", "", s)
    s = re.sub(r"^[0-9]{1,2}\s*[\.\)]\s*", "", s)
    s = re.sub(r"^[0-9]{1,2}\s+(?=['‘“#])", "", s)
    s = re.sub(r"^#(?=\w)", "", s)
    s = s.strip(" '‘’\"")

    year = None
    m = re.search(r"\((19|20)\d{2}\)", s)
    if m:
        year = int(m.group(0)[1:-1])
        s = (s[:m.start()] + s[m.end():]).strip()

    note = ""
    # Keep explanatory parentheticals as notes, but remove them from matching title.
    parens = re.findall(r"\(([^)]{2,})\)", s)
    if parens:
        note = "; ".join(parens)
        s = re.sub(r"\s*\([^)]{2,}\)\s*", " ", s).strip()

    s = s.replace("#", "").strip()
    s = re.sub(r"\*+$", "", s).strip()
    s = re.sub(r"\s+", " ", s)

    return s, seen, priority, year, note

def main():
    lines = RAW.read_text(encoding="utf-8").splitlines()
    group = "Lista general"
    items = []
    by_key = {}

    for raw in lines:
        line = raw.strip()
        if not line:
            if group == "Francella":
                group = "Lista general"
            continue

        if line in HEADING_MAP:
            group = HEADING_MAP[line]
            continue
        if line.startswith("Películas de A24 estrenadas"):
            group = "A24 2024"
            continue
        if "(director)" in line.lower():
            group = re.sub(r"\s*\(director\)\s*", "", line, flags=re.I).strip()
            continue
        if any(line.startswith(x) for x in SKIP_PREFIXES):
            continue
        if line.endswith(":") and len(line) < 70:
            group = line[:-1].strip()
            continue

        title, seen, priority, year, note = clean_title(line)
        if not title or len(title) < 2:
            continue

        key = norm(title)
        if not key:
            continue

        item = {
            "id": key[:90],
            "title": title,
            "status": "vista" if seen else "por-ver",
            "groups": [group],
            "priority": priority,
            "year": year,
            "note": note,
            "tmdb": None,
            "poster": "",
            "publicRating": None,
            "publicRatingSource": "TMDb",
            "review": "",
            "rottenTomatoes": None
        }

        if key in by_key:
            prev = by_key[key]
            if group not in prev["groups"]:
                prev["groups"].append(group)
            if seen:
                prev["status"] = "vista"
            prev["priority"] = prev["priority"] or priority
            prev["year"] = prev["year"] or year
            if note and note not in prev["note"]:
                prev["note"] = (prev["note"] + "; " + note).strip("; ")
        else:
            by_key[key] = item
            items.append(item)

    js = "window.WATCHLIST = " + json.dumps(items, ensure_ascii=False, indent=2) + ";\n"
    OUT.write_text(js, encoding="utf-8")
    print(f"Generated {len(items)} unique entries")

if __name__ == "__main__":
    main()
