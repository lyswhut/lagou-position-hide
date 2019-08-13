// ==UserScript==
// @name         拉勾网职位隐藏脚本
// @namespace    https://greasyfork.org/zh-CN/scripts/388495-%E6%8B%89%E5%8B%BE%E7%BD%91%E8%81%8C%E4%BD%8D%E9%9A%90%E8%97%8F%E8%84%9A%E6%9C%AC
// @version      0.1
// @description  隐藏拉勾网职位搜索列表的指定职位或公司
// @author       lyswhut
// @match        https://www.lagou.com/jobs/list_*
// @run-at       document-start
// @grant        none
// ==/UserScript==

;(function() {
  'use strict'
  window.__tools__ = {
    hideCompany: [],
    hidePosition: [],
    isFirst: true,
    jq: null,
    list: [],
    lgAjax(options) {
      var w = {},
        h = !1
      if (
        (options.needNoToken ||
          (options.headers = {
            'X-Anit-Forge-Token': window.X_Anti_Forge_Token || 'None',
            'X-Anit-Forge-Code': window.X_Anti_Forge_Code || '0',
          }),
        options.success)
      ) {
        h = !0
        for (var i in options)
          switch (i) {
            case 'success':
            case 'error':
              break
            default:
              w[i] = options[i]
          }
      } else w = jQuery.extend({}, options)

      return jQuery
        .ajax(w)
        .done((a, w, b) => {
          if (options.url.includes('positionAjax'))
            window.__tools__.filterData(a)
          window.__tools__.done(a, w, b, h, options)
        })
        .fail(function(a, w, b) {
          h && options.error && options.error(a, w, b)
        })
    },
    done(a, w, b, h, options) {
      if (!options.needNoToken)
        try {
          a &&
            jQuery.submitToken &&
            jQuery.submitCode &&
            ((window.X_Anti_Forge_Token = jQuery.submitToken),
            (window.X_Anti_Forge_Code = jQuery.submitCode))
        } catch (e) {}
      var k = window.encodeURIComponent(window.location.href),
        g = window.location.host
      if (a && jQuery.state)
        switch (jQuery.state) {
          case 2402:
            window.location.href =
              'https://' + g + '/utrack/trackMid.html?f=' + k
            break
          case 2403:
            window.location.href = 'https://passport.lagou.com/login/login.html'
            break
          case 2404:
            window.location.href =
              'https://' + g + '/utrack/verify.html?t=1&f=' + k
            break
          case 2405:
            window.location.href =
              'https://sec.lagou.com/verify.html?e=' +
              jQuery.errorcode +
              '&f=' +
              k
            break
          case 2406:
            window.location.href =
              'https://sec.lagou.com/sms/verify.html?e=' +
              jQuery.errorcode +
              '&f=' +
              k
            break
          case 2407:
            window.location.href =
              'https://forbidden.lagou.com/forbidden/fbi.html'
            break
          case 2408:
            window.location.href =
              'https://forbidden.lagou.com/forbidden/fbh.html'
            break
          case 2409:
            window.location.href =
              'https://forbidden.lagou.com/forbidden/fbl.html'
        }
      h && options.success && options.success(a, w, b)
    },

    // 过滤职位
    filterData(data) {
      if (!data.content.positionResult.result.length) return
      let result = data.content.positionResult.result
      const filterList = []
      result = result
        .filter(p => this.hideCompany.find(i => i.companyId === p.companyId) ? !filterList.push(p) : true)
        .filter(p => this.hidePosition.find(i => i.positionId === p.positionId) ? !filterList.push(p) : true)
      data.content.positionResult.result = this.list = result
      console.log('本次已过滤的职位为：')
      console.log(filterList
        .map(i => `${i.companyFullName} - ${i.positionName} - ${i.salary} - ${i.companySize}`)
        .join('\n') || '空')
    },

    // 隐藏公司
    addHideCompany(dom_btn, index) {
      const item = this.list[index]
      if (!item) return
      if (this.hideCompany.find(i => i.companyId === item.companyId)) return
      this.hideCompany.push(item)
      this.saveData()
      this.removeDomLi(dom_btn)
    },

    // 隐藏职位
    addHidePosition(dom_btn, index) {
      const item = this.list[index]
      if (!item) return
      if (this.hideCompany.find(i => i.positionId === item.positionId)) return
      this.hidePosition.push(item)
      this.saveData()
      this.removeDomLi(dom_btn)
    },

    // 从dom列表中移除隐藏的职位
    removeDomLi(dom_btn) {
      let dom_li = dom_btn.parentNode.parentNode
      if (dom_li.tagName != 'LI') return
      dom_li.parentNode.removeChild(dom_li)
    },

    // 模板注入
    injectTemplate() {
      let t = document.getElementById('tpl-position-list')
      if (!t) throw new Error('找不到模板')
      const btn = `<div style="position: absolute; right: 0; top: 0;">
<button style="padding: 3px 5px; background: rgba(230,230,230, .8);" onclick="__tools__.addHidePosition(this, {{i}})">隐藏该职位</button>
<button style="padding: 3px 5px; background: rgba(230,230,230, .8);" onclick="__tools__.addHideCompany(this, {{i}})">隐藏该公司</button>
</div>`
      t.innerHTML = t.innerHTML.replace('</li>', btn + '</li>')
    },

    // 保存数据
    saveData() {
      localStorage.setItem(
        '__lgTools__',
        JSON.stringify({
          hideCompany: this.hideCompany,
          hidePosition: this.hidePosition,
        })
      )
    },

    // hook jQuery
    hookJQuery() {
      Object.defineProperty(window, 'jQuery', {
        set: v => {
          this.jq = v
          this.hookLgajax()
        },
        get: () => {
          return this.jq
        },
      })
    },

    // hook拉勾ajax
    hookLgajax() {
      Object.defineProperty(this.jq, 'lgAjax', {
        get: () => {
          return this.lgAjax
        },
      })
    },

    // 初始化
    init() {
      this.hookJQuery()
      document.addEventListener('DOMContentLoaded', () => {
        this.injectTemplate()
      })
      let list = localStorage.getItem('__lgTools__')
      if (!list) return
      list = JSON.parse(list)
      this.hideCompany = list.hideCompany
      this.hidePosition = list.hidePosition
    },
  }
  window.__tools__.init()
})()
