import cv2
import argparse
import os
import string
import math

global objectsize, im, terrain_coors, original_im

global leftMouseDown, rightMouseDown
leftMouseDown = False
rightMouseDown = False

def get_box_coors(input_x, input_y):
    return (input_x // objectsize, input_y // objectsize)

def highlight_square(x, y):
    global im
    xcoor = x * objectsize
    ycoor = y * objectsize
    if (y, x) in terrain_coors:
        color = (0, 0, 0)
        terrain_coors.remove((y, x))
    else:
        color = (255, 255, 255)
        terrain_coors.add((y, x))
    cv2.line(im, (xcoor, ycoor), (xcoor + objectsize - 1, ycoor), color, 3)
    cv2.line(im, (xcoor, ycoor), (xcoor, ycoor + objectsize - 1), color, 3)
    cv2.line(im, (xcoor + objectsize - 1, ycoor), (xcoor + objectsize - 1, ycoor + objectsize - 1), color, 3)
    cv2.line(im, (xcoor, ycoor + objectsize - 1), (xcoor + objectsize - 1, ycoor + objectsize - 1), color, 3)

def mouse_callback(event, x, y, flags, param):
    global leftMouseDown, rightMouseDown
    if event == cv2.EVENT_LBUTTONDOWN:
        leftMouseDown = not leftMouseDown
        if(rightMouseDown):
            rightMouseDown = False       
    elif event == cv2.EVENT_RBUTTONDOWN:
        rightMouseDown = not rightMouseDown
        if(leftMouseDown):
            leftMouseDown = False     
    elif event == cv2.EVENT_MOUSEMOVE:
        (grid_x, grid_y) = get_box_coors(x, y)
        print('mouse callback with {} {}'.format(grid_x, grid_y))
        if(leftMouseDown):
            if (grid_y, grid_x) not in terrain_coors:
                highlight_square(grid_x, grid_y)
        if(rightMouseDown):
            if (grid_y, grid_x) in terrain_coors:
                highlight_square(grid_x, grid_y)

def draw_gridlines():
    global im
    # rows
    for x in range(1, im.shape[1] // args.objectsize):
        xcoor = args.objectsize * x
        cv2.line(im, (xcoor, 0), (xcoor, im.shape[0] - 1), (0, 0, 0), 3)

    for y in range(1, im.shape[0] // args.objectsize):
        ycoor = args.objectsize * y
        cv2.line(im, (0, ycoor), (im.shape[1] - 1, ycoor), (0, 0, 0), 3)

def resize_im(scale):
    global im, original_im
    width = int(original_im.shape[1] * scale)
    height = int(original_im.shape[0] * scale)
    dim = (width, height)
    im = cv2.resize(original_im, dim, interpolation=cv2.INTER_CUBIC)
    original_im = cv2.resize(original_im, dim, interpolation=cv2.INTER_CUBIC)
    draw_gridlines()
    terrain_coors = set()

def strip_punc(s):
    return s.translate(str.maketrans('', '', string.punctuation))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('objectsize', type=int)
    parser.add_argument('imagepath', type=str)
    parser.add_argument('--scale', type=float)
    parser.add_argument('--terrainfile', default='terrain.txt', type=str)
    args = parser.parse_args()

    objectsize = args.objectsize
    im = cv2.imread(args.imagepath)
    original_im = cv2.imread(args.imagepath)
    print('original im')
    print(original_im.shape)
    draw_gridlines()

    terrain_coors = set()
    if os.path.exists(args.terrainfile):
        with open(args.terrainfile, 'r') as fin:
            lines = fin.readlines()
            for y in range(len(lines)):
                nums = [int(strip_punc(temp)) for temp in lines[y].split(' ')]
                for x in range(len(nums)):
                    if nums[x] == 1:
                        highlight_square(x, y)

    cv2.namedWindow('image', cv2.WINDOW_NORMAL)
    if args.scale:
        scaled_width = int(im.shape[1] * args.scale)
        scaled_height = int(im.shape[0] * args.scale)
        print('scale: {}, (w, h): {}, {}'.format(args.scale, scaled_width, scaled_height))
        cv2.resizeWindow('image', (scaled_width, scaled_height))
    mouseDown = False
    cv2.setMouseCallback('image', mouse_callback)
    while True:
        cv2.imshow('image', im)
        k = cv2.waitKey(10) & 0xFF
        if k == ord('a'):
            with open(args.terrainfile, 'w') as fout:
                to_write = [[0 for _ in range(math.ceil(im.shape[1] / objectsize))] for _ in range(math.ceil(im.shape[0] / objectsize))]
                for (temp_x, temp_y) in terrain_coors:
                    print('{} {} terrain_coors'.format(temp_x, temp_y))
                    to_write[temp_x][temp_y] = 1
                for temp_x in range(len(to_write)):
                    row = to_write[temp_x]
                    fout.write('[' + str(row[0]))
                    for temp_y in range(1, len(row)):
                        fout.write(', ' + str(row[temp_y]))
                    if temp_x == len(to_write) - 1:
                        fout.write(']')
                    else:
                        fout.write('],\n')
            cv2.imwrite(args.imagepath, original_im)
        elif k == ord('p'):
            resize_im(1.01)
        elif k == ord('o'):
            resize_im(0.99)
        elif k == 27:  # Esc
            break
    cv2.destroyAllWindows()