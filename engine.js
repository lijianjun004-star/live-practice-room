(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PracticeEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const scenes = {
    general: { name: '日常聊天', product: '这个', lines: [
      '刚进来，今天聊什么呀？','主播第一次练播吗？感觉还挺自然的','可以再讲详细一点吗？','我来了，晚上好！','主播平时几点开播？','这个话题我也有话说','先蹲一会儿，听你讲','刚才没听清，可以再说一遍吗？','有没有和我一样刚下班的','主播看一下弹幕呀','这个我也遇到过','接下来准备聊什么？','今天状态不错，加油','能不能举个实际例子？','你说的我大概明白了','有没有更简单的说法？'
    ]},
    digital: { name: '数码家电', product: '这款产品', lines: [
      '{商品}多少钱？','这款和上一代有什么区别？','日常使用费电吗？','家里空间不大，能放得下吗？','售后怎么联系？','有安装服务吗？','外观能不能近一点看？','主播讲一下最实用的功能','这个价格还会有优惠吗？','什么时候发货？','送到家里还是要自提？','运行的时候声音大不大？','老人用起来方便吗？','和其他款怎么选？','质保多久呀？','刚进来，麻烦再讲一下重点','能不能演示一下操作？','我先对比一下尺寸'
    ]},
    beauty: { name: '美妆服饰', product: '这款', lines: [
      '有其他颜色吗？','{商品}适合日常用吗？','实际颜色和镜头里一样吗？','敏感肌可以用吗？','身高165应该怎么选？','主播能不能近距离展示一下？','材质摸起来是什么感觉？','有试用装吗？','上身效果再看一下','可以讲一下尺码吗？','清洗有什么需要注意的？','买回来不合适能退吗？','新手适不适合？','是自然光拍的吗？','什么时候发货呀？','可以和什么搭配？'
    ]},
    gaming: { name: '游戏娱乐', product: '这个游戏', lines: [
      '主播现在是什么段位？','这一局什么思路？','新手可以一起玩吗？','刚才那个操作怎么做到的？','这套配置适合新手吗？','能讲一下按键吗？','来了来了，先看一会儿','下一局玩什么？','主播看一下右边！','这个角色有什么技巧？','刚才太紧张了哈哈','能不能讲讲出装思路？','这波怎么处理会更好？','别急，还有机会','这个地图我也经常玩','你一般什么时候开播？'
    ]},
    knowledge: { name: '知识分享', product: '这个方法', lines: [
      '零基础可以学吗？','可以举一个具体例子吗？','这一点能再解释一下吗？','有没有简单一点的入门方法？','每天需要练多久？','实际工作里怎么应用？','有没有常见的错误要避开？','刚才那个步骤我没跟上','主播讲慢一点，我记一下','这个和之前那个方法有什么区别？','有什么适合新手的练习？','需要准备哪些工具？','学会之后能用来做什么？','能不能再总结一下重点？','我这样理解对不对？','遇到问题应该先检查哪里？'
    ]}
  };
  const commonRules = [
    { keys: ['价格','多少钱','便宜','贵','元','块钱','预算'], replies: ['这个价格包含哪些服务？','和同价位的比，优势在哪里？','预算有限的话，有没有其他选择？'] },
    { keys: ['优惠','福利','活动','折扣','赠品','领券'], replies: ['这个优惠需要满足什么条件？','优惠活动持续到什么时候？','赠品和正装是一起发的吗？'] },
    { keys: ['发货','快递','物流','包邮','配送','到货'], replies: ['大概几天能收到？','偏远地区也能配送吗？','下单之后怎么查看物流？'] },
    { keys: ['售后','质保','保修','退货','退换','维修'], replies: ['具体的售后流程是什么？','这个保修范围包含哪些？','收到后发现问题应该怎么处理？'] },
    { keys: ['欢迎','新来','进来','晚上好','大家好','朋友们'], replies: ['刚进来，主播今天主要讲什么？','晚上好呀，第一次刷到你','来了来了，我先听一会儿'] },
    { keys: ['演示','展示','看一下','操作','使用方法'], replies: ['这个步骤可以放慢一点吗？','能不能从头完整演示一次？','新手照着这样操作就行吗？'] },
    { keys: ['区别','对比','比较','选择','怎么选'], replies: ['如果只考虑日常使用，应该选哪个？','这两种分别适合什么人？','可以用一句话总结区别吗？'] },
    { keys: ['总结','重点','最后','回顾'], replies: ['可以再重复一下最关键的那一点吗？','刚进来的能不能再听一下重点？','明白了，接下来讲什么？'] }
  ];
  const sceneRules = {
    digital: [
      { keys: ['冰箱','冷藏','冷冻','保鲜'], replies: ['冷藏和冷冻能分别调温吗？','这款冰箱的尺寸和容量能再讲一下吗？','日常存放蔬菜应该用哪个区域？'] },
      { keys: ['电视','屏幕','画质','分辨率'], replies: ['白天看会不会反光？','这个尺寸适合多大的客厅？','能不能切个实际播放画面？'] },
      { keys: ['空调','制冷','制热','匹数'], replies: ['卧室用的话应该怎么选匹数？','安装有哪些需要提前准备的？','晚上睡觉运行声音怎么样？'] },
      { keys: ['耗电','省电','能耗','能效'], replies: ['这个耗电量对应什么使用条件？','有没有具体的能效参数可以看？'] },
      { keys: ['容量','尺寸','空间','占地'], replies: ['需要预留多少安装空间？','这个尺寸包含背部的预留距离吗？'] }
    ],
    beauty: [
      { keys: ['尺码','身高','体重','版型'], replies: ['平时穿M码，这款应该怎么选？','这款是宽松版还是修身版？'] },
      { keys: ['肤质','敏感','保湿','护肤'], replies: ['敏感肌使用前需要先做什么测试？','应该放在护肤的哪个步骤用？'] },
      { keys: ['颜色','色号','搭配','显白'], replies: ['自然光下是什么颜色？','这个色号适合日常通勤吗？'] }
    ],
    gaming: [
      { keys: ['技能','连招','操作','按键'], replies: ['刚才那个连招顺序是什么？','新手应该先练哪个操作？'] },
      { keys: ['出装','装备','配置','阵容'], replies: ['对面换阵容的话要怎么调整？','有没有更适合新手的搭配？'] },
      { keys: ['输了','失败','失误','没打过'], replies: ['刚才主要是哪里没处理好？','下一局准备怎么调整？'] }
    ],
    knowledge: [
      { keys: ['方法','步骤','流程','教程'], replies: ['这个流程可以再拆开讲一下吗？','第一步最容易错在哪里？'] },
      { keys: ['练习','学习','入门','新手'], replies: ['零基础第一天应该先练什么？','怎么判断自己已经掌握了？'] }
    ],
    general: []
  };
  const nicknames = ['小橘子','晚风','阿远','柠檬不酸','路过的小林','一只团子','早睡选手','夏天的风','星河','小白同学','椰子水','今天也加油','北北','青柠','认真听讲中','可乐加冰','小麦','阿鱼','橙子汽水','周末快乐'];
  function normalize(text) { return String(text || '').replace(/\s+/g, '').toLowerCase(); }
  function pick(list, random) { return list[Math.floor((random || Math.random)() * list.length)]; }
  function parseRules(text) {
    return String(text || '').split(/\r?\n/).filter(x => x.trim()).map((line, index) => {
      const cut = line.indexOf('|');
      if (cut < 1 || !line.slice(cut + 1).trim()) throw new Error('第 ' + (index + 1) + ' 行格式应为：关键词 | 弹幕内容');
      const keys = line.slice(0, cut).split(/[,，、]/).map(x => x.trim()).filter(Boolean);
      if (!keys.length) throw new Error('第 ' + (index + 1) + ' 行缺少关键词');
      return { keys, replies: [line.slice(cut + 1).trim()] };
    });
  }
  function chooseReply(text, scene, customRules, random) {
    const input = normalize(text);
    if (input.length < 2) return null;
    const groups = [customRules || [], sceneRules[scene] || [], commonRules];
    for (const rules of groups) {
      let best = null, score = 0;
      for (const rule of rules) {
        const hits = rule.keys.reduce((n, key) => n + (input.includes(normalize(key)) ? Math.max(2, normalize(key).length) : 0), 0);
        if (hits > score) { score = hits; best = rule; }
      }
      if (best) return { text: pick(best.replies, random), topic: best.keys[0] };
    }
    // Unmatched speech stays silent; never pretend to understand it.
    return null;
  }
  function fill(text, product, scene) { return String(text).replace(/\{商品\}/g, String(product || '').trim() || (scenes[scene] || scenes.general).product); }
  return { scenes, nicknames, parseRules, chooseReply, normalize, fill, pick };
});
