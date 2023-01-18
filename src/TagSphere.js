import { useState, useRef, useEffect, createRef } from "react"

const defaultConfig = {
  radius: 100, // rolling radius, unit `px`
  maxSpeed: 1, // rolling max speed, optional: `slow`, `normal`(default), `fast`
  initSpeed: 32, // rolling init speed, optional: `slow`, `normal`(default), `fast`
  direction: 135, // rolling init direction, unit clockwise `deg`, optional: `0`(top) , `90`(left), `135`(right-bottom)(default)...
  containerClass: "tagsphere",
  itemClass: "tagsphere--item"
  // keep: true, // whether to keep rolling after mouse out area, optional: `false`, `true`(default)(decelerate to rolling init speed, and keep rolling with mouse)
  // useContainerInlineStyles: true,
  // useItemInlineStyles: true,
}
// const _getMaxSpeed = (name) => ({ slow: 0.5, normal: 1, fast: 2 }[name] || 1)
// const _getInitSpeed = (name) => ({ slow: 16, normal: 32, fast: 80 }[name] || 32)

// calculate appropriate place
const computeItemPosition = (index, textsLength, size) => {
  const phi = Math.acos(-1 + (2 * index + 1) / textsLength)
  const theta = Math.sqrt((textsLength + 1) * Math.PI) * phi
  return {
    x: (size * Math.cos(theta) * Math.sin(phi)) / 2,
    y: (size * Math.sin(theta) * Math.sin(phi)) / 2,
    z: (size * Math.cos(phi)) / 2
  }
}
/* Text span element */
const createTextItem = (text, index, textsLength, size, itemRef) => {
  const transformOrigin = "50% 50%"
  const transform = "translate3d(-50%, -50%, 0) scale(1)"
  const styles = {
    willChange: "transform, opacity, filter",
    position: "absolute",
    top: "50%",
    left: "50%",
    zIndex: index + 1,
    filter: "alpha(opacity:0)",
    opacity: 0,
    WebkitTransformOrigin: transformOrigin,
    MozTransformOrigin: transformOrigin,
    OTransformOrigin: transformOrigin,
    transformOrigin: transformOrigin,
    WebkitTransform: transform,
    MozTransform: transform,
    OTransform: transform,
    transform: transform
  }
  const itemEl = (
    <span
      ref={itemRef}
      key={index}
      className={defaultConfig.itemClass}
      style={styles}
    >
      {text}
    </span>
  )
  return {
    ref: itemRef,
    el: itemEl,
    ...computeItemPosition(index, textsLength, size)
  }
}

/* Main tag sphere element */
const TagSphere = ({ texts = [], options = {} }) => {
  const containerRef = useRef(null)
  const config = { ...defaultConfig, ...options }
  const { radius, maxSpeed, initSpeed, direction } = config
  const depth = 1 * radius // rolling depth (defalt 2)
  const size = 1.6 * radius // rolling area size with mouse (default 1.5)
  // const keep = config.keep // whether to keep rolling after mouse out area
  // const paused = false // keep state to pause the animation
  const itemHooks = texts.map(() => createRef()) // create ref for each text item
  const [active, setActive] = useState(false) // whether the mouse is activated
  const [mouseX, setMouseX] = useState(0) // mouse X coordinate
  const [mouseY, setMouseY] = useState(0) // mouse Y coordinate
  const [items, setItems] = useState([])

  //   calculate the next state
  const next = () => {
    // if (paused) return //
    // if (!keep && !active) {
    //   setMouseX(() => (Math.abs(mouseX - mouseX0) < 1 ? mouseX0 : (mouseX + mouseX0) / 2)) // reset distance between the mouse and rolling center x axis
    //   setMouseY(() => (Math.abs(mouseY - mouseY0) < 1 ? mouseY0 : (mouseY + mouseY0) / 2)) // reset distance between the mouse and rolling center y axis
    // }     // if keep `false`, pause rolling after moving mouse out area
    if (!items) return
    setItems((items) => {
      // calculate text items move speed
      const a = -(Math.min(Math.max(-mouseY, -size), size) / radius) * maxSpeed
      const b = (Math.min(Math.max(-mouseX, -size), size) / radius) * maxSpeed
      if (Math.abs(a) <= 0.01 && Math.abs(b) <= 0.01) return items // pause when mouse on the center
      // calculate offset
      const l = Math.PI / 180
      const sc = [
        Math.sin(a * l),
        Math.cos(a * l),
        Math.sin(b * l),
        Math.cos(b * l)
      ]
      return items.map((item) => updateItem(item, sc, depth))
    })
  }
  // update the text items position, direction, styles
  const updateItem = (item, sc, depth) => {
    const newItem = { ...item }
    const rx1 = item.x
    const ry1 = item.y * sc[1] + item.z * -sc[0]
    const rz1 = item.y * sc[0] + item.z * sc[1]

    const rx2 = rx1 * sc[3] + rz1 * sc[2]
    const ry2 = ry1
    const rz2 = rz1 * sc[3] - rx1 * sc[2]

    const per = (2 * depth) / (2 * depth + rz2) // todo

    newItem.x = rx2
    newItem.y = ry2
    newItem.z = rz2
    if (newItem.x === item.x && newItem.y === item.y && newItem.z === item.z)
      return item

    newItem.scale = per.toFixed(3)
    let alpha = per * per - 0.25
    alpha = (alpha > 1 ? 1 : alpha).toFixed(3)

    if (!newItem.ref.current) return item
    const itemEl = newItem.ref.current
    const left = (item.x - itemEl.offsetWidth / 2).toFixed(2)
    const top = (item.y - itemEl.offsetHeight / 2).toFixed(2)
    const transform = `translate3d(${left}px, ${top}px, 0) scale(${item.scale})`
    itemEl.style.WebkitTransform = transform
    itemEl.style.MozTransform = transform
    itemEl.style.OTransform = transform
    itemEl.style.transform = transform
    itemEl.style.filter = `alpha(opacity=${100 * alpha})`
    itemEl.style.opacity = alpha
    return newItem
  }

  const init = () => {
    setActive(false)
    const mouseX0 = initSpeed * Math.sin(direction * (Math.PI / 180))
    const mouseY0 = -initSpeed * Math.cos(direction * (Math.PI / 180))

    setMouseX(() => mouseX0)
    setMouseY(() => mouseY0)
    window.addEventListener("mousemove", handleMouseMove)
    next()
  }

  const handleMouseMove = (ev) => {
    if (containerRef.current === null) return
    const rect = containerRef.current.getBoundingClientRect()
    setMouseX(() => (ev.clientX - (rect.left + rect.width / 2)) / 5)
    setMouseY(() => (ev.clientY - (rect.top + rect.height / 2)) / 5)
  }

  /* Set item elements and init the main element */
  useEffect(() => {
    const containerEL = containerRef.current
    // console.log(containerEL)
    setItems(
      texts.map((text, index) =>
        createTextItem(text, index, texts.length, size, itemHooks[index])
      )
    )
    init()
  }, [])

  useEffect(() => {
    const animationFrame = requestAnimationFrame(next)
    return () => cancelAnimationFrame(animationFrame)
  }, [mouseX, mouseY, active, items, radius])

  return (
    <div
      ref={containerRef}
      className={config.containerClass}
      onMouseOver={() => setActive(true)}
      onMouseOut={() => setActive(false)}
      // onMouseMove={(e) => handleMouseMove(e)}
      style={{
        position: "relative",
        width: `${2 * radius}px`,
        height: `${2 * radius}px`
      }}
    >
      {items.map((item) => item.el)}
    </div>
  )
}

export default TagSphere
