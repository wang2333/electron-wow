import pyautogui
import time
import signal
import sys
from typing import Dict, Tuple
from pynput import keyboard
from threading import Thread
import pygame
import os
from mss import mss  # 导入mss库
import numpy as np  # 导入numpy用于高效的数组操作
import random

# 从TypeScript文件中提取的颜色到按键的映射
COLOR_TO_KEY_MAP: Dict[str, str] = {
    '#8cd6ee': 'alt-ctrl-f1',
    '#8ca3ee': 'alt-ctrl-f2',
    '#9b8cee': 'alt-ctrl-f3',
    '#bd8ded': 'alt-ctrl-f4',
    '#e48cee': 'alt-ctrl-f5',
    '#ee8cdb': 'alt-ctrl-f6',
    '#ef8fbd': 'alt-ctrl-f7',
    '#ef8f92': 'alt-ctrl-f8',
    '#e673c4': 'alt-ctrl-f9',
    '#9571e8': 'alt-ctrl-f10',
    '#e7ae18': 'alt-ctrl-f11',
    '#e19257': 'alt-ctrl-f12',

    '#f5f9b7': 'alt-ctrl-shift-f1',
    '#f9ddb7': 'alt-ctrl-shift-f2',
    '#f7c2ae': 'alt-ctrl-shift-f3',
    '#f7aeae': 'alt-ctrl-shift-f4',
    '#eda08d': 'alt-ctrl-shift-f5',
    '#edb98d': 'alt-ctrl-shift-f6',
    '#edda8d': 'alt-ctrl-shift-f7',
    '#d2ed8d': 'alt-ctrl-shift-f8',
    '#a6ed8d': 'alt-ctrl-shift-f9',
    '#8dedce': 'alt-ctrl-shift-f10',
    '#31e4f9': 'alt-ctrl-shift-f11',
    '#8a88d0': 'alt-ctrl-shift-f12',

    '#aee6ae': 'alt-num0',
    '#bd4043': 'alt-num1',
    '#dc96c7': 'alt-num2',
    '#b54ac4': 'alt-num3',
    '#bd9bdf': 'alt-num4',
    '#5444c4': 'alt-num5',
    '#9eb7e0': 'alt-num6',
    '#57b4c8': 'alt-num7',
    '#97ddcf': 'alt-num8',
    '#4fc882': 'alt-num9',

    '#f8b4b6': 'alt-shift-f1',
    '#f9b3db': 'alt-shift-f2',
    '#fab1f4': 'alt-shift-f3',
    '#e2b3f9': 'alt-shift-f4',
    '#cbb1fa': 'alt-shift-f5',
    '#b0b3fb': 'alt-shift-f6',
    '#b0d2fb': 'alt-shift-f7',
    '#b3ecf9': 'alt-shift-f8',
    '#b7f9d8': 'alt-shift-f9',
    '#b7f9c2': 'alt-shift-f10',
    '#56b3da': 'alt-shift-f11',
    '#a669c7': 'alt-shift-f12',

    '#f78a48': 'alt-ctrl-num0',
    '#f9e746': 'alt-ctrl-num1',
    '#bffa45': 'alt-ctrl-num2',
    '#6dfa45': 'alt-ctrl-num3',
    '#44fbbf': 'alt-ctrl-num4',
    '#44c4fb': 'alt-ctrl-num5',
    '#4476fb': 'alt-ctrl-num6',
    '#9644fb': 'alt-ctrl-num7',
    '#f744fb': 'alt-ctrl-num8',
    '#fb4496': 'alt-ctrl-num9',

    '#59a323': 'ctrl-f1',
    '#35483c': 'ctrl-f2',
    '#b89eb8': 'ctrl-f3',
    '#b19eb8': 'ctrl-f4',
    '#ab9eb8': 'ctrl-f5',
    '#a59eb8': 'ctrl-f6',
    '#9e9eb8': 'ctrl-f7',
    '#9eb8b8': 'ctrl-f8',
    '#b89eb1': 'ctrl-f9',
    '#9eb1b8': 'ctrl-f10',
    '#9eb89e': 'ctrl-f11',
    '#b8b89e': 'ctrl-f12',

    '#e66f68': 'ctrl-num0',
    '#e7aa67': 'ctrl-num1',
    '#e8d166': 'ctrl-num2',
    '#dce965': 'ctrl-num3',
    '#9de965': 'ctrl-num4',
    '#22cc1e': 'ctrl-num5',
    '#40e3aa': 'ctrl-num6',
    '#40cbe3': 'ctrl-num7',
    '#3f75e4': 'ctrl-num8',
    '#743ee6': 'ctrl-num9',

    '#f154da': 'ctrl-shift-f1',
    '#e0a3f8': 'ctrl-shift-f2',
    '#8d56f3': 'ctrl-shift-f3',
    '#9c9cf8': 'ctrl-shift-f4',
    '#60a3f4': 'ctrl-shift-f5',
    '#b4f8fa': 'ctrl-shift-f6',
    '#6cf4aa': 'ctrl-shift-f7',
    '#c6fab4': 'ctrl-shift-f8',
    '#d7f777': 'ctrl-shift-f9',
    '#fac2da': 'ctrl-shift-f10',
    '#a56fbf': 'ctrl-shift-f11',
    '#83a34e': 'ctrl-shift-f12',

    '#ecb182': 'ctrl-shift-b',
    '#a6f4f2': 'ctrl-shift-c',
    '#a6f4c1': 'ctrl-shift-f',
    '#f4cfa6': 'ctrl-shift-g',
    '#ece782': 'ctrl-shift-h',
    '#82c7ec': 'ctrl-shift-i',
    '#81edda': 'ctrl-shift-j',
    '#b183eb': 'ctrl-shift-k',
    '#ea84b9': 'ctrl-shift-l',
    '#8393eb': 'ctrl-shift-m',
    '#81eda2': 'ctrl-shift-n',
    '#ea84ea': 'ctrl-shift-o',
    '#ea849b': 'ctrl-shift-p',
    '#c9f4a6': 'ctrl-shift-t',
    '#baec82': 'ctrl-shift-u',
    '#f4f2a6': 'ctrl-shift-v',
    '#a6c4f4': 'ctrl-shift-x',
    '#f4aaa6': 'ctrl-shift-y',
    '#bba6f4': 'ctrl-shift-z',

    '#28232c': 'shift-f1',
    '#b8ab9e': 'shift-f2',
    '#3f3d4e': 'shift-f3',
    '#b8a59e': 'shift-f4',
    '#b8b19e': 'shift-f5',
    '#30373f': 'shift-f6',
    '#9eabb8': 'shift-f7',
    '#9ea5b8': 'shift-f8',
    '#9eb8b1': 'shift-f9',
    '#b89eab': 'shift-f10',
    '#b1b89e': 'shift-f11',
    '#abb89e': 'shift-f12',

    '#8e4065': 'alt-f1',
    '#c477b6': 'alt-f2',
    '#8c4aac': 'alt-f3',
    '#8c76c7': 'alt-f4',
    '#4552ab': 'alt-f5',
    '#81bcc5': 'alt-f6',
    '#58b474': 'alt-f7',
    '#9fd599': 'alt-f8',
    '#9ebe5c': 'alt-f9',
    '#989138': 'alt-f10',
    '#dcbda0': 'alt-f11',
    '#7e3a3a': 'alt-f12',

    '#795e4d': 'f5',
    '#49623e': 'f6',
    '#30ad72': 'f7',
    '#963ea6': 'f8',
    '#337d49': 'f9',
    '#437e98': 'f10',
    '#77a9b0': 'f11',
    '#1e1c68': 'f12',

    '#a5b89e': 'combat',
    '#b6b485': 'ctrl-shiftleft-home',
    '#b89e9f': 'stop'
}

def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    """将RGB颜色值转换为十六进制颜色代码"""
    return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])

class AutoKeyController:
    def __init__(self, x1: int, x2: int, y: int, interval: float = 0.01):
        self.x1 = x1
        self.x2 = x2
        self.y = y
        self.current_x = x1
        self.interval = interval
        self.running = False

        # 初始化pygame音频
        pygame.mixer.init()
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.sound_f1 = pygame.mixer.Sound(os.path.join(current_dir, "", "model1.wav"))
        self.sound_f2 = pygame.mixer.Sound(os.path.join(current_dir, "", "model2.wav"))
        self.sound_f3_1 = pygame.mixer.Sound(os.path.join(current_dir, "", "start.wav"))
        self.sound_f3_2 = pygame.mixer.Sound(os.path.join(current_dir, "", "pause.wav"))

        # 初始化mss
        self.sct = mss()
        self.monitor = {"top": y, "left": min(x1, x2), "width": abs(x2-x1)+1, "height": 1}

        # 优化颜色匹配逻辑
        self.color_map = self._create_color_map()

    def _create_color_map(self):
        color_map = {}
        for hex_color, key in COLOR_TO_KEY_MAP.items():
            r, g, b = int(hex_color[1:3], 16), int(hex_color[3:5], 16), int(hex_color[5:7], 16)
            color_map[f"{r},{g},{b}"] = key
        return color_map

    def toggle(self):
        self.running = not self.running
        if self.running:
            self.sound_f3_1.play()
        else:
            self.sound_f3_2.play()
        print("自动按键已" + ("启动" if self.running else "停止"))

    def switch_to_x1(self):
        self.current_x = self.x1
        print(f"切换到坐标 X1: ({self.current_x}, {self.y})")
        self.sound_f1.play()  # 新增：播放F1音频

    def switch_to_x2(self):
        self.current_x = self.x2
        print(f"切换到坐标 X2: ({self.current_x}, {self.y})")
        self.sound_f2.play()  # 新增：播放F2音频

    def monitor_screen(self):
        print(f"开始监控坐标 ({self.current_x}, {self.y})")
        while True:
            if self.running:
                try:
                    screenshot = self.sct.grab(self.monitor)
                    img = np.array(screenshot)
                    pixel_color = img[0, self.current_x - self.monitor["left"]][:3]
                    color_key = f"{pixel_color[2]},{pixel_color[1]},{pixel_color[0]}"
                    if color_key in self.color_map:
                        key_combination = self.color_map[color_key]
                        self.execute_key_press(key_combination)
                except Exception as e:
                    print(f"发生错误: {e}")
            time.sleep(self.interval)

    def execute_key_press(self, key_combination):
        print(f"触发按键: {key_combination}")
        keys = key_combination.split('-')
        interval = random.uniform(0.05, 0.1)
        pyautogui.hotkey(*keys, interval=interval)


def on_press(key, controller):
    try:
        if key.char == '1':
            if not controller.running:
                controller.toggle()
            controller.switch_to_x1()
        elif key.char == '2':
            if not controller.running:
                controller.toggle()
            controller.switch_to_x2()
        elif key.char == '3':
            controller.toggle()
    except AttributeError:
        pass

def keyboard_listener(controller):
    with keyboard.Listener(on_press=lambda key: on_press(key, controller)) as listener:
        listener.join()

def signal_handler(signum, frame):
    print("接收到中断信号，正在退出...")
    sys.exit(0)

if __name__ == "__main__":
    # 设置要监控的屏幕坐标
    MONITOR_X1 = 1  # 请根据实际需要调整这个值
    MONITOR_X2 = 2550  # 请根据实际需要调整这个值
    MONITOR_Y = 25   # 请根据实际需要调整这个值

    controller = AutoKeyController(MONITOR_X1, MONITOR_X2, MONITOR_Y)

    # 设置信号处理
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # 启动键盘监听线程
    keyboard_thread = Thread(target=keyboard_listener, args=(controller,))
    keyboard_thread.daemon = True  # 设置为守护线程
    keyboard_thread.start()

    # 开始监控屏幕
    try:
        controller.monitor_screen()
    except KeyboardInterrupt:
        print("程序被用户中断")
    finally:
        print("正在清理资源...")
        pygame.mixer.quit()  # 新增：清理pygame音频资源
        sys.exit(0)  # 确保程序退出
