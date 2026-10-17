"""Run backend (FastAPI :8000) and frontend (Vite :5173) together:  python start.py"""
import os, shutil, subprocess, sys

root = os.path.dirname(os.path.abspath(__file__))
be, fe = os.path.join(root, "backend"), os.path.join(root, "frontend")
npm = shutil.which("npm") or "npm"
subprocess.run([sys.executable, "-m", "pip", "install", "-q", "-r", "requirements.txt"], cwd=be, check=True)
if not os.path.isdir(os.path.join(fe, "node_modules")):
    subprocess.run([npm, "install"], cwd=fe, check=True)
procs = [
    subprocess.Popen([sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"], cwd=be),
    subprocess.Popen([npm, "run", "dev"], cwd=fe),
]
print("PAPERARSE -> http://localhost:5173")
try:
    for p in procs:
        p.wait()
except KeyboardInterrupt:
    for p in procs:
        p.terminate()
