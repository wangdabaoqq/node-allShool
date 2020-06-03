const express = require('express')
const app = express()
const superagent = require('superagent')
const cheerio = require('cheerio')
const request = require('request')
const path = require('path');
const fs = require('fs')
const async = require("async"); // 控制并发数，防止被封IP
const SaveToMongo = require('save-to-mongo');
const JSONStream = require('JSONStream')
require('superagent-charset')(superagent)
// const iconv = require('iconv-lite'); 
// const $ = cheerio.load('<h2 class="title">Hello world</h2>')
// superagent.buffer = true
let indexssss = 0
let mlist = []
let allCity = []
let list = []
let allList = []
function sleep(numberMillis) {
  let now = new Date();
  const exitTime = now.getTime() + numberMillis;
  while (true) {
	  now = new Date();
	  if (now.getTime() > exitTime)
	  return;
  }
}
const dd = () => {
  let reptileMove = (url, callback) => {
    superagent.get(url.href).charset('gb2312').buffer(true).then(res => {
      let $ = cheerio.load(res.text, { decodeEntities:false });
      let findELe = $('#table7 tbody tr td #Showbackground1 tbody tr td a').length
      // console.log(findELe)
      // console.log(findELe, url.text)
      // console.log()
      if (findELe <= 0) {
        let cityVal = url.text.slice(0, 4)
        // #Showbackground1 tbody tr td
        // console.log('经过')
        $('#table7 tbody tr td').append(`<table id="Showbackground1"><tbody><tr><td><a><b>${cityVal}</b></a></td></tr></tbody></table>`)
      }
      $('#table7 tbody tr td #Showbackground1 tbody tr td a').each((index, dom) => {
        // console.log($(dom).text(), index)
        list[index] = {
          val: $(dom).text(),
          sub: []
        }
      })
      // if ()
      // $('#table7 tbody tr td table')
      // if ($('#table7 tbody tr td table').length > 2) {
      let doms = $('#table7 tbody tr td table').length > 2 ? $('#table7 tbody tr td div table') : $('#table7 tbody tr td table')
      doms.each((index, dom) => {
        // console.log(index)
        let items = $(dom).find('tbody tr td').text()
        // console.log(items)
        let allArr = items.split(/\d+/g).filter((ele, indexs) => {
          return indexs > 0 && ele
        }).map(eles => eles.trim().split(/\s+/))
        allArr.forEach((ele, key) => {
            list[index].sub.push({
              school: ele[0],
              provinces: ele[1],
              city: ele[2],
              level: ele[3],
              address: ele[4]
            })
          // }
          // indexssss++
        })
      })
      mlist = [...mlist, ...list]
      // console.log(list.length)
      callback()
    })
  }
  async.mapLimit(allCity, 20, function (url, callback) {
    reptileMove(url, callback);
  }, function (err, result) {
    // 访问完成的回调函数
    console.log('----------------------------');
    console.log('高校抓取成功，共有数据：');
    console.log('----------------------------');
    let t = JSON.stringify(mlist);
    // console.log(t)
    fs.writeFileSync('data.json', t);
    // console.log(mlist.length)
    fs.createReadStream(path.join(__dirname, './data.json'))
      .pipe(JSONStream.parse('*'))
      .pipe(saveToMongo)
      .on('execute-error', function (err) {
    	  console.log(err);
      })
      .on('done', function () {
    	  console.log('存入完毕!');
    	  process.exit(0);
      });
    // }); 
    // fetchName(req, res);
  })
}
const init = async () => {
  const reptileMove = (url, callback) => {
    superagent.get(url).charset('gb2312').buffer(true).then(res => {
      // let allCity = []
      let $ = cheerio.load(res.text, { decodeEntities:false });
      $('body > div #table2').last().addClass('checkNode')
      $('.checkNode tbody tr td a').each((index, dom) => {
        // console.log($(dom > 'td').html())
        // console.log($(dom).attr('href'))
        let data = {
          text: $(dom).text(),
          href: $(dom).attr('href')
        }
        allCity[index] = data
      })
      callback(null, url + 'Call back content');
      // allSchool(allCity)
    })
  }
  async.mapLimit(['http://www.huaue.com/gxmd.htm'], 1, function (url, callback) {
    console.log('异步回调的url:' + url);
	  reptileMove(url, callback);
  }, function (err, result) {
    // console.log(req)
    console.log('----------------------------');
    console.log('城市抓取完毕');
    console.log('----------------------------');
    // fetchYear(req, res); 
    dd()
    // console.log(req)
	  // reptileMove(url, callback);
  });
}

init()
// const ddd = (data) => {
//   // allType
//   return new Promise((resolve, reject) => {
//     resolve(data)
//   })
// }
let saveToMongo = SaveToMongo({
  uri: 'mongodb://127.0.0.1:27017/schoolCity',  //mongoDB的地址
  collection: 'savetomongo',
  bulk: {
	  mode: 'unordered'
  }
});
let server = app.listen(3002, function () {
  console.log(111)
})