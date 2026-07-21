const app = getApp()
const fetch = app.fetch
Page({
  data: {
    is_last: true,
    order: {},
    loading: false,
    activeTab: 'current',
    filteredOrders: []
  },
  enableRefresh: false,
  last_id: 0,
  row: 10,
  onLoad: function() {
    wx.showLoading({
      title: '加载中'
    })
    this.loadData({
      last_id: 0,
      success: data => {
        this.setData({
          order: data.list
        }, () => {
          wx.hideLoading()
          this.filterOrders()
        })
      },
      fail: () => {
        this.onLoad()
      }
    })
  },
  onPullDownRefresh: function() {
    wx.showLoading({
      title: '加载中'
    })
    this.loadData({
      last_id: 0,
      success: data => {
        this.setData({
          order: data.list
        }, () => {
          wx.hideLoading()
          wx.stopPullDownRefresh()
          this.filterOrders()
        })
      },
      fail: () => {
        this.onLoad()
      }
    })
  },
  onReachBottom: function() {
    if (this.data.is_last) {
      return
    }
    this.loadData({
      last_id: this.last_id,
      success: data => {
        var order = this.data.order
        data.list.forEach(item => {
          order.push(item)
        })
        this.setData({
          order: order
        })
      },
      fail: () => {
        this.onReachBottom()
      }
    })
  },
  onShow: function() {
    this.setData({
      loading: true
    })
    this.loadData({
      last_id: 0,
      success: data => {
        this.setData({
          order: data.list,
          loading: false
        })
        this.filterOrders()
      },
      fail: () => {
        this.setData({
          loading: false
        })
        this.onShow()
      }
    })
  },
  
  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      activeTab: tab
    })
    this.filterOrders()
  },
  
  filterOrders: function() {
    const orders = this.data.order || []
    let filteredOrders = []
    
    if (this.data.activeTab === 'current') {
      filteredOrders = orders.filter(item => !item.is_taken || item.is_taken === 0)
    } else {
      filteredOrders = orders.filter(item => item.is_taken && item.is_taken === 1)
    }
    
    this.setData({
      filteredOrders: filteredOrders
    })
  },
  detail: function(e) {
    var id = e.currentTarget.dataset.id
    var deliveryType = e.currentTarget.dataset.delivery
    
    console.log('订单ID:', id, '从后端获取的配送类型:', deliveryType)
    
    const orderDeliveryMap = wx.getStorageSync('orderDeliveryMap') || {}
    if (orderDeliveryMap[id]) {
      deliveryType = orderDeliveryMap[id]
      console.log('从本地存储获取配送类型:', deliveryType)
    }
    
    if (!deliveryType || deliveryType === '' || deliveryType === null) {
      console.log('配送类型为空，默认使用自取')
      deliveryType = 'dine'
    }
    
    const pageUrl = deliveryType === 'delivery' 
      ? `/pages/order/detail/detail?order_id=${id}`
      : `/pages/order/pickup/pickup?order_id=${id}`
    console.log('跳转到:', pageUrl)
    wx.navigateTo({
      url: pageUrl
    })
  },
  loadData: function(options) {
    wx.showNavigationBarLoading()
    fetch('food/orderlist', {
      last_id: options.last_id,
      row: this.row
    }).then(data => {
      this.last_id = data.last_id
      this.setData({
        is_last: data.list.length < this.row
      }, () => {
        wx.hideNavigationBarLoading()
        options.success(data)
      })
    }, () => {
      wx.hideNavigationBarLoading()
      options.fail()
    })
  }
})