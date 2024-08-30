import win32gui
import win32ui
import win32con
from PIL import Image, ImageTk
import numpy as np
import cv2
import tkinter as tk
from tkinter import Label
from collections import deque

# ORB related functions
def get_multiscale_features(image, mask_size, scales=[1.0, 0.75, 0.5, 0.25]):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    height, width = gray.shape
    cx, cy = width // 2, height // 2
    half_size = mask_size // 2

    mask = np.ones((height, width), dtype=np.uint8) * 255
    mask[cy - half_size:cy + half_size, cx - half_size:cx + half_size] = 0

    all_keypoints = []
    all_descriptors = []

    for scale in scales:
        scaled_img = cv2.resize(gray, (0, 0), fx=scale, fy=scale)
        scaled_mask = cv2.resize(mask, (0, 0), fx=scale, fy=scale)
        orb = cv2.ORB_create(nfeatures=5000)
        keypoints, descriptors = orb.detectAndCompute(scaled_img, scaled_mask)
        if descriptors is not None:
            all_keypoints.extend(keypoints)
            if len(all_descriptors) == 0:
                all_descriptors = descriptors
            else:
                all_descriptors = np.vstack((all_descriptors, descriptors))

    return all_keypoints, np.array(all_descriptors)

def match_features(des1, des2):
    bf = cv2.BFMatcher(cv2.NORM_HAMMING)
    matches = bf.knnMatch(des1, des2, k=2)

    # Apply ratio test
    good_matches = []
    for m, n in matches:
        if m.distance < 0.75 * n.distance:
            good_matches.append(m)

    good_matches = sorted(good_matches, key=lambda x: x.distance)
    return good_matches

def calculate_movement(kp1, kp2, matches, distance_threshold, movement_speed):
    movements = []
    for match in matches:
        if match.distance < distance_threshold:
            pt1 = np.array(kp1[match.queryIdx].pt)
            pt2 = np.array(kp2[match.trainIdx].pt)
            movement = pt2 - pt1
            movements.append(movement)
    if len(movements) > 0:
        average_movement = np.median(movements, axis=0) * movement_speed
        return average_movement, True
    else:
        return np.array([0, 0]), False

# Screenshot and window finding functions
def capture_window_region(hwnd, x, y, width, height):
    window_dc = win32gui.GetWindowDC(hwnd)
    dc_obj = win32ui.CreateDCFromHandle(window_dc)
    compatible_dc = dc_obj.CreateCompatibleDC()

    bitmap = win32ui.CreateBitmap()
    bitmap.CreateCompatibleBitmap(dc_obj, width, height)
    compatible_dc.SelectObject(bitmap)
    compatible_dc.BitBlt((0, 0), (width, height), dc_obj, (x, y), win32con.SRCCOPY)

    bitmap_info = bitmap.GetInfo()
    bitmap_bits = bitmap.GetBitmapBits(True)

    img = Image.frombuffer(
        'RGB',
        (bitmap_info['bmWidth'], bitmap_info['bmHeight']),
        bitmap_bits, 'raw', 'BGRX', 0, 1
    )

    win32gui.DeleteObject(bitmap.GetHandle())
    compatible_dc.DeleteDC()
    dc_obj.DeleteDC()
    win32gui.ReleaseDC(hwnd, window_dc)

    return np.array(img)

def find_window_by_title(title):
    hwnd = win32gui.FindWindow(None, title)
    if hwnd == 0:
        raise Exception(f"Window with title '{title}' not found!")
    return hwnd

def preprocess_image(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    equalized = cv2.equalizeHist(gray)
    equalized_rgb = cv2.cvtColor(equalized, cv2.COLOR_GRAY2RGB)
    return equalized_rgb

def match_and_stitch(image1, image2, movement_speed):
    mask_size = 26
    distance_threshold = 35

    kp1, des1 = get_multiscale_features(image1, mask_size)
    kp2, des2 = get_multiscale_features(image2, mask_size)

    matches = match_features(des1, des2)
    good_matches = [m for m in matches if m.distance < distance_threshold]

    movement, reliable = calculate_movement(kp1, kp2, good_matches, distance_threshold, movement_speed)

    if reliable:
        return -movement.astype(int), len(good_matches)  # 反转平移向量的方向
    else:
        return None, 0

def update_image():
    global big_image, screenshot_np, x, y, width, height, offset, hwnd, window, show_trace, trace_points, center_x, center_y, movement_speed

    new_screenshot = capture_window_region(hwnd, x, y, width, height)
    new_screenshot = preprocess_image(new_screenshot)

    translation, good_matches_count = match_and_stitch(screenshot_np, new_screenshot, movement_speed)

    if translation is not None:
        offset = (offset[0] + translation[0], offset[1] + translation[1])
        center_current = (offset[0] + width // 2, offset[1] + height // 2)
        trace_points.append(center_current)

        new_x = max(0, min(offset[0], big_image.shape[1] - new_screenshot.shape[1]))
        new_y = max(0, min(offset[1], big_image.shape[0] - new_screenshot.shape[0]))

        big_image[new_y:new_y+new_screenshot.shape[0], new_x:new_x+new_screenshot.shape[1]] = new_screenshot

        if show_trace and len(trace_points) > 1:
            for i in range(len(trace_points) - 1):
                cv2.line(big_image, trace_points[i], trace_points[i + 1], (0, 255, 0), 2)

        resize_and_update_image()

        screenshot_np = new_screenshot

        current_x = offset[0] + width // 2
        current_y = offset[1] + height // 2
        window.title(f"GPS: ({current_x - center_x}, {current_y - center_y}) - Speed: {movement_speed:.1f}")

    window.after(500, update_image)

def on_key_press(event):
    global show_trace, movement_speed
    if event.char.lower() == 'q':
        save_image_and_exit()
    elif event.char.lower() == 'l':
        show_trace = not show_trace
    elif event.char.lower() == '-':
        movement_speed = max(0.1, movement_speed - 0.1)
    elif event.char.lower() == '+':
        movement_speed = min(2.0, movement_speed + 0.1)
    window.title(f"Big Map - Speed: {movement_speed:.1f}")

def save_image_and_exit():
    global big_image
    img_pil = Image.fromarray(big_image)
    img_pil.save("Map.png")
    window.destroy()

def resize_and_update_image(event=None):
    global big_image, label, window

    window_width = window.winfo_width()
    window_height = window.winfo_height()

    aspect_ratio = big_image.shape[1] / big_image.shape[0]
    new_height = int(window_width / aspect_ratio)
    if new_height > window_height:
        new_height = window_height
        new_width = int(window_height * aspect_ratio)
    else:
        new_width = window_width

    resized_image = cv2.resize(big_image, (new_width, new_height), interpolation=cv2.INTER_AREA)
    img_pil = Image.fromarray(resized_image)
    img_tk = ImageTk.PhotoImage(image=img_pil)
    label.config(image=img_tk)
    label.image = img_tk

def main():
    global big_image, screenshot_np, x, y, width, height, hwnd, label, offset, window, show_trace, trace_points, center_x, center_y, movement_speed

    window_title = '魔兽世界'
    hwnd = find_window_by_title(window_title)

    x, y, width, height = 1764, 110, 95, 95

    big_image_width, big_image_height = 1000, 1000
    window = tk.Tk()
    window.title("Big Map - Speed: 1.0")
    window.geometry(f"{big_image_width}x{big_image_height}")
    window.attributes("-topmost", True)

    label = Label(window)
    label.pack()

    screenshot = capture_window_region(hwnd, x, y, width, height)
    screenshot = preprocess_image(screenshot)
    screenshot_np = np.array(screenshot)

    big_image = np.zeros((big_image_height, big_image_width, 3), dtype=np.uint8)

    center_x, center_y = big_image_width // 2, big_image_height // 2
    start_x, start_y = center_x - width // 2, center_y - height // 2
    big_image[start_y:start_y+height, start_x:start_x+width] = screenshot_np

    offset = (start_x, start_y)
    trace_points = deque([(center_x, center_y)])  # 追踪点从截图中心开始

    resize_and_update_image()

    show_trace = True  # 默认显示轨迹线
    movement_speed = 1.05  # 移动速度初始值

    window.after(500, update_image)

    window.bind('<KeyPress>', on_key_press)
    window.bind('<Configure>', resize_and_update_image)

    window.mainloop()

if __name__ == "__main__":
    main()
