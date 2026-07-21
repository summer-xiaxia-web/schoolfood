const app = getApp()
const fetch = app.fetch
Page({
  data: {
    userInfo: {
      name: '',
      gender: '',
      phone: '',
      birthday: '',
      address: ''
    },
    avatarUrl: '',
    showPhoneModal: false,
    newPhone: '',
    today: ''
  },
  onLoad: function() {
    const today = new Date()
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
    this.setData({ today: todayStr })
    this.loadUserInfo()
    this.loadServerProfile()
  },
  onShow: function() {
    const pendingAddr = wx.getStorageSync('pendingSelectedAddress')
    if (pendingAddr) {
      const addrText = (pendingAddr.province || '') + (pendingAddr.city || '') + (pendingAddr.district || '') + (pendingAddr.detail || '')
      this.setData({
        'userInfo.address': addrText
      })
      const info = wx.getStorageSync('userProfile') || {}
      info.address = addrText
      wx.setStorageSync('userProfile', info)
      wx.removeStorageSync('pendingSelectedAddress')
    }
  },
  loadUserInfo: function() {
    const info = wx.getStorageSync('userProfile') || {}
    this.setData({
      userInfo: {
        name: info.name || '',
        gender: info.gender || '',
        phone: info.phone || '',
        birthday: info.birthday || '',
        address: info.address || ''
      },
      avatarUrl: info.avatarUrl || ''
    })
  },
  loadServerProfile: function() {
    fetch('user/profile').then(res => {
      if (res && res.data) {
        const info = wx.getStorageSync('userProfile') || {}
        const newInfo = {
          ...info,
          name: res.data.name || '',
          gender: res.data.gender || '',
          phone: res.data.phone || '',
          birthday: res.data.birthday || '',
          address: res.data.address || ''
        }
        wx.setStorageSync('userProfile', newInfo)
        this.setData({
          userInfo: {
            name: newInfo.name,
            gender: newInfo.gender,
            phone: newInfo.phone,
            birthday: newInfo.birthday,
            address: newInfo.address
          }
        })
      }
    }).catch(() => {})
  },
  chooseAvatar: function() {
    wx.showActionSheet({
      itemList: ['用微信头像', '从相册选择', '拍照'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.getWxAvatar()
        } else if (res.tapIndex === 1) {
          this.chooseFromAlbum()
        } else if (res.tapIndex === 2) {
          this.takePhoto()
        }
      }
    })
  },
  getWxAvatar: function() {
    wx.getUserProfile({
      desc: '获取您的微信头像',
      success: (res) => {
        const avatarUrl = res.userInfo.avatarUrl
        this.setData({ avatarUrl })
        this.saveAvatar(avatarUrl)
        wx.showToast({
          title: '头像设置成功',
          icon: 'success'
        })
      },
      fail: () => {
        wx.showToast({
          title: '获取失败',
          icon: 'none'
        })
      }
    })
  },
  chooseFromAlbum: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        const avatarUrl = res.tempFilePaths[0]
        this.setData({ avatarUrl })
        this.saveAvatar(avatarUrl)
        wx.showToast({
          title: '头像设置成功',
          icon: 'success'
        })
      },
      fail: () => {
        wx.showToast({
          title: '选择失败',
          icon: 'none'
        })
      }
    })
  },
  takePhoto: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: (res) => {
        const avatarUrl = res.tempFilePaths[0]
        this.setData({ avatarUrl })
        this.saveAvatar(avatarUrl)
        wx.showToast({
          title: '头像设置成功',
          icon: 'success'
        })
      },
      fail: () => {
        wx.showToast({
          title: '拍照失败',
          icon: 'none'
        })
      }
    })
  },
  saveAvatar: function(avatarUrl) {
    const info = wx.getStorageSync('userProfile') || {}
    info.avatarUrl = avatarUrl
    wx.setStorageSync('userProfile', info)
  },
  onNameInput: function(e) {
    this.setData({
      'userInfo.name': e.detail.value
    })
  },
  onPhoneInput: function(e) {
    this.setData({
      newPhone: e.detail.value
    })
  },
  stopPropagation: function() {},
  selectGender: function(e) {
    const gender = e.currentTarget.dataset.gender
    this.setData({
      'userInfo.gender': gender
    })
  },
  onBirthdayChange: function(e) {
    if (this.data.userInfo.birthday) {
      wx.showToast({
        title: '生日填写后不可修改',
        icon: 'none'
      })
      return
    }
    this.setData({
      'userInfo.birthday': e.detail.value
    })
  },
  changePhone: function() {
    this.setData({
      showPhoneModal: true,
      newPhone: ''
    })
  },
  closePhoneModal: function() {
    this.setData({
      showPhoneModal: false,
      newPhone: ''
    })
  },
  confirmPhoneChange: function() {
    if (this.data.newPhone) {
      const phone = this.data.newPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      this.setData({
        'userInfo.phone': phone,
        showPhoneModal: false
      })
      wx.showToast({
        title: '更换成功',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
    }
  },
  goToAddress: function() {
    wx.navigateTo({
      url: '/pages/record/address?select=1&from=profile'
    })
  },
  saveProfile: function() {
    wx.showLoading({
      title: '保存中...',
      mask: true
    })
    const params = {
      name: this.data.userInfo.name,
      gender: this.data.userInfo.gender,
      phone: this.data.userInfo.phone,
      address: this.data.userInfo.address
    }
    const cachedProfile = wx.getStorageSync('userProfile') || {}
    if (!cachedProfile.birthday && this.data.userInfo.birthday) {
      params.birthday = this.data.userInfo.birthday
    }
    fetch('user/updateProfile', params, 'POST').then(res => {
      wx.hideLoading()
      if (res && res.data) {
        const profile = {
          name: res.data.name,
          gender: res.data.gender,
          phone: res.data.phone,
          birthday: res.data.birthday,
          address: res.data.address,
          avatarUrl: this.data.avatarUrl
        }
        wx.setStorageSync('userProfile', profile)
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    }).catch(() => {
      wx.hideLoading()
    })
  },
  goToAccount: function() {
    wx.showModal({
      title: '账号管理',
      content: '账号安全设置\n\n📱 绑定手机号\n🔐 修改密码\n📧 绑定邮箱\n🚫 注销账号',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})