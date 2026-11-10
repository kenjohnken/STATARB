/* 互動故事資料
 * 場景是 4:3 的畫面，item 的 x / y 是中心點位置(百分比)，s 是寬度(佔場景寬度的百分比)
 * item.word = 對應 words.js 的詞 id(點了會念出名稱)；item.name = 非詞庫物件的名稱
 * task 類型：
 *   tap  : 點出 target；moveTo 填 item id 時，答對後該物件會飛過去
 *   drag : 把 item 拖到 to
 *   say  : 跟讀 word(words.js 的詞 id)
 * bg 背景：meadow 草地、road 馬路、park 公園、farm 農場、beach 海邊
 */
window.KL_STORIES = [
  {
    id: 'picnic',
    title: { zh: '小猴子去野餐', en: "Little Monkey's Picnic" },
    cover: '1f412',
    sticker: 'monkey',
    pages: [
      {
        bg: 'meadow',
        items: [
          { id: 'sun', img: '2600', x: 86, y: 14, s: 14, anim: 'float', name: { zh: '太陽', en: 'sun' } },
          { id: 'cloud', img: '2601', x: 22, y: 16, s: 16, anim: 'float', name: { zh: '雲', en: 'cloud' } },
          { id: 'house', img: '1f3e0', x: 24, y: 58, s: 26, name: { zh: '房子', en: 'house' } },
          { id: 'tree', img: '1f333', x: 82, y: 56, s: 22, name: { zh: '樹', en: 'tree' } },
          { id: 'monkey', img: '1f412', x: 54, y: 74, s: 24, anim: 'bounce', name: { zh: '小猴子', en: 'Little Monkey' } }
        ],
        text: { zh: '小猴子早上起床了，今天要去野餐！', en: 'Little Monkey wakes up. Today is picnic day!' }
      },
      {
        bg: 'meadow',
        items: [
          { id: 'monkey', img: '1f412', x: 18, y: 70, s: 26, anim: 'wiggle', name: { zh: '小猴子', en: 'Little Monkey' } },
          { id: 'basket', img: '1f9fa', x: 50, y: 84, s: 14, name: { zh: '籃子', en: 'basket' } },
          { id: 'banana', img: '1f34c', x: 46, y: 38, s: 16, word: 'banana' },
          { id: 'apple', img: '1f34e', x: 66, y: 42, s: 16, word: 'apple' },
          { id: 'grapes', img: '1f347', x: 86, y: 38, s: 16, word: 'grapes' }
        ],
        text: { zh: '小猴子肚子餓了，咕嚕咕嚕。', en: 'Little Monkey is hungry. Rumble, rumble.' },
        task: {
          type: 'tap', target: 'banana', moveTo: 'monkey',
          prompt: { zh: '幫小猴子找到黃色的香蕉！', en: 'Find the yellow banana for Monkey!' },
          done: { zh: '找到了！香蕉好好吃！', en: 'You found it! Yummy banana!' }
        }
      },
      {
        bg: 'meadow',
        items: [
          { id: 'monkey', img: '1f412', x: 24, y: 68, s: 24, name: { zh: '小猴子', en: 'Little Monkey' } },
          { id: 'dog', img: '1f415', x: 72, y: 68, s: 26, anim: 'bounce', word: 'dog', flip: true },
          { id: 'flower', img: '1f337', x: 48, y: 86, s: 10, name: { zh: '花', en: 'flower' } },
          { id: 'sun', img: '2600', x: 86, y: 14, s: 12, anim: 'float', name: { zh: '太陽', en: 'sun' } }
        ],
        text: { zh: '走著走著，遇到了小狗。', en: 'On the way, Monkey meets a dog.' },
        task: {
          type: 'say', word: 'dog',
          prompt: { zh: '跟小狗打招呼，我們一起說：狗！', en: "Let's say hello. Say: dog!" },
          done: { zh: '小狗好開心，汪汪！', en: 'The dog is happy. Woof woof!' }
        }
      },
      {
        bg: 'road',
        items: [
          { id: 'stop', img: '1f68f', x: 82, y: 58, s: 16, name: { zh: '公車站', en: 'bus stop' } },
          { id: 'monkey', img: '1f412', x: 66, y: 50, s: 14, name: { zh: '小猴子', en: 'Little Monkey' } },
          { id: 'dog', img: '1f415', x: 94, y: 50, s: 12, word: 'dog', flip: true },
          { id: 'bus', img: '1f68c', x: 20, y: 78, s: 28, word: 'bus' }
        ],
        text: { zh: '他們要坐公車去公園。', en: 'They take the bus to the park.' },
        task: {
          type: 'drag', item: 'bus', to: 'stop',
          prompt: { zh: '把公車拖到站牌那裡！', en: 'Drag the bus to the bus stop!' },
          done: { zh: '叭叭！公車來了！', en: 'Beep beep! Here comes the bus!' }
        }
      },
      {
        bg: 'park',
        items: [
          { id: 'tree', img: '1f333', x: 14, y: 44, s: 24, name: { zh: '樹', en: 'tree' } },
          { id: 'sunflower', img: '1f33b', x: 90, y: 52, s: 12, name: { zh: '向日葵', en: 'sunflower' } },
          { id: 'monkey', img: '1f412', x: 30, y: 76, s: 20, name: { zh: '小猴子', en: 'Little Monkey' } },
          { id: 'dog', img: '1f415', x: 56, y: 78, s: 20, word: 'dog', flip: true },
          { id: 'lemon', img: '1f34b', x: 46, y: 34, s: 14, word: 'lemon' },
          { id: 'apple', img: '1f34e', x: 64, y: 40, s: 14, word: 'apple' },
          { id: 'grapes', img: '1f347', x: 80, y: 28, s: 14, word: 'grapes' }
        ],
        text: { zh: '到了公園，大家一起野餐。', en: 'At the park, everyone has a picnic.' },
        task: {
          type: 'tap', target: 'apple', moveTo: 'dog',
          prompt: { zh: '小狗想吃蘋果，蘋果在哪裡？', en: 'The dog wants an apple. Where is it?' },
          done: { zh: '小狗說：謝謝你！', en: 'The dog says: thank you!' }
        }
      },
      {
        bg: 'park',
        items: [
          { id: 'rainbow', img: '1f308', x: 50, y: 22, s: 32, anim: 'float', name: { zh: '彩虹', en: 'rainbow' } },
          { id: 'monkey', img: '1f412', x: 36, y: 68, s: 24, anim: 'bounce', name: { zh: '小猴子', en: 'Little Monkey' } },
          { id: 'dog', img: '1f415', x: 66, y: 70, s: 22, anim: 'bounce', word: 'dog', flip: true }
        ],
        text: { zh: '今天真開心！謝謝你陪小猴子去野餐。', en: 'What a happy day! Thank you for coming to the picnic.' }
      }
    ]
  },
  {
    id: 'trip',
    title: { zh: '小汽車去旅行', en: "Little Car's Trip" },
    cover: '1f697',
    sticker: 'racecar',
    pages: [
      {
        bg: 'road',
        items: [
          { id: 'sun', img: '2600', x: 86, y: 14, s: 14, anim: 'float', name: { zh: '太陽', en: 'sun' } },
          { id: 'house', img: '1f3e0', x: 20, y: 46, s: 24, name: { zh: '房子', en: 'house' } },
          { id: 'tree', img: '1f333', x: 66, y: 44, s: 20, name: { zh: '樹', en: 'tree' } },
          { id: 'car', img: '1f697', x: 52, y: 78, s: 28, anim: 'bounce', word: 'car' }
        ],
        text: { zh: '小汽車要去旅行囉！', en: 'Little Car is going on a trip!' }
      },
      {
        bg: 'road',
        items: [
          { id: 'light', img: '1f6a6', x: 86, y: 40, s: 14, name: { zh: '紅綠燈', en: 'traffic light' } },
          { id: 'green', img: '1f7e2', x: 30, y: 26, s: 14, word: 'green' },
          { id: 'red', img: '1f534', x: 50, y: 26, s: 14, word: 'red' },
          { id: 'yellow', img: '1f7e1', x: 70, y: 26, s: 14, word: 'yellow' },
          { id: 'car', img: '1f697', x: 26, y: 78, s: 26, word: 'car' }
        ],
        text: { zh: '路口有紅綠燈。', en: 'There is a traffic light.' },
        task: {
          type: 'tap', target: 'green',
          prompt: { zh: '綠燈才能走，找出綠色！', en: 'Green means go. Find green!' },
          done: { zh: '綠燈亮了，出發！', en: "Green light. Let's go!" }
        }
      },
      {
        bg: 'farm',
        items: [
          { id: 'cow', img: '1f404', x: 26, y: 66, s: 26, word: 'cow', anim: 'pulse' },
          { id: 'pig', img: '1f416', x: 56, y: 72, s: 22, word: 'pig', anim: 'wiggle' },
          { id: 'rooster', img: '1f413', x: 82, y: 66, s: 16, name: { zh: '公雞', en: 'rooster' } },
          { id: 'sun', img: '2600', x: 14, y: 16, s: 12, anim: 'float', name: { zh: '太陽', en: 'sun' } }
        ],
        text: { zh: '經過農場，看到好多動物。', en: 'The car passes a farm. So many animals!' },
        task: {
          type: 'tap', target: 'cow',
          prompt: { zh: '哪一個是牛？', en: 'Which one is the cow?' },
          done: { zh: '哞～牛跟你說你好！', en: 'Moo! The cow says hello!' }
        }
      },
      {
        bg: 'road',
        items: [
          { id: 'train', img: '1f686', x: 52, y: 56, s: 32, anim: 'drive', word: 'train' },
          { id: 'car', img: '1f697', x: 18, y: 86, s: 16, word: 'car' }
        ],
        text: { zh: '咻～火車開過來了！', en: 'Whoosh! Here comes a train!' },
        task: {
          type: 'say', word: 'train',
          prompt: { zh: '我們一起說：火車！', en: "Let's say: train!" },
          done: { zh: '嘟嘟！火車好快！', en: 'Choo choo! The train is fast!' }
        }
      },
      {
        bg: 'road',
        items: [
          { id: 'beach', img: '1f3d6', x: 80, y: 48, s: 26, name: { zh: '海邊', en: 'beach' } },
          { id: 'car', img: '1f697', x: 18, y: 78, s: 24, word: 'car' }
        ],
        text: { zh: '小汽車想去海邊。', en: 'Little Car wants to go to the beach.' },
        task: {
          type: 'drag', item: 'car', to: 'beach',
          prompt: { zh: '把小汽車開到海邊！', en: 'Drive Little Car to the beach!' },
          done: { zh: '到海邊了！', en: 'We are at the beach!' }
        }
      },
      {
        bg: 'beach',
        items: [
          { id: 'boat', img: '1f6a2', x: 72, y: 38, s: 22, anim: 'swim', word: 'boat' },
          { id: 'fish', img: '1f41f', x: 28, y: 60, s: 14, anim: 'swim', word: 'fish' },
          { id: 'octopus', img: '1f419', x: 54, y: 66, s: 13, anim: 'wiggle', name: { zh: '章魚', en: 'octopus' } },
          { id: 'crab', img: '1f980', x: 84, y: 88, s: 12, name: { zh: '螃蟹', en: 'crab' } }
        ],
        text: { zh: '海邊好漂亮，海裡有好多東西。', en: 'The beach is beautiful. There are many things in the sea.' },
        task: {
          type: 'tap', target: 'fish',
          prompt: { zh: '找出魚在哪裡！', en: 'Find the fish!' },
          done: { zh: '魚游來游去，好可愛！', en: 'The fish swims around. So cute!' }
        }
      },
      {
        bg: 'beach',
        items: [
          { id: 'sun', img: '2600', x: 82, y: 14, s: 14, anim: 'float', name: { zh: '太陽', en: 'sun' } },
          { id: 'boat', img: '1f6a2', x: 64, y: 44, s: 16, anim: 'swim', word: 'boat' },
          { id: 'car', img: '1f697', x: 40, y: 86, s: 24, anim: 'bounce', word: 'car' }
        ],
        text: { zh: '旅行好好玩！謝謝你陪小汽車去旅行。', en: 'What a fun trip! Thank you for traveling with Little Car.' }
      }
    ]
  }
];
