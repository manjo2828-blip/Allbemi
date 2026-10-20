"""contracts/examples/ 예시 데이터를 스키마와 무결성 규칙으로 검사한다.

사용: py scripts/validate_examples.py
필요: pip install jsonschema
"""
import json
import pathlib
import sys

from jsonschema import Draft202012Validator

ROOT = pathlib.Path(__file__).resolve().parent.parent
C = ROOT / "contracts"
EX = C / "examples"

errors: list[str] = []


def load(path: pathlib.Path):
    return json.loads(path.read_text(encoding="utf-8"))


def validate(items, schema_name: str, label: str):
    validator = Draft202012Validator(load(C / schema_name))
    for item in items:
        for e in validator.iter_errors(item):
            where = "/".join(str(p) for p in e.absolute_path) or "(root)"
            errors.append(f"[스키마] {label} {item.get('id', '?')} · {where}: {e.message}")


projects = load(EX / "projects.json")
logs = load(EX / "logs.json")
cards = load(EX / "cards.json")
files = load(EX / "files.json")
judgments = load(EX / "judgments.json")

validate(projects, "project.schema.json", "project")
validate(logs, "log.schema.json", "log")
validate(cards, "decision-card.schema.json", "card")
validate(files, "file.schema.json", "file")
validate(judgments, "judgment.schema.json", "judgment")

proj = {p["id"] for p in projects}
log_by = {x["id"]: x for x in logs}
card_by = {x["id"]: x for x in cards}
file_by = {x["id"]: x for x in files}


def dup(items, label):
    ids = [i["id"] for i in items]
    for i in set(ids):
        if ids.count(i) > 1:
            errors.append(f"[중복] {label} id {i}")


for items, label in [(projects, "project"), (logs, "log"), (cards, "card"), (files, "file"), (judgments, "judgment")]:
    dup(items, label)

if sum(1 for p in projects if p["is_default"]) != 1:
    errors.append("[프로젝트] is_default가 true인 프로젝트는 정확히 1개여야 한다")

for x in logs:
    if x["project_id"] not in proj:
        errors.append(f"[참조] log {x['id']}: 없는 프로젝트 {x['project_id']}")

for c in cards:
    cid = c["id"]
    if c["project_id"] not in proj:
        errors.append(f"[참조] card {cid}: 없는 프로젝트")
    for e in c["evidence"]:
        lg = log_by.get(e["log_id"])
        if not lg:
            errors.append(f"[근거] card {cid}: 없는 로그 {e['log_id']}")
            continue
        if lg["project_id"] != c["project_id"]:
            errors.append(f"[근거] card {cid}: 다른 프로젝트의 로그 {e['log_id']}")
        if e["message_index"] >= len(lg["messages"]):
            errors.append(f"[근거] card {cid}: message_index 범위 초과 ({e['log_id']})")
            continue
        text = lg["messages"][e["message_index"]]["text"]
        if e["quote"] not in text:
            errors.append(f"[근거] card {cid}: 인용문이 원문에 없음 → {e['quote']!r}")
        if "span" in e and text[e["span"][0]:e["span"][1]] != e["quote"]:
            errors.append(f"[근거] card {cid}: span이 인용문과 맞지 않음 → {e['quote']!r}")
    for a in c["attachments"]:
        fl = file_by.get(a["file_id"])
        if not fl:
            errors.append(f"[첨부] card {cid}: 없는 파일 {a['file_id']}")
        else:
            if cid not in fl["linked_card_ids"]:
                errors.append(f"[첨부] card {cid} ↔ file {fl['id']}: 파일 쪽 linked_card_ids에 없음")
            if fl["project_id"] != c["project_id"]:
                errors.append(f"[첨부] card {cid}: 다른 프로젝트의 파일 {fl['id']}")
    for key, back in (("supersedes", "superseded_by"), ("superseded_by", "supersedes")):
        other = c[key]
        if other is None:
            continue
        o = card_by.get(other)
        if not o:
            errors.append(f"[대체] card {cid}: 없는 카드 {other}")
        elif o[back] != cid:
            errors.append(f"[대체] card {cid}.{key}={other} 인데 {other}.{back}={o[back]}")
        elif o["project_id"] != c["project_id"]:
            errors.append(f"[대체] card {cid}: 다른 프로젝트의 카드와 대체 관계")

for fl in files:
    if fl["project_id"] not in proj:
        errors.append(f"[참조] file {fl['id']}: 없는 프로젝트")
    if not fl["is_synthetic"]:
        errors.append(f"[공개] file {fl['id']}: 공개 저장소에는 합성 자료(is_synthetic=true)만 둔다")
    for cid in fl["linked_card_ids"]:
        c = card_by.get(cid)
        if not c:
            errors.append(f"[첨부] file {fl['id']}: 없는 카드 {cid}")
        elif fl["id"] not in {a["file_id"] for a in c["attachments"]}:
            errors.append(f"[첨부] file {fl['id']} ↔ card {cid}: 카드 쪽 attachments에 없음")

for j in judgments:
    if j["project_id"] not in proj:
        errors.append(f"[참조] judgment {j['id']}: 없는 프로젝트")
    for m in j["matched_cards"]:
        c = card_by.get(m["card_id"])
        if not c:
            errors.append(f"[판정] {j['id']}: 없는 카드 {m['card_id']}")
            continue
        if c["project_id"] != j["project_id"]:
            errors.append(f"[판정] {j['id']}: 다른 프로젝트의 카드 {c['id']}")
        rel = m["relation"]
        want = {"active_decision": "active", "deprecated_decision": "deprecated", "superseded_decision": "superseded"}
        if rel in want and c["status"] != want[rel]:
            errors.append(f"[판정] {j['id']}: {c['id']} 상태는 {c['status']}인데 relation={rel}")
        if rel == "rejected_alternative" and not c["rejected_alternatives"]:
            errors.append(f"[판정] {j['id']}: {c['id']}에 버린 대안이 없는데 relation=rejected_alternative")

# 프로젝트별로 화면에 필요한 다양성이 있는지
for p in projects:
    cs = [c for c in cards if c["project_id"] == p["id"]]
    vs = {j["verdict"] for j in judgments if j["project_id"] == p["id"]}
    st = {c["status"] for c in cs}
    print(f"  {p['id']}: 카드 {len(cs)}장, 상태 {sorted(st)}, 판정 {sorted(vs)}, "
          f"확인 필요 {sum(c['needs_review'] for c in cs)}장, 대체 쌍 {sum(1 for c in cs if c['status'] == 'superseded')}쌍")
all_verdicts = {j["verdict"] for j in judgments}
if all_verdicts != {"match", "conflict", "rejected", "unrelated"}:
    errors.append(f"[판정] 4종 판정이 모두 있어야 한다 (현재 {sorted(all_verdicts)})")
all_status = {c["status"] for c in cards}
if all_status != {"active", "deprecated", "superseded"}:
    errors.append(f"[카드] 3종 상태가 모두 있어야 한다 (현재 {sorted(all_status)})")

if errors:
    print(f"\n실패: {len(errors)}건")
    for e in errors:
        print(" -", e)
    sys.exit(1)
print(f"\n통과: 프로젝트 {len(projects)} · 로그 {len(logs)} · 카드 {len(cards)} · 파일 {len(files)} · 판정 {len(judgments)}")
