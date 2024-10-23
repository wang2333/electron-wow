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

# 从TypeScript文件中提取的颜色到按键的映射
COLOR_TO_KEY_MAP: Dict[str, str] = {
    '#8cd6ee': 'altleft-ctrlleft-f1',
    '#8ca3ee': 'altleft-ctrlleft-f2',
    '#9b8cee': 'altleft-ctrlleft-f3',
    '#bd8ded': 'altleft-ctrlleft-f4',
    '#e48cee': 'altleft-ctrlleft-f5',
    '#ee8cdb': 'altleft-ctrlleft-f6',
    '#ef8fbd': 'altleft-ctrlleft-f7',
    '#ef8f92': 'altleft-ctrlleft-f8',
    '#e673c4': 'altleft-ctrlleft-f9',
    '#9571e8': 'altleft-ctrlleft-f10',
    '#e7ae18': 'altleft-ctrlleft-f11',
    '#e19257': 'altleft-ctrlleft-f12',

    '#f5f9b7': 'altleft-ctrlleft-leftshift-f1',
    '#f9ddb7': 'altleft-ctrlleft-leftshift-f2',
    '#f7c2ae': 'altleft-ctrlleft-leftshift-f3',
    '#f7aeae': 'altleft-ctrlleft-leftshift-f4',
    '#eda08d': 'altleft-ctrlleft-leftshift-f5',
    '#edb98d': 'altleft-ctrlleft-leftshift-f6',
    '#edda8d': 'altleft-ctrlleft-leftshift-f7',
    '#d2ed8d': 'altleft-ctrlleft-leftshift-f8',
    '#a6ed8d': 'altleft-ctrlleft-leftshift-f9',
    '#8dedce': 'altleft-ctrlleft-leftshift-f10',
    '#31e4f9': 'altleft-ctrlleft-leftshift-f11',
    '#8a88d0': 'altleft-ctrlleft-leftshift-f12',

    '#aee6ae': 'altleft-0',
    '#bd4043': 'altleft-1',
    '#dc96c7': 'altleft-2',
    '#b54ac4': 'altleft-3',
    '#bd9bdf': 'altleft-4',
    '#5444c4': 'altleft-5',
    '#9eb7e0': 'altleft-6',
    '#57b4c8': 'altleft-7',
    '#97ddcf': 'altleft-8',
    '#4fc882': 'altleft-9',

    '#f8b4b6': 'altleft-leftshift-f1',
    '#f9b3db': 'altleft-leftshift-f2',
    '#fab1f4': 'altleft-leftshift-f3',
    '#e2b3f9': 'altleft-leftshift-f4',
    '#cbb1fa': 'altleft-leftshift-f5',
    '#b0b3fb': 'altleft-leftshift-f6',
    '#b0d2fb': 'altleft-leftshift-f7',
    '#b3ecf9': 'altleft-leftshift-f8',
    '#b7f9d8': 'altleft-leftshift-f9',
    '#b7f9c2': 'altleft-leftshift-f10',
    '#56b3da': 'altleft-leftshift-f11',
    '#a669c7': 'altleft-leftshift-f12',

    '#f78a48': 'altleft-ctrlleft-0',
    '#f9e746': 'altleft-ctrlleft-1',
    '#bffa45': 'altleft-ctrlleft-2',
    '#6dfa45': 'altleft-ctrlleft-3',
    '#44fbbf': 'altleft-ctrlleft-4',
    '#44c4fb': 'altleft-ctrlleft-5',
    '#4476fb': 'altleft-ctrlleft-6',
    '#9644fb': 'altleft-ctrlleft-7',
    '#f744fb': 'altleft-ctrlleft-8',
    '#fb4496': 'altleft-ctrlleft-9',

    '#59a323': 'ctrlleft-f1',
    '#35483c': 'ctrlleft-f2',
    '#b89eb8': 'ctrlleft-f3',
    '#b19eb8': 'ctrlleft-f4',
    '#ab9eb8': 'ctrlleft-f5',
    '#a59eb8': 'ctrlleft-f6',
    '#9e9eb8': 'ctrlleft-f7',
    '#9eb8b8': 'ctrlleft-f8',
    '#b89eb1': 'ctrlleft-f9',
    '#9eb1b8': 'ctrlleft-f10',
    '#9eb89e': 'ctrlleft-f11',
    '#b8b89e': 'ctrlleft-f12',

    '#e66f68': 'ctrlleft-0',
    '#e7aa67': 'ctrlleft-1',
    '#e8d166': 'ctrlleft-2',
    '#dce965': 'ctrlleft-3',
    '#9de965': 'ctrlleft-4',
    '#22cc1e': 'ctrlleft-5',
    '#40e3aa': 'ctrlleft-6',
    '#40cbe3': 'ctrlleft-7',
    '#3f75e4': 'ctrlleft-8',
    '#743ee6': 'ctrlleft-9',

    '#f154da': 'ctrlleft-leftshift-f1',
    '#e0a3f8': 'ctrlleft-leftshift-f2',
    '#8d56f3': 'ctrlleft-leftshift-f3',
    '#9c9cf8': 'ctrlleft-leftshift-f4',
    '#60a3f4': 'ctrlleft-leftshift-f5',
    '#b4f8fa': 'ctrlleft-leftshift-f6',
    '#6cf4aa': 'ctrlleft-leftshift-f7',
    '#c6fab4': 'ctrlleft-leftshift-f8',
    '#d7f777': 'ctrlleft-leftshift-f9',
    '#fac2da': 'ctrlleft-leftshift-f10',
    '#a56fbf': 'ctrlleft-leftshift-f11',
    '#83a34e': 'ctrlleft-leftshift-f12',

    '#ecb182': 'ctrlleft-leftshift-b',
    '#a6f4f2': 'ctrlleft-leftshift-c',
    '#a6f4c1': 'ctrlleft-leftshift-f',
    '#f4cfa6': 'ctrlleft-leftshift-g',
    '#ece782': 'ctrlleft-leftshift-h',
    '#82c7ec': 'ctrlleft-leftshift-i',
    '#81edda': 'ctrlleft-leftshift-j',
    '#b183eb': 'ctrlleft-leftshift-k',
    '#ea84b9': 'ctrlleft-leftshift-l',
    '#8393eb': 'ctrlleft-leftshift-m',
    '#81eda2': 'ctrlleft-leftshift-n',
    '#ea84ea': 'ctrlleft-leftshift-o',
    '#ea849b': 'ctrlleft-leftshift-p',
    '#c9f4a6': 'ctrlleft-leftshift-t',
    '#baec82': 'ctrlleft-leftshift-u',
    '#f4f2a6': 'ctrlleft-leftshift-v',
    '#a6c4f4': 'ctrlleft-leftshift-x',
    '#f4aaa6': 'ctrlleft-leftshift-y',
    '#bba6f4': 'ctrlleft-leftshift-z',

    '#28232c': 'leftshift-f1',
    '#b8ab9e': 'leftshift-f2',
    '#3f3d4e': 'leftshift-f3',
    '#b8a59e': 'leftshift-f4',
    '#b8b19e': 'leftshift-f5',
    '#30373f': 'leftshift-f6',
    '#9eabb8': 'leftshift-f7',
    '#9ea5b8': 'leftshift-f8',
    '#9eb8b1': 'leftshift-f9',
    '#b89eab': 'leftshift-f10',
    '#b1b89e': 'leftshift-f11',
    '#abb89e': 'leftshift-f12',

    '#8e4065': 'altleft-f1',
    '#c477b6': 'altleft-f2',
    '#8c4aac': 'altleft-f3',
    '#8c76c7': 'altleft-f4',
    '#4552ab': 'altleft-f5',
    '#81bcc5': 'altleft-f6',
    '#58b474': 'altleft-f7',
    '#9fd599': 'altleft-f8',
    '#9ebe5c': 'altleft-f9',
    '#989138': 'altleft-f10',
    '#dcbda0': 'altleft-f11',
    '#7e3a3a': 'altleft-f12',

    '#795e4d': 'f5',
    '#49623e': 'f6',
    '#30ad72': 'f7',
    '#963ea6': 'f8',
    '#337d49': 'f9',
    '#437e98': 'f10',
    '#77a9b0': 'f11',
    '#1e1c68': 'f12',

    '#a5b89e': 'combat',
    '#b6b485': 'ctrlleft-shiftleft-home',
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
                    color_key = f"{pixel_color[0]},{pixel_color[1]},{pixel_color[2]}"
                    if color_key in self.color_map:
                        key_combination = self.color_map[color_key]
                        self.execute_key_press(key_combination)
                except Exception as e:
                    print(f"发生错误: {e}")
            time.sleep(self.interval)

    def execute_key_press(self, key_combination):
        print(f"触发按键: {key_combination}")
        keys = key_combination.split('-')
        for key in keys:
            pyautogui.keyDown(key)
        time.sleep(0.01)
        for key in reversed(keys):
            pyautogui.keyUp(key)

def on_press(key, controller):
    try:
        if key == keyboard.Key.f1:
            if not controller.running:
                controller.toggle()
            controller.switch_to_x1()
        elif key == keyboard.Key.f2:
            if not controller.running:
                controller.toggle()
            controller.switch_to_x2()
        elif key == keyboard.Key.f3:
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
    MONITOR_X1 = 100  # 请根据实际需要调整这个值
    MONITOR_X2 = 200  # 请根据实际需要调整这个值
    MONITOR_Y = 100   # 请根据实际需要调整这个值

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
