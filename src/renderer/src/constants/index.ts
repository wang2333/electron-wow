type ColorArray = [number, number, string]
interface IColorDict {
  playerAttack: ColorArray
  hasMonster: ColorArray
}

/** 整圈旋转耗时 */
export const Time_TO_COMPLETE_FULL_ROTATION = 2000

/** 每毫秒旋转角度 */
export const DEGREES_PER_MILLISEOND = Time_TO_COMPLETE_FULL_ROTATION / 360

/** 人物中心点 */
export const PERSON_POSITION = {
  x: 850,
  y: 800
}

/** 雷达箭头模板路径 */
export const ARROW_IMG_PATH = window.api.getResourcePath('resources/images/arrow.png')

/** 怪物血条模板路径 */
export const BLOOD_IMG_PATH = window.api.getResourcePath('resources/images/blood.png')

/** 事件对应的坐标和色值 */
export const COLOR_DICT: IColorDict = {
  playerAttack: [345, 1084, '#ffe66c'],
  hasMonster: [1350, 1050, '#80df27']
}
