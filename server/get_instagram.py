import sys
import json
import os

# Add relevant directories to sys.path
curr_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(curr_dir)
if curr_dir not in sys.path:
    sys.path.insert(0, curr_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from parth_dl import get_info
except ImportError:
    try:
        from server.parth_dl import get_info
    except ImportError:
        get_info = None

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "URL parameter missing"}))
        sys.exit(0)

    if not get_info:
        print(json.dumps({"success": False, "error": "parth_dl module could not be loaded"}))
        sys.exit(0)

    url = sys.argv[1].strip()
    try:
        info = get_info(url, verbose=False)
        if not info:
            print(json.dumps({"success": False, "error": "No media info returned"}))
            sys.exit(0)
        print(json.dumps({"success": True, "data": info}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(0)

if __name__ == "__main__":
    main()
