import sys
import json
import pandas as pd

# Load slippy DataBase
df = pd.read_csv("../slippyData.csv")

#Read Data from JS program
functionType = int(sys.argv[1]) # Specifies which command type
if len(sys.argv) > 2:
    data = json.loads(sys.argv[2])

print("worked!")
