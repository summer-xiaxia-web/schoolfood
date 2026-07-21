const config = require('./config')
module.exports = function(path, data, method) {
  var sess = wx.getStorageSync('PHPSESSID')
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'http://localhost:8081/api/' + path,
      method: method,
      data: data,
      header: {
        'Content-Type': 'json',
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': sess ? 'PHPSESSID=' + sess : ''
      },
      success: res => {
        if (res.header['Set-Cookie'] !== undefined) {
          sess = decodeCookie(res.header['Set-Cookie'])['PHPSESSID']
          wx.setStorageSync('PHPSESSID', sess)
        }
        if (res.statusCode !== 200) {
          fail('服务器异常', reject)
          return
        }
        if (res.data.code === 0) {
          fail(res.data.msg, reject)
          return
        }
        resolve(res.data)
      },
      fail: function() {
        fail('加载数据失败', reject)
      }
    })
  })

  function decodeCookie(cookie) {
    var obj = {}
    cookie.split(',').forEach((item, index) => {
      item.split('; ').forEach((item, index) => {
        var arr = item.split('=')
        obj[arr[0]] = arr[1] !== undefined ? decodeURIComponent(arr[1]) : true
      })
    })
    return obj
  }

  function fail(title, callback) {
    wx.hideLoading()
    wx.showModal({
      title: title,
      confirmText: '重试',
      success: res => {
        if (res.confirm) {
          callback()
        }
      }
    })
  }
}