import sys
import json
import pandas as pd

# Load slippy DataBase
df = pd.read_csv("slippyData.csv")

#Read Data from JS program
function = int(sys.argv[1]) # Specifies which command type

if len(sys.argv) > 2:
    data = json.loads(sys.argv[2])

if(function == 1):
    data["messageTime"] = pd.to_datetime(data["messageTime"], unit="ms")
    
    exceptExpected = data.get("expectedTime")
    if(exceptExpected):
        data["expectedTime"] = pd.to_datetime(data["expectedTime"], unit="ms")
    else:
        data["expectedTime"] = None

    newRow = pd.DataFrame([data])
    df = pd.concat([df, newRow], ignore_index = True)
    print(df.head)
    df.to_csv("slippyData.csv", index=False)