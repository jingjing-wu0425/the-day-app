import { DaySummary } from "./types";

const day1: DaySummary = {
  date: "2025-05-11",
  title: "周末的菜市场",
  summary:
    "起了个大早去了<b>菜市场</b>。鱼摊的老板认识我了，多送了两根葱。回来做了一顿红烧鱼，吃了两碗饭。",
  fragments: [
    { id: "d1a", type: "text", content: "六点半就醒了，窗外鸟叫得很响。", timestamp: "06:32" },
    { id: "d1b", type: "text", content: "菜市场好热闹，很久没来了。", timestamp: "08:10" },
    { id: "d1c", type: "text", content: "买了条鲈鱼，还有西红柿和鸡蛋。", timestamp: "08:25" },
    { id: "d1d", type: "text", content: "红烧鱼做得很成功，吃了两碗饭。", timestamp: "12:30" },
    { id: "d1e", type: "text", content: "下午看了一部电影，看到一半睡着了。", timestamp: "15:40" },
  ],
};

const day2: DaySummary = {
  date: "2025-05-12",
  title: "风很大",
  summary:
    "今天<b>风很大</b>，出门头发被吹成鸟窝。下午在窗口看外面的树被吹得东倒西歪，有种莫名的安心感。",
  fragments: [
    { id: "d2a", type: "text", content: "风好大，差点没站稳。", timestamp: "07:50" },
    { id: "d2b", type: "text", content: "今天穿少了，冷。", timestamp: "08:00" },
    { id: "d2c", type: "text", content: "中午吃了一碗很烫的馄饨，舒服。", timestamp: "12:15" },
    { id: "d2d", type: "text", content: "下午在窗口看树被风吹，发呆了很久。", timestamp: "16:00" },
    { id: "d2e", type: "text", content: "晚上风停了，突然安静得有点不习惯。", timestamp: "22:00" },
  ],
};

const day3: DaySummary = {
  date: "2025-05-13",
  title: "普通的一天",
  summary:
    "没有什么特别的事发生。上班，下班，吃饭，睡觉。<b>普通</b>也是一种幸福吧。",
  fragments: [
    { id: "d3a", type: "text", content: "地铁上人很少，找了个座位坐下了。", timestamp: "08:05" },
    { id: "d3b", type: "text", content: "今天的工作很顺利，没有加班。", timestamp: "18:00" },
    { id: "d3c", type: "text", content: "晚饭煮了泡面，加了个蛋。", timestamp: "19:30" },
  ],
};

const day4: DaySummary = {
  date: "2025-05-14",
  title: "雨后的街道",
  summary:
    "早上下了场<b>大雨</b>，出门时地还没干透。鞋底踩在水坑里，发出很响的声音。下午雨停了，空气里有泥土的味道。傍晚的时候<b>天突然放晴</b>，阳光穿过云层打在湿漉漉的路面上，像铺了一层金。",
  fragments: [
    { id: "y1", type: "text", content: "被雨声吵醒的，比闹钟早了半小时。", timestamp: "06:40" },
    { id: "y2", type: "text", content: "出门没带伞，淋了一路。头发全湿了。", timestamp: "08:15" },
    { id: "y3", type: "text", content: "一上午都在听雨声，效率很低，但很舒服。", timestamp: "11:30" },
    { id: "y4", type: "text", content: "午饭吃了碗热汤面，觉得今天也就值了。", timestamp: "12:20" },
    { id: "y5", type: "photo", content: "", timestamp: "17:10", imageUrl: "/images/after-rain.jpg" },
    { id: "y6", type: "text", content: "雨停了。天空一半是乌云一半是阳光，很好看。", timestamp: "17:12" },
    { id: "y7", type: "text", content: "晚上的路上都是积水倒影，像走在另一个世界里。", timestamp: "21:00" },
  ],
};

const day5: DaySummary = {
  date: "2025-05-15",
  title: "窗帘缝里的阳光",
  summary:
    "清晨的<b>第一缕光</b>从窗帘缝隙钻进来，照亮了书桌上未读完的书。上午在咖啡馆坐了很久，听隔壁桌的人聊旅行。傍晚在阳台上拍了一张<b>落日</b>，橘色铺满了半边天。今天没有做什么了不起的事，但每一个碎片都值得记住。",
  fragments: [
    { id: "f1", type: "text", content: "闹钟响的时候，窗帘缝里已经有光了。想再赖一会儿床。", timestamp: "07:22" },
    { id: "f2", type: "text", content: "出门前发现昨晚忘记洗的杯子，泡了杯速溶带走。", timestamp: "07:33" },
    { id: "f3", type: "photo", content: "", timestamp: "10:15", imageUrl: "/images/morning-coffee.jpg" },
    { id: "f4", type: "text", content: "在咖啡馆坐了两个小时，隔壁有人在聊去冰岛的事。听起来好远。", timestamp: "10:45" },
    { id: "f5", type: "text", content: "下午开会的时候走神了，在想冰岛的极光长什么样。", timestamp: "14:20" },
    { id: "f6", type: "text", content: "回家的路上买了束花，不知道为什么，就是想买。", timestamp: "18:05" },
    { id: "f7", type: "photo", content: "", timestamp: "18:52", imageUrl: "/images/sunset.jpg" },
    { id: "f8", type: "text", content: "橘色的天。今天没有做什么了不起的事，但感觉还不错。", timestamp: "18:54" },
    { id: "f9", type: "text", content: "夜深了，窗外有人在遛狗。小狗跑得好快。", timestamp: "22:30" },
  ],
};

export const allDays: DaySummary[] = [day1, day2, day3, day4, day5];

export const mockDay = day5;
