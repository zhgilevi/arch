import io
import re
from pathlib import Path
from typing import List, Dict, Any
from collections import Counter

import numpy as np
import pandas as pd
from fastapi import UploadFile
from gensim.models import Word2Vec
from sqlalchemy.orm import Session
from sklearn.cluster import KMeans

from app.models import Burial, EmbeddingVersion, BurialEmbedding, BurialInfo


BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models"


def find_sum(s: str) -> int:
    nums = list(map(int, re.findall(r"\d+", s)))
    if len(nums) > 0:
        return sum(nums)
    return 1


def write_info(
    db: Session,
    file: UploadFile,
    name: str,
    short_name: str,
):
    if not file.filename:
        raise ValueError("File name is missing")

    content = file.file.read()
    if not content:
        raise ValueError("Empty file")

    try:
        df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise ValueError(f"Failed to read file: {e}")

    table_cols = list(df.columns)[1:]
    
    df = df.apply(lambda x: x.replace("?", np.nan))
    df = df.fillna(0)


    for col in table_cols:
        df[col] = df[col].apply(lambda x: find_sum(str(x)))

    for col in table_cols:
        df[col] = df[col].astype(int)

    burial_info = db.query(BurialInfo).filter(
        BurialInfo.burial_short_name == short_name,
        BurialInfo.burial_name == name
    ).one_or_none()
    if burial_info is None:
        burial_info = BurialInfo(
            burial_name=name,
            burial_short_name=short_name
        )
        db.add(burial_info)
        db.flush()


    new_records = dataframe_to_records(
        df=df,
        table_cols=table_cols,
    )

    existing_burials = db.query(Burial).all()
    existing_records = burials_to_records(existing_burials)

    full_corpus_records = existing_records + new_records
    full_corpus = [record["items"] for record in full_corpus_records]

    embed_kv = train_embed_model(full_corpus)

    prev_active_versions = (
        db.query(EmbeddingVersion)
        .filter(EmbeddingVersion.status == "ACTIVE")
        .all()
    )
    for version in prev_active_versions:
        version.status = "ARCHIVED"

    last_version = (
        db.query(EmbeddingVersion)
        .order_by(EmbeddingVersion.version_no.desc())
        .first()
    )
    next_version_no = 1 if last_version is None else last_version.version_no + 1

    embedding_version = EmbeddingVersion(
        version_no=next_version_no,
        status="BUILDING",
    )
    db.add(embedding_version)
    db.flush()

    existing_embeddings = []
    for burial in existing_burials:
        vector = build_burial_embedding(burial.items or [], embed_kv)

        existing_embeddings.append(
            BurialEmbedding(
                burial_id=burial.id,
                embedding_version_id=embedding_version.id,
                vector=vector,
            )
        )

    db.add_all(existing_embeddings)

    new_embeddings = []
    for record in new_records:
        burial = Burial(
            kkm=record["kkm"],
            burial_info=burial_info,
            items=record["items"],
        )
        
        db.add(burial)
        db.flush()

        vector = build_burial_embedding(record["items"], embed_kv)

        new_embeddings.append(
            BurialEmbedding(
                burial_id=burial.id,
                embedding_version_id=embedding_version.id,
                vector=vector,
            )
        )

    db.add_all(new_embeddings)

    embedding_version.status = "ACTIVE"
    db.commit()


def dataframe_to_records(
    df: pd.DataFrame,
    table_cols: List[str],
) -> List[Dict[str, Any]]:
    records = []

    for i in range(len(df)):
        series = df.iloc[i]
        items = []

        for col in table_cols:
            count = int(series[col])
            for _ in range(count):
                items.append(col)

        records.append(
            {
                "kkm": str(series["ккм"]),
                "items": items,
            }
        )

    return records


def burials_to_records(burials: List[Burial]) -> List[Dict[str, Any]]:
    records = []

    for burial in burials:
        records.append(
            {
                "kkm": burial.kkm,
                "items": burial.items or [],
            }
        )

    return records


def build_burial_embedding(items: List[str], embed_kv) -> List[float]:
    embed = np.zeros(30, dtype=float)
    count = 0

    for item in items:
        if item in embed_kv:
            embed += embed_kv[item]
            count += 1

    return (embed / max(count, 1)).tolist()


def create_corpus(df: pd.DataFrame, table_cols: List[str]) -> List[List[str]]:
    corpus = []

    for i in range(len(df)):
        series = df.iloc[i]
        words = []

        for col in table_cols:
            for _ in range(int(series[col])):
                words.append(col)

        corpus.append(words)

    return corpus


def train_embed_model(corpus: List[List[str]]):
    embeddings_trained = Word2Vec(
        sentences=corpus,
        vector_size=30,
        window=10,
        min_count=1,
        workers=4,
        sg=1,
        epochs=30,
        negative=10,
        sample=0,
    ).wv

    MODEL_PATH.mkdir(parents=True, exist_ok=True)
    embeddings_trained.save(str(MODEL_PATH / "word_vectors.kv"))

    return embeddings_trained



def get_all_embeddings_full(db: Session):
    active_version = (
        db.query(EmbeddingVersion)
        .filter(EmbeddingVersion.status == "ACTIVE")
        .order_by(EmbeddingVersion.version_no.desc())
        .first()
    )

    if active_version is None:
        return []

    rows = (
        db.query(Burial, BurialEmbedding)
        .join(BurialEmbedding, Burial.id == BurialEmbedding.burial_id)
        .filter(BurialEmbedding.embedding_version_id == active_version.id)
        .order_by(Burial.id)
        .all()
    )

    result = []
    for burial, embedding in rows:
        result.append({
            "burial_id": burial.id,
            "kkm": burial.kkm,
            "burial_name": burial.burial_info.burial_name,
            "burial_short_name": burial.burial_info.burial_short_name,
            "items": burial.items,
            "vector": embedding.vector,
        })

    return result



def get_cluster(db: Session, cluster_num: int):
    try:
        data = get_all_embeddings_full(db)
        km = KMeans(n_clusters=cluster_num, n_init="auto", random_state=42)
        X = [record["vector"] for record in data]
        labels = km.fit_predict(X)
    except Exception as e:
        raise e
    
    return labels





def frequent_items(db: Session, cluster_num: int):

    data = get_all_embeddings_full(db)
    labels = get_cluster(db, cluster_num)

    cluster_to_ids: Dict[str, List[str]] = {}
    ids_to_short_name = {i["kkm"]: i["burial_short_name"] for i in data}
    cluster_subject_top = {}
    subjects_top = []
    for i, cid in zip(data, labels):
        cluster_to_ids.setdefault(int(cid), []).append(i["kkm"])
        c = int(cid)
        subjects = set(i["items"])

        if not subjects:
            continue

        cluster_subject_top.setdefault(c, [])
        cluster_subject_top[c].extend([{"subject": s} for s in i["items"]])
        subjects_top.extend(i["items"])

    for c in list(cluster_to_ids.keys()):
        raw = cluster_subject_top.get(c, [])
        counter = Counter([x["subject"] for x in raw]) if raw else Counter()
        top10 = [{"subject": s, "count": int(n)} for s, n in counter.most_common(10)]
        cluster_subject_top[c] = top10

    top_counter  = Counter(subjects_top)
    cluster_groups = []
    for c in sorted(cluster_to_ids.keys()):
        cluster_groups.append(
            {
                "cluster": c,
                "ids": cluster_to_ids[c],
                "short_name": [ids_to_short_name[idx] for idx in cluster_to_ids[c]],
                "count": len(cluster_to_ids[c]),
                "top_subjects": cluster_subject_top.get(c, []), 
            }
        )

    return cluster_groups




def get_burial_info(db: Session, short_name: str):

    burial_info = (
        db.query(BurialInfo).filter(
            BurialInfo.burial_short_name == short_name
        ).one_or_none()
                   )
    rows = (
        db.query(Burial)
        .filter(Burial.burial_info.has(BurialInfo.burial_short_name == short_name))
        .order_by(Burial.id)
        .all()
    )
    response = {"burial_name": burial_info.burial_name,
                "burial_short_name": burial_info.burial_short_name
                }

    result = []
    for burial in rows:
        result.append({
            "burial_id": burial.id,
            "kkm": burial.kkm,
            "items": burial.items,
        })
    response["burials"] = result

    return response

def get_all_burials(db: Session):

    response = []
    burials_info = (
        db.query(BurialInfo).all()
    )


    for burial_info in burials_info:
        burials = (
        db.query(Burial)
        .filter(Burial.burial_info.has(BurialInfo.id == burial_info.id))
        .order_by(Burial.id)
        .all()
    )
        data = []
        for burial in burials:
            data.append({
            "burial_id": burial.id,
            "kkm": burial.kkm,
            "items": burial.items,
        })
        response.append({"burial_name": burial_info.burial_name,
                "burial_short_name": burial_info.burial_short_name,
                "burials": data
                })
    
    return response
