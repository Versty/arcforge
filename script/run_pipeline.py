#!/usr/bin/env python
import subprocess
import sys
from pathlib import Path

subprocess.run([sys.executable, "get_item_data_from_wiki.py"], check=True, cwd=Path(__file__).parent)
subprocess.run([sys.executable, "get_trader_data_from_wiki.py"], check=True, cwd=Path(__file__).parent)
subprocess.run([sys.executable, "adjust_item_data.py"], check=True, cwd=Path(__file__).parent)
subprocess.run([sys.executable, "build_relation_graph.py"], check=True, cwd=Path(__file__).parent)
