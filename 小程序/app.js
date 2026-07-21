App({
  fetch: require('utils/fetch.js'),
  onLaunch: function() {
    wx.showLoading({
      title: '登录中',
      mask: true
    })
    this.fetch('user/setting').then(data => {
      if (data.isLogin) {
        this.onUserInfoReady()
      } else {
        this.login({
          success: () => {
            this.onUserInfoReady()
          },
          fail: () => {
            this.onLaunch()
          }
        })
      }
    }, () => {
      this.onLaunch()
    })
  },
  login: function(options) {
    wx.login({
      success: res => {
        this.fetch('user/login', {
          js_code: res.code
        }).then(data => {
          if (data && data.isLogin) {
            options.success()
          } else {
            wx.hideLoading()
            wx.showModal({
              title: '登录失败（请使用真实的AppID，并检查服务器端配置）',
              confirmText: '重试',
              success: res => {
                if (res.confirm) {
                  options.fail()
                }
              }
            })
          }
        }, () => {
          options.fail()
        })
      }
    })
  },
  userInfoReady: false,
  onUserInfoReady: function() {
    wx.hideLoading()
    if (this.userInfoReadyCallback) {
      this.userInfoReadyCallback()
    } else {
      this.userInfoReady = true
    }
  }
})