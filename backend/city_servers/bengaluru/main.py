import uvicorn
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from city_servers.city_service import create_city_app

app = create_city_app(city_name="bengaluru", port=8002)

if __name__ == "__main__":
    uvicorn.run("bengaluru.main:app", host="0.0.0.0", port=8002, reload=True)
