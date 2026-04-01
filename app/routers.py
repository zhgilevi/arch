from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.service import write_info, frequent_items, get_burial_info


router = APIRouter()



@router.post("/burial/upload")
def upload_info(file: UploadFile, name: str, short_name: str, db: Session = Depends(get_db)):
    """endpoint for writing info from csv to database"""

    write_info(db, file, name, short_name)



@router.get("/cluster/clusters")
def get_clusters(cluster_num: int, db: Session = Depends(get_db)):
    response = frequent_items(db, cluster_num)
    return response
    


@router.get("/burial/{burial_short_name}")
def get_burial(burial_short_name: str, db: Session = Depends(get_db)):
    response = get_burial_info(db, burial_name)
    return response