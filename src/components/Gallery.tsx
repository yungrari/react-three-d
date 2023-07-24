'use client'

import React, { Children, memo, useCallback, useRef, useEffect, useState } from 'react'

type Unit = `${number}${'px' | 'em' | 'rem' | 'vw' | 'vh' | 'vmin' | 'vmax' | '%'}`

type CommonProps = {
  height: Unit
  isHorizontal?: boolean
  perspective: Unit
  width: Unit
}

type StaticProps = CommonProps & {
  isInfiniteMode?: boolean
  isNavigation?: boolean
  itemsToScroll?: number
  mouseSwipeRatio?: number
  mouseSwipeTreshold?: number
  onChange?: (newIndex: number) => void
  selectedIndex?: number
  selectedProps?: React.HTMLAttributes<any>
  swipeRatio?: number
  swipeTreshold?: number
  touchSwipeRatio?: number
  touchSwipeTreshold?: number
}

type ResponsiveProp = CommonProps & {
  maxWidth?: number | null
  minWidth?: number
}

type ResponsiveProps = {
  responsiveProps?: ResponsiveProp[]
}

export type GalleryProps = Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange'> & StaticProps & ResponsiveProps

function getUnit(unit: Unit) {
  return (unit.match(/^(\d+)(\D+)$/)?.slice(1) as [string, string]) || []
}

function getTransform(params: { count: number; height: Unit; index: number; isHorizontal: boolean; width: Unit }) {
  const theta = 360 / params.count
  const angle = theta * params.index * -1
  const fn = params.isHorizontal ? 'rotateY' : 'rotateX'
  const [size] = getUnit(params.isHorizontal ? params.width : params.height)
  const radius = Math.round(+size / 2 / Math.tan(Math.PI / params.count))

  return `translateZ(${-radius}px) ${fn}(${angle}deg)`
}

function useResizeObserver(ref?: React.RefObject<Element>) {
  const [dimensions, setDimensions] = useState<[number, number]>([0, 0])

  useEffect(() => {
    const targetElement = ref?.current || document.body

    const resizeObserver = new ResizeObserver(([entry]) => {
      setDimensions([entry.contentRect.width, entry.contentRect.height])
    })

    resizeObserver.observe(targetElement)

    return () => {
      resizeObserver.unobserve(targetElement)
    }
  }, [ref])

  return dimensions
}

function Gallery({
  children,
  isInfiniteMode = false,
  isNavigation = true,
  itemsToScroll = 1,
  mouseSwipeRatio,
  mouseSwipeTreshold,
  onChange,
  responsiveProps = [],
  selectedIndex = 0,
  selectedProps: { className: selectedCellClassName, ...selectedProps } = {},
  swipeRatio = 1,
  swipeTreshold,
  touchSwipeRatio,
  touchSwipeTreshold,
  ...props
}: GalleryProps) {
  const items = Children.toArray(children) as React.ReactElement<any>[]
  const count = Children.count(children)
  const lastIndex = count - 1

  const sceneRef = useRef<HTMLDivElement>(null!)
  const carouselRef = useRef<HTMLDivElement>(null!)

  const isDraggingRef = useRef(false)
  const dragStartPosRef = useRef(0)

  const [windowWidth] = useResizeObserver()

  const propsByWindowWidth = responsiveProps.reduce(
    (result, { minWidth = 0, maxWidth = null, ...item } = {} as ResponsiveProp) =>
      windowWidth >= minWidth && (!maxWidth || windowWidth < maxWidth) ? { ...result, ...item } : result,
    props,
  )

  const {
    height,
    isHorizontal = true,
    perspective,
    style,
    width,
    ...restProps
  } = windowWidth ? propsByWindowWidth : props

  const getNextSlideIndex = useCallback(
    (direction: 'forward' | 'backward') => {
      if (direction === 'forward') {
        const nextIndex = selectedIndex + itemsToScroll
        const isOnEnd = nextIndex > lastIndex

        const newSlideIndex = isOnEnd ? (isInfiniteMode ? nextIndex - lastIndex - 1 : lastIndex) : nextIndex

        return newSlideIndex
      }

      if (direction === 'backward') {
        const nextIndex = selectedIndex - itemsToScroll
        const isOnStart = nextIndex < 0

        const newSlideIndex = isOnStart ? (isInfiniteMode ? lastIndex + 1 + nextIndex : 0) : nextIndex

        return newSlideIndex
      }

      return selectedIndex
    },
    [selectedIndex, itemsToScroll, lastIndex, isInfiniteMode],
  )

  const updateActiveSlideIndex = useCallback(
    (newIndex: number) => {
      if (newIndex !== selectedIndex) {
        const newTransform = getTransform({
          count,
          index: newIndex,
          isHorizontal,
          width,
          height,
        })

        carouselRef.current.style.transform = newTransform
      }

      if (onChange) {
        onChange(newIndex)
      }
    },
    [selectedIndex, onChange, count, isHorizontal, width, height],
  )

  useEffect(() => {
    const element = carouselRef.current

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function handleSwipe(_event: TouchEvent | MouseEvent) {
      isDraggingRef.current = true
    }

    function handleSwipeEnd(event: TouchEvent | MouseEvent) {
      document.removeEventListener('mousemove', handleSwipe)
      document.removeEventListener('mouseup', handleSwipeEnd)
      document.removeEventListener('touchmove', handleSwipe)
      document.removeEventListener('touchend', handleSwipeEnd)

      if (isDraggingRef.current) {
        const isTouch = !!(event as TouchEvent).changedTouches?.[0]

        const dragPos = isTouch
          ? (event as TouchEvent).changedTouches[(event as TouchEvent).changedTouches.length - 1].clientX
          : (event as MouseEvent).clientX

        const mousePosDiff =
          (dragStartPosRef.current - dragPos) * ((isTouch ? touchSwipeRatio : mouseSwipeRatio) || swipeRatio)

        const quarter = +getUnit(isHorizontal ? width : height)[0] / 4

        const treshold = (isTouch ? touchSwipeTreshold : mouseSwipeTreshold) || swipeTreshold || quarter

        const nextActiveSlide =
          mousePosDiff > treshold
            ? {
                index: getNextSlideIndex('forward'),
                direction: 'forward',
              }
            : mousePosDiff < -treshold
            ? {
                index: getNextSlideIndex('backward'),
                direction: 'backward',
              }
            : {
                index: selectedIndex,
                direction: 'forward',
              }

        updateActiveSlideIndex(nextActiveSlide.index)
      }

      dragStartPosRef.current = 0
      isDraggingRef.current = false
    }

    function handleSwipeStart(event: TouchEvent | MouseEvent) {
      const isTouch = !!(event as TouchEvent).touches?.[0]

      dragStartPosRef.current = isTouch ? (event as TouchEvent).touches?.[0].clientX : (event as MouseEvent).clientX

      if (isTouch) {
        document.addEventListener('touchmove', handleSwipe)
        document.addEventListener('touchend', handleSwipeEnd)
      } else {
        document.addEventListener('mousemove', handleSwipe)
        document.addEventListener('mouseup', handleSwipeEnd)
      }
    }

    if (isNavigation) {
      element?.addEventListener('touchstart', handleSwipeStart, { passive: true })
      element?.addEventListener('mousedown', handleSwipeStart)
      element?.addEventListener('dragstart', handleSwipeEnd)
    }

    return () => {
      isDraggingRef.current = false
      dragStartPosRef.current = 0

      document.removeEventListener('mousemove', handleSwipe)
      document.removeEventListener('mouseup', handleSwipeEnd)
      document.removeEventListener('touchmove', handleSwipe)
      document.removeEventListener('touchend', handleSwipeEnd)

      element?.removeEventListener('touchstart', handleSwipeStart)
      element?.removeEventListener('mousedown', handleSwipeStart)
      element?.removeEventListener('dragstart', handleSwipeEnd)
    }
  }, [
    getNextSlideIndex,
    height,
    isHorizontal,
    isInfiniteMode,
    isNavigation,
    mouseSwipeRatio,
    mouseSwipeTreshold,
    selectedIndex,
    swipeRatio,
    swipeTreshold,
    touchSwipeRatio,
    touchSwipeTreshold,
    updateActiveSlideIndex,
    width,
  ])

  const carouselTransform = getTransform({
    count,
    index: selectedIndex,
    isHorizontal,
    width,
    height,
  })

  return (
    <div
      style={{
        ...style,
        position: 'relative',
        width,
        height,
        perspective,
      }}
      ref={sceneRef}
      {...restProps}
    >
      <div
        style={{
          height: '100%',
          position: 'absolute',
          WebkitTransformStyle: 'preserve-3d',
          MozTransformStyle: 'preserve-3d',
          transformStyle: 'preserve-3d',
          width: '100%',
          WebkitTransition: '-webkit-transform 400ms ease-in-out',
          MozTransition: '-moz-transform 400ms ease-in-out',
          transition: 'transform 400ms ease-in-out',
          WebkitTransform: carouselTransform,
          transform: carouselTransform,
        }}
        ref={carouselRef}
      >
        {items.map((item, index, { length }) => {
          const {
            props: { className: cellClassName = '', style: cellStyle = {}, ...cellComponentProps } = {},
            ...cellComponentData
          } = item

          const isActive = index === selectedIndex

          const className = `${cellClassName} ${isActive ? selectedCellClassName : ''}`.trim() || undefined

          const [value, unit] = getUnit(isHorizontal ? width : height)
          const fn = isHorizontal ? 'rotateY' : 'rotateX'
          const rotate = (360 / length) * index
          const translate = +value / 2 / Math.tan(Math.PI / length)

          const cellProps = {
            role: 'cell',
            className,
            style: {
              ...cellStyle,
              height: '100%',
              left: '0',
              position: 'absolute',
              top: '0',
              width: '100%',
              WebkitTransform: `${fn}(${rotate}deg) translateZ(${translate}${unit})`,
              transform: `${fn}(${rotate}deg) translateZ(${translate}${unit})`,
            },
            ...cellComponentProps,
            ...(isActive ? selectedProps : {}),
          }

          return {
            props: cellProps,
            ...cellComponentData,
          }
        })}
      </div>
    </div>
  )
}

export default memo(Gallery)
