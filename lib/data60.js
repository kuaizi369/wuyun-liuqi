'use strict';

// 六十年逐岁运气病治全表
// 数据源：《素问·六元正纪大论篇第七十一》
//   1) 六司天政五运纪要：`太阳 太角 太阴 壬辰 壬戌 其运风，其化鸣紊启拆，其变振拉摧拔，其病眩掉目瞑`
//   2) 凡此X司天之政 总民病 + 六步逐气病候 + 岁宜治则
//   3) "凡此定期之纪" 逐岁三化数与药食宜（上/中/下 三味）
// 字段说明：
//   zhiGroup      地支组（辰戌/卯酉/…），确定司天在泉与先天后天
//   ganzhi        干支年（一组两支，如 '壬辰'/'壬戌'）
//   qiTian        司天（天气）
//   qiQuan        在泉（地气）
//   yunType       中运五音太少（太角/少角/…）
//   yunWuxing     中运五行
//   yunLevel      'taiGuo' | 'buJi'
//   shengFu       胜复描述（不及年才有，如 '清热胜复同'）
//   pingQi        平气标记（如 '同正商' / '' ）
//   fuHui         符会标记数组（岁会/天符/太一天符/同天符/同岁会）
//   qiYun         其运
//   qiHua         其化（正常气化）
//   qiBian        其变（异常灾变）
//   qiBingYun     其病（中运主病）
//   huaShu        三化数 { 上:'热化二', 中:'雨化五', 下:'燥化四' }（胜复年为胜复化）
//   zaiGong       灾宫（如 '灾七宫'，正化年无）
//   yaoShiYi      药食宜 { 上, 中, 下 }
//   minBing       凡此X政总民病（该司天半年纲）
//   steps         六步逐气病候 [初气~终气]
//   suiYi         岁宜治则总纲（食岁谷等从总纲取）

const ZHI_GROUPS = {
  '辰戌': {
    siTian: { qi: '太阳寒水', wuxing: '水' },
    zaiQuan: { qi: '太阴湿土', wuxing: '土' },
    yunZhu: '先天', // 气化营运先天
    zheng: '太阳之政',
    tiangXiang: '上应辰星镇星',
    shiGu: '其谷玄鉅（岁谷：玄/黅）',
    zongBing: '民病寒湿，发肌肉萎，足痿不收，濡泻血溢',
    steps: [
      '初之气（大寒~春分）：地气迁，气乃大温，草乃早荣，民乃厉，温病乃作，身热头痛呕吐，肌腠疮疡',
      '二之气（春分~小满）：大凉反至，民乃惨，草乃遇寒，火气遂抑，民病气郁中满，寒乃始',
      '三之气（小满~大暑）：天政布，寒气行，雨乃降。民病寒，反热中，痈疽注下，心热瞀闷，不治者死',
      '四之气（大暑~秋分）：风湿交争，风化为雨，乃长乃化乃成。民病大热少气，肌肉萎足痿，注下赤白',
      '五之气（秋分~小雪）：阳复化，草乃长乃化乃成，民乃舒',
      '终之气（小雪~大寒）：地气正，湿令行，阴凝太虚，埃昏郊野，民乃惨凄，寒风以至，反者孕乃死'
    ],
    suiYi: '岁宜苦以燥之温之，必折其郁气，先资其化源，抑其运气，扶其不胜，无使暴过而生其疾；同寒湿者燥热化，异寒湿者燥湿化',
    fangJi: { name: '静顺汤', source: '《三因极一病证方论·六气时行民病证治》', zhu: '治辰戌岁太阳司天太阴在泉：身热头痛，呕吐气郁，中满瞀闷，少气足痿，注下赤白，肌腠疮疡，发为痈疽。组成：白茯苓、木瓜干各一两，附子(炮)、牛膝(酒浸)各三分，防风、诃子(炮)、甘草(炙)、干姜(炮)各半两。六步加减：大寒至春分去附子加枸杞半两；春分至小满入附子枸杞；小满至大暑去附子木瓜干姜加人参枸杞地榆白芷生姜各三分；大暑至秋分加石榴皮半两；秋分至小雪依正方；小雪至大寒去牛膝加当归芍药阿胶炒各三分。治法：用甘温以平水，酸苦以补火，抑其运气，扶其不胜' }
  },
  '卯酉': {
    siTian: { qi: '阳明燥金', wuxing: '金' },
    zaiQuan: { qi: '少阴君火', wuxing: '火' },
    yunZhu: '后天',
    zheng: '阳明之政',
    tiangXiang: '上应太白荧惑',
    shiGu: '其谷白丹',
    zongBing: '民病咳嗌塞，寒热发，暴振栗癃闭（清先而劲毛虫乃死，热后而暴介虫乃殃）',
    steps: [
      '初之气（大寒~春分）：地气迁，阴始凝，气始肃，水乃冰，寒雨化。其病中热胀，面目浮肿，善眠，鼽衄嚏欠呕，小便黄赤，甚则淋',
      '二之气（春分~小满）：阳乃布，民乃舒，物乃生荣。厉大至，民善暴死',
      '三之气（小满~大暑）：天政布，凉乃行，燥热交合，燥极而泽，民病寒热',
      '四之气（大暑~秋分）：寒雨降。病暴仆，振栗谵妄，少气嗌干引饮，及为心痛痈肿疮疡疟寒之疾，骨痿血便',
      '五之气（秋分~小雪）：春令反行，草乃生荣，民气和',
      '终之气（小雪~大寒）：阳气布，候反温，蛰虫来见，流水不冰，民乃康平，其病温'
    ],
    suiYi: '岁宜以咸以苦以辛，汗之清之散之，安其运气，无使受邪，折其郁气，资其化源；以寒热轻重少多其制，同热者多天化，同清者多地化',
    fangJi: { name: '审平汤', source: '《三因极一病证方论·六气时行民病证治》', zhu: '治卯酉岁阳明司天少阴在泉：中热面浮鼻鼽，小便赤黄，甚则淋，或疠气行善暴仆，振栗谵妄，寒疟痈肿便血。组成：远志(姜制)、紫檀香各一两，天门冬、山茱萸各三分，白术、白芍药、甘草(炙)、生姜各半两。六步加减：大寒至春分加茯苓半夏紫苏生姜各半两；春分至小满加玄参白薇各半两；小满至大暑去远志山茱萸白术加丹参泽泻各半两；大暑至秋分去远志白术加酸枣仁车前子各半两；秋分后依正方。治法：宜咸寒以抑火，辛甘以助金，汗之清之散之' }
  },
  '寅申': {
    siTian: { qi: '少阳相火', wuxing: '火' },
    zaiQuan: { qi: '厥阴风木', wuxing: '木' },
    yunZhu: '先天',
    zheng: '少阳之政',
    tiangXiang: '上应荧惑岁星',
    shiGu: '其谷丹苍',
    zongBing: '民病寒中，外发疮疡，内为泄满；往复之作，民病寒热疟泄，聋瞑呕吐，上怫肿色变',
    steps: [
      '初之气（大寒~春分）：地气迁，风胜乃摇，寒乃去，候乃大温，草木早荣。温病乃起，其病气怫于上，血溢目赤，咳逆头痛，血崩胁满，肤腠中疮',
      '二之气（春分~小满）：火反郁，白埃四起，云趋雨府，风不胜湿，雨乃零，民乃康。其病热郁于上，咳逆呕吐，疮发于中，胸嗌不利，头痛身热，昏愦脓疮',
      '三之气（小满~大暑）：天政布，炎暑至，少阳临上，雨乃涯。民病热中，聋瞑血溢，脓疮咳呕，鼽衄渴嚏欠，喉痹目赤，善暴死',
      '四之气（大暑~秋分）：凉乃至，炎暑间化，白露降，民气和平，其病满身重',
      '五之气（秋分~小雪）：阳乃去，寒乃来，雨乃降，气门乃闭，刚木早雕，民避寒邪，君子周密',
      '终之气（小雪~大寒）：地气正，风乃至，万物反生，霿雾以行。其病关闭不禁，心痛，阳气不藏而咳'
    ],
    suiYi: '岁宜咸辛宜酸，渗之泄之，渍之发之，观气寒温以调其过，同风热者多寒化，异风热者少寒化',
    fangJi: { name: '升明汤', source: '《三因极一病证方论·六气时行民病证治》', zhu: '治寅申岁少阳司天厥阴在泉：气郁热，血溢目赤，咳逆头痛，胁满呕吐，胸臆不利，聋瞑渴，身重心痛，阳气不藏，疮疡烦躁。组成：紫檀香、车前子(炒)、青皮、半夏(汤洗)、酸枣仁、蔷薇、生姜、甘草(炙)各半两。六步加减：大寒至春分加白薇玄参各半两；春分至小满加丁香一钱；小满至大暑加漏芦升麻赤芍各半两；大暑至秋分加茯苓半两；秋分后依正方；小雪至大寒加五味子半两。治法：宜咸寒平其上，辛温治其内，宜酸渗之泄之渍之发之' }
  },
  '丑未': {
    siTian: { qi: '太阴湿土', wuxing: '土' },
    zaiQuan: { qi: '太阳寒水', wuxing: '水' },
    yunZhu: '后天',
    zheng: '太阴之政',
    tiangXiang: '上应镇星辰星',
    shiGu: '其谷黅玄',
    zongBing: '民病寒湿，腹满身膹愤胕肿，痞逆寒厥拘急',
    steps: [
      '初之气（大寒~春分）：地气迁，寒乃去，春气正，风乃来，生布万物以荣，民气条舒，风湿相薄，雨乃后。民病血溢，筋络拘强，关节不利，身重筋痿',
      '二之气（春分~小满）：大火正，物承化，民乃和，其病温厉大行，远近咸若，湿蒸相薄，雨乃时降',
      '三之气（小满~大暑）：天政布，湿气降，地气腾，雨乃时降，寒乃随之。感于寒湿，则民病身重胕肿，胸腹满',
      '四之气（大暑~秋分）：畏火临，溽蒸化，地气腾，天气痞隔，寒风晓暮，蒸热相薄，草木凝烟，湿化不流，则白露阴布，以成秋令。民病腠理热，血暴溢疟，心腹满热胪胀，甚则胕肿',
      '五之气（秋分~小雪）：惨令已行，寒露下，霜乃早降，草木黄落，寒气及体，君子周密，民病皮腠',
      '终之气（小雪~大寒）：寒大举，湿大化，霜乃积，阴乃凝，水坚冰，阳光不治。感于寒，则病人关节禁固，腰脽痛，寒湿推于气交而为疾也'
    ],
    suiYi: '岁宜以苦燥之温之，甚者发之泄之；不发不泄则湿气外溢，肉溃皮拆而水血交流；必赞其阳火，令御甚寒；同寒者以热化，同湿者以燥化',
    fangJi: { name: '备化汤', source: '《三因极一病证方论·六气时行民病证治》', zhu: '治丑未岁太阴司天太阳在泉：关节不利，筋脉拘急，身重萎弱，或温疠盛行，或胸腹满闷，甚则浮肿，寒疟血溢，腰脽痛。组成：木瓜干、茯神各一两，牛膝(酒浸)、附子(炮)各三分，熟地黄、覆盆子各半两，甘草一分，生姜三分。六步加减：大寒至春分依正方；春分至小满去附子加天麻防风各半两；小满至大暑加泽泻三分；大暑后依正方。治法：用酸以平其上，甘温治其下，以苦燥之温之，甚则发之泄之，赞其阳火令御其寒' }
  },
  '子午': {
    siTian: { qi: '少阴君火', wuxing: '火' },
    zaiQuan: { qi: '阳明燥金', wuxing: '金' },
    yunZhu: '先天',
    zheng: '少阴之政',
    tiangXiang: '上应荧惑太白',
    shiGu: '其谷丹白',
    zongBing: '民病咳喘，血溢血泄鼽嚏，目赤眦疡，寒厥入胃，心痛腰痛，腹大嗌干肿上',
    steps: [
      '初之气（大寒~春分）：地气迁，燥将去，寒乃始，蛰复藏，水乃冰，霜复降，风乃至，阳气郁，民反周密，关节禁固，腰脽痛，炎暑将起，中外疮疡',
      '二之气（春分~小满）：阳气布，风乃行，春气以正，万物应荣，寒气时至，民乃和。其病淋，目瞑目赤，气郁于上而热',
      '三之气（小满~大暑）：天政布，大火行，庶类番鲜，寒气时至。民病气厥心痛，寒热更作，咳喘目赤',
      '四之气（大暑~秋分）：溽暑至，大雨时行，寒热互至。民病寒热，嗌干黄瘅，鼽衄饮发',
      '五之气（秋分~小雪）：畏火临，暑反至，阳乃化，万物乃生乃长荣，民乃康，其病温',
      '终之气（小雪~大寒）：燥令行，余火内格，肿于上，咳喘，甚则血溢。寒气数举，则霿雾翳，病生皮腠，内舍于胁，下连少腹而作寒中，地将易也'
    ],
    suiYi: '岁宜咸以软之而调其上，甚则以苦发之；以酸收之而安其下，甚则以苦泄之；同天气者以寒清化，同地气者以温热化',
    fangJi: { name: '正阳汤', source: '《三因极一病证方论·六气时行民病证治》', zhu: '治子午岁少阴司天阳明在泉：关节禁固，腰痛，气郁热，小便淋，目赤心痛，寒热更作，咳喘，或鼻鼽嗌咽吐饮，发黄瘅喘，甚则连小腹而作寒中。组成：白薇、玄参、川芎、桑白皮(炙)、当归、芍药、旋覆花、甘草(炙)、生姜各半两。六步加减：大寒至春分加杏仁升麻各半两；春分至小满加茯苓车前子各半两；小满至大暑加杏仁麻仁各一分；大暑至秋分加荆芥茵陈各一分；秋分后依正方；小雪至大寒加紫苏子半两。治法：宜咸以平其上，苦热以治其内，咸以软之，苦以发之，酸以收之' }
  },
  '巳亥': {
    siTian: { qi: '厥阴风木', wuxing: '木' },
    zaiQuan: { qi: '少阳相火', wuxing: '火' },
    yunZhu: '后天',
    zheng: '厥阴之政',
    tiangXiang: '上应岁星荧惑',
    shiGu: '其谷苍丹',
    zongBing: '风燥火热，胜复更作，蛰虫来见，流水不冰，热病行于下，风病行于上，风燥胜复形于中',
    steps: [
      '初之气（大寒~春分）：寒始肃，杀气方至，民病寒于右之下',
      '二之气（春分~小满）：寒不去，华雪水冰，杀气施化，霜乃降，名草上焦，寒雨数至，阳复化，民病热于中',
      '三之气（小满~大暑）：天政布，风乃时举，民病泣出耳鸣掉眩',
      '四之气（大暑~秋分）：溽暑湿热相薄，争于左之上，民病黄瘅而为胕肿',
      '五之气（秋分~小雪）：燥湿更胜，沉阴乃布，寒气及体，风雨乃行',
      '终之气（小雪~大寒）：畏火司令，阳乃大化，蛰虫出见，流水不冰，地气大发，草乃生，人乃舒，其病温厉'
    ],
    suiYi: '岁宜以辛调上，以咸调下，畏火之气，无妄犯之；折其郁气，资其化源，赞其运气，无使邪胜',
    fangJi: { name: '敷和汤', source: '《三因极一病证方论·六气时行民病证治》', zhu: '治巳亥岁厥阴司天少阳在泉：中热而反右胁下寒，耳鸣，泪出掉眩，燥湿相搏，民病黄瘅浮肿，时作瘟疠。组成：半夏(汤洗)、枣子、五味子、枳实(麸炒)、茯苓、诃子(炮)、干姜(炮)、橘皮、甘草(炙)各半两。六步加减：大寒至春分加鼠粘子一分；春分至小满加麦门冬山药各一分；小满至大暑加紫菀一分；大暑至秋分加泽泻山栀仁各一分；秋分后依正方。治法：宜用辛凉平其上，咸寒调其下，畏火之气无妄犯之' }
  }
};

const SIXTY_YEARS = [
  // ===== 辰戌之纪：太阳寒水司天 太阴湿土在泉 =====
  { ganzhi: '壬辰', zhiGroup: '辰戌', yunType: '太角', yunWuxing: '木', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '风', qiHua: '鸣紊启拆', qiBian: '振拉摧拔', qiBingYun: '眩掉目瞑', huaShu: { zhong: '风化八', qita: '寒化六，雨化五' }, zaiGong: '', yaoShiYi: { shang: '苦温', zhong: '酸和', xia: '甘温' } },
  { ganzhi: '壬戌', zhiGroup: '辰戌', yunType: '太角', yunWuxing: '木', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '风', qiHua: '鸣紊启拆', qiBian: '振拉摧拔', qiBingYun: '眩掉目瞑', huaShu: { zhong: '风化八', qita: '寒化六，雨化五' }, zaiGong: '', yaoShiYi: { shang: '苦温', zhong: '酸和', xia: '甘温' } },
  { ganzhi: '戊辰', zhiGroup: '辰戌', yunType: '太征', yunWuxing: '火', yunLevel: 'taiGuo', shengFu: '', pingQi: '同正征（太过被抑，火运平气）', fuHui: [], qiYun: '热', qiHua: '暄暑郁燠', qiBian: '炎烈沸腾', qiBingYun: '热郁', huaShu: { zhong: '热化七', qita: '寒化六，湿化五' }, zaiGong: '', yaoShiYi: { shang: '苦温', zhong: '甘和', xia: '甘温' } },
  { ganzhi: '戊戌', zhiGroup: '辰戌', yunType: '太征', yunWuxing: '火', yunLevel: 'taiGuo', shengFu: '', pingQi: '同正征（太过被抑，火运平气）', fuHui: [], qiYun: '热', qiHua: '暄暑郁燠', qiBian: '炎烈沸腾', qiBingYun: '热郁', huaShu: { zhong: '热化七', qita: '寒化六，湿化五' }, zaiGong: '', yaoShiYi: { shang: '苦温', zhong: '甘和', xia: '甘温' } },
  { ganzhi: '甲辰', zhiGroup: '辰戌', yunType: '太宫', yunWuxing: '土', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['岁会', '同天符'], qiYun: '阴埃', qiHua: '柔润重泽', qiBian: '震惊飘骤', qiBingYun: '湿下重', huaShu: { zhong: '雨化五', qita: '寒化六' }, zaiGong: '', yaoShiYi: { shang: '苦热', zhong: '苦温', xia: '苦温' } },
  { ganzhi: '甲戌', zhiGroup: '辰戌', yunType: '太宫', yunWuxing: '土', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['岁会', '同天符'], qiYun: '阴埃', qiHua: '柔润重泽', qiBian: '震惊飘骤', qiBingYun: '湿下重', huaShu: { zhong: '雨化五', qita: '寒化六' }, zaiGong: '', yaoShiYi: { shang: '苦热', zhong: '苦温', xia: '苦温' } },
  { ganzhi: '庚辰', zhiGroup: '辰戌', yunType: '太商', yunWuxing: '金', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '凉', qiHua: '雾露萧骚', qiBian: '肃杀雕零', qiBingYun: '燥背瞀胸满', huaShu: { zhong: '清化九', qita: '寒化一，雨化五' }, zaiGong: '', yaoShiYi: { shang: '苦热', zhong: '辛温', xia: '甘热' } },
  { ganzhi: '庚戌', zhiGroup: '辰戌', yunType: '太商', yunWuxing: '金', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '凉', qiHua: '雾露萧骚', qiBian: '肃杀雕零', qiBingYun: '燥背瞀胸满', huaShu: { zhong: '清化九', qita: '寒化一，雨化五' }, zaiGong: '', yaoShiYi: { shang: '苦热', zhong: '辛温', xia: '甘热' } },
  { ganzhi: '丙辰', zhiGroup: '辰戌', yunType: '太羽', yunWuxing: '水', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['天符'], qiYun: '寒', qiHua: '凝惨凛冽', qiBian: '冰雪霜雹', qiBingYun: '大寒留于溪谷', huaShu: { zhong: '寒化六', qita: '雨化五' }, zaiGong: '', yaoShiYi: { shang: '苦热', zhong: '咸温', xia: '甘热' } },
  { ganzhi: '丙戌', zhiGroup: '辰戌', yunType: '太羽', yunWuxing: '水', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['天符'], qiYun: '寒', qiHua: '凝惨凛冽', qiBian: '冰雪霜雹', qiBingYun: '大寒留于溪谷', huaShu: { zhong: '寒化六', qita: '雨化五' }, zaiGong: '', yaoShiYi: { shang: '苦热', zhong: '咸温', xia: '甘热' } },

  // ===== 卯酉之纪：阳明燥金司天 少阴君火在泉 =====
  { ganzhi: '丁卯', zhiGroup: '卯酉', yunType: '少角', yunWuxing: '木', yunLevel: 'buJi', shengFu: '清热胜复同', pingQi: '同正商（不及得助，木运平气）', fuHui: ['岁会'], qiYun: '风清热', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '风化三', qita: '燥化九，热化七' }, zaiGong: '灾三宫', yaoShiYi: { shang: '苦小温', zhong: '辛和', xia: '咸寒' } },
  { ganzhi: '丁酉', zhiGroup: '卯酉', yunType: '少角', yunWuxing: '木', yunLevel: 'buJi', shengFu: '清热胜复同', pingQi: '同正商（不及得助，木运平气）', fuHui: [], qiYun: '风清热', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '风化三', qita: '燥化九，热化七' }, zaiGong: '灾三宫', yaoShiYi: { shang: '苦小温', zhong: '辛和', xia: '咸寒' } },
  { ganzhi: '癸卯', zhiGroup: '卯酉', yunType: '少征', yunWuxing: '火', yunLevel: 'buJi', shengFu: '寒雨胜复同', pingQi: '同正商（不及得助，火运平气）', fuHui: ['同岁会'], qiYun: '热寒雨', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '热化二', qita: '燥化九' }, zaiGong: '灾九宫', yaoShiYi: { shang: '苦小温', zhong: '咸温', xia: '咸寒' } },
  { ganzhi: '癸酉', zhiGroup: '卯酉', yunType: '少征', yunWuxing: '火', yunLevel: 'buJi', shengFu: '寒雨胜复同', pingQi: '同正商（不及得助，火运平气）', fuHui: ['同岁会'], qiYun: '热寒雨', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '热化二', qita: '燥化九' }, zaiGong: '灾九宫', yaoShiYi: { shang: '苦小温', zhong: '咸温', xia: '咸寒' } },
  { ganzhi: '己卯', zhiGroup: '卯酉', yunType: '少宫', yunWuxing: '土', yunLevel: 'buJi', shengFu: '风凉胜复同', pingQi: '', fuHui: [], qiYun: '雨风凉', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '雨化五', qita: '清化九，热化七' }, zaiGong: '灾五宫', yaoShiYi: { shang: '苦小温', zhong: '甘和', xia: '咸寒' } },
  { ganzhi: '己酉', zhiGroup: '卯酉', yunType: '少宫', yunWuxing: '土', yunLevel: 'buJi', shengFu: '风凉胜复同', pingQi: '', fuHui: [], qiYun: '雨风凉', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '雨化五', qita: '清化九，热化七' }, zaiGong: '灾五宫', yaoShiYi: { shang: '苦小温', zhong: '甘和', xia: '咸寒' } },
  { ganzhi: '乙卯', zhiGroup: '卯酉', yunType: '少商', yunWuxing: '金', yunLevel: 'buJi', shengFu: '热寒胜复同', pingQi: '同正商（不及得助，金运平气）', fuHui: ['天符'], qiYun: '凉热寒', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '清化四', qita: '热化二' }, zaiGong: '灾七宫', yaoShiYi: { shang: '苦小温', zhong: '苦和', xia: '咸寒' } },
  { ganzhi: '乙酉', zhiGroup: '卯酉', yunType: '少商', yunWuxing: '金', yunLevel: 'buJi', shengFu: '热寒胜复同', pingQi: '同正商（不及得助，金运平气）', fuHui: ['天符', '岁会', '太一天符'], qiYun: '凉热寒', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '清化四', qita: '热化二' }, zaiGong: '灾七宫', yaoShiYi: { shang: '苦小温', zhong: '苦和', xia: '咸寒' } },
  { ganzhi: '辛卯', zhiGroup: '卯酉', yunType: '少羽', yunWuxing: '水', yunLevel: 'buJi', shengFu: '雨风胜复同', pingQi: '同少宫', fuHui: [], qiYun: '寒雨风', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '寒化一', qita: '清化九，热化七' }, zaiGong: '灾一宫', yaoShiYi: { shang: '苦小温', zhong: '苦和', xia: '咸寒' } },
  { ganzhi: '辛酉', zhiGroup: '卯酉', yunType: '少羽', yunWuxing: '水', yunLevel: 'buJi', shengFu: '雨风胜复同', pingQi: '同少宫', fuHui: [], qiYun: '寒雨风', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '寒化一', qita: '清化九，热化七' }, zaiGong: '灾一宫', yaoShiYi: { shang: '苦小温', zhong: '苦和', xia: '咸寒' } },

  // ===== 寅申之纪：少阳相火司天 厥阴风木在泉 =====
  { ganzhi: '壬寅', zhiGroup: '寅申', yunType: '太角', yunWuxing: '木', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['同天符'], qiYun: '风鼓', qiHua: '鸣紊启坼', qiBian: '振拉摧拔', qiBingYun: '掉眩支胁惊骇', huaShu: { zhong: '风化八', qita: '火化二' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '酸和', xia: '辛凉' } },
  { ganzhi: '壬申', zhiGroup: '寅申', yunType: '太角', yunWuxing: '木', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['同天符'], qiYun: '风鼓', qiHua: '鸣紊启坼', qiBian: '振拉摧拔', qiBingYun: '掉眩支胁惊骇', huaShu: { zhong: '风化八', qita: '火化二' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '酸和', xia: '辛凉' } },
  { ganzhi: '戊寅', zhiGroup: '寅申', yunType: '太征', yunWuxing: '火', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['天符'], qiYun: '暑', qiHua: '暄嚣郁燠', qiBian: '炎烈沸腾', qiBingYun: '上热郁血溢血泄心痛', huaShu: { zhong: '火化七', qita: '风化三' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '甘和', xia: '辛凉' } },
  { ganzhi: '戊申', zhiGroup: '寅申', yunType: '太征', yunWuxing: '火', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['天符'], qiYun: '暑', qiHua: '暄嚣郁燠', qiBian: '炎烈沸腾', qiBingYun: '上热郁血溢血泄心痛', huaShu: { zhong: '火化七', qita: '风化三' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '甘和', xia: '辛凉' } },
  { ganzhi: '甲寅', zhiGroup: '寅申', yunType: '太宫', yunWuxing: '土', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '阴雨', qiHua: '柔润重泽', qiBian: '震惊飘骤', qiBingYun: '体重胕肿痞饮', huaShu: { zhong: '雨化五', qita: '火化二，风化八' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '咸和', xia: '辛凉' } },
  { ganzhi: '甲申', zhiGroup: '寅申', yunType: '太宫', yunWuxing: '土', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '阴雨', qiHua: '柔润重泽', qiBian: '震惊飘骤', qiBingYun: '体重胕肿痞饮', huaShu: { zhong: '雨化五', qita: '火化二，风化八' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '咸和', xia: '辛凉' } },
  { ganzhi: '庚寅', zhiGroup: '寅申', yunType: '太商', yunWuxing: '金', yunLevel: 'taiGuo', shengFu: '', pingQi: '同正商（太过被抑，金运平气）', fuHui: [], qiYun: '凉', qiHua: '雾露清切', qiBian: '肃杀雕零', qiBingYun: '肩背胸中', huaShu: { zhong: '清化九', qita: '火化七，风化三' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '辛温', xia: '辛凉' } },
  { ganzhi: '庚申', zhiGroup: '寅申', yunType: '太商', yunWuxing: '金', yunLevel: 'taiGuo', shengFu: '', pingQi: '同正商（太过被抑，金运平气）', fuHui: [], qiYun: '凉', qiHua: '雾露清切', qiBian: '肃杀雕零', qiBingYun: '肩背胸中', huaShu: { zhong: '清化九', qita: '火化七，风化三' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '辛温', xia: '辛凉' } },
  { ganzhi: '丙寅', zhiGroup: '寅申', yunType: '太羽', yunWuxing: '水', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '寒肃', qiHua: '凝惨凛冽', qiBian: '冰雪霜雹', qiBingYun: '寒浮肿', huaShu: { zhong: '寒化六', qita: '火化二' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '咸温', xia: '辛温' } },
  { ganzhi: '丙申', zhiGroup: '寅申', yunType: '太羽', yunWuxing: '水', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '寒肃', qiHua: '凝惨凛冽', qiBian: '冰雪霜雹', qiBingYun: '寒浮肿', huaShu: { zhong: '寒化六', qita: '火化二' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '咸温', xia: '辛温' } },

  // ===== 丑未之纪：太阴湿土司天 太阳寒水在泉 =====
  { ganzhi: '丁丑', zhiGroup: '丑未', yunType: '少角', yunWuxing: '木', yunLevel: 'buJi', shengFu: '清热胜复同', pingQi: '同正宫（不及得助，木运平气）', fuHui: [], qiYun: '风清热', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '风化三', qita: '雨化五，寒化一' }, zaiGong: '灾三宫', yaoShiYi: { shang: '苦温', zhong: '辛温', xia: '甘热' } },
  { ganzhi: '丁未', zhiGroup: '丑未', yunType: '少角', yunWuxing: '木', yunLevel: 'buJi', shengFu: '清热胜复同', pingQi: '同正宫（不及得助，木运平气）', fuHui: [], qiYun: '风清热', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '风化三', qita: '雨化五，寒化一' }, zaiGong: '灾三宫', yaoShiYi: { shang: '苦温', zhong: '辛温', xia: '甘热' } },
  { ganzhi: '癸丑', zhiGroup: '丑未', yunType: '少征', yunWuxing: '火', yunLevel: 'buJi', shengFu: '寒雨胜复同', pingQi: '', fuHui: [], qiYun: '热寒雨', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '火化二', qita: '雨化五，寒化一' }, zaiGong: '灾九宫', yaoShiYi: { shang: '苦温', zhong: '咸温', xia: '甘热' } },
  { ganzhi: '癸未', zhiGroup: '丑未', yunType: '少征', yunWuxing: '火', yunLevel: 'buJi', shengFu: '寒雨胜复同', pingQi: '', fuHui: [], qiYun: '热寒雨', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '火化二', qita: '雨化五，寒化一' }, zaiGong: '灾九宫', yaoShiYi: { shang: '苦温', zhong: '咸温', xia: '甘热' } },
  { ganzhi: '己丑', zhiGroup: '丑未', yunType: '少宫', yunWuxing: '土', yunLevel: 'buJi', shengFu: '风清胜复同', pingQi: '同正宫（不及得助，土运平气）', fuHui: ['天符', '太一天符'], qiYun: '雨风清', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '雨化五', qita: '寒化一' }, zaiGong: '灾五宫', yaoShiYi: { shang: '苦热', zhong: '甘和', xia: '甘热' } },
  { ganzhi: '己未', zhiGroup: '丑未', yunType: '少宫', yunWuxing: '土', yunLevel: 'buJi', shengFu: '风清胜复同', pingQi: '同正宫（不及得助，土运平气）', fuHui: ['天符', '太一天符'], qiYun: '雨风清', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '雨化五', qita: '寒化一' }, zaiGong: '灾五宫', yaoShiYi: { shang: '苦热', zhong: '甘和', xia: '甘热' } },
  { ganzhi: '乙丑', zhiGroup: '丑未', yunType: '少商', yunWuxing: '金', yunLevel: 'buJi', shengFu: '热寒胜复同', pingQi: '', fuHui: [], qiYun: '凉热寒', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '清化四', qita: '雨化五，寒化一' }, zaiGong: '灾七宫', yaoShiYi: { shang: '苦热', zhong: '酸和', xia: '甘热' } },
  { ganzhi: '乙未', zhiGroup: '丑未', yunType: '少商', yunWuxing: '金', yunLevel: 'buJi', shengFu: '热寒胜复同', pingQi: '', fuHui: [], qiYun: '凉热寒', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '清化四', qita: '雨化五，寒化一' }, zaiGong: '灾七宫', yaoShiYi: { shang: '苦热', zhong: '酸和', xia: '甘热' } },
  { ganzhi: '辛丑', zhiGroup: '丑未', yunType: '少羽', yunWuxing: '水', yunLevel: 'buJi', shengFu: '雨风胜复同', pingQi: '同正宫（不及得助，水运平气）', fuHui: ['同岁会'], qiYun: '寒雨风', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '寒化一', qita: '雨化五' }, zaiGong: '灾一宫', yaoShiYi: { shang: '苦热', zhong: '苦和', xia: '苦热' } },
  { ganzhi: '辛未', zhiGroup: '丑未', yunType: '少羽', yunWuxing: '水', yunLevel: 'buJi', shengFu: '雨风胜复同', pingQi: '同正宫（不及得助，水运平气）', fuHui: ['同岁会'], qiYun: '寒雨风', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '寒化一', qita: '雨化五' }, zaiGong: '灾一宫', yaoShiYi: { shang: '苦热', zhong: '苦和', xia: '苦热' } },

  // ===== 子午之纪：少阴君火司天 阳明燥金在泉 =====
  { ganzhi: '壬子', zhiGroup: '子午', yunType: '太角', yunWuxing: '木', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '风鼓', qiHua: '鸣紊启拆', qiBian: '振拉摧拔', qiBingYun: '支满', huaShu: { zhong: '风化八', qita: '热化二，清化四' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '酸凉', xia: '酸温' } },
  { ganzhi: '壬午', zhiGroup: '子午', yunType: '太角', yunWuxing: '木', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '风鼓', qiHua: '鸣紊启拆', qiBian: '振拉摧拔', qiBingYun: '支满', huaShu: { zhong: '风化八', qita: '热化二，清化四' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '酸凉', xia: '酸温' } },
  { ganzhi: '戊子', zhiGroup: '子午', yunType: '太征', yunWuxing: '火', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['天符'], qiYun: '炎暑', qiHua: '暄曜郁燠', qiBian: '炎烈沸腾', qiBingYun: '上热血溢', huaShu: { zhong: '热化七', qita: '清化九' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '甘寒', xia: '酸温' } },
  { ganzhi: '戊午', zhiGroup: '子午', yunType: '太征', yunWuxing: '火', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['天符', '岁会', '太一天符'], qiYun: '炎暑', qiHua: '暄曜郁燠', qiBian: '炎烈沸腾', qiBingYun: '上热血溢', huaShu: { zhong: '热化七', qita: '清化九' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '甘寒', xia: '酸温' } },
  { ganzhi: '甲子', zhiGroup: '子午', yunType: '太宫', yunWuxing: '土', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '阴雨', qiHua: '柔润时雨', qiBian: '震惊飘骤', qiBingYun: '中满身重', huaShu: { zhong: '雨化五', qita: '热化二，燥化四' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '苦热', xia: '酸热' } },
  { ganzhi: '甲午', zhiGroup: '子午', yunType: '太宫', yunWuxing: '土', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '阴雨', qiHua: '柔润时雨', qiBian: '震惊飘骤', qiBingYun: '中满身重', huaShu: { zhong: '雨化五', qita: '热化二，燥化四' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '苦热', xia: '酸热' } },
  { ganzhi: '庚子', zhiGroup: '子午', yunType: '太商', yunWuxing: '金', yunLevel: 'taiGuo', shengFu: '', pingQi: '同正商（太过被抑，金运平气）', fuHui: ['同天符'], qiYun: '凉劲', qiHua: '雾露萧骚', qiBian: '肃杀雕零', qiBingYun: '下清', huaShu: { zhong: '清化九', qita: '热化七，燥化九' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '辛温', xia: '酸温' } },
  { ganzhi: '庚午', zhiGroup: '子午', yunType: '太商', yunWuxing: '金', yunLevel: 'taiGuo', shengFu: '', pingQi: '同正商（太过被抑，金运平气）', fuHui: ['同天符'], qiYun: '凉劲', qiHua: '雾露萧骚', qiBian: '肃杀雕零', qiBingYun: '下清', huaShu: { zhong: '清化九', qita: '热化七，燥化九' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '辛温', xia: '酸温' } },
  { ganzhi: '丙子', zhiGroup: '子午', yunType: '太羽', yunWuxing: '水', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: ['岁会'], qiYun: '寒', qiHua: '凝惨凛冽', qiBian: '冰雪霜雹', qiBingYun: '寒下', huaShu: { zhong: '寒化六', qita: '热化二，清化四' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '咸热', xia: '酸温' } },
  { ganzhi: '丙午', zhiGroup: '子午', yunType: '太羽', yunWuxing: '水', yunLevel: 'taiGuo', shengFu: '', pingQi: '', fuHui: [], qiYun: '寒', qiHua: '凝惨凛冽', qiBian: '冰雪霜雹', qiBingYun: '寒下', huaShu: { zhong: '寒化六', qita: '热化二，清化四' }, zaiGong: '', yaoShiYi: { shang: '咸寒', zhong: '咸热', xia: '酸温' } },

  // ===== 巳亥之纪：厥阴风木司天 少阳相火在泉 =====
  { ganzhi: '丁巳', zhiGroup: '巳亥', yunType: '少角', yunWuxing: '木', yunLevel: 'buJi', shengFu: '清热胜复同', pingQi: '同正角（不及得助，木运平气）', fuHui: ['天符'], qiYun: '风清热', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '风化三', qita: '火化七' }, zaiGong: '灾三宫', yaoShiYi: { shang: '辛凉', zhong: '辛和', xia: '咸寒' } },
  { ganzhi: '丁亥', zhiGroup: '巳亥', yunType: '少角', yunWuxing: '木', yunLevel: 'buJi', shengFu: '清热胜复同', pingQi: '同正角（不及得助，木运平气）', fuHui: ['天符'], qiYun: '风清热', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '风化三', qita: '火化七' }, zaiGong: '灾三宫', yaoShiYi: { shang: '辛凉', zhong: '辛和', xia: '咸寒' } },
  { ganzhi: '癸巳', zhiGroup: '巳亥', yunType: '少征', yunWuxing: '火', yunLevel: 'buJi', shengFu: '寒雨胜复同', pingQi: '', fuHui: ['同岁会'], qiYun: '热寒雨', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '火化二', qita: '风化八' }, zaiGong: '灾九宫', yaoShiYi: { shang: '辛凉', zhong: '咸和', xia: '咸寒' } },
  { ganzhi: '癸亥', zhiGroup: '巳亥', yunType: '少征', yunWuxing: '火', yunLevel: 'buJi', shengFu: '寒雨胜复同', pingQi: '', fuHui: ['同岁会'], qiYun: '热寒雨', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '火化二', qita: '风化八' }, zaiGong: '灾九宫', yaoShiYi: { shang: '辛凉', zhong: '咸和', xia: '咸寒' } },
  { ganzhi: '己巳', zhiGroup: '巳亥', yunType: '少宫', yunWuxing: '土', yunLevel: 'buJi', shengFu: '风清胜复同', pingQi: '同正角（不及得助，土运平气）', fuHui: [], qiYun: '雨风清', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '雨化五', qita: '风化三，火化七' }, zaiGong: '灾五宫', yaoShiYi: { shang: '辛凉', zhong: '甘和', xia: '咸寒' } },
  { ganzhi: '己亥', zhiGroup: '巳亥', yunType: '少宫', yunWuxing: '土', yunLevel: 'buJi', shengFu: '风清胜复同', pingQi: '同正角（不及得助，土运平气）', fuHui: [], qiYun: '雨风清', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '雨化五', qita: '风化三，火化七' }, zaiGong: '灾五宫', yaoShiYi: { shang: '辛凉', zhong: '甘和', xia: '咸寒' } },
  { ganzhi: '乙巳', zhiGroup: '巳亥', yunType: '少商', yunWuxing: '金', yunLevel: 'buJi', shengFu: '热寒胜复同', pingQi: '同正角（不及得助，金运平气）', fuHui: [], qiYun: '凉热寒', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '清化四', qita: '风化八，火化二' }, zaiGong: '灾七宫', yaoShiYi: { shang: '辛凉', zhong: '酸和', xia: '咸寒' } },
  { ganzhi: '乙亥', zhiGroup: '巳亥', yunType: '少商', yunWuxing: '金', yunLevel: 'buJi', shengFu: '热寒胜复同', pingQi: '同正角（不及得助，金运平气）', fuHui: [], qiYun: '凉热寒', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '清化四', qita: '风化八，火化二' }, zaiGong: '灾七宫', yaoShiYi: { shang: '辛凉', zhong: '酸和', xia: '咸寒' } },
  { ganzhi: '辛巳', zhiGroup: '巳亥', yunType: '少羽', yunWuxing: '水', yunLevel: 'buJi', shengFu: '雨风胜复同', pingQi: '', fuHui: [], qiYun: '寒雨风', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '寒化一', qita: '风化三，火化七' }, zaiGong: '灾一宫', yaoShiYi: { shang: '辛凉', zhong: '苦和', xia: '咸寒' } },
  { ganzhi: '辛亥', zhiGroup: '巳亥', yunType: '少羽', yunWuxing: '水', yunLevel: 'buJi', shengFu: '雨风胜复同', pingQi: '', fuHui: [], qiYun: '寒雨风', qiHua: '', qiBian: '', qiBingYun: '', huaShu: { zhong: '寒化一', qita: '风化三，火化七' }, zaiGong: '灾一宫', yaoShiYi: { shang: '辛凉', zhong: '苦和', xia: '咸寒' } }
];

// 六十年运气上下相临关系（《运气要诀·六十年运气上下相临歌》）
// 顺化：气生运（相得）；天刑：气克运（不相得）；小逆：运生气（子居母上，主微病）；
// 不和：运克气（下克上，主病甚）；天符：运气相同（同气偏胜亢害）
const LIN_YUN_RULES = [
  { type: '顺化', desc: '司天生中运，上生下，相得之岁', years: ['癸巳','癸亥','甲子','甲午','甲寅','甲申','乙丑','乙未','辛卯','辛酉','壬辰','壬戌'] },
  { type: '天刑', desc: '司天克中运，以上克下，不相得之岁', years: ['己巳','己亥','辛丑','辛未','戊辰','戊戌','庚子','庚午','庚寅','庚申','丁卯','丁酉'] },
  { type: '小逆', desc: '中运生司天，以下生上，子居母上，主微病', years: ['癸丑','癸未','壬子','壬午','壬寅','壬申','辛巳','辛亥','庚辰','庚戌','己卯','己酉'] },
  { type: '不和', desc: '中运克司天，以下克上，不相得，主病甚', years: ['乙巳','乙亥','丙子','丙午','丙寅','丙申','丁丑','丁未','癸卯','癸酉','甲辰','甲戌'] },
  { type: '天符', desc: '运气相同，同气相临，虽曰同气，不无偏胜亢害', years: ['丁巳','丁亥','戊子','戊午','戊寅','戊申','己丑','己未','乙卯','乙酉','丙辰','丙戌'] }
];

module.exports = { SIXTY_YEARS, ZHI_GROUPS, LIN_YUN_RULES };