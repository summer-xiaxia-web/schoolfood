const app = getApp()
const fetch = app.fetch
Page({
  data: {
    couponCount: 0,
    favoriteCount: 0,
    historyCount: 0,
    points: 0,
    pendingCount: null,
    avatarUrl: '',
    userName: '',
    shopInfo: {}
  },
  enableRefresh: false,
  onLoad: function() {
    this.loadLocalData()
    wx.showLoading({
      title: '努力加载中'
    })
    fetch('food/record').then(data => {
      wx.hideLoading()
      this.setData(data)
    })
    fetch('food/orderlist', { last_id: 0, row: 10 }).then(data => {
      const list = data.list || []
      const pendingCount = list.filter(item => !item.is_taken || item.is_taken === 0).length
      this.setData({ pendingCount })
    })
    this.loadShopInfo()
  },

  loadShopInfo: function() {
    fetch('user/shopInfo').then(res => {
      if (res && res.data) {
        this.setData({ shopInfo: res.data })
      }
    })
  },

  callShop: function() {
    const phone = this.data.shopInfo.shop_phone
    if (!phone) return
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => {
        wx.showToast({ title: '拨号失败', icon: 'none' })
      }
    })
  },
  onShow: function () {
    this.loadLocalData()
    fetch('food/orderlist', { last_id: 0, row: 10 }).then(data => {
      const list = data.list || []
      const pendingCount = list.filter(item => !item.is_taken || item.is_taken === 0).length
      this.setData({ pendingCount })
    })
    this.loadShopInfo()
    if (this.enableRefresh) {
      this.onLoad()
    } else {
      this.enableRefresh = true
    }
  },
  loadLocalData: function() {
    const coupons = wx.getStorageSync('coupons') || this.getDefaultCoupons()
    const favorites = wx.getStorageSync('favorites') || []
    const history = wx.getStorageSync('history') || []
    const points = wx.getStorageSync('points') || 100
    const userProfile = wx.getStorageSync('userProfile') || {}
    
    this.setData({
      couponCount: coupons.filter(c => !c.used && c.expire > Date.now()).length,
      favoriteCount: favorites.length,
      historyCount: history.length,
      points: points,
      avatarUrl: userProfile.avatarUrl || '',
      userName: userProfile.name || ''
    })
  },
  getDefaultCoupons: function() {
    const defaultCoupons = [
      { id: 1, name: '新人专享', discount: 5, minAmount: 20, expire: Date.now() + 7 * 24 * 60 * 60 * 1000, used: false },
      { id: 2, name: '满减优惠', discount: 10, minAmount: 50, expire: Date.now() + 30 * 24 * 60 * 60 * 1000, used: false },
      { id: 3, name: '周末特惠', discount: 8, minAmount: 30, expire: Date.now() + 7 * 24 * 60 * 60 * 1000, used: false }
    ]
    wx.setStorageSync('coupons', defaultCoupons)
    return defaultCoupons
  },
  goToWallet: function() {
    wx.showModal({
      title: '我的钱包',
      content: `当前余额：¥0\n当前积分：${this.data.points}分`,
      showCancel: false,
      confirmText: '知道了'
    })
  },
  goToPointsShop: function() {
    wx.showModal({
      title: '积分商城',
      content: `当前积分：${this.data.points}分\n\n可用兑换：\n🎁 100积分 = 5元优惠券\n🎁 200积分 = 10元优惠券\n🎁 500积分 = 30元优惠券`,
      showCancel: false,
      confirmText: '立即兑换'
    })
  },
  goToFeedback: function() {
    wx.showModal({
      title: '意见反馈',
      content: '感谢您的反馈！如有任何问题或建议，请联系客服：\n\n📞 客服热线：400-123-4567\n📧 邮箱：service@campusfood.com',
      showCancel: false,
      confirmText: '知道了'
    })
  },
  goToHelp: function() {
    wx.showModal({
      title: '帮助中心',
      content: '常见问题：\n\n1️⃣ 如何修改订单？\n答：订单提交后无法修改，请重新下单。\n\n2️⃣ 订单多久能送达？\n答：到店取餐约10分钟，外卖配送约30分钟。\n\n3️⃣ 如何申请退款？\n答：未取餐订单可在订单详情页申请退款。',
      showCancel: false,
      confirmText: '知道了'
    })
  },
  goToShare: function() {
    wx.showModal({
      title: '分享有礼',
      content: '🎉 分享小程序给好友，双方各得5元优惠券！\n\n1. 点击右上角...\n2. 选择"分享给朋友"\n3. 好友首次下单后即可获得优惠券',
      showCancel: false,
      confirmText: '立即分享'
    })
  },
  goToInvite: function() {
    wx.showModal({
      title: '邀请好友',
      content: '🎁 邀请好友注册并下单，您将获得：\n\n✨ 每邀请1位好友得10积分\n✨ 好友完成首单再得5元优惠券\n✨ 累计邀请5人升级为黄金会员',
      showCancel: false,
      confirmText: '立即邀请'
    })
  },
  goToVIP: function() {
    wx.showModal({
      title: '会员中心',
      content: '👑 当前等级：普通会员\n积分：' + this.data.points + '分\n\n会员特权：\n⭐ 普通会员：基础服务\n⭐ 黄金会员：95折优惠\n⭐ 钻石会员：9折优惠 + 优先配送\n\n升级到黄金会员需500积分',
      showCancel: false,
      confirmText: '立即升级'
    })
  },
  goToCoupon: function() {
    const coupons = wx.getStorageSync('coupons') || this.getDefaultCoupons()
    const validCoupons = coupons.filter(c => !c.used && c.expire > Date.now())
    
    let couponList = validCoupons.map(c => {
      const expireDate = new Date(c.expire)
      return `${c.name}\n满${c.minAmount}减${c.discount}\n有效期至：${expireDate.getMonth() + 1}月${expireDate.getDate()}日`
    }).join('\n\n')
    
    wx.showModal({
      title: '我的优惠券',
      content: couponList || '暂无可用优惠券',
      showCancel: false,
      confirmText: '知道了'
    })
  },
  goToFavorites: function() {
    const favorites = wx.getStorageSync('favorites') || []
    if (favorites.length === 0) {
      wx.showModal({
        title: '我的收藏',
        content: '暂无收藏的商品',
        showCancel: false,
        confirmText: '知道了'
      })
      return
    }
    let favList = favorites.map(f => `${f.name}\n¥${f.price}`).join('\n\n')
    wx.showModal({
      title: '我的收藏',
      content: favList,
      showCancel: false,
      confirmText: '知道了'
    })
  },
  goToAddress: function() {
    wx.navigateTo({
      url: '/pages/record/address'
    })
  },
  goToHistory: function() {
    const history = wx.getStorageSync('history') || []
    if (history.length === 0) {
      wx.showModal({
        title: '浏览记录',
        content: '暂无浏览记录',
        showCancel: false,
        confirmText: '知道了'
      })
      return
    }
    let historyList = history.slice(-5).reverse().map(h => `${h.name}\n浏览时间：${h.time}`).join('\n\n')
    wx.showModal({
      title: '最近浏览',
      content: historyList,
      showCancel: false,
      confirmText: '清空记录',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('history')
          this.setData({ historyCount: 0 })
          wx.showToast({
            title: '已清空',
            icon: 'success'
          })
        }
      }
    })
  },
  goToOrderList: function() {
    wx.switchTab({
      url: '/pages/order/list/list'
    })
  },
  goToPoints: function() {
    wx.showModal({
      title: '我的积分',
      content: `当前积分：${this.data.points}分\n\n积分可以在兑换中心兑换优惠券和礼品哦~`,
      showCancel: false,
      confirmText: '知道了'
    })
  },
  goToProfile: function() {
    wx.navigateTo({
      url: '/pages/record/profile'
    })
  },
  goToSettings: function() {
    wx.showActionSheet({
      itemList: ['清除缓存', '关于我们', '版本号 1.0.0'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.clearStorageSync()
          this.loadLocalData()
          wx.showToast({
            title: '缓存已清除',
            icon: 'success'
          })
        } else if (res.tapIndex === 1) {
          this.goToAbout()
        }
      }
    })
  },
  goToAbout: function() {
    wx.showModal({
      title: '关于校园美食',
      content: '校园美食小程序\n为校园师生提供便捷的餐饮服务\n\n版本：1.0.0',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
