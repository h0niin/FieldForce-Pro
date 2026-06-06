from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json
import os

router = APIRouter()

class SimilarityRequest(BaseModel):
    tenant_id: str
    subject: str
    description: Optional[str] = ""

class SimilarityResponse(BaseModel):
    is_duplicate: bool
    similarity_score: float

# A simple in-memory store for previous requests for demonstration.
# In production, this would query the database for recent requests.
history_store = []

@router.post("/similarity", response_model=SimilarityResponse)
async def check_similarity(request: SimilarityRequest):
    global history_store
    
    current_text = f"{request.subject} {request.description}".lower().strip()
    
    # Filter history by tenant
    tenant_history = [h for h in history_store if h['tenant_id'] == request.tenant_id]
    
    if not tenant_history or not current_text:
        # Save to history for future checks
        history_store.append({
            'tenant_id': request.tenant_id,
            'text': current_text
        })
        # Keep only last 1000 items to avoid memory leak
        if len(history_store) > 1000:
            history_store.pop(0)
            
        return SimilarityResponse(is_duplicate=False, similarity_score=0.0)

    # Use scikit-learn TF-IDF for similarity checking
    corpus = [h['text'] for h in tenant_history]
    corpus.append(current_text)
    
    vectorizer = TfidfVectorizer().fit_transform(corpus)
    vectors = vectorizer.toarray()
    
    # Compare the last element (current_text) with all others
    current_vec = vectors[-1].reshape(1, -1)
    history_vecs = vectors[:-1]
    
    similarities = cosine_similarity(current_vec, history_vecs)[0]
    max_similarity = float(max(similarities))
    
    # Save to history
    history_store.append({
        'tenant_id': request.tenant_id,
        'text': current_text
    })
    
    # Threshold for duplication is 80%
    is_duplicate = max_similarity > 0.80
    
    return SimilarityResponse(is_duplicate=is_duplicate, similarity_score=max_similarity)
