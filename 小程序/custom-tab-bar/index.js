Component({
  data: {
    currentIndex: 0
  },

  attached() {
    const pages = getCurrentPages()
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1]
      const route = currentPage.route
      if (route === 'pages/index/index') {
        this.setData({ currentIndex: 0 })
      } else if (route === 'pages/order/list/list') {
        this.setData({ currentIndex: 1 })
      } else if (route === 'pages/record/record') {
        this.setData({ currentIndex: 2 })
      }
    }
  },

  methods: {
    switchTab(e) {
      const index = parseInt(e.currentTarget.dataset.index)
      const path = e.currentTarget.dataset.path
      
      this.setData({ currentIndex: index })
      wx.switchTab({ url: path })
    }
  }
})