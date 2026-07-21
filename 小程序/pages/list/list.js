const app = getApp()
const fetch = app.fetch
var categoryHeight = [] // 右列表各分类高度数组

Page({
  data: {
    activeIndex: 0,
    tapIndex: 0,
    foodList: [],
    categoryIcons: ['🍜', '🍔', '🍱', '🥟', '🍵', '🧋', '🏪', '🍖'],
    cartList: {},
    cartPrice: 0,
    cartNumber: 0,
    cartBall: {
      show: false,
      x: 0,
      y: 0
    },
    showCart: false,
    promotion: {},
    deliveryType: 'dine',
    selectedAddress: null,
    deliveryFee: 5
  },
  changingCategory: false,
  shopcartAnimate: null,

  onLoad: function (options) {
    console.log('list页面接收参数:', options); // 调试用

    // 保存需要自动添加的商品ID
    this.autoAddFoodId = (options && options.autoAddId) ? options.autoAddId : null
    
    // 保存需要跳转到的分类索引
    this.targetCategoryIndex = (options && options.index) ? parseInt(options.index) : null

    wx.showLoading({
      title: '努力加载中'
    })
    fetch('food/list').then(data => {
      wx.hideLoading()
      
      // 将对象转换为数组（处理后端返回的对象格式）
      const foodListData = Array.isArray(data.list) ? data.list : Object.values(data.list || {})
      
      // 为每个商品添加isInCart字段
      const cartList = this.data.cartList || {}
      foodListData.forEach(category => {
        if (category && category.food) {
          const foodArray = Array.isArray(category.food) ? category.food : Object.values(category.food)
          foodArray.forEach(food => {
            if (food) {
              food.isInCart = cartList[food.id] && cartList[food.id].number > 0
            }
          })
        }
      })
      
      // 如果指定了分类索引，则跳转到该分类
      const targetIndex = this.targetCategoryIndex !== null && this.targetCategoryIndex >= 0 && this.targetCategoryIndex < foodListData.length 
        ? this.targetCategoryIndex 
        : 0
        
      this.setData({
        activeIndex: targetIndex,
        tapIndex: 'category_' + targetIndex
      })
      
      this.setData({
        foodList: foodListData,
        promotion: data.promotion[0]
      }, () => {
        this.calculateCategoryHeight()
        
        // 数据加载完成后再执行自动添加购物车
        if (this.autoAddFoodId) {
          this.autoAddToCart(this.autoAddFoodId)
        }
        
        // 如果指定了分类索引，滚动到对应位置
        if (this.targetCategoryIndex !== null) {
          setTimeout(() => {
            this.setData({
              tapIndex: 'category_' + this.targetCategoryIndex,
              activeIndex: this.targetCategoryIndex
            })
          }, 300)
        }
      })
    }, () => {
      this.onLoad()
    })
    this.shopcartAnimate = shopcartAnimate('.operate-shopcart-icon', this)
  },

  // 计算右侧分类高度
  calculateCategoryHeight() {
    var query = wx.createSelectorQuery()
    var top = 0
    query.select('.food').boundingClientRect(rect => {
      top = rect ? rect.top : 0
    })
    query.selectAll('.food-category').boundingClientRect(res => {
      categoryHeight = []
      res.forEach(rect => {
        const id = rect.id.substring(rect.id.indexOf('_') + 1)
        categoryHeight[id] = rect.top - top
      })
    })
    query.exec()
  },

  // ==================== AI推荐自动加入购物车（加强版） ====================
  autoAddToCart: function (foodId) {
    const targetId = String(foodId).trim()
    console.log('🔍 尝试自动添加商品ID:', targetId)

    let found = false

    for (let catIndex = 0; catIndex < this.data.foodList.length; catIndex++) {
      const category = this.data.foodList[catIndex]
      if (!category || !category.food) continue
      
      // 将对象转换为数组（处理后端返回的对象格式）
      const foodList = Array.isArray(category.food) ? category.food : Object.values(category.food)

      for (let food of foodList) {
        if (String(food.id) === targetId || food.id == targetId) {
          console.log('✅ 找到商品:', food.name, 'ID:', food.id)

          // 直接添加到购物车，不再调用 addToCart
          var cartList = this.data.cartList
          if (cartList[food.id]) {
            ++cartList[food.id].number
          } else {
            // 简化商品名，去掉规格信息
            let shortName = food.name || '商品'
            if (shortName) {
              shortName = shortName.split('/')[0].trim()
              shortName = shortName.split('(')[0].trim()
              shortName = shortName.split('（')[0].trim()
            }
            
            cartList[food.id] = {
              id: food.id,
              name: shortName,
              price: parseFloat(food.price),
              number: 1
            }
          }
          
          this.setData({
            cartList: cartList,
            cartPrice: this.data.cartPrice + (cartList[food.id].number === 1 ? cartList[food.id].price : 0),
            cartNumber: this.data.cartNumber + 1
          })

          wx.showToast({
            title: `已自动添加 ${food.name}`,
            icon: 'success',
            duration: 2000
          })
          return
        }
      }
    }

    if (!found) {
      wx.showToast({ title: '商品未找到', icon: 'none' })
      console.error('❌ 未找到商品ID:', targetId)
    }
  },

  tapCategory: function (e) {
    var index = parseInt(e.currentTarget.dataset.index)
    console.log('点击分类索引:', index)
    this.changingCategory = true
    this.setData({
      activeIndex: index,
      tapIndex: 'category_' + index
    }, () => {
      console.log('tapIndex已更新:', this.data.tapIndex)
      this.changingCategory = false
    })
  },

  onFoodScroll: function (e) {
    var scrollTop = e.detail.scrollTop
    var activeIndex = 0
    categoryHeight.forEach((item, i) => {
      if (scrollTop >= item) {
        activeIndex = i
      }
    })
    if (!this.changingCategory) {
      this.changingCategory = true
      this.setData({
        activeIndex: activeIndex,
      }, () => {
        this.changingCategory = false
      })
    }
  },

  scrolltolower: function () {
    this.setData({
      activeIndex: categoryHeight.length - 1
    })
  },

  isInCart: function (foodId) {
    var cartList = this.data.cartList
    return cartList && cartList[foodId] && cartList[foodId].number > 0
  },

  updateFoodInCartStatus: function (foodId, isInCart) {
    var foodList = this.data.foodList
    for (var i = 0; i < foodList.length; i++) {
      var category = foodList[i]
      if (category && category.food) {
        var foods = Array.isArray(category.food) ? category.food : Object.values(category.food)
        for (var j = 0; j < foods.length; j++) {
          if (foods[j] && String(foods[j].id) === String(foodId)) {
            foods[j].isInCart = isInCart
            this.setData({
              foodList: foodList
            })
            return
          }
        }
      }
    }
  },

  addToCart: function (e) {
    var id = e.currentTarget.dataset.id
    var category_id = e.currentTarget.dataset.category_id
    var category = this.data.foodList[category_id]
    if (!category) return

    // 处理对象格式的 food 数据
    var foodList = Array.isArray(category.food) ? category.food : Object.values(category.food)
    var food = foodList.find(f => String(f.id) === String(id))
    
    if (!food) return

    var cartList = this.data.cartList
    if (cartList[id]) {
      ++cartList[id].number
    } else {
      // 简化商品名，去掉规格信息
      let shortName = food.name || '商品'
      if (shortName) {
        shortName = shortName.split('/')[0].trim()
        shortName = shortName.split('(')[0].trim()
        shortName = shortName.split('（')[0].trim()
      }
      cartList[id] = {
        id: food.id,
        name: shortName,
        price: parseFloat(food.price),
        number: 1
      }
    }
    
    // 更新商品的isInCart状态
    food.isInCart = true
    
    this.shopcartAnimate.show(e)
    this.setData({
      foodList: this.data.foodList,
      cartList: cartList,
      cartPrice: this.data.cartPrice + cartList[id].price,
      cartNumber: this.data.cartNumber + 1
    })
  },

  showCartList: function () {
    if (this.data.cartNumber > 0) {
      this.setData({
        showCart: !this.data.showCart
      })
    }
  },

  cartNumberDec: function (e) {
    var id = e.currentTarget.dataset.id
    var cartList = this.data.cartList
    if (cartList[id]) {
      var price = cartList[id].price
      if (cartList[id].number > 1) {
        --cartList[id].number
      } else {
        delete cartList[id]
        // 更新商品的isInCart状态
        this.updateFoodInCartStatus(id, false)
      }
      this.setData({
        cartList: cartList,
        cartNumber: --this.data.cartNumber,
        cartPrice: this.data.cartPrice - price
      })
      if (this.data.cartNumber <= 0) {
        this.setData({
          showCart: false
        })
      }
    }
  },

  cartNumberAdd: function (e) {
    var id = e.currentTarget.dataset.id
    var cartList = this.data.cartList
    ++cartList[id].number
    this.setData({
      cartList: cartList,
      cartNumber: ++this.data.cartNumber,
      cartPrice: this.data.cartPrice + cartList[id].price
    })
  },

  cartClear: function () {
    // 清空所有商品的isInCart状态
    var foodList = this.data.foodList
    for (var i = 0; i < foodList.length; i++) {
      var category = foodList[i]
      if (category && category.food) {
        var foods = Array.isArray(category.food) ? category.food : Object.values(category.food)
        for (var j = 0; j < foods.length; j++) {
          if (foods[j]) {
            foods[j].isInCart = false
          }
        }
      }
    }
    this.setData({
      foodList: foodList,
      cartList: {},
      cartNumber: 0,
      cartPrice: 0,
      showCart: false
    })
  },

  setDeliveryType: function(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      deliveryType: type
    })
    if (type === 'delivery') {
      this.loadAddress()
    }
  },

  loadAddress: function() {
    const addresses = wx.getStorageSync('addresses') || []
    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0]
    if (defaultAddr) {
      this.setData({
        selectedAddress: defaultAddr
      })
    }
  },

  selectAddress: function() {
    wx.navigateTo({
      url: '/pages/record/address?select=1'
    })
  },

  onShow: function() {
  },

  order: function () {
    if (this.data.cartNumber === 0) {
      return
    }
    
    if (this.data.deliveryType === 'delivery' && !this.data.selectedAddress) {
      wx.showToast({
        title: '请选择配送地址',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '正在生成订单'
    })
    
    const orderData = {
      order: this.data.cartList,
      deliveryType: this.data.deliveryType,
      addressId: this.data.selectedAddress ? this.data.selectedAddress.id : null
    }
    
    fetch('food/order', orderData, 'POST').then(data => {
      const orderDeliveryMap = wx.getStorageSync('orderDeliveryMap') || {}
      orderDeliveryMap[data.order_id] = this.data.deliveryType
      wx.setStorageSync('orderDeliveryMap', orderDeliveryMap)
      wx.navigateTo({
        url: `/pages/order/checkout/checkout?order_id=${data.order_id}&delivery=${this.data.deliveryType}`
      })
    }, () => {
      this.order()
    })
  }
})

function shopcartAnimate(iconClass, page) {
  var busPos = {}
  wx.createSelectorQuery().select(iconClass).boundingClientRect(rect => {
    busPos.x = rect.left + 15
    busPos.y = rect.top
  }).exec()
  return {
    show: function (e) {
      var finger = {
        x: e.touches[0].clientX - 10,
        y: e.touches[0].clientY - 10
      }
      var topPoint = {}
      if (finger.y < busPos.y) {
        topPoint.y = finger.y - 150
      } else {
        topPoint.y = busPos.y - 150
      }
      topPoint.x = Math.abs(finger.x - busPos.x) / 2
      if (finger.x > busPos.x) {
        topPoint.x = (finger.x - busPos.x) / 2 + busPos.x
      } else {
        topPoint.x = (busPos.x - finger.x) / 2 + finger.x
      }
      var linePos = bezier([busPos, topPoint, finger], 30)
      var bezier_points = linePos.bezier_points
      page.setData({
        'cartBall.show': true,
        'cartBall.x': finger.x,
        'cartBall.y': finger.y
      })
      var len = bezier_points.length
      var index = len
      let i = index - 1
      var timer = setInterval(function () {
        i = i - 5
        if (i < 1) {
          clearInterval(timer)
          page.setData({
            'cartBall.show': false
          })
          return
        }
        page.setData({
          'cartBall.show': true,
          'cartBall.x': bezier_points[i].x,
          'cartBall.y': bezier_points[i].y
        })
      }, 50)
    }
  }

  function bezier(pots, amount) {
    var pot
    var lines
    var ret = []
    var points
    for (var i = 0; i <= amount; ++i) {
      points = pots.slice(0)
      lines = []
      while (pot = points.shift()) {
        if (points.length) {
          lines.push(pointLine([pot, points[0]], i / amount))
        } else if (lines.length > 1) {
          points = lines
          lines = []
        } else {
          break
        }
      }
      ret.push(lines[0])
    }

    function pointLine(points, rate) {
      var pointA, pointB, pointDistance, xDistance, yDistance, tan, radian, tmpPointDistance
      var ret = []
      pointA = points[0]
      pointB = points[1]
      xDistance = pointB.x - pointA.x
      yDistance = pointB.y - pointA.y
      pointDistance = Math.pow(Math.pow(xDistance, 2) + Math.pow(yDistance, 2), 1 / 2)
      tan = yDistance / xDistance
      radian = Math.atan(tan)
      tmpPointDistance = pointDistance * rate
      ret = {
        x: pointA.x + tmpPointDistance * Math.cos(radian),
        y: pointA.y + tmpPointDistance * Math.sin(radian)
      }
      return ret
    }
    return {
      bezier_points: ret
    }
  }
}