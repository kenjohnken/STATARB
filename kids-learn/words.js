/* 詞庫：換素材或加新詞只需要改這個檔案。
 * zh = 中文, zy = 注音(每個字一組, 用空格分隔, 數量必須和字數相同), en = 英文
 * img = assets/twemoji/ 底下的檔名(不含 .svg)
 * anim = 動畫類型: bounce wiggle grow swim float drive pulse
 * altZh = 中文辨識時額外接受的同音字/近音字(選填)
 */
window.KL_DATA = {
  categories: [
    {
      id: 'animals', zh: '動物', en: 'Animals', icon: '1f431',
      words: [
        { id: 'cat', zh: '貓', zy: 'ㄇㄠ', en: 'cat', img: '1f431', anim: 'wiggle', altZh: ['毛'] },
        { id: 'dog', zh: '狗', zy: 'ㄍㄡˇ', en: 'dog', img: '1f436', anim: 'bounce', altZh: ['夠', '溝'] },
        { id: 'elephant', zh: '大象', zy: 'ㄉㄚˋ ㄒㄧㄤˋ', en: 'elephant', img: '1f418', anim: 'grow' },
        { id: 'fish', zh: '魚', zy: 'ㄩˊ', en: 'fish', img: '1f41f', anim: 'swim', altZh: ['於', '余'] },
        { id: 'bird', zh: '鳥', zy: 'ㄋㄧㄠˇ', en: 'bird', img: '1f426', anim: 'float' },
        { id: 'rabbit', zh: '兔子', zy: 'ㄊㄨˋ ˙ㄗ', en: 'rabbit', img: '1f430', anim: 'bounce' },
        { id: 'pig', zh: '豬', zy: 'ㄓㄨ', en: 'pig', img: '1f437', anim: 'wiggle', altZh: ['朱', '珠'] },
        { id: 'cow', zh: '牛', zy: 'ㄋㄧㄡˊ', en: 'cow', img: '1f42e', anim: 'pulse' },
        { id: 'monkey', zh: '猴子', zy: 'ㄏㄡˊ ˙ㄗ', en: 'monkey', img: '1f435', anim: 'wiggle' },
        { id: 'tiger', zh: '老虎', zy: 'ㄌㄠˇ ㄏㄨˇ', en: 'tiger', img: '1f42f', anim: 'grow' }
      ]
    },
    {
      id: 'fruits', zh: '水果', en: 'Fruits', icon: '1f34e',
      words: [
        { id: 'apple', zh: '蘋果', zy: 'ㄆㄧㄥˊ ㄍㄨㄛˇ', en: 'apple', img: '1f34e', anim: 'bounce' },
        { id: 'banana', zh: '香蕉', zy: 'ㄒㄧㄤ ㄐㄧㄠ', en: 'banana', img: '1f34c', anim: 'wiggle' },
        { id: 'strawberry', zh: '草莓', zy: 'ㄘㄠˇ ㄇㄟˊ', en: 'strawberry', img: '1f353', anim: 'pulse' },
        { id: 'watermelon', zh: '西瓜', zy: 'ㄒㄧ ㄍㄨㄚ', en: 'watermelon', img: '1f349', anim: 'grow' },
        { id: 'grapes', zh: '葡萄', zy: 'ㄆㄨˊ ㄊㄠˊ', en: 'grapes', img: '1f347', anim: 'bounce' },
        { id: 'orange', zh: '橘子', zy: 'ㄐㄩˊ ˙ㄗ', en: 'orange', img: '1f34a', anim: 'pulse' },
        { id: 'pineapple', zh: '鳳梨', zy: 'ㄈㄥˋ ㄌㄧˊ', en: 'pineapple', img: '1f34d', anim: 'wiggle' },
        { id: 'lemon', zh: '檸檬', zy: 'ㄋㄧㄥˊ ㄇㄥˊ', en: 'lemon', img: '1f34b', anim: 'bounce' },
        { id: 'peach', zh: '桃子', zy: 'ㄊㄠˊ ˙ㄗ', en: 'peach', img: '1f351', anim: 'pulse' },
        { id: 'cherry', zh: '櫻桃', zy: 'ㄧㄥ ㄊㄠˊ', en: 'cherry', img: '1f352', anim: 'wiggle' }
      ]
    },
    {
      id: 'colors', zh: '顏色', en: 'Colors', icon: '1f534',
      words: [
        { id: 'red', zh: '紅色', zy: 'ㄏㄨㄥˊ ㄙㄜˋ', en: 'red', img: '1f534', anim: 'pulse' },
        { id: 'c-orange', zh: '橘色', zy: 'ㄐㄩˊ ㄙㄜˋ', en: 'orange', img: '1f7e0', anim: 'pulse' },
        { id: 'yellow', zh: '黃色', zy: 'ㄏㄨㄤˊ ㄙㄜˋ', en: 'yellow', img: '1f7e1', anim: 'pulse' },
        { id: 'green', zh: '綠色', zy: 'ㄌㄩˋ ㄙㄜˋ', en: 'green', img: '1f7e2', anim: 'pulse' },
        { id: 'blue', zh: '藍色', zy: 'ㄌㄢˊ ㄙㄜˋ', en: 'blue', img: '1f535', anim: 'pulse' },
        { id: 'purple', zh: '紫色', zy: 'ㄗˇ ㄙㄜˋ', en: 'purple', img: '1f7e3', anim: 'pulse' },
        { id: 'brown', zh: '咖啡色', zy: 'ㄎㄚ ㄈㄟ ㄙㄜˋ', en: 'brown', img: '1f7e4', anim: 'pulse' },
        { id: 'black', zh: '黑色', zy: 'ㄏㄟ ㄙㄜˋ', en: 'black', img: '26ab', anim: 'pulse' },
        { id: 'white', zh: '白色', zy: 'ㄅㄞˊ ㄙㄜˋ', en: 'white', img: '26aa', anim: 'pulse' }
      ]
    },
    {
      id: 'transport', zh: '交通工具', en: 'Vehicles', icon: '1f697',
      words: [
        { id: 'car', zh: '車子', zy: 'ㄔㄜ ˙ㄗ', en: 'car', img: '1f697', anim: 'drive' },
        { id: 'bus', zh: '公車', zy: 'ㄍㄨㄥ ㄔㄜ', en: 'bus', img: '1f68c', anim: 'drive' },
        { id: 'train', zh: '火車', zy: 'ㄏㄨㄛˇ ㄔㄜ', en: 'train', img: '1f686', anim: 'drive' },
        { id: 'airplane', zh: '飛機', zy: 'ㄈㄟ ㄐㄧ', en: 'airplane', img: '2708', anim: 'float' },
        { id: 'boat', zh: '船', zy: 'ㄔㄨㄢˊ', en: 'boat', img: '1f6a2', anim: 'swim', altZh: ['傳'] },
        { id: 'bicycle', zh: '腳踏車', zy: 'ㄐㄧㄠˇ ㄊㄚˋ ㄔㄜ', en: 'bicycle', img: '1f6b2', anim: 'drive' }
      ]
    }
  ],
  /* UI 用到的圖示(同樣放在 assets/twemoji/) */
  ui: {
    home: '1f3e0', gear: '2699', star: '2b50', speaker: '1f50a', mic: '1f3a4', prev: '2b05', next: '27a1',
    learn: '1f4d6', find: '1f50d', memory: '1f3b4', story: '1f4da', book: '1f4d2', mixed: '1f308',
    again: '1f501', check: '2705', trophy: '1f3c6', point: '1f449'
  },
  /* 貼紙：story 為 true 的是故事專屬貼紙，不會隨機發 */
  stickers: [
    { id: 'monkey', img: '1f412', zh: '小猴子', en: 'monkey', story: true },
    { id: 'racecar', img: '1f3ce', zh: '賽車', en: 'race car', story: true },
    { id: 'unicorn', img: '1f984', zh: '獨角獸', en: 'unicorn' },
    { id: 'lion', img: '1f981', zh: '獅子', en: 'lion' },
    { id: 'panda', img: '1f43c', zh: '熊貓', en: 'panda' },
    { id: 'koala', img: '1f428', zh: '無尾熊', en: 'koala' },
    { id: 'penguin', img: '1f427', zh: '企鵝', en: 'penguin' },
    { id: 'butterfly', img: '1f98b', zh: '蝴蝶', en: 'butterfly' },
    { id: 'dolphin', img: '1f42c', zh: '海豚', en: 'dolphin' },
    { id: 'dinosaur', img: '1f996', zh: '恐龍', en: 'dinosaur' },
    { id: 'turtle', img: '1f422', zh: '烏龜', en: 'turtle' },
    { id: 'giraffe', img: '1f992', zh: '長頸鹿', en: 'giraffe' },
    { id: 'zebra', img: '1f993', zh: '斑馬', en: 'zebra' },
    { id: 'parrot', img: '1f99c', zh: '鸚鵡', en: 'parrot' },
    { id: 'snail', img: '1f40c', zh: '蝸牛', en: 'snail' },
    { id: 'bee', img: '1f41d', zh: '蜜蜂', en: 'bee' },
    { id: 'rainbow', img: '1f308', zh: '彩虹', en: 'rainbow' },
    { id: 'rocket', img: '1f680', zh: '火箭', en: 'rocket' },
    { id: 'icecream', img: '1f366', zh: '冰淇淋', en: 'ice cream' },
    { id: 'cake', img: '1f382', zh: '蛋糕', en: 'cake' },
    { id: 'balloon', img: '1f388', zh: '氣球', en: 'balloon' },
    { id: 'donut', img: '1f369', zh: '甜甜圈', en: 'donut' }
  ]
};
