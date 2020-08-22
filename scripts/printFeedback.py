import json

f = open('output.txt', "r")

i = 1

for line in f:
	data = json.loads(line)
	# if(data["name"] != ""):
	# 	print(data["name"])
	# if(data["email"] != ""):
	# 	print("(" + data["email"] + ")")
	print("**" + str(i) + ")** " + data["feedback"] + "  ")
	print("\n")
	print("\n")
	i = i + 1