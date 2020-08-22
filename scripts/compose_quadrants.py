filename_top_left     = "cmu_top_left.txt"
filename_top_right    = "cmu_top_right.txt"
filename_bottom_left  = "cmu_bottom_left.txt"
filename_bottom_right = "cmu_bottom_right.txt"
filename_output       = "cmu.txt"

n_rows = 100

out = open(filename_output,"w") 


def getRows(file):
	rows = []
	for line in file:
		if(line[-1] == "\n"):
			line = line[0:-1]
		rows += [line]
	return rows


#top
top_left = open(filename_top_left, "r")
top_left_rows = getRows(top_left)

top_right = open(filename_top_right, "r") 
top_right_rows = getRows(top_right)

for i in range(0, n_rows):
	row = top_left_rows[i] + top_right_rows[i] + "\n"
	out.write(row)

# #bottom
bottom_left = open(filename_bottom_left, "r")
bottom_left_rows = getRows(bottom_left)

bottom_right = open(filename_bottom_right, "r") 
bottom_right_rows = getRows(bottom_right)

for i in range(0, n_rows):
	row = bottom_left_rows[i] + bottom_right_rows[i] + "\n"
	out.write(row)

top_left.close() 
top_right.close()
bottom_left.close()
bottom_right.close()
out.close()