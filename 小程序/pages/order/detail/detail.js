const app = getApp()
const fetch = app.fetch
Page({
  data: {
    deliveryType: 'delivery',
    orderStatus: 'pending',
    addressInfo: '',
    riderName: '',
    riderPhone: '',
    loading: true
  },
  onLoad: function(options) {
    var id = options.order_id
    fetch('food/order', {
      id: id
    }).then(data => {
      this.setData({
        ...data,
        loading: false
      })
      this.initDeliveryInfo()
    }, () => {
      this.onLoad(options)
    })
  },
  
  initDeliveryInfo: function() {
    const addresses = wx.getStorageSync('addresses') || []
    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0]
    
    if (defaultAddr) {
      const addressInfo = `${defaultAddr.name} ${defaultAddr.phone}\n${defaultAddr.province}${defaultAddr.city}${defaultAddr.district}${defaultAddr.detail}`
      this.setData({
        addressInfo: addressInfo
      })
    } else {
      this.setData({
        addressInfo: '请在"我的"页面添加收货地址'
      })
    }
    
    if (this.data.is_taken == 1) {
      this.setData({
        orderStatus: 'delivered'
      })
    } else {
      this.setData({
        orderStatus: 'pending'
      })
    }
  },
  
  callRider: function() {
    wx.showModal({
      title: '联系骑手',
      content: '骑手电话：' + this.data.riderPhone,
      showCancel: false
    })
  },
  
  
  
  onUnload: function() {
    wx.switchTab({
      url: '/pages/order/list/list'
    })
  }
})
