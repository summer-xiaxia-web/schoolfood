Page({
  data: {
    addresses: [],
    selectedId: null,
    showModal: false,
    isEdit: false,
    editId: null,
    selectMode: false,
    formData: {
      name: '',
      phone: '',
      tag: '家庭',
      province: '',
      city: '',
      district: '',
      detail: '',
      isDefault: false
    }
  },

  onLoad: function(options) {
    this.setData({
      selectMode: options && options.select === '1'
    })
    this.loadAddresses()
  },

  loadAddresses: function() {
    const addresses = wx.getStorageSync('addresses') || []
    const defaultAddr = addresses.find(a => a.isDefault)
    this.setData({
      addresses: addresses,
      selectedId: defaultAddr ? defaultAddr.id : (addresses.length > 0 ? addresses[0].id : null)
    })
  },

  goBack: function() {
    wx.navigateBack()
  },

  addAddress: function() {
    this.setData({
      showModal: true,
      isEdit: false,
      editId: null,
      formData: {
        name: '',
        phone: '',
        tag: '学校',
        province: '',
        city: '',
        district: '',
        detail: '',
        isDefault: false
      }
    })
  },

  editAddress: function(e) {
    const id = parseInt(e.currentTarget.dataset.id)
    const address = this.data.addresses.find(a => a.id === id)
    if (address) {
      this.setData({
        showModal: true,
        isEdit: true,
        editId: id,
        formData: {
          name: address.name || '',
          phone: address.phone || '',
          tag: address.tag || '家庭',
          province: address.province || '',
          city: address.city || '',
          district: address.district || '',
          detail: address.detail || '',
          isDefault: address.isDefault || false
        }
      })
    }
  },

  deleteAddress: function(e) {
    const id = parseInt(e.currentTarget.dataset.id)
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个地址吗？',
      success: (res) => {
        if (res.confirm) {
          let addresses = this.data.addresses.filter(a => a.id !== id)
          wx.setStorageSync('addresses', addresses)
          this.loadAddresses()
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
        }
      }
    })
  },

  selectAddress: function(e) {
    const id = parseInt(e.currentTarget.dataset.id)
    this.setData({
      selectedId: id
    })

    if (this.data.selectMode) {
      const address = this.data.addresses.find(a => a.id === id)
      if (address) {
        const pages = getCurrentPages()
        const prevPage = pages[pages.length - 2]
        if (prevPage) {
          prevPage.setData({
            selectedAddress: address
          })
        }
        wx.setStorageSync('pendingSelectedAddress', address)
        wx.navigateBack()
      }
    }
  },

  closeModal: function() {
    this.setData({
      showModal: false
    })
  },

  preventClose: function() {},

  onInput: function(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`formData.${field}`]: value
    })
  },

  selectTag: function(e) {
    const tag = e.currentTarget.dataset.tag
    this.setData({
      'formData.tag': tag
    })
  },

  pickRegion: function() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'formData.province': res.province || '',
          'formData.city': res.city || '',
          'formData.district': res.district || '',
          'formData.detail': res.address || this.data.formData.detail
        })
      },
      fail: () => {
        this.setData({
          'formData.province': '广东省',
          'formData.city': '东莞市',
          'formData.district': '麻涌镇',
          'formData.detail': '广州新华学院（东莞校区）'
        })
        wx.showToast({
          title: '已设置默认地址',
          icon: 'none'
        })
      }
    })
  },

  toggleDefault: function() {
    this.setData({
      'formData.isDefault': !this.data.formData.isDefault
    })
  },

  saveAddress: function() {
    const { name, phone, province, detail } = this.data.formData
    
    if (!name.trim()) {
      wx.showToast({
        title: '请输入收货人',
        icon: 'none'
      })
      return
    }
    
    if (!phone.trim() || phone.length !== 11) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      })
      return
    }
    
    if (!detail.trim()) {
      wx.showToast({
        title: '请输入详细地址',
        icon: 'none'
      })
      return
    }

    let addresses = wx.getStorageSync('addresses') || []
    
    if (this.data.isEdit) {
      addresses = addresses.map(a => {
        if (a.id === this.data.editId) {
          return {
            ...a,
            ...this.data.formData
          }
        }
        if (this.data.formData.isDefault) {
          return { ...a, isDefault: false }
        }
        return a
      })
    } else {
      if (this.data.formData.isDefault) {
        addresses = addresses.map(a => ({ ...a, isDefault: false }))
      }
      addresses.push({
        id: Date.now(),
        ...this.data.formData
      })
    }

    wx.setStorageSync('addresses', addresses)
    this.loadAddresses()
    this.closeModal()
    wx.showToast({
      title: this.data.isEdit ? '修改成功' : '添加成功',
      icon: 'success'
    })
  }
})
