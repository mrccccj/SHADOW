/*
搞鸡玩家-秒秒币
Last Modified time: 2022-1-21
活动入口：京东 首页秒杀
更新地址：jd_ms.js
已支持IOS双京东账号, Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, 小火箭，JSBox, Node.js
============Quantumultx===============
[task_local]
#搞鸡玩家-秒秒币
10 8 * * * jd_ms.js, tag=搞鸡玩家-秒秒币, img-url=, enabled=true

================Loon==============
[Script]
cron "10 8 * * *" script-path=jd_ms.js, tag=搞鸡玩家-秒秒币

===============Surge=================
搞鸡玩家-秒秒币 = type=cron,cronexp="10 8 * * *",wake-system=1,timeout=3600,script-path=jd_ms.js

============小火箭=========
搞鸡玩家-秒秒币 = type=cron,script-path=jd_ms.js, cronexpr="10 8 * * *", timeout=3600, enable=true
 */
const $ = new Env('搞鸡玩家-秒秒币');

const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
var timestamp = Math.round(new Date().getTime()).toString();
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
  };
  if(JSON.stringify(process.env).indexOf('GITHUB')>-1) process.exit(0)
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/client.action';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = '';
      await TotalBean();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, {"open-url": "https://bean.m.jd.com/"});

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue
      }
      await jdMs()
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })

async function jdMs() {
  $.score = 0
  await getActInfo()
  await getUserInfo()
  $.cur = $.score
  if ($.encryptProjectId) {
    await getTaskList()
  }
  await getUserInfo(false)
  await showMsg()
}

function getActInfo() {
  return new Promise(resolve => {
    $.post(taskPostUrl('assignmentList', {}, 'appid=jwsp'), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err},${jsonParse(resp.body)['message']}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            if (data.code === 200) {
              $.encryptProjectId = data.result.assignmentResult.encryptProjectId
              console.log(`活动名称：${data.result.assignmentResult.projectName}`)
              sourceCode = data.result.sourceCode
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
function getUserInfo(info=true) {
  return new Promise(resolve => {
    $.post(taskPostUrl('homePageV2', {}, 'appid=SecKill2020'), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err},${jsonParse(resp.body)['message']}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            if (data.code === 2041) {
              $.score = data.result.assignment.assignmentPoints || 0
              if(info) console.log(`当前秒秒币${$.score}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
function getTaskList() {
  let body = {"encryptProjectId": $.encryptProjectId, "sourceCode": "wh5"}
  return new Promise(resolve => {
    $.post(taskPostUrl('queryInteractiveInfo', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err},${jsonParse(resp.body)['message']}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            $.risk = false
            if (data.code === '0') {
              for (let vo of data.assignmentList) {
                if($.risk) break
                if (vo['completionCnt'] < vo['assignmentTimesLimit']) {
                  if (vo['assignmentType'] === 1) {
                    if(vo['ext'][vo['ext']['extraType']].length === 0) continue;
                    for (let i = vo['completionCnt']; i < vo['assignmentTimesLimit']; ++i) {
                      console.log(`去做${vo['assignmentName']}任务：${i + 1}/${vo['assignmentTimesLimit']}`)
                      let body = {
                        "encryptAssignmentId": vo['encryptAssignmentId'],
                        "itemId": vo['ext'][vo['ext']['extraType']][i]['itemId'],
                        "actionType": 1,
                        "completionFlag": ""
                      }
                      await doTask(body)
                      await $.wait(vo['ext']['waitDuration'] * 1000 + 500)
                      body['actionType'] = 0
                      await doTask(body)
                    }
                  } else if (vo['assignmentType'] === 0) {
                    for (let i = vo['completionCnt']; i < vo['assignmentTimesLimit']; ++i) {
                      console.log(`去做${vo['assignmentName']}任务：${i + 1}/${vo['assignmentTimesLimit']}`)
                      let body = {
                        "encryptAssignmentId": vo['encryptAssignmentId'],
                        "itemId": "",
                        "actionType": "0",
                        "completionFlag": true
                      }
                      await doTask(body)
                      await $.wait(1000)
                    }
                  } else if (vo['assignmentType'] === 3) {
                    for (let i = vo['completionCnt']; i < vo['assignmentTimesLimit']; ++i) {
                      console.log(`去做${vo['assignmentName']}任务：${i + 1}/${vo['assignmentTimesLimit']}`)
                      let body = {
                        "encryptAssignmentId": vo['encryptAssignmentId'],
                        "itemId": vo['ext'][vo['ext']['extraType']][i]['itemId'],
                        "actionType": 0,
                        "completionFlag": ""
                      }
                      await doTask(body)
                      await $.wait(1000)
                    }
                  }
                }
              }
            } else {
              console.log(data)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

var _0xodI='jsjiami.com.v6',_0xodI_=['‮_0xodI'],_0x5f52=[_0xodI,'aMKrwrQX6Kyn5rG35aaI6LeX772k6K225qOQ5p+657+z6LeQ6YaM6K6I','DwkgL8KX','C8KxWg==','FcK3Thw=','w59CKz3DrQ==','w6DCo8O+Wjo=','w5Qywo4swpk=','wrIcw4hPwqvDkA==','DFXDgH7DqQ==','aEQVwqFA','aRjCnsOlwpk=','aGfDosOKcsKvwp93','worDmzPDqkzDg00pXsK7QcODBhonCw==','RcOnw5TCtFI=','Nk1Gw67DuQ==','ZcOkKcKJwqU=','w6F4w5XCqwM=','wrLDtn3Dt8O6','w5Qpw5wZUQ==','6aGW6ZiF566A57im5pyI6YO16Lyv','woHDhX7DssO9','RgQkw5k=','w7wlwqLDrks=','OwcBGsKB','b8KWwqLCu8Ku','w7Igw4oQwpw=','wo/CmMKhwovDhA==','McKOazPCuA==','wpEnw6IN','w7YNwqTDpA==','MsKNw5M=','cMOFw7HCqA==','wp3CknFow6c=','Ewc1','w7cHw78F','wqwVwrMK6Ky95rCr5aa36LeM772k6K+85qGj5p2i57y+6LSa6YSY6K6h','w6c0w5Qnwrw=','w4zCq8OKWCM=','wrbCl8OwJ8Oo','wp8awpTDkMKj','w5XDk8O0','wroUworDhEk=','ZMOkHw==','CsOew78aw7c=','TcKSNA==','w6B3TcKE','wqvCisOlwr/Dnw==','w6I1wo4m','jsjxiaVCmiT.PKcom.Wggv6JSU=='];if(function(_0x26911f,_0x42ef24,_0x3703e8){function _0x2fab33(_0x3fab18,_0x327f55,_0x2994cf,_0x357735,_0x99fa5c,_0x12beaa){_0x327f55=_0x327f55>>0x8,_0x99fa5c='po';var _0x16a6ef='shift',_0x709334='push',_0x12beaa='‮';if(_0x327f55<_0x3fab18){while(--_0x3fab18){_0x357735=_0x26911f[_0x16a6ef]();if(_0x327f55===_0x3fab18&&_0x12beaa==='‮'&&_0x12beaa['length']===0x1){_0x327f55=_0x357735,_0x2994cf=_0x26911f[_0x99fa5c+'p']();}else if(_0x327f55&&_0x2994cf['replace'](/[xVCTPKWggJSU=]/g,'')===_0x327f55){_0x26911f[_0x709334](_0x357735);}}_0x26911f[_0x709334](_0x26911f[_0x16a6ef]());}return 0xcd08c;};return _0x2fab33(++_0x42ef24,_0x3703e8)>>_0x42ef24^_0x3703e8;}(_0x5f52,0xf9,0xf900),_0x5f52){_0xodI_=_0x5f52['length']^0xf9;};function _0x44c0(_0x4899a3,_0x8f6b9e){_0x4899a3=~~'0x'['concat'](_0x4899a3['slice'](0x1));var _0x33213b=_0x5f52[_0x4899a3];if(_0x44c0['uHYDHh']===undefined){(function(){var _0x1e8ad3=typeof window!=='undefined'?window:typeof process==='object'&&typeof require==='function'&&typeof global==='object'?global:this;var _0xae6c5c='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x1e8ad3['atob']||(_0x1e8ad3['atob']=function(_0x29cfb2){var _0x2eb3d5=String(_0x29cfb2)['replace'](/=+$/,'');for(var _0x1707eb=0x0,_0x38dabc,_0x3d4ee9,_0x45913e=0x0,_0x52f03c='';_0x3d4ee9=_0x2eb3d5['charAt'](_0x45913e++);~_0x3d4ee9&&(_0x38dabc=_0x1707eb%0x4?_0x38dabc*0x40+_0x3d4ee9:_0x3d4ee9,_0x1707eb++%0x4)?_0x52f03c+=String['fromCharCode'](0xff&_0x38dabc>>(-0x2*_0x1707eb&0x6)):0x0){_0x3d4ee9=_0xae6c5c['indexOf'](_0x3d4ee9);}return _0x52f03c;});}());function _0x1e1a95(_0x260d5e,_0x8f6b9e){var _0x7c09af=[],_0x1edaf0=0x0,_0x106385,_0x196e89='',_0x5b52ca='';_0x260d5e=atob(_0x260d5e);for(var _0x17d036=0x0,_0x563c12=_0x260d5e['length'];_0x17d036<_0x563c12;_0x17d036++){_0x5b52ca+='%'+('00'+_0x260d5e['charCodeAt'](_0x17d036)['toString'](0x10))['slice'](-0x2);}_0x260d5e=decodeURIComponent(_0x5b52ca);for(var _0x307471=0x0;_0x307471<0x100;_0x307471++){_0x7c09af[_0x307471]=_0x307471;}for(_0x307471=0x0;_0x307471<0x100;_0x307471++){_0x1edaf0=(_0x1edaf0+_0x7c09af[_0x307471]+_0x8f6b9e['charCodeAt'](_0x307471%_0x8f6b9e['length']))%0x100;_0x106385=_0x7c09af[_0x307471];_0x7c09af[_0x307471]=_0x7c09af[_0x1edaf0];_0x7c09af[_0x1edaf0]=_0x106385;}_0x307471=0x0;_0x1edaf0=0x0;for(var _0x5a13cf=0x0;_0x5a13cf<_0x260d5e['length'];_0x5a13cf++){_0x307471=(_0x307471+0x1)%0x100;_0x1edaf0=(_0x1edaf0+_0x7c09af[_0x307471])%0x100;_0x106385=_0x7c09af[_0x307471];_0x7c09af[_0x307471]=_0x7c09af[_0x1edaf0];_0x7c09af[_0x1edaf0]=_0x106385;_0x196e89+=String['fromCharCode'](_0x260d5e['charCodeAt'](_0x5a13cf)^_0x7c09af[(_0x7c09af[_0x307471]+_0x7c09af[_0x1edaf0])%0x100]);}return _0x196e89;}_0x44c0['DEbcCJ']=_0x1e1a95;_0x44c0['TrMwGW']={};_0x44c0['uHYDHh']=!![];}var _0x351ef4=_0x44c0['TrMwGW'][_0x4899a3];if(_0x351ef4===undefined){if(_0x44c0['iGcLWi']===undefined){_0x44c0['iGcLWi']=!![];}_0x33213b=_0x44c0['DEbcCJ'](_0x33213b,_0x8f6b9e);_0x44c0['TrMwGW'][_0x4899a3]=_0x33213b;}else{_0x33213b=_0x351ef4;}return _0x33213b;};function doTask(_0x1408b9){var _0x27c0e7={'IAMWM':function(_0x297c0c,_0x48d64d){return _0x297c0c(_0x48d64d);},'lsQfQ':function(_0x144646,_0xf503e8){return _0x144646===_0xf503e8;},'ClBId':'SrZnT','hbpKQ':'message','otFhF':function(_0x40f362,_0xafba8e){return _0x40f362!==_0xafba8e;},'wcaHd':_0x44c0('‮0','3eP$'),'MONyE':function(_0x1bb752,_0x5c6959){return _0x1bb752===_0x5c6959;},'DPbMc':_0x44c0('‫1','kaOz'),'dIkoi':function(_0x301006,_0x28ac67,_0x44d119){return _0x301006(_0x28ac67,_0x44d119);},'wOfiE':'doInteractiveAssignment','WMAeK':_0x44c0('‫2','*fc7'),'YJLLK':'MShPageh5'};_0x1408b9={..._0x1408b9,'encryptProjectId':$[_0x44c0('‮3','MH9&')],'sourceCode':sourceCode,'ext':{},'extParam':{'businessData':{'random':0x1851c35},'signStr':timestamp+_0x27c0e7[_0x44c0('‮4','6a0C')],'sceneid':_0x27c0e7['YJLLK']}};return new Promise(_0x40b36e=>{var _0xead8={'DoSFs':function(_0x19602d,_0x2adeb4){return _0x27c0e7[_0x44c0('‮5','7Yw%')](_0x19602d,_0x2adeb4);},'TJFRs':function(_0x5cab92,_0x32788b){return _0x5cab92(_0x32788b);},'FASwe':function(_0x30f362,_0x17eb69){return _0x27c0e7[_0x44c0('‮6','WATj')](_0x30f362,_0x17eb69);},'iOtzt':function(_0x5a2f9f,_0x16048e){return _0x5a2f9f!==_0x16048e;},'YMuGD':_0x27c0e7['ClBId'],'yjrwN':_0x27c0e7['hbpKQ'],'FfDYt':function(_0x4c899a,_0x57cb18){return _0x27c0e7[_0x44c0('‮7','z9Y9')](_0x4c899a,_0x57cb18);},'SGgeu':_0x27c0e7[_0x44c0('‮8','lFMP')],'PuEca':function(_0x3de508,_0x9f941e){return _0x27c0e7[_0x44c0('‮9','Hfq4')](_0x3de508,_0x9f941e);},'kpFAG':_0x44c0('‮a','#f5c'),'sjhnw':function(_0x9afb3c,_0x2afeac){return _0x9afb3c!==_0x2afeac;},'upwoZ':_0x27c0e7[_0x44c0('‫b','lFMP')]};$[_0x44c0('‮c','G]cO')](_0x27c0e7[_0x44c0('‫d','#f5c')](taskPostUrl,_0x27c0e7['wOfiE'],_0x1408b9),(_0xe7ac8,_0x35299d,_0x21043b)=>{var _0x2811ad={'VPVDQ':function(_0x18c353,_0x308220){return _0xead8[_0x44c0('‫e','lH7n')](_0x18c353,_0x308220);},'ZxkYt':'message','XfmoS':function(_0x38675d,_0x57b50f){return _0xead8['TJFRs'](_0x38675d,_0x57b50f);},'laflG':function(_0x5bf3b9,_0x53449e){return _0xead8['FASwe'](_0x5bf3b9,_0x53449e);},'CCloQ':'风险等级未通过'};if(_0xead8[_0x44c0('‫f','3ZL9')](_0x44c0('‫10','u7fu'),_0xead8[_0x44c0('‫11','hy^W')])){console['log'](_0xe7ac8+','+_0x2811ad[_0x44c0('‫12','XQR@')](jsonParse,_0x35299d[_0x44c0('‮13','uzYm')])[_0x2811ad['ZxkYt']]);console['log']($[_0x44c0('‫14','#f5c')]+'\x20API请求失败，请检查网路重试');}else{try{if(_0xe7ac8){console[_0x44c0('‫15','J*(Y')](_0xe7ac8+','+_0xead8['TJFRs'](jsonParse,_0x35299d[_0x44c0('‮16','6a0C')])[_0xead8[_0x44c0('‮17','qPq5')]]);console[_0x44c0('‫18','lH7n')]($[_0x44c0('‮19','Hfq4')]+_0x44c0('‫1a','H@Sk'));}else{if(safeGet(_0x21043b)){if(_0xead8[_0x44c0('‮1b','u7fu')](_0x44c0('‮1c','n6(f'),_0xead8[_0x44c0('‮1d','&fE[')])){_0x21043b=JSON[_0x44c0('‫1e','1@Z!')](_0x21043b);console[_0x44c0('‫15','J*(Y')](_0x21043b[_0x44c0('‫1f','Jijn')]);if(_0xead8[_0x44c0('‫20','GKRh')](_0x21043b[_0x44c0('‮21','WATj')],_0xead8[_0x44c0('‫22','NEU2')]))$['risk']=0x1;}else{if(_0xe7ac8){console[_0x44c0('‮23','Ii2(')](_0xe7ac8+','+jsonParse(_0x35299d[_0x44c0('‮24','Y[8o')])[_0x2811ad[_0x44c0('‮25','hhpp')]]);console['log']($[_0x44c0('‮26','H@Sk')]+_0x44c0('‫27','lfwn'));}else{if(_0x2811ad['XfmoS'](safeGet,_0x21043b)){_0x21043b=JSON[_0x44c0('‮28','lH7n')](_0x21043b);console[_0x44c0('‫29','XQR@')](_0x21043b['msg']);if(_0x2811ad['laflG'](_0x21043b['msg'],_0x2811ad['CCloQ']))$[_0x44c0('‮2a','XQR@')]=0x1;}}}}}}catch(_0x1acb72){if(_0xead8[_0x44c0('‮2b','#jXf')](_0xead8['upwoZ'],_0xead8[_0x44c0('‫2c','n6(f')])){_0x2811ad[_0x44c0('‮2d','H@Sk')](_0x40b36e,_0x21043b);}else{$[_0x44c0('‫2e','^cjA')](_0x1acb72,_0x35299d);}}finally{_0xead8[_0x44c0('‮2f','kU2z')](_0x40b36e,_0x21043b);}}});});};_0xodI='jsjiami.com.v6';

function showMsg() {
  return new Promise(resolve => {
    message += `本次运行获得秒秒币${$.score-$.cur}枚，共${$.score}枚`;
    $.msg($.name, '', `京东账号${$.index}${$.nickName}\n${message}`);
    resolve()
  })
}


function taskPostUrl(function_id, body = {}, extra = '', function_id2) {
  let url = `${JD_API_HOST}`;
  if (function_id2) {
    url += `?functionId=${function_id2}`;
  }
  return {
    url,
    body: `functionId=${function_id}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=1.0.0&${extra}`,
    headers: {
      "Cookie": cookie,
      "origin": "https://h5.m.jd.com",
      "referer": "https://h5.m.jd.com/babelDiy/Zeus/2NUvze9e1uWf4amBhe1AV6ynmSuH/index.html",
      'Content-Type': 'application/x-www-form-urlencoded',
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
    }
  }
}

function TotalBean() {
  return new Promise(async resolve => {
    const options = {
      "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      "headers": {
        "Accept": "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1")
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === 13) {
              $.isLogin = false; //cookie过期
              return
            }
            if (data['retcode'] === 0) {
              $.nickName = (data['base'] && data['base'].nickname) || $.UserName;
            } else {
              $.nickName = $.UserName
            }
          } else {
            console.log(`京东服务器返回空数据`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function safeGet(data) {
  try {
    if (typeof JSON.parse(data) == "object") {
      return true;
    }
  } catch (e) {
    console.log(e);
    console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
    return false;
  }
}

function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, '', '不要在BoxJS手动复制粘贴修改cookie')
      return [];
    }
  }
}
// prettier-ignore
function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
