from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
import numpy as np
import json
import pandas as pd
from tqdm import tqdm

qdrant_client = QdrantClient(
    url="https://88748863-e61f-48d6-b069-f6ee9461092c.eu-central-1-0.aws.cloud.qdrant.io:6333", 
    api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.P_xeAoAxHdrRpW8bI_-1FY2Xz8i0dW9PcmXbL-uabJA",
)

print(qdrant_client)  

