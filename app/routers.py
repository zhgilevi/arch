from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.service import write_info, frequent_items, get_burial_info, get_all_burials, frequent_burial_items


router = APIRouter()



@router.post("/burial/upload")
def upload_info(file: UploadFile, name: str, short_name: str, db: Session = Depends(get_db)):
    """endpoint for writing info from csv to database"""

    write_info(db, file, name, short_name)



@router.post("/cluster/clusters")
def get_clusters(cluster_num: int, db: Session = Depends(get_db)):
    response = frequent_items(db, cluster_num)
    return response
    

@router.get("/burial/all")
def get_burials_all( db: Session = Depends(get_db)):
    response = get_all_burials(db)
    return response


@router.get("/burial/{burial_short_name}")
def get_burial(burial_short_name: str, db: Session = Depends(get_db)):
    response = get_burial_info(db, burial_short_name)
    return response


@router.post("/cluster/burial_clusters")
def get_burial_clusters(clusters_num: int, burial_short_name:str, 
                        db: Session = Depends(get_db)):
    response = frequent_burial_items(clusters_num, burial_short_name, db)
    return response
    