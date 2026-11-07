'use strict';

const VERSION = '1.1.0';
const SCHEMA_VERSION = 2;

const NINE_STAR = [
  { index: 0, number: '一', color: '白', wuxing: '水', luck: '吉', name: '贪狼', position: '坎' },
  { index: 1, number: '二', color: '黑', wuxing: '土', luck: '凶', name: '巨门', position: '坤' },
  { index: 2, number: '三', color: '碧', wuxing: '木', luck: '凶', name: '禄存', position: '震' },
  { index: 3, number: '四', color: '绿', wuxing: '木', luck: '吉', name: '文曲', position: '巽' },
  { index: 4, number: '五', color: '黄', wuxing: '土', luck: '大凶', name: '廉贞', position: '中' },
  { index: 5, number: '六', color: '白', wuxing: '金', luck: '吉', name: '武曲', position: '乾' },
  { index: 6, number: '七', color: '赤', wuxing: '金', luck: '凶', name: '破军', position: '兑' },
  { index: 7, number: '八', color: '白', wuxing: '土', luck: '吉', name: '左辅', position: '艮' },
  { index: 8, number: '九', color: '紫', wuxing: '火', luck: '吉', name: '右弼', position: '离' }
];

const ZHIXING_MEANING = {
  建: '万物生育、健旺之日',
  除: '除旧布新、扫除之日',
  满: '圆满、丰盈之日',
  平: '平常、平稳之日',
  定: '安定、确定之日',
  执: '执持、操守之日',
  破: '破败、冲破之日',
  危: '危险、危惧之日',
  成: '成就、成功之日',
  收: '收成、收纳之日',
  开: '开启、通达之日',
  闭: '闭藏、休整之日'
};

const EVENTS = {
  marriage: {
    id: 'marriage',
    name: '嫁娶',
    category: '婚嫁',
    aliases: ['嫁娶', '结婚', '婚礼', '领证', '办喜事', '婚宴'],
    yi: ['嫁娶', '纳采', '订盟'],
    ji: ['嫁娶'],
    zhixing: { good: ['定', '成', '开', '满'], bad: ['破', '平', '闭', '建', '危'] },
    xiu: {
      good: ['角', '房', '尾', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '昴', '参', '鬼', '翼']
    },
    nineStar: { good: [7, 8, 0, 3], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['巳', '午', '未', '卯'],
    taboo: ['三娘煞']
  },
  engagement: {
    id: 'engagement',
    name: '订婚',
    category: '婚嫁',
    aliases: ['订婚', '纳采', '订盟', '提亲', '文定'],
    yi: ['纳采', '订盟', '嫁娶'],
    ji: ['纳采', '订盟'],
    zhixing: { good: ['定', '成', '开', '满'], bad: ['破', '平', '闭'] },
    xiu: {
      good: ['角', '房', '尾', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '昴', '参', '鬼', '翼']
    },
    nineStar: { good: [7, 8, 0, 3], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['巳', '午', '未', '卯'],
    taboo: ['三娘煞']
  },
  opening: {
    id: 'opening',
    name: '开业',
    category: '商业',
    aliases: ['开业', '开市', '开张', '开店', '开门营业', '公司成立'],
    yi: ['开市', '交易', '立券', '纳财', '开业'],
    ji: ['开市'],
    zhixing: { good: ['开', '成', '满', '定'], bad: ['破', '闭', '平', '收'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '柳', '翼']
    },
    nineStar: { good: [7, 5, 8, 0], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['辰', '巳', '午', '卯'],
    taboo: ['杨公忌']
  },
  move: {
    id: 'move',
    name: '搬家',
    category: '居住',
    aliases: ['搬家', '入宅', '移徙', '乔迁', '迁居', '入住'],
    yi: ['入宅', '移徙', '安床'],
    ji: ['入宅', '移徙'],
    zhixing: { good: ['开', '成', '定', '满'], bad: ['破', '闭', '建', '危'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '柳', '翼']
    },
    nineStar: { good: [7, 5, 8, 3], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['辰', '巳', '午', '未'],
    taboo: ['杨公忌']
  },
  travel: {
    id: 'travel',
    name: '出行',
    category: '出行',
    aliases: ['出行', '出差', '旅游', '远行', '赴任', '启程'],
    yi: ['出行', '赴任', '移徙'],
    ji: ['出行'],
    zhixing: { good: ['开', '成', '定', '平', '建'], bad: ['破', '闭', '危'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '壁', '娄', '胃', '毕', '张', '翼', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '参', '鬼', '柳']
    },
    nineStar: { good: [7, 5, 8, 0], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['卯', '辰', '巳', '午'],
    taboo: ['往亡日', '杨公忌']
  },
  groundbreaking: {
    id: 'groundbreaking',
    name: '动土',
    category: '营建',
    aliases: ['动土', '开工', '破土', '奠基', '起基', '开挖'],
    yi: ['动土', '破土', '起基', '修造'],
    ji: ['动土', '破土'],
    zhixing: { good: ['开', '成', '定', '执'], bad: ['破', '闭', '平'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [7, 5, 0, 8], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['辰', '巳', '午', '未'],
    taboo: ['土符', '杨公忌']
  },
  construction: {
    id: 'construction',
    name: '修造',
    category: '营建',
    aliases: ['修造', '装修', '上梁', '竖柱', '盖房', '翻修', '拆卸'],
    yi: ['修造', '上梁', '竖柱', '拆卸'],
    ji: ['修造', '上梁'],
    zhixing: { good: ['开', '成', '定', '执'], bad: ['破', '闭', '平'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [7, 5, 0, 8], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['辰', '巳', '午', '未'],
    taboo: ['土符', '杨公忌']
  },
  burial: {
    id: 'burial',
    name: '安葬',
    category: '丧葬',
    aliases: ['安葬', '下葬', '葬礼', '入殓', '移柩', '启钻', '立碑'],
    yi: ['安葬', '入殓', '移柩', '启钻', '谢土'],
    ji: ['安葬', '入殓'],
    zhixing: { good: ['开', '成', '定', '闭'], bad: ['破', '平', '收', '满'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [5, 7, 0, 8], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['辰', '巳', '未', '申'],
    taboo: ['受死日', '杨公忌']
  },
  contract: {
    id: 'contract',
    name: '签约',
    category: '商业',
    aliases: ['签约', '合同', '立券', '交易', '谈判', '合作'],
    yi: ['立券', '交易', '纳财', '开市'],
    ji: ['立券', '交易'],
    zhixing: { good: ['成', '定', '开', '满'], bad: ['破', '闭', '平'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [7, 5, 8, 0], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['辰', '巳', '午', '未'],
    taboo: ['杨公忌']
  },
  study: {
    id: 'study',
    name: '入学',
    category: '文教',
    aliases: ['入学', '开学', '考试', '报名', '拜师', '求学', '升学'],
    yi: ['入学', '会亲友', '祈福'],
    ji: ['入学'],
    zhixing: { good: ['开', '成', '定', '满'], bad: ['破', '闭', '平'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [3, 0, 7, 8], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['卯', '辰', '巳', '午'],
    taboo: []
  },
  medical: {
    id: 'medical',
    name: '求医',
    category: '健康',
    aliases: ['求医', '看病', '手术', '治疗', '针灸', '体检'],
    yi: ['求医', '治病', '针灸'],
    ji: ['求医', '治病'],
    zhixing: { good: ['除', '开', '成', '定'], bad: ['破', '闭', '满'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [0, 5, 3, 8], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['卯', '辰', '巳', '午'],
    taboo: ['受死日']
  },
  worship: {
    id: 'worship',
    name: '祭祀祈福',
    category: '礼俗',
    aliases: ['祭祀', '祈福', '求嗣', '斋醮', '还愿', '开光', '上香'],
    yi: ['祭祀', '祈福', '求嗣', '斋醮', '开光'],
    ji: ['祭祀', '祈福'],
    zhixing: { good: ['开', '成', '定', '满'], bad: ['破', '闭', '平'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [7, 8, 0, 3], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['卯', '辰', '巳', '午'],
    taboo: []
  },
  haircut: {
    id: 'haircut',
    name: '理发',
    category: '日常',
    aliases: ['理发', '剪发', '美发', '剃头', '沐浴'],
    yi: ['理发', '沐浴', '整手足甲'],
    ji: ['理发'],
    zhixing: { good: ['除', '开', '成', '定'], bad: ['破', '闭', '建'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [0, 3, 7, 8], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['卯', '辰', '巳', '午'],
    taboo: []
  },
  farming: {
    id: 'farming',
    name: '栽种',
    category: '农事',
    aliases: ['栽种', '种植', '播种', '移栽', '农事', '养殖'],
    yi: ['栽种', '牧养', '纳畜'],
    ji: ['栽种'],
    zhixing: { good: ['开', '成', '定', '满'], bad: ['破', '闭', '平'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [7, 5, 8, 3], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['卯', '辰', '巳', '午'],
    taboo: []
  },
  career: {
    id: 'career',
    name: '赴任求职',
    category: '事业',
    aliases: ['赴任', '求职', '面试', '上任', '入职', '升职'],
    yi: ['赴任', '出行', '会亲友'],
    ji: ['赴任'],
    zhixing: { good: ['开', '成', '定', '建'], bad: ['破', '闭', '平'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [7, 5, 8, 0], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['卯', '辰', '巳', '午'],
    taboo: ['往亡日']
  },
  lawsuit: {
    id: 'lawsuit',
    name: '诉讼',
    category: '事务',
    aliases: ['诉讼', '打官司', '立案', '开庭', '仲裁'],
    yi: ['诉讼'],
    ji: ['诉讼'],
    zhixing: { good: ['定', '执', '开'], bad: ['破', '闭', '平', '满'] },
    xiu: {
      good: ['角', '房', '尾', '箕', '斗', '室', '壁', '娄', '胃', '毕', '张', '轸'],
      bad: ['亢', '氐', '心', '牛', '女', '虚', '危', '昴', '觜', '参', '鬼', '柳', '翼']
    },
    nineStar: { good: [5, 0, 7, 8], bad: [4, 1, 2, 6] },
    yueXiang: { good: ['望', '既望'], bad: ['朔', '晦'] },
    timePrefer: ['辰', '巳', '午', '未'],
    taboo: ['受死日']
  }
};

const EVENT_ALIASES = (() => {
  const map = new Map();
  for (const key of Object.keys(EVENTS)) {
    const ev = EVENTS[key];
    map.set(key, key);
    map.set(ev.name, key);
    for (const alias of ev.aliases) map.set(alias, key);
  }
  return map;
})();

const CITIES = {
  北京: { lng: 116.4074, lat: 39.9042, tz: 8 },
  上海: { lng: 121.4737, lat: 31.2304, tz: 8 },
  广州: { lng: 113.2644, lat: 23.1291, tz: 8 },
  深圳: { lng: 114.0579, lat: 22.5431, tz: 8 },
  成都: { lng: 104.0665, lat: 30.5723, tz: 8 },
  杭州: { lng: 120.1551, lat: 30.2741, tz: 8 },
  武汉: { lng: 114.3055, lat: 30.5928, tz: 8 },
  西安: { lng: 108.9398, lat: 34.3416, tz: 8 },
  重庆: { lng: 106.5516, lat: 29.5630, tz: 8 },
  南京: { lng: 118.7969, lat: 32.0603, tz: 8 },
  天津: { lng: 117.2009, lat: 39.0842, tz: 8 },
  苏州: { lng: 120.5853, lat: 31.2989, tz: 8 },
  长沙: { lng: 112.9388, lat: 28.2282, tz: 8 },
  郑州: { lng: 113.6254, lat: 34.7466, tz: 8 },
  青岛: { lng: 120.3826, lat: 36.0671, tz: 8 },
  沈阳: { lng: 123.4315, lat: 41.8057, tz: 8 },
  哈尔滨: { lng: 126.5349, lat: 45.8038, tz: 8 },
  昆明: { lng: 102.8329, lat: 24.8801, tz: 8 },
  贵阳: { lng: 106.6302, lat: 26.6477, tz: 8 },
  南宁: { lng: 108.3669, lat: 22.8170, tz: 8 },
  福州: { lng: 119.2965, lat: 26.0745, tz: 8 },
  厦门: { lng: 118.0894, lat: 24.4798, tz: 8 },
  济南: { lng: 117.1205, lat: 36.6512, tz: 8 },
  合肥: { lng: 117.2272, lat: 31.8206, tz: 8 },
  南昌: { lng: 115.8582, lat: 28.6829, tz: 8 },
  石家庄: { lng: 114.5149, lat: 38.0428, tz: 8 },
  太原: { lng: 112.5489, lat: 37.8706, tz: 8 },
  呼和浩特: { lng: 111.7492, lat: 40.8426, tz: 8 },
  乌鲁木齐: { lng: 87.6168, lat: 43.8256, tz: 8 },
  拉萨: { lng: 91.1409, lat: 29.6456, tz: 8 },
  兰州: { lng: 103.8343, lat: 36.0611, tz: 8 },
  西宁: { lng: 101.7782, lat: 36.6171, tz: 8 },
  银川: { lng: 106.2309, lat: 38.4872, tz: 8 },
  海口: { lng: 110.1983, lat: 20.0440, tz: 8 },
  三亚: { lng: 109.5119, lat: 18.2528, tz: 8 },
  香港: { lng: 114.1694, lat: 22.3193, tz: 8 },
  澳门: { lng: 113.5439, lat: 22.1987, tz: 8 },
  台北: { lng: 121.5654, lat: 25.0330, tz: 8 },
  东京: { lng: 139.6917, lat: 35.6895, tz: 9 },
  首尔: { lng: 126.9780, lat: 37.5665, tz: 9 },
  新加坡: { lng: 103.8198, lat: 1.3521, tz: 8 },
  纽约: { lng: -74.0060, lat: 40.7128, tz: -5 },
  伦敦: { lng: -0.1276, lat: 51.5074, tz: 0 },
  洛杉矶: { lng: -118.2437, lat: 34.0522, tz: -8 },
  巴黎: { lng: 2.3522, lat: 48.8566, tz: 1 },
  悉尼: { lng: 151.2093, lat: -33.8688, tz: 10 }
};

const RULES = {
  R001: { id: 'R001', name: '日宜匹配', kind: 'positive', max: 30, field: 'lunar.getDayYi()' },
  R002: { id: 'R002', name: '日忌冲突', kind: 'negative', max: 50, field: 'lunar.getDayJi()' },
  R003: { id: 'R003', name: '建除十二神', kind: 'mixed', max: 25, field: 'lunar.getZhiXing()' },
  R004: { id: 'R004', name: '黄道黑道', kind: 'mixed', max: 15, field: 'lunar.getDayTianShenType()' },
  R005: { id: 'R005', name: '二十八宿', kind: 'mixed', max: 12, field: 'lunar.getXiu()/getXiuLuck()' },
  R006: { id: 'R006', name: '吉神加持', kind: 'positive', max: 12, field: 'lunar.getDayJiShen()' },
  R007: { id: 'R007', name: '凶煞扣减', kind: 'negative', max: 20, field: 'lunar.getDayXiongSha()' },
  R008: { id: 'R008', name: '生肖相冲', kind: 'negative', max: 40, field: 'lunar.getDayChongShengXiao()' },
  R009: { id: 'R009', name: '命主日柱关系', kind: 'mixed', max: 35, field: 'dayZhi vs profile.dayZhi' },
  R010: { id: 'R010', name: '九星吉凶', kind: 'mixed', max: 12, field: 'lunar.getDayNineStar()' },
  R011: { id: 'R011', name: '彭祖百忌', kind: 'negative', max: 15, field: 'lunar.getPengZuGan()/getPengZuZhi()' },
  R012: { id: 'R012', name: '旬空', kind: 'negative', max: 10, field: 'lunar.getDayXunKong()' },
  R013: { id: 'R013', name: '四离四绝', kind: 'negative', max: 50, field: '节气交日' },
  R014: { id: 'R014', name: '天赦日', kind: 'positive', max: 18, field: 'lunar.getDayJiShen()' },
  R015: { id: 'R015', name: '三娘煞', kind: 'negative', max: 18, field: '农历日/月' },
  R016: { id: 'R016', name: '杨公忌日', kind: 'negative', max: 18, field: '农历日' },
  R017: { id: 'R017', name: '受死日', kind: 'negative', max: 22, field: 'lunar.getDayXiongSha()' },
  R018: { id: 'R018', name: '往亡日', kind: 'negative', max: 12, field: 'lunar.getDayXiongSha()' },
  R019: { id: 'R019', name: '月相', kind: 'mixed', max: 10, field: 'lunar.getYueXiang()' },
  R020: { id: 'R020', name: '节气交接', kind: 'negative', max: 8, field: 'lunar.getJieQi()/getPrevJieQi()' },
  R021: { id: 'R021', name: '本命日', kind: 'negative', max: 8, field: 'dayGanZhi vs profile.dayGanZhi' }
};

const LEVELS = [
  { min: 90, label: '上吉', tone: 'excellent' },
  { min: 80, label: '吉', tone: 'good' },
  { min: 70, label: '小吉', tone: 'fair' },
  { min: 60, label: '平', tone: 'neutral' },
  { min: 50, label: '慎用', tone: 'caution' },
  { min: 0, label: '不宜', tone: 'bad' }
];

const SCORE = {
  base: 55,
  divisor: 2.0
};

const SAN_NIANG = [3, 7, 13, 18, 22, 27];

const YANG_GONG = [
  { month: 1, day: 13 }, { month: 2, day: 11 }, { month: 3, day: 9 },
  { month: 4, day: 7 }, { month: 5, day: 5 }, { month: 6, day: 3 },
  { month: 7, day: 1 }, { month: 7, day: 29 }, { month: 8, day: 27 },
  { month: 9, day: 25 }, { month: 10, day: 23 }, { month: 11, day: 21 },
  { month: 12, day: 19 }
];

const SI_LI = ['立春', '立夏', '立秋', '立冬'];
const SI_JUE = ['春分', '夏至', '秋分', '冬至'];

const PENGZU_GAN = {
  甲: { taboo: '开仓', note: '甲不开仓财物耗散' },
  乙: { taboo: '栽植', note: '乙不栽植千株不长' },
  丙: { taboo: '修灶', note: '丙不修灶必见灾殃' },
  丁: { taboo: '剃头', note: '丁不剃头头必生疮' },
  戊: { taboo: '受田', note: '戊不受田田主不祥' },
  己: { taboo: '破券', note: '己不破券二比并亡' },
  庚: { taboo: '经络', note: '庚不经络织机虚张' },
  辛: { taboo: '合酱', note: '辛不合酱主人不尝' },
  壬: { taboo: '泱水', note: '壬不泱水更难提防' },
  癸: { taboo: '词讼', note: '癸不词讼理弱敌强' }
};

const PENGZU_ZHI = {
  子: { taboo: '问卜', note: '子不问卜自惹祸殃' },
  丑: { taboo: '冠带', note: '丑不冠带主不还乡' },
  寅: { taboo: '祭祀', note: '寅不祭祀神鬼不尝' },
  卯: { taboo: '穿井', note: '卯不穿井水泉不香' },
  辰: { taboo: '哭泣', note: '辰不哭泣必主重丧' },
  巳: { taboo: '远行', note: '巳不远行财物伏藏' },
  午: { taboo: '苫盖', note: '午不苫盖屋主更张' },
  未: { taboo: '服药', note: '未不服药毒气入肠' },
  申: { taboo: '安床', note: '申不安床鬼祟入房' },
  酉: { taboo: '会客', note: '酉不会客醉坐颠狂' },
  戌: { taboo: '吃犬', note: '戌不吃犬作怪上床' },
  亥: { taboo: '嫁娶', note: '亥不嫁娶不利新郎' }
};

const EVENT_PENGZU_MATCH = {
  marriage: ['嫁娶'],
  engagement: ['嫁娶'],
  opening: ['开仓', '破券'],
  move: ['安床'],
  travel: ['远行'],
  groundbreaking: ['修灶', '穿井'],
  construction: ['修灶'],
  burial: ['哭泣'],
  contract: ['破券', '词讼'],
  study: ['冠带'],
  medical: ['服药'],
  worship: ['祭祀'],
  haircut: ['剃头'],
  farming: ['栽植'],
  career: ['远行'],
  lawsuit: ['词讼']
};

module.exports = {
  VERSION,
  SCHEMA_VERSION,
  NINE_STAR,
  ZHIXING_MEANING,
  EVENTS,
  EVENT_ALIASES,
  CITIES,
  RULES,
  LEVELS,
  SCORE,
  SAN_NIANG,
  YANG_GONG,
  SI_LI,
  SI_JUE,
  PENGZU_GAN,
  PENGZU_ZHI,
  EVENT_PENGZU_MATCH
};