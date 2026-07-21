const app = getApp()
const fetch = app.fetch
Page({
  data: {
    deliveryType: 'dine',
    deliveryFee: 5,
    addressInfo: '',
    totalPrice: 0,
    loading: true
  },
  onLoad: function(options) {
    var id = options.order_id
    var deliveryType = options.delivery || 'dine'
    
    this.setData({
      deliveryType: deliveryType
    })
    
    if (deliveryType === 'delivery') {
      this.loadAddress()
    }
    
    fetch('food/order', {
      id: id
    }).then(data => {
      this.setData({
        ...data,
        loading: false
      })
      this.calculateTotalPrice()
    }, () => {
      this.onLoad(options)
    })
  },
  
  loadAddress: function() {
    const addresses = wx.getStorageSync('addresses') || []
    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0]
    if (defaultAddr) {
      const addressInfo = `${defaultAddr.name} ${defaultAddr.phone}\n${defaultAddr.province}${defaultAddr.city}${defaultAddr.district}${defaultAddr.detail}`
      this.setData({
        addressInfo: addressInfo
      })
    }
  },
  
  calculateTotalPrice: function() {
    let price = parseFloat(this.data.price) || 0
    let promotion = parseFloat(this.data.promotion) || 0
    let deliveryFee = this.data.deliveryType === 'delivery' ? this.data.deliveryFee : 0
    
    let totalPrice = price + deliveryFee - promotion
    if (totalPrice < 0) totalPrice = 0
    
    this.setData({
      totalPrice: totalPrice
    })
  },
  
  comment: function(e) {
    this.data.comment = e.detail.value
  },
  pay: function() {
    var id = this.data.id
    wx.showLoading({
      title: '正在支付'
    })
    fetch('food/order', {
      id: id,
      comment: this.data.comment
    }, 'POST').then(data => {
      return fetch('food/pay', {
        id: id
      }, 'POST')
    }).then(data => {
      wx.hideLoading()
      wx.showToast({
        title: '支付成功',
        icon: 'success',
        duration: 2000,
        success: () => {
          wx.switchTab({
            url: '/pages/order/list/list'
          })
        }
      })
    }).catch(() => {
      this.pay()
    })
  }
})
