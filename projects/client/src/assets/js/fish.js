import $ from 'jquery'

const SURFACE_POINT = function (renderer, x) {
  this.renderer = renderer
  this.x = x
  this.init()
}

const FISH = function (renderer) {
  this.renderer = renderer
  this.init()
}
FISH.prototype = {
  GRAVITY: 0.4,

  init() {
    this.fillStyle = '#6699CC'
    this.direction = Math.random() < 0.5
    this.x = this.direction
      ? this.renderer.width + this.renderer.THRESHOLD
      : -this.renderer.THRESHOLD
    this.previousY = this.y
    this.vx = this.getRandomValue(4, 10) * (this.direction ? -1 : 1)

    if (this.renderer.reverse) {
      this.y = this.getRandomValue(
        (this.renderer.height * 1) / 10,
        (this.renderer.height * 4) / 10,
      )
      this.vy = this.getRandomValue(2, 5)
      this.ay = this.getRandomValue(0.05, 0.2)
    }
    else {
      this.y = this.getRandomValue(
        (this.renderer.height * 6) / 10,
        (this.renderer.height * 9) / 10,
      )
      this.vy = this.getRandomValue(-5, -2)
      this.ay = this.getRandomValue(-0.2, -0.05)
    }
    this.isOut = false
    this.theta = 0
    this.phi = 0
  },
  getRandomValue(min, max) {
    return min + (max - min) * Math.random()
  },
  // // 点击切换
  // reverseVertical: function () {
  //   this.isOut = !this.isOut;
  //   this.ay *= -1;
  // },
  controlStatus(context) {
    this.previousY = this.y
    this.x += this.vx
    this.y += this.vy
    this.vy += this.ay

    if (this.renderer.reverse) {
      if (this.y > this.renderer.height * this.renderer.INIT_HEIGHT_RATE) {
        this.vy -= this.GRAVITY
        this.isOut = true
      }
      else {
        if (this.isOut)
          this.ay = this.getRandomValue(0.05, 0.2)

        this.isOut = false
      }
    }
    else {
      if (this.y < this.renderer.height * this.renderer.INIT_HEIGHT_RATE) {
        this.vy += this.GRAVITY
        this.isOut = true
      }
      else {
        if (this.isOut)
          this.ay = this.getRandomValue(-0.2, -0.05)

        this.isOut = false
      }
    }
    if (!this.isOut) {
      this.theta += Math.PI / 20
      this.theta %= Math.PI * 2
      this.phi += Math.PI / 30
      this.phi %= Math.PI * 2
    }
    this.renderer.generateEpicenter(
      this.x + (this.direction ? -1 : 1) * this.renderer.THRESHOLD,
      this.y,
      this.y - this.previousY,
    )

    if (
      (this.vx > 0 && this.x > this.renderer.width + this.renderer.THRESHOLD)
      || (this.vx < 0 && this.x < -this.renderer.THRESHOLD)
    )
      this.init()
  },
  render(context) {
    // ================================ 画鱼开始 ================================
    context.save()
    // 设置鱼的颜色
    // context.fillStyle = "rgba(66, 185, 133, 0.8)";
    context.fillStyle = '#EBEEF5'
    context.translate(this.x, this.y)
    context.rotate(Math.PI + Math.atan2(this.vy, this.vx))
    context.scale(1, this.direction ? 1 : -1)
    context.beginPath()
    context.moveTo(-30, 0)
    context.bezierCurveTo(-20, 15, 15, 10, 40, 0)
    context.bezierCurveTo(15, -10, -20, -15, -30, 0)
    context.fill()

    context.save()
    context.translate(40, 0)
    context.scale(0.9 + 0.2 * Math.sin(this.theta), 1)
    context.beginPath()
    context.moveTo(0, 0)
    context.quadraticCurveTo(5, 10, 20, 8)
    context.quadraticCurveTo(12, 5, 10, 0)
    context.quadraticCurveTo(12, -5, 20, -8)
    context.quadraticCurveTo(5, -10, 0, 0)
    context.fill()
    context.restore()

    context.save()
    context.translate(-3, 0)
    context.rotate(
      (Math.PI / 3 + (Math.PI / 10) * Math.sin(this.phi))
      * (this.renderer.reverse ? -1 : 1),
    )
    context.beginPath()

    if (this.renderer.reverse) {
      context.moveTo(5, 0)
      context.bezierCurveTo(10, 10, 10, 30, 0, 40)
      context.bezierCurveTo(-12, 25, -8, 10, 0, 0)
    }
    else {
      context.moveTo(-5, 0)
      context.bezierCurveTo(-10, -10, -10, -30, 0, -40)
      context.bezierCurveTo(12, -25, 8, -10, 0, 0)
    }
    context.closePath()
    context.fill()
    context.restore()

    context.restore()
    // 定义海的颜色
    context.fillStyle = '#6699CC'
    // context.fillStyle = "linear-gradient(90deg, rgba(247, 149, 51, 0.1),rgba(243, 112, 85, 0.1) 15%,rgba(239, 78, 123, 0.1) 30%,rgba(161, 102, 171, 0.1) 44%,rgba(80, 115, 184, 0.1) 58%,rgba(16, 152, 173, 0.1) 72%,rgba(7, 179, 155, 0.1) 86%,rgba(109, 186, 130, 0.1))";
    // ================================ 画鱼结束 ================================

    this.controlStatus(context)
  },
}
SURFACE_POINT.prototype = {
  SPRING_CONSTANT: 0.03,
  SPRING_FRICTION: 0.9,
  WAVE_SPREAD: 0.3,
  ACCELARATION_RATE: 0.01,

  init() {
    this.initHeight = this.renderer.height * this.renderer.INIT_HEIGHT_RATE
    this.height = this.initHeight
    this.fy = 0
    this.force = { previous: 0, next: 0 }
  },
  setPreviousPoint(previous) {
    this.previous = previous
  },
  setNextPoint(next) {
    this.next = next
  },
  interfere(y, velocity) {
    this.fy
      = this.renderer.height
      * this.ACCELARATION_RATE
      * (this.renderer.height - this.height - y >= 0 ? -1 : 1)
      * Math.abs(velocity)
  },
  updateSelf() {
    this.fy += this.SPRING_CONSTANT * (this.initHeight - this.height)
    this.fy *= this.SPRING_FRICTION
    this.height += this.fy
  },
  updateNeighbors() {
    if (this.previous) {
      this.force.previous
        = this.WAVE_SPREAD * (this.height - this.previous.height)
    }
    if (this.next)
      this.force.next = this.WAVE_SPREAD * (this.height - this.next.height)
  },
  render(context) {
    if (this.previous) {
      this.previous.height += this.force.previous
      this.previous.fy += this.force.previous
    }
    if (this.next) {
      this.next.height += this.force.next
      this.next.fy += this.force.next
    }
    context.lineTo(this.x, this.renderer.height - this.height)
  },
}
const RENDERER = {
  POINT_INTERVAL: 5,
  FISH_COUNT: 5,
  MAX_INTERVAL_COUNT: 50,
  // 初始海平面高度
  INIT_HEIGHT_RATE: 0.55,
  THRESHOLD: 50,

  init() {
    this.setParameters()
    this.reconstructMethods()
    this.setup()
    this.bindEvent()
    this.render()
  },
  setParameters() {
    this.$window = $(window)
    this.$container = $('#jsi-flying-fish-container')
    this.$canvas = $('<canvas />')
    this.context = this.$canvas
      .appendTo(this.$container)
      .get(0)
      .getContext('2d')
    this.points = []
    this.fishes = []
    this.watchIds = []
  },
  createSurfacePoints() {
    const count = Math.round(this.width / this.POINT_INTERVAL)
    this.pointInterval = this.width / (count - 1)
    this.points.push(new SURFACE_POINT(this, 0))
    this.points.push(new SURFACE_POINT(this, 0))

    for (let i = 1; i < count; i++) {
      const point = new SURFACE_POINT(this, i * this.pointInterval)
      const previous = this.points[i - 1]

      point.setPreviousPoint(previous)
      previous.setNextPoint(point)
      this.points.push(point)
    }
  },
  reconstructMethods() {
    this.watchWindowSize = this.watchWindowSize.bind(this)
    this.jdugeToStopResize = this.jdugeToStopResize.bind(this)
    this.startEpicenter = this.startEpicenter.bind(this)
    this.moveEpicenter = this.moveEpicenter.bind(this)
    // 点击切换
    // this.reverseVertical = this.reverseVertical.bind(this);
    this.render = this.render.bind(this)
  },
  setup() {
    this.points.length = 0
    this.fishes.length = 0
    this.watchIds.length = 0
    this.intervalCount = this.MAX_INTERVAL_COUNT
    this.width = this.$container.width()
    this.height = this.$container.height()
    this.fishCount
      = (((this.FISH_COUNT * this.width) / 500) * this.height) / 500
    this.$canvas.attr({ width: this.width, height: this.height })
    this.reverse = false

    this.fishes.push(new FISH(this))
    this.createSurfacePoints()
  },
  watchWindowSize() {
    this.clearTimer()
    this.tmpWidth = this.$window.width()
    this.tmpHeight = this.$window.height()
    this.watchIds.push(setTimeout(this.jdugeToStopResize, this.WATCH_INTERVAL))
  },
  clearTimer() {
    while (this.watchIds.length > 0)
      clearTimeout(this.watchIds.pop())
  },
  jdugeToStopResize() {
    const width = this.$window.width()
    const height = this.$window.height()
    const stopped = width === this.tmpWidth && height === this.tmpHeight

    this.tmpWidth = width
    this.tmpHeight = height

    if (stopped)
      this.setup()
  },
  bindEvent() {
    this.$window.on('resize', this.watchWindowSize)
    this.$container.on('mouseenter', this.startEpicenter)
    this.$container.on('mousemove', this.moveEpicenter)
    // 点击切换
    // this.$container.on("click", this.reverseVertical);
  },
  getAxis(event) {
    const offset = this.$container.offset()

    return {
      x: event.clientX - offset.left + this.$window.scrollLeft(),
      y: event.clientY - offset.top + this.$window.scrollTop(),
    }
  },
  startEpicenter(event) {
    this.axis = this.getAxis(event)
  },
  moveEpicenter(event) {
    const axis = this.getAxis(event)

    if (!this.axis)
      this.axis = axis

    this.generateEpicenter(axis.x, axis.y, axis.y - this.axis.y)
    this.axis = axis
  },
  generateEpicenter(x, y, velocity) {
    if (
      y < this.height / 2 - this.THRESHOLD
      || y > this.height / 2 + this.THRESHOLD
    )
      return

    const index = Math.round(x / this.pointInterval)

    if (index < 0 || index >= this.points.length)
      return

    this.points[index].interfere(y, velocity)
  },
  // 点击切换
  // reverseVertical: function () {
  //   this.reverse = !this.reverse;

  //   for (var i = 0, count = this.fishes.length; i < count; i++) {
  //     this.fishes[i].reverseVertical();
  //   }
  // },
  controlStatus() {
    for (let i = 0, count = this.points.length; i < count; i++)
      this.points[i].updateSelf()

    for (let i = 0, count = this.points.length; i < count; i++)
      this.points[i].updateNeighbors()

    if (this.fishes.length < this.fishCount) {
      if (--this.intervalCount === 0) {
        this.intervalCount = this.MAX_INTERVAL_COUNT
        this.fishes.push(new FISH(this))
      }
    }
  },
  render() {
    requestAnimationFrame(this.render)
    this.controlStatus()
    this.context.clearRect(0, 0, this.width, this.height)
    this.context.fillStyle = 'linear-gradient(90deg, rgba(247, 149, 51, 0.1),rgba(243, 112, 85, 0.1) 15%,rgba(239, 78, 123, 0.1) 30%,rgba(161, 102, 171, 0.1) 44%,rgba(80, 115, 184, 0.1) 58%,rgba(16, 152, 173, 0.1) 72%,rgba(7, 179, 155, 0.1) 86%,rgba(109, 186, 130, 0.1))'

    for (let i = 0, count = this.fishes.length; i < count; i++)
      this.fishes[i].render(this.context)

    this.context.save()
    this.context.globalCompositeOperation = 'xor'
    this.context.beginPath()
    this.context.moveTo(0, this.reverse ? 0 : this.height)

    for (let i = 0, count = this.points.length; i < count; i++)
      this.points[i].render(this.context)

    this.context.lineTo(this.width, this.reverse ? 0 : this.height)
    this.context.closePath()
    this.context.fill()
    this.context.restore()
  },
}

$(() => {
  RENDERER.init()
})
export function fish() {
  RENDERER.init()
}
