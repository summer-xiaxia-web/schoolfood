const app = getApp()
const fetch = app.fetch

Page({
  data: {
    swiper: [
      '/images/lunbo1.png',
      '/images/lunbo2.png',
      '/images/lunbo3.png'
    ],
    ad: '',
    category: [],
    recommendations: [],
    aiLoading: false,
    shopInfo: {},
    quickCategories: [
      { id: 1, name: '食堂一楼', icon: '🏠' },
      { id: 2, name: '食堂二楼', icon: '🏢' },
      { id: 3, name: '西门小吃街', icon: '🍢' },
      { id: 4, name: '创意园', icon: '🍽' },
      { id: 5, name: '创客坊', icon: '🍚' },
      { id: 6, name: '奶茶', icon: '🧋' },
      { id: 7, name: '便利店', icon: '🏪' },
      { id: 8, name: '零食', icon: '🍖' }
    ],
    foodList: [],
    nearbyShops: [
      { id: 1, name: '食堂一楼', rating: '4.8', type: '快餐', distance: '200m', status: '营业中' },
      { id: 2, name: '西门小吃街', rating: '4.6', type: '小吃', distance: '500m', status: '营业中' },
      { id: 3, name: '南苑餐厅', rating: '4.7', type: '中餐', distance: '800m', status: '营业中' },
      { id: 4, name: '北区食堂', rating: '4.5', type: '自助餐', distance: '1.2km', status: '休息中' }
    ],
    nearbyDistance: '500m',
    reviews: [
      { id: 1, avatar: '🎓', name: '小明同学', time: '2小时前', rating: 5, 
        content: '食堂一楼的麻辣香锅太绝了！食材新鲜，麻辣够劲，每次来都要排队！强烈推荐！', 
        images: [], 
        shop: '食堂一楼', likes: 128, comments: 2, isLiked: false, 
        showComments: false, commentInput: '', 
        commentList: [
          { id: 101, avatar: '👨‍🎓', name: '吃货小王', text: '同意！我也超爱这家的！' },
          { id: 102, avatar: '👩‍🎓', name: '美食达人', text: '中午去试试！' }
        ] },
      { id: 2, avatar: '👩‍🎓', name: '小红', time: '5小时前', rating: 4, 
        content: '西门小吃街的黄焖鸡米饭，鸡肉很嫩，汤汁浓郁，配米饭绝了！', 
        images: [], 
        shop: '西门小吃街', likes: 89, comments: 1, isLiked: false, 
        showComments: false, commentInput: '', 
        commentList: [
          { id: 201, avatar: '🧑‍🎓', name: '隔壁同学', text: '黄焖鸡确实好吃' }
        ] },
      { id: 3, avatar: '🧑‍🎓', name: '学霸小李', time: '1天前', rating: 5, 
        content: '南苑餐厅的糖醋里脊，外酥里嫩，酸甜适中，每次聚餐必点！', 
        images: [], 
        shop: '食堂一楼', likes: 156, comments: 0, isLiked: false, 
        showComments: false, commentInput: '', 
        commentList: [] }
    ],
    shopList: ['食堂一楼', '食堂二楼', '西门小吃街', '奶茶', '便利店', '零食'],
    showModal: false,
    selectedShop: '',
    inputContent: '',
    uploadImages: []
  },

  onLoad: function (options) {
    this.loadShopInfo()
    var callback = () => {
      wx.showLoading({ title: '努力加载中', mask: true })
      fetch('food/index').then(data => {
        wx.hideLoading()
        this.setData({
          ad: data.img_ad || '',
          foodList: data.list || []
        })
      }).catch(() => callback())
    }
    if (app.userInfoReady) {
      callback()
    } else {
      app.userInfoReadyCallback = callback
    }
  },

  onShow: function() {
    this.loadShopInfo()
  },

  loadShopInfo: function() {
    fetch('user/shopInfo').then(res => {
      if (res && res.data) {
        this.setData({ shopInfo: res.data })
      }
    })
  },

  hideNotice: function() {
    this.setData({
      'shopInfo.shop_notice': ''
    })
  },

  goToOrder(e) {
    const index = e.currentTarget.dataset.index
    wx.navigateTo({ url: `/pages/list/list?index=${index}` })
  },

  // AI 推荐
  getAIRecommend() {
    this.setData({ aiLoading: true })

    fetch('food/list').then(res => {
      const list = res?.list || res?.data || []
      // 将对象转换为数组（处理后端返回的对象格式）
      const categoryList = Array.isArray(list) ? list : Object.values(list || {})
      
      if (categoryList.length > 0) {
        // 将所有分类的商品合并成一个数组
        const allFoods = []
        categoryList.forEach((category, catIndex) => {
          if (category && category.food) {
            const foodList = Array.isArray(category.food) ? category.food : Object.values(category.food || {})
            foodList.forEach(food => {
              allFoods.push({
                ...food,
                category_id: catIndex
              })
            })
          }
        })
        
        // 随机打乱并选择前2个
        const shuffled = [...allFoods].sort(() => 0.5 - Math.random())
        const selected = shuffled.slice(0, 2).map(item => ({
          id: item.id,
          category_id: item.category_id || 0,
          name: item.name,
          price: item.price,
          image_url: this.fixImageUrl(item.image_url || item.image || item.img),
          reason: this.generateReason(item.name)
        }))

        this.setData({ 
          recommendations: selected, 
          aiLoading: false 
        })
      } else {
        this.useLocalDishes()
      }
    }).catch(() => this.useLocalDishes())
  },

  // 图片路径处理
  fixImageUrl(img) {
    if (!img) return '/images/default.jpg'
    if (img.startsWith('https://')) {
      return img
    }
    if (img.startsWith('http://')) {
      return img
    }
    const baseUrl = 'http://127.0.0.1:8081'
    return baseUrl + (img.startsWith('/') ? '' : '/') + img
  },

  // 备用本地数据
  useLocalDishes() {
    const local = [
      { id: 1, category_id: 1, name: "奶香糯玉米松饼", price: 14, image_url: this.fixImageUrl("/images/dish1.jpg"), reason: "香甜软糯" },
      { id: 2, category_id: 1, name: "鲜枣馍", price: 13, image_url: this.fixImageUrl("/images/dish2.jpg"), reason: "传统手工" }
    ]
    this.setData({
      recommendations: local,
      aiLoading: false
    })
  },

  generateReason(name) {
    const reasons = ["店长推荐", "今日热销", "人气爆款", "新鲜好喝"]
    return reasons[Math.floor(Math.random() * reasons.length)]
  },

  

  showReviewModal() {
    this.setData({ showModal: true })
  },

  hideReviewModal() {
    this.setData({ showModal: false })
  },

  stopPropagation() {
  },

  onShopChange(e) {
    const index = e.detail.value
    this.setData({ selectedShop: this.data.shopList[index] })
  },

  onContentInput(e) {
    this.setData({ inputContent: e.detail.value })
  },

  chooseImage() {
    wx.chooseImage({
      count: 9 - this.data.uploadImages.length,
      success: (res) => {
        this.setData({
          uploadImages: [...this.data.uploadImages, ...res.tempFilePaths]
        })
      }
    })
  },

  deleteImage(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    const newImages = this.data.uploadImages.filter((_, i) => i !== index)
    this.setData({ uploadImages: newImages })
  },

  previewImage(e) {
    const src = e.currentTarget.dataset.src
    wx.previewImage({
      current: src,
      urls: [src]
    })
  },

  likeReview(e) {
    const id = parseInt(e.currentTarget.dataset.id)
    const reviews = this.data.reviews.map(r => {
      if (r.id === id) {
        return { ...r, likes: r.isLiked ? r.likes - 1 : r.likes + 1, isLiked: !r.isLiked }
      }
      return r
    })
    this.setData({ reviews })
    wx.showToast({ title: reviews.find(r => r.id === id).isLiked ? '点赞成功' : '已取消', icon: 'success' })
  },

  toggleComments(e) {
    const id = parseInt(e.currentTarget.dataset.id)
    const reviews = this.data.reviews.map(r => {
      if (r.id === id) {
        return { ...r, showComments: !r.showComments }
      }
      return r
    })
    this.setData({ reviews })
  },

  onCommentInput(e) {
    const id = parseInt(e.currentTarget.dataset.id)
    const value = e.detail.value
    const reviews = this.data.reviews.map(r => {
      if (r.id === id) {
        return { ...r, commentInput: value }
      }
      return r
    })
    this.setData({ reviews })
  },

  submitComment(e) {
    const id = parseInt(e.currentTarget.dataset.id)
    const reviews = this.data.reviews.map(r => {
      if (r.id === id) {
        if (!r.commentInput.trim()) {
          return r
        }
        return {
          ...r,
          comments: r.comments + 1,
          commentInput: '',
          commentList: [
            ...r.commentList,
            { id: Date.now(), avatar: '🎓', name: '我', text: r.commentInput }
          ]
        }
      }
      return r
    })
    this.setData({ reviews })
    wx.showToast({ title: '评论成功', icon: 'success' })
  },

  submitReview() {
    if (!this.data.selectedShop) {
      wx.showToast({ title: '请选择店铺', icon: 'none' })
      return
    }
    if (!this.data.inputContent.trim()) {
      wx.showToast({ title: '请输入评价内容', icon: 'none' })
      return
    }

    const newReview = {
      id: Date.now(),
      avatar: '🎓',
      name: '我',
      time: '刚刚',
      content: this.data.inputContent,
      images: [...this.data.uploadImages],
      shop: this.data.selectedShop,
      likes: 0,
      comments: 0,
      isLiked: false,
      showComments: false,
      commentInput: '',
      commentList: []
    }

    this.setData({
      reviews: [newReview, ...this.data.reviews],
      showModal: false,
      selectedShop: '',
      inputContent: '',
      uploadImages: []
    })

    wx.showToast({ title: '发布成功', icon: 'success' })
  }
})